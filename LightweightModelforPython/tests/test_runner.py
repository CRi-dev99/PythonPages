import unittest

from python_tutor.runner import RunnerError, send_input, start_run, stop_run, validate_code


class RunnerTests(unittest.TestCase):
    def test_print_finishes_with_output(self) -> None:
        result = start_run('print("Hello")')
        self.assertEqual(result["status"], "finished")
        self.assertIn("Hello", result["output"])

    def test_input_pauses_and_resumes(self) -> None:
        started = start_run('name = input("Name: ")\nprint("Hello", name)')
        self.assertEqual(started["status"], "waiting_for_input")
        self.assertEqual(started["prompt"], "Name: ")

        finished = send_input(str(started["session_id"]), "Paddy")
        self.assertEqual(finished["status"], "finished")
        self.assertIn("Hello Paddy", finished["output"])

    def test_two_inputs_work_in_sequence(self) -> None:
        started = start_run('first = input("First: ")\nsecond = input("Second: ")\nprint(first + second)')
        self.assertEqual(started["prompt"], "First: ")
        second = send_input(str(started["session_id"]), "Py")
        self.assertEqual(second["status"], "waiting_for_input")
        self.assertEqual(second["prompt"], "Second: ")
        finished = send_input(str(second["session_id"]), "thon")
        self.assertEqual(finished["status"], "finished")
        self.assertIn("Python", finished["output"])

    def test_blocks_imports_and_dangerous_calls(self) -> None:
        with self.assertRaises(RunnerError):
            validate_code("import os")
        with self.assertRaises(RunnerError):
            validate_code("open('x.txt')")
        with self.assertRaises(RunnerError):
            validate_code("eval('1 + 1')")

    def test_stop_run_stops_session(self) -> None:
        started = start_run('name = input("Name: ")\nprint(name)')
        result = stop_run(str(started["session_id"]))
        self.assertEqual(result["status"], "stopped")


if __name__ == "__main__":
    unittest.main()
