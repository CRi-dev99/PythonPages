"""Inference adapters for local models and deterministic fallback review."""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from dataclasses import asdict
from typing import Protocol

from .analysis import AnalysisResult, Diagnostic
from .prompts import build_review_prompt


REVIEW_KEYS = [
    "what_went_wrong",
    "why_it_happens",
    "hint",
    "improvement",
    "try_this_next",
]


class InferenceAdapter(Protocol):
    def review(self, *, code: str, question: str, analysis: AnalysisResult) -> dict[str, str]:
        ...


class RuleBasedReviewer:
    """Reliable fallback when no local LLM server is configured."""

    def review(self, *, code: str, question: str, analysis: AnalysisResult) -> dict[str, str]:
        diagnostics = _prioritized_diagnostics(analysis.diagnostics)[:3]
        question_focus = _question_focus(question, diagnostics[0] if diagnostics else None)
        if not diagnostics:
            return {
                "what_went_wrong": _with_question_focus(
                    "I do not see a definite error from the automated checks.",
                    question_focus,
                ),
                "why_it_happens": (
                    "The syntax is valid, and there are no obvious beginner-level warnings. "
                    "That does not prove the logic is perfect, but it is a good sign."
                ),
                "hint": "Try testing the code with one small input, one typical input, and one edge case.",
                "improvement": (
                    "Add clear variable names or a small function if the snippet grows. Keep each step easy "
                    "to explain in your own words."
                ),
                "try_this_next": "Write down what output you expect before running the code, then compare it with the actual output.",
            }

        primary = diagnostics[0]
        return {
            "what_went_wrong": _with_question_focus(_summarize_diagnostics(diagnostics), question_focus),
            "why_it_happens": _explain(primary),
            "hint": _hint(primary),
            "improvement": _improvement(primary),
            "try_this_next": _try_next(primary),
        }


class OpenAICompatibleLocalAdapter:
    """Adapter for local OpenAI-compatible servers such as Ollama, LM Studio, or vLLM."""

    def __init__(self) -> None:
        self.base_url = os.getenv("PY_TUTOR_BASE_URL", "http://localhost:11434/v1/chat/completions")
        self.model = os.getenv("PY_TUTOR_MODEL", "gpt-oss-20b")
        self.timeout = float(os.getenv("PY_TUTOR_MODEL_TIMEOUT", "45"))
        self.fallback = RuleBasedReviewer()

    def review(self, *, code: str, question: str, analysis: AnalysisResult) -> dict[str, str]:
        payload = {
            "model": self.model,
            "messages": build_review_prompt(code, question, analysis),
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        }
        request = urllib.request.Request(
            self.base_url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                data = json.loads(response.read().decode("utf-8"))
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError):
            return self.fallback.review(code=code, question=question, analysis=analysis)

        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        try:
            parsed = json.loads(content)
        except json.JSONDecodeError:
            return self.fallback.review(code=code, question=question, analysis=analysis)

        if all(isinstance(parsed.get(key), str) for key in REVIEW_KEYS):
            return {key: parsed[key].strip() for key in REVIEW_KEYS}
        return self.fallback.review(code=code, question=question, analysis=analysis)


def get_adapter() -> InferenceAdapter:
    backend = os.getenv("PY_TUTOR_BACKEND", "rule").lower()
    if backend in {"openai-compatible", "openai_compatible", "local-llm", "llm"}:
        return OpenAICompatibleLocalAdapter()
    return RuleBasedReviewer()


def review_payload(code: str, question: str, *, analysis: AnalysisResult) -> dict[str, object]:
    adapter = get_adapter()
    review = adapter.review(code=code, question=question, analysis=analysis)
    return {
        "review": review,
        "diagnostics": [asdict(item) for item in analysis.diagnostics],
        "analysis": {
            "syntax_ok": analysis.syntax_ok,
        },
        "backend": os.getenv("PY_TUTOR_BACKEND", "rule"),
    }


def _summarize_diagnostics(diagnostics: list[Diagnostic]) -> str:
    parts = []
    for item in diagnostics:
        line = f" on line {item.line}" if item.line else ""
        parts.append(f"{item.category}{line}: {item.message}")
    return " ".join(parts)


def _prioritized_diagnostics(diagnostics: list[Diagnostic]) -> list[Diagnostic]:
    priority = {
        "syntax": 0,
        "undefined-name": 1,
        "loop-boundary": 2,
        "mutable-default": 3,
    }
    sorted_pairs = sorted(enumerate(diagnostics), key=lambda pair: (priority.get(pair[1].category, 9), pair[0]))
    return [item for _, item in sorted_pairs]


