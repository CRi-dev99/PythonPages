import unittest

from python_tutor.analysis import analyze_code


class AnalysisTests(unittest.TestCase):
    def categories_for(self, code: str) -> set[str]:
        result = analyze_code(code)
        return {item.category for item in result.diagnostics}

    def test_syntax_error(self) -> None:
        result = analyze_code("for item in [1, 2, 3]\n    print(item)")
        self.assertFalse(result.syntax_ok)
        self.assertIn("syntax", self.categories_for("for item in [1, 2, 3]\n    print(item)"))

    def test_indentation_error(self) -> None:
        result = analyze_code("if True:\nprint('hello')")
        self.assertFalse(result.syntax_ok)
        self.assertIn("syntax", {item.category for item in result.diagnostics})

    def test_undefined_variable(self) -> None:
        self.assertIn("undefined-name", self.categories_for("print(total)\n"))

    def test_wrong_loop_range_logic(self) -> None:
        code = "items = [1, 2, 3]\nfor i in range(len(items) + 1):\n    print(items[i])"
        self.assertIn("loop-boundary", self.categories_for(code))

    def test_mutable_default_argument(self) -> None:
        code = "def add_item(item, items=[]):\n    items.append(item)\n    return items"
        self.assertIn("mutable-default", self.categories_for(code))

    def test_beginner_style_issue(self) -> None:
        self.assertIn("python-idiom", self.categories_for("items = []\nif len(items) == 0:\n    print('empty')"))

    def test_correct_solution_has_no_error_diagnostics(self) -> None:
        result = analyze_code("def add_numbers(numbers):\n    return sum(numbers)\n")
        severities = {item.severity for item in result.diagnostics}
        self.assertNotIn("error", severities)
        self.assertTrue(result.syntax_ok)

    def test_static_analysis_does_not_report_runtime_diagnostics(self) -> None:
        result = analyze_code("print(missing_name)")

        self.assertNotIn("runtime", {item.category for item in result.diagnostics})
        self.assertIn("undefined-name", {item.category for item in result.diagnostics})


if __name__ == "__main__":
    unittest.main()
