# Local Python Learning Code Reviewer

A lightweight local web app that helps adult beginner Python learners understand what went wrong in their code and how to improve it.

The app has no required third-party dependencies. It runs with Python's standard library and includes:

- A browser UI with a code editor, learner question box, and sectioned review output.
- Static Python checks using `ast`.
- A pluggable inference adapter.
- A deterministic rule-based fallback when no local model server is running.
- JSONL review-example storage for future LoRA/fine-tuning data.

## Run

Use any available Python 3.10+ interpreter:

```powershell
python app.py
```

In this Codex workspace, Python is available at:

```powershell
C:\Users\Cristian\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe app.py
```

Then open:

```text
http://127.0.0.1:8000
```

The server-side Python runner is disabled by default. Enable it only for a trusted/local deployment:

```powershell
$env:PY_TUTOR_ENABLE_RUNNER = "1"
python app.py
```

## Deploy on Render for GitHub Pages

Create a Render web service for this folder and use:

```powershell
python app.py
```

Recommended environment variables:

```text
PY_TUTOR_HOST=0.0.0.0
PY_TUTOR_BACKEND=rule
PY_TUTOR_ALLOWED_ORIGINS=https://YOUR_GITHUB_USERNAME.github.io
```

Do not set `PY_TUTOR_ENABLE_RUNNER=1` on a public service unless you intentionally want the legacy server-side code runner exposed. Without that variable, `/api/run/*` returns 403 and `/api/review` continues to work.

Render provides the `PORT` variable automatically. The app also exposes:

```text
GET /api/health
POST /api/review
POST /api/run/start
POST /api/run/input
POST /api/run/stop
```

Public saving to `/api/examples` is disabled unless `PY_TUTOR_ENABLE_EXAMPLES=1` is set.

The `/api/run/*` endpoints power the website Code Runner. They run short beginner Python snippets in a restricted subprocess and support terminal-style `input()` prompts.

## Local Model Backend

By default the app uses the safe rule-based reviewer. To use a local OpenAI-compatible model server:

```powershell
$env:PY_TUTOR_BACKEND = "openai-compatible"
$env:PY_TUTOR_MODEL = "gpt-oss-20b"
$env:PY_TUTOR_BASE_URL = "http://localhost:11434/v1/chat/completions"
python app.py
```

This is designed for local/open tooling. `gpt-oss` weights are not served through the OpenAI API or ChatGPT.

## Static Analysis

Reviews do not run learner code. The checker parses the code with Python's `ast` module and reports static issues such as syntax errors, undefined names, suspicious loop boundaries, mutable defaults, and beginner readability hints.

## Tests

```powershell
python -m unittest discover -s tests
```

In this Codex workspace:

```powershell
C:\Users\Cristian\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe -m unittest discover -s tests
```
