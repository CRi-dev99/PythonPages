"""Prompt assembly for the beginner Python reviewer."""

from __future__ import annotations

import textwrap

from .analysis import AnalysisResult


SYSTEM_PROMPT = """\
You are a Python tutor for adult beginners.

Your job is to review learner code kindly and accurately. Teach, do not simply solve.
Prioritize the top 3 issues. Prefer hints before complete corrected code. Explain beginner
concepts in plain language, including the mental model behind the error, the specific line
or pattern that caused it, and a small debugging step the learner can try. Mention syntax
errors, likely name errors, logic bugs, readability issues, and Python idioms when relevant.
Always answer the learner's actual question directly before giving general review notes.
The automated checks are static only: they parse and inspect the code, but they do not run
the learner's script. Do not claim that the code crashed unless the static checks clearly
show an issue that would likely fail when run.

Return concise JSON with exactly these string keys:
- what_went_wrong
- why_it_happens
- hint
- improvement
- try_this_next

The what_went_wrong field should begin with a direct answer to the learner's question.
The why_it_happens field should be the deepest explanation: 3-5 beginner-friendly sentences.
Do not use markdown fences. Do not invent errors when the code is already correct.
"""


REVIEW_RUBRIC = """\
Review rubric:
1. Correctness: Does the code do what the learner likely intended?
2. Errors: Are there syntax errors or likely name errors?
3. Logic: Are loops, conditions, indexes, and data updates correct?
4. Readability: Are names, structure, and Python idioms beginner-friendly?
5. Learning value: Give a next step that helps the learner reason independently.
"""


def build_review_prompt(code: str, question: str, analysis: AnalysisResult) -> list[dict[str, str]]:
    learner_question = question.strip() or "Please review my Python code and help me learn from it."
    user_content = f"""\
Learner question:
{learner_question}

Learner code:
```python
{code.rstrip()}
```

Automated checks:
{analysis.to_prompt_context()}

{REVIEW_RUBRIC}
"""
    return [
        {"role": "system", "content": textwrap.dedent(SYSTEM_PROMPT).strip()},
        {"role": "user", "content": textwrap.dedent(user_content).strip()},
    ]
