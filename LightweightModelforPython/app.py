from __future__ import annotations

import json
import mimetypes
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from python_tutor.adapters import review_payload
from python_tutor.analysis import analyze_code
from python_tutor.storage import ReviewExample, append_review_example


ROOT = Path(__file__).parent
STATIC = ROOT / "static"
DEFAULT_ALLOWED_ORIGINS = "*"


class TutorHandler(BaseHTTPRequestHandler):
    server_version = "PythonTutorReviewer/0.1"

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/health":
            return self._send_json({"ok": True, "service": "python-tutor-reviewer"})
        if parsed.path == "/":
            return self._send_file(STATIC / "index.html")
        if parsed.path.startswith("/static/"):
            target = STATIC / parsed.path.removeprefix("/static/")
            return self._send_file(target)
        self._send_json({"error": "Not found"}, status=404)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._send_cors_headers()
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/review":
            return self._handle_review()
        if parsed.path == "/api/examples":
            return self._handle_example()
        self._send_json({"error": "Not found"}, status=404)

    def log_message(self, format: str, *args: object) -> None:
        if os.getenv("PY_TUTOR_QUIET") == "1":
            return
        super().log_message(format, *args)

    def _handle_review(self) -> None:
        data = self._read_json()
        code = str(data.get("code", ""))
        question = str(data.get("question", ""))

        if len(code) > 20_000:
            return self._send_json({"error": "Code is too long for this local reviewer."}, status=413)

        analysis = analyze_code(code)
        self._send_json(review_payload(code, question, analysis=analysis))

    def _handle_example(self) -> None:
        if os.getenv("PY_TUTOR_ENABLE_EXAMPLES") != "1":
            return self._send_json({"error": "Saving examples is disabled for this public service."}, status=403)

        data = self._read_json()
        example = ReviewExample(
            learner_code=str(data.get("learner_code", "")),
            expected_issue_categories=list(data.get("expected_issue_categories", [])),
            ideal_feedback=dict(data.get("ideal_feedback", {})),
            corrected_code_should_be_withheld=bool(data.get("corrected_code_should_be_withheld", True)),
            difficulty_level=str(data.get("difficulty_level", "beginner")),
        )
        append_review_example(example)
        self._send_json({"ok": True})

    def _read_json(self) -> dict[str, object]:
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length) if length else b"{}"
        try:
            data = json.loads(body.decode("utf-8"))
        except json.JSONDecodeError:
            return {}
        if isinstance(data, dict):
            return data
        return {}

    def _send_file(self, path: Path) -> None:
        try:
            resolved = path.resolve()
            resolved.relative_to(STATIC.resolve())
        except ValueError:
            return self._send_json({"error": "Forbidden"}, status=403)

        if not resolved.exists() or not resolved.is_file():
            return self._send_json({"error": "Not found"}, status=404)

        content_type = mimetypes.guess_type(str(resolved))[0] or "application/octet-stream"
        content = resolved.read_bytes()
        self.send_response(200)
        self._send_cors_headers()
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def _send_json(self, payload: dict[str, object], *, status: int = 200) -> None:
        content = json.dumps(payload, ensure_ascii=True).encode("utf-8")
        self.send_response(status)
        self._send_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def _send_cors_headers(self) -> None:
        allowed = os.getenv("PY_TUTOR_ALLOWED_ORIGINS", DEFAULT_ALLOWED_ORIGINS)
        request_origin = self.headers.get("Origin", "")
        origins = [origin.strip() for origin in allowed.split(",") if origin.strip()]
        if "*" in origins:
            self.send_header("Access-Control-Allow-Origin", "*")
        elif request_origin and request_origin in origins:
            self.send_header("Access-Control-Allow-Origin", request_origin)
            self.send_header("Vary", "Origin")


def main() -> None:
    host = os.getenv("PY_TUTOR_HOST", "127.0.0.1")
    port = int(os.getenv("PORT", os.getenv("PY_TUTOR_PORT", "8000")))
    server = ThreadingHTTPServer((host, port), TutorHandler)
    print(f"Python Tutor Reviewer running at http://{host}:{port}")
    print("Set PY_TUTOR_BACKEND=openai-compatible to use a local LLM server.")
    server.serve_forever()


if __name__ == "__main__":
    main()
