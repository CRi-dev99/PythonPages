import unittest

from python_tutor.analysis import analyze_code
from python_tutor.prompts import REVIEW_RUBRIC, SYSTEM_PROMPT, build_review_prompt


class PromptTests(unittest.TestCase):
    def test_prompt_contains_code_question_static_checks_and_rubric(self) -> None:
        code = "print(missing_name)"
        analysis = analyze_code(code)
        messages = build_review_prompt(code, "Why does this crash?", analysis)

        self.assertEqual(messages[0]["role"], "system")
        self.assertIn("Teach, do not simply solve", SYSTEM_PROMPT)
        self.assertIn("Why does this crash?", messages[1]["content"])
        self.assertIn(code, messages[1]["content"])
        self.assertIn("undefined-name", messages[1]["content"])
        self.assertIn("The automated checks are static only", SYSTEM_PROMPT)
        self.assertIn("Review rubric:", REVIEW_RUBRIC)
        self.assertIn("Review rubric:", messages[1]["content"])

    def test_empty_question_uses_default(self) -> None:
        messages = build_review_prompt("x = 1", "", analyze_code("x = 1"))
        self.assertIn("Please review my Python code", messages[1]["content"])


if __name__ == "__main__":
    unittest.main()
