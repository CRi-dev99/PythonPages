"""Beginner-safe interactive Python runner."""

from __future__ import annotations

import ast
import base64
import json
import os
import queue
import subprocess
import sys
import textwrap
import threading
import time
import uuid
from dataclasses import dataclass, field
from typing import Literal


MAX_CODE_CHARS = 8_000
MAX_OUTPUT_CHARS = 8_000
MAX_INPUT_PROMPTS = 20
MAX_RUNTIME_SECONDS = 10
COLLECT_WAIT_SECONDS = 0.15
INPUT_MARKER = "__PY_TUTOR_INPUT__"

Status = Literal["running", "waiting_for_input", "finished", "error", "timed_out", "stopped"]


class RunnerError(ValueError):
    pass


@dataclass
class RunnerSession:
    id: str
    process: subprocess.Popen[str]
    started_at: float
    events: "queue.Queue[tuple[str, str]]" = field(default_factory=queue.Queue)
    output: str = ""
    prompt_count: int = 0
    waiting_for_input: bool = False
    stopped: bool = False


SESSIONS: dict[str, RunnerSession] = {}


def start_run(code: str) -> dict[str, object]:
    cleanup_sessions()
    validate_code(code)

    session_id = uuid.uuid4().hex
    encoded = base64.b64encode(code.encode("utf-8")).decode("ascii")
    env = {**os.environ, "PY_TUTOR_RUNNER_CODE": encoded}
    process = subprocess.Popen(
        [sys.executable, "-I", "-u", "-c", _WRAPPER],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        env=env,
    )
    session = RunnerSession(id=session_id, process=process, started_at=time.monotonic())
    SESSIONS[session_id] = session
    _start_reader(session)
    response = _collect(session, wait=True)
    response["session_id"] = session_id
    return response


def send_input(session_id: str, stdin: str) -> dict[str, object]:
    session = _get_session(session_id)
    if session.process.stdin is None or session.process.poll() is not None:
        return _final_response(session, "finished")

    session.waiting_for_input = False
    try:
        session.process.stdin.write(stdin.rstrip("\n") + "\n")
        session.process.stdin.flush()
    except BrokenPipeError:
        return _collect(session, wait=True)
    return _collect(session, wait=True)


def stop_run(session_id: str) -> dict[str, object]:
    session = _get_session(session_id)
    session.stopped = True
    _kill(session)
    SESSIONS.pop(session_id, None)
    return _final_response(session, "stopped")


def cleanup_sessions() -> None:
    now = time.monotonic()
    expired = [
        session_id
        for session_id, session in SESSIONS.items()
        if now - session.started_at > MAX_RUNTIME_SECONDS * 2
    ]
    for session_id in expired:
        session = SESSIONS.pop(session_id, None)
        if session and session.process.poll() is None:
            _kill(session)


def validate_code(code: str) -> None:
    if len(code) > MAX_CODE_CHARS:
        raise RunnerError("Code is too long for this beginner runner.")

    try:
        tree = ast.parse(textwrap.dedent(code).strip("\n") or "\n")
    except SyntaxError:
        return

    blocked_calls = {"open", "exec", "eval", "compile", "__import__", "globals", "locals", "vars"}
    for node in ast.walk(tree):
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            raise RunnerError("Imports are disabled in this beginner runner.")
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in blocked_calls:
            raise RunnerError(f"`{node.func.id}` is disabled in this beginner runner.")
        if isinstance(node, ast.Attribute) and node.attr.startswith("__"):
            raise RunnerError("Dunder attribute access is disabled in this beginner runner.")
        if isinstance(node, ast.Name) and node.id.startswith("__"):
            raise RunnerError("Dunder names are disabled in this beginner runner.")


def _get_session(session_id: str) -> RunnerSession:
    cleanup_sessions()
    session = SESSIONS.get(session_id)
    if not session:
        raise RunnerError("That runner session has expired. Run the code again.")
    return session


