"""JSONL storage for future review and fine-tuning examples."""

from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from pathlib import Path


EXAMPLES_PATH = Path("data/review_examples.jsonl")


@dataclass
class ReviewExample:
    learner_code: str
    expected_issue_categories: list[str]
    ideal_feedback: dict[str, str]
    corrected_code_should_be_withheld: bool
    difficulty_level: str = "beginner"


def append_review_example(example: ReviewExample, path: Path = EXAMPLES_PATH) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(asdict(example), ensure_ascii=True) + "\n")


def read_review_examples(path: Path = EXAMPLES_PATH) -> list[ReviewExample]:
    if not path.exists():
        return []
    examples: list[ReviewExample] = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                examples.append(ReviewExample(**json.loads(line)))
    return examples
