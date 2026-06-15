import json
from unittest.mock import patch

from python_ide.analyzer import analyze_code
from python_ide.chat import build_debug_input, request_debug_help


def test_chat_prompt_contains_code_output_and_analysis() -> None:
    analysis = analyze_code("print(missing)")
    messages = build_debug_input(
        message="Why does this fail?",
        code="print(missing)",
        terminal_output="NameError",
        analysis=analysis,
        lesson_title="Variables",
    )
    joined = "\n".join(item["content"] for item in messages)
    assert "Variables" in joined
    assert "print(missing)" in joined
    assert "NameError" in joined
    assert "undefined-name" in joined


def test_chat_uses_fallback_without_api_key(monkeypatch) -> None:
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    result = request_debug_help(
        message="Help",
        code="print(missing)",
        terminal_output="",
        analysis=analyze_code("print(missing)"),
    )
    assert result["backend"] == "fallback"
    assert "OPENAI_API_KEY" not in json.dumps(result)


def test_chat_posts_to_openai_without_leaking_key(monkeypatch) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "secret-test-key")

    class Response:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def read(self) -> bytes:
            return b'{"output_text": "Check the variable name first."}'

    with patch("urllib.request.urlopen", return_value=Response()) as urlopen:
        result = request_debug_help(
            message="Help",
            code="print(missing)",
            terminal_output="",
            analysis=analyze_code("print(missing)"),
        )

    assert result["backend"] == "openai"
    assert "variable name" in str(result["reply"])
    request = urlopen.call_args.args[0]
    assert request.headers["Authorization"] == "Bearer secret-test-key"
    assert "secret-test-key" not in json.dumps(result)

