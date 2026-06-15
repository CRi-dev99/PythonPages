from __future__ import annotations

import json
import os
import urllib.error
import urllib.request

from .analyzer import AnalysisResult


OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"

SYSTEM_INSTRUCTIONS = """\
You are a kind Python debugging tutor for beginner learners.
Use the learner's code, terminal output, and static diagnostics.
Do not simply paste a full finished solution unless the learner explicitly asks.
Start with the most likely issue, explain why it happens, and suggest one small next action.
If the static safety gate blocked code, explain the blocked item and offer a safe alternative.
"""


def build_debug_input(
    *,
    message: str,
    code: str,
    terminal_output: str,
    analysis: AnalysisResult,
    lesson_title: str = "",
) -> list[dict[str, str]]:
    context = f"""\
Lesson or challenge: {lesson_title or "Not specified"}

Learner code:
```python
{code.rstrip()}
```

Terminal output:
```text
{terminal_output.rstrip() or "No output yet."}
```

Static analysis:
{analysis.to_prompt_context()}
"""
    return [
        {"role": "developer", "content": SYSTEM_INSTRUCTIONS.strip()},
        {"role": "user", "content": context.strip()},
        {"role": "user", "content": message.strip() or "Please help me debug this code."},
    ]


def request_debug_help(
    *,
    message: str,
    code: str,
    terminal_output: str,
    analysis: AnalysisResult,
    lesson_title: str = "",
) -> dict[str, object]:
    api_key = os.getenv("OPENAI_API_KEY", "")
    model = os.getenv("OPENAI_MODEL", "gpt-5.5")
    if not api_key:
        return {
            "reply": _fallback_reply(message=message, analysis=analysis),
            "backend": "fallback",
            "model": model,
        }

    payload = {
        "model": model,
        "reasoning": {"effort": os.getenv("OPENAI_REASONING_EFFORT", "low")},
        "text": {"verbosity": os.getenv("OPENAI_TEXT_VERBOSITY", "low")},
        "input": build_debug_input(
            message=message,
            code=code,
            terminal_output=terminal_output,
            analysis=analysis,
            lesson_title=lesson_title,
        ),
    }
    request = urllib.request.Request(
        OPENAI_RESPONSES_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=float(os.getenv("OPENAI_TIMEOUT", "45"))) as response:
            data = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, OSError, json.JSONDecodeError) as exc:
        return {
            "reply": f"The AI debugger could not be reached right now. The local checks still ran: {_first_issue(analysis)}",
            "backend": "fallback",
            "model": model,
            "error": str(exc),
        }

    return {
        "reply": _extract_output_text(data) or _fallback_reply(message=message, analysis=analysis),
        "backend": "openai",
        "model": model,
    }


def _fallback_reply(*, message: str, analysis: AnalysisResult) -> str:
    if analysis.safety == "block" and analysis.safety_findings:
        first = analysis.safety_findings[0]
        return f"I blocked this before running it because {first.message} Try replacing that part with a safe beginner-friendly approach."
    if analysis.diagnostics:
        first_diag = analysis.diagnostics[0]
        line = f" on line {first_diag.line}" if first_diag.line else ""
        return f"Start with the {first_diag.category} issue{line}: {first_diag.message} Make one small fix, then run again."
    return "The local checks do not see a definite problem. Run the code with a tiny test input and compare the output with what you expected."


def _first_issue(analysis: AnalysisResult) -> str:
    if analysis.safety_findings:
        return analysis.safety_findings[0].message
    if analysis.diagnostics:
        return analysis.diagnostics[0].message
    return "no definite local issue found"


def _extract_output_text(data: dict[str, object]) -> str:
    direct = data.get("output_text")
    if isinstance(direct, str):
        return direct.strip()

    chunks: list[str] = []
    output = data.get("output")
    if isinstance(output, list):
        for item in output:
            if not isinstance(item, dict):
                continue
            content = item.get("content")
            if not isinstance(content, list):
                continue
            for part in content:
                if isinstance(part, dict) and isinstance(part.get("text"), str):
                    chunks.append(part["text"])
    return "\n".join(chunks).strip()

