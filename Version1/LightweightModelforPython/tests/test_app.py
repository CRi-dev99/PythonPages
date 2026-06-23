import os
import unittest
from unittest.mock import patch

from app import runner_enabled


class AppConfigTests(unittest.TestCase):
    def test_server_side_runner_is_disabled_by_default(self) -> None:
        with patch.dict(os.environ, {}, clear=True):
            self.assertFalse(runner_enabled())

    def test_server_side_runner_requires_explicit_opt_in(self) -> None:
        for value in ("1", "true", "yes", "on", "TRUE"):
            with self.subTest(value=value), patch.dict(os.environ, {"PY_TUTOR_ENABLE_RUNNER": value}):
                self.assertTrue(runner_enabled())

    def test_server_side_runner_rejects_other_values(self) -> None:
        for value in ("", "0", "false", "no", "off"):
            with self.subTest(value=value), patch.dict(os.environ, {"PY_TUTOR_ENABLE_RUNNER": value}):
                self.assertFalse(runner_enabled())


if __name__ == "__main__":
    unittest.main()