def _start_reader(session: RunnerSession) -> None:
    def read_output() -> None:
        assert session.process.stdout is not None
        for line in session.process.stdout:
            if line.startswith(INPUT_MARKER):
                prompt = line.removeprefix(INPUT_MARKER).rstrip("\n")
                session.events.put(("prompt", prompt))
            else:
                session.events.put(("stdout", line))
        session.events.put(("process_end", ""))

    thread = threading.Thread(target=read_output, daemon=True)
    thread.start()


def _collect(session: RunnerSession, *, wait: bool) -> dict[str, object]:
    deadline = time.monotonic() + (MAX_RUNTIME_SECONDS if wait else COLLECT_WAIT_SECONDS)
    status: Status = "running"
    prompt = ""

    while True:
        if time.monotonic() - session.started_at > MAX_RUNTIME_SECONDS:
            _kill(session)
            SESSIONS.pop(session.id, None)
            return _final_response(session, "timed_out")

        timeout = max(0.0, min(COLLECT_WAIT_SECONDS, deadline - time.monotonic()))
        try:
            event, value = session.events.get(timeout=timeout)
        except queue.Empty:
            if session.process.poll() is not None:
                SESSIONS.pop(session.id, None)
                return _final_response(session, "finished")
            if time.monotonic() >= deadline:
                return _final_response(session, status)
            continue

        if event == "stdout":
            session.output = _trim_output(session.output + value)
        elif event == "prompt":
            session.prompt_count += 1
            if session.prompt_count > MAX_INPUT_PROMPTS:
                _kill(session)
                SESSIONS.pop(session.id, None)
                return _final_response(session, "error", error="Too many input prompts.")
            session.waiting_for_input = True
            prompt = value
            return _final_response(session, "waiting_for_input", prompt=prompt)
        elif event == "process_end":
            SESSIONS.pop(session.id, None)
            return _final_response(session, "finished")


def _final_response(
    session: RunnerSession,
    status: Status,
    *,
    prompt: str = "",
    error: str = "",
) -> dict[str, object]:
    if status in {"finished", "error", "timed_out", "stopped"}:
        _close_process(session)
    return {
        "session_id": session.id,
        "status": status,
        "output": session.output,
        "prompt": prompt,
        "exit_code": session.process.poll(),
        "error": error,
    }


def _trim_output(output: str) -> str:
    if len(output) <= MAX_OUTPUT_CHARS:
        return output
    return output[:MAX_OUTPUT_CHARS] + "\n[Output stopped because it is too long.]\n"


def _kill(session: RunnerSession) -> None:
    if session.process.poll() is None:
        session.process.kill()


def _close_process(session: RunnerSession) -> None:
    if session.process.poll() is None:
        try:
            session.process.wait(timeout=0.5)
        except subprocess.TimeoutExpired:
            _kill(session)
            session.process.wait(timeout=0.5)
    for pipe in (session.process.stdin, session.process.stdout):
        if pipe and not pipe.closed:
            pipe.close()


_WRAPPER = r"""
import base64
import builtins
import os
import sys

INPUT_MARKER = "__PY_TUTOR_INPUT__"
code = base64.b64decode(os.environ["PY_TUTOR_RUNNER_CODE"]).decode("utf-8")

def safe_input(prompt=""):
    print(INPUT_MARKER + str(prompt), flush=True)
    line = sys.stdin.readline()
    if line == "":
        raise EOFError("No input was provided.")
    return line.rstrip("\n")

safe_builtins = {
    "abs": builtins.abs,
    "bool": builtins.bool,
    "dict": builtins.dict,
    "enumerate": builtins.enumerate,
    "float": builtins.float,
    "input": safe_input,
    "int": builtins.int,
    "len": builtins.len,
    "list": builtins.list,
    "max": builtins.max,
    "min": builtins.min,
    "print": builtins.print,
    "range": builtins.range,
    "round": builtins.round,
    "set": builtins.set,
    "sorted": builtins.sorted,
    "str": builtins.str,
    "sum": builtins.sum,
    "tuple": builtins.tuple,
}

scope = {"__builtins__": safe_builtins}
exec(compile(code, "student_code.py", "exec"), scope, scope)
"""
