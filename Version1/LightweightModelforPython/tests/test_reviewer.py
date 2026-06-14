import unittest

from python_tutor.adapters import REVIEW_KEYS, RuleBasedReviewer
from python_tutor.analysis import analyze_code


class RuleBasedReviewerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.reviewer = RuleBasedReviewer()

    def review(self, code: str, question: str = "Please review this.") -> dict[str, str]:
        return self.reviewer.review(code=code, question=question, analysis=analyze_code(code))

    def test_golden_syntax_error_response(self) -> None:
        review = self.review("for item in [1, 2]\n    print(item)")
        self.assertTrue(all(key in review for key in REVIEW_KEYS))
        self.assertIn("syntax", review["what_went_wrong"])
        self.assertIn("none of the later lines", review["why_it_happens"])
        self.assertIn("line above", review["hint"])

    def test_golden_loop_boundary_response(self) -> None:
        code = "items = [1, 2, 3]\nfor i in range(len(items) + 1):\n    print(items[i])"
        review = self.review(code)
        self.assertIn("loop-boundary", review["what_went_wrong"])
        self.assertIn("valid indexes", review["why_it_happens"])
        self.assertIn("final value", review["hint"])

    def test_golden_mutable_default_response(self) -> None:
        code = "def add_item(item, items=[]):\n    items.append(item)\n    return items"
        review = self.review(code)
        self.assertIn("mutable-default", review["what_went_wrong"])
        self.assertIn("created once", review["why_it_happens"])
        self.assertNotIn("def add_item(item, items=[]):", review["improvement"])

    def test_correct_code_does_not_invent_error(self) -> None:
        review = self.review("def total(numbers):\n    return sum(numbers)\n")
        self.assertIn("do not see a definite error", review["what_went_wrong"])
        self.assertIn("edge case", review["hint"])

    def test_answers_why_question_directly(self) -> None:
        review = self.review("print(missing_name)", "Why does this crash?")
        self.assertTrue(review["what_went_wrong"].startswith("Answer to your question:"))
        self.assertIn("breaks because", review["what_went_wrong"])

    def test_static_review_does_not_claim_executed_exception(self) -> None:
        review = self.review("print(missing_name)", "Why does this crash?")
        joined = " ".join(review.values())
        self.assertIn("undefined-name", review["what_went_wrong"])
        self.assertIn("line 1", review["what_went_wrong"])
        self.assertNotIn("NameError", joined)
        self.assertNotIn("executed", joined)

    def test_answers_improvement_question_directly(self) -> None:
        review = self.review("items = []\nif len(items) == 0:\n    print('empty')", "How can I make this cleaner?")
        self.assertTrue(review["what_went_wrong"].startswith("Answer to your question:"))
        self.assertIn("intention easier to read", review["what_went_wrong"])

    def test_answers_correctness_question_directly(self) -> None:
        review = self.review("def total(numbers):\n    return sum(numbers)\n", "Is this correct?")
        self.assertTrue(review["what_went_wrong"].startswith("Answer to your question:"))
        self.assertIn("looks reasonable", review["what_went_wrong"])

    def test_response_is_concise_and_encouraging(self) -> None:
        review = self.review("print(missing_name)")
        joined = " ".join(review.values())
        self.assertLess(len(joined.split()), 230)
        self.assertIn("Check", joined)


if __name__ == "__main__":
    unittest.main()