def _question_focus(question: str, primary: Diagnostic | None) -> str:
    cleaned = " ".join(question.lower().strip().split())
    if not cleaned:
        return ""

    if any(phrase in cleaned for phrase in ("why", "crash", "error", "not work", "isn't working", "is not working")):
        if primary is None:
            return "Answer to your question: the automated checks did not find a clear crash or error, so the next step is to test whether the output matches what you expected."
        if primary.category == "syntax":
            return "Answer to your question: it fails before running because Python cannot parse the code yet."
        if primary.category in {"undefined-name", "loop-boundary"}:
            return "Answer to your question: it breaks because the running code reaches a value or name that Python cannot use safely."
        return "Answer to your question: the code may run, but this pattern can still make the program harder to reason about."

    if any(phrase in cleaned for phrase in ("what did i do wrong", "where did i go wrong", "mistake", "wrong")):
        if primary is None:
            return "Answer to your question: I do not see a definite mistake from the automated checks."
        line = f" on line {primary.line}" if primary.line else ""
        return f"Answer to your question: the first thing to fix is the {primary.category} issue{line}."

    if any(phrase in cleaned for phrase in ("improve", "better", "cleaner", "style")):
        if primary is None:
            return "Answer to your question: focus on readability, small test cases, and names that explain the idea."
        return "Answer to your question: fix the main issue first, then improve the code by making the intention easier to read."

    if any(phrase in cleaned for phrase in ("correct", "right", "good")):
        if primary is None:
            return "Answer to your question: it looks reasonable from these checks, but you should still test a few inputs."
        return "Answer to your question: it is not fully correct yet because there is at least one issue to fix first."

    return "Answer to your question: start with the first issue below, because it is the most likely to affect the result."


def _with_question_focus(message: str, question_focus: str) -> str:
    if not question_focus:
        return message
    return f"{question_focus} {message}"


def _explain(item: Diagnostic) -> str:
    explanations = {
        "syntax": (
            "Python reads your program before it runs it. A syntax error means Python could not understand "
            "the shape of the code, so none of the later lines get a chance to execute. The reported line is "
            "the place where Python became confused, but the real cause can be just before it."
        ),
        "undefined-name": (
            "Python keeps track of names that have been assigned, imported, or built in. When it reaches this "
            "line, it cannot find that name in the current scope. That usually means a spelling mismatch, a "
            "variable created later than it is used, or a value that only exists inside another function/block."
        ),
        "loop-boundary": (
            "List indexes start at 0 and end at length minus 1. For a three-item list, the valid indexes are "
            "0, 1, and 2. If a loop produces 3 as an index, Python tries to access a position that does not "
            "exist, which commonly leads to an off-by-one error."
        ),
        "mutable-default": (
            "Default argument values are created once when Python defines the function, not each time the "
            "function is called. A default list, dict, or set can therefore keep old values from previous "
            "calls, which surprises beginners because it feels like the function is remembering too much."
        ),
        "python-idiom": (
            "The code may work, but Python has a clearer common pattern for this situation. Idioms matter "
            "because they make your intention easier for other Python programmers to recognize quickly."
        ),
        "structure": (
            "Long top-level snippets become harder to test because every line runs at once. A small function "
            "lets you name one idea, pass in test values, and check the result without rerunning unrelated code."
        ),
    }
    return explanations.get(item.category, "This is a useful place to slow down and check your assumption.")


def _hint(item: Diagnostic) -> str:
    hints = {
        "syntax": (
            "Check the line above the error first, then the reported line. Look for a missing colon, bracket, "
            "quote, comma, or indentation change."
        ),
        "undefined-name": (
            "Check the exact spelling, then search upward in the code. You should be able to point to the line "
            "where this name first gets a value before it is used here."
        ),
        "loop-boundary": (
            "Print or write down the index values your loop produces. Compare them with the real valid indexes "
            "for the list, especially the final value."
        ),
        "mutable-default": (
            "Use `None` as the default, then create a new list or dict inside the function. This gives each call "
            "its own fresh object."
        ),
        "python-idiom": (
            "Ask what idea you are expressing. If the idea is emptiness, Python usually prefers `if not items:` "
            "over checking the exact length."
        ),
        "structure": (
            "Try naming the repeated idea as a function with one clear input and one clear output. Then test the "
            "function with a tiny example."
        ),
    }
    return hints.get(item.category, "Test one tiny case and trace the value after each line.")


def _improvement(item: Diagnostic) -> str:
    if item.category == "undefined-name":
        return (
            "Use consistent variable names and introduce each variable close to where it is first needed. "
            "A good habit is to read the code from top to bottom and make sure every name already has a value."
        )
    if item.category == "loop-boundary":
        return (
            "Prefer looping directly over items when you do not need the index: `for item in items:`. If you do "
            "need the index, use `range(len(items))` and remember that the last index is `len(items) - 1`."
        )
    if item.category == "mutable-default":
        return (
            "Write `def fn(items=None):` and set `items = []` inside when it is `None`. This pattern separates "
            "the idea of 'no value was provided' from the actual list you want to work with."
        )
    if item.category == "syntax":
        return (
            "Fix the parse error first, then run the code again before changing the logic. Syntax errors can "
            "hide other problems, so solve them one at a time."
        )
    return (
        "Make one small change, rerun, and confirm whether the output moved closer to your expectation. "
        "This keeps debugging focused instead of changing several things at once."
    )


def _try_next(item: Diagnostic) -> str:
    if item.category == "syntax":
        return "After fixing the syntax, add one print statement to confirm the first important value before moving on."
    if item.category == "loop-boundary":
        return "Write the valid indexes for a three-item list on paper, then compare them with the numbers your loop creates."
    return "Explain what each line should do in plain English, then run the code and compare that explanation with the result."
