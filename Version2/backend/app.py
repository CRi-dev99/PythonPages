from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from python_ide.analyzer import analyze_code
from python_ide.auth import AuthUser, require_user
from python_ide.chat import request_debug_help


ROOT = Path(__file__).resolve().parent
FRONTEND_DIST = ROOT.parent / "frontend" / "dist"

app = FastAPI(title="PythonPages Version2 IDE", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("PY_IDE_ALLOWED_ORIGINS", "*").split(",") if origin.strip()],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def add_security_headers(request: Any, call_next: Any) -> Any:
    response = await call_next(request)
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
    response.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
    return response


class AnalyzeRequest(BaseModel):
    code: str = Field(default="", max_length=40_000)


class ChatRequest(BaseModel):
    message: str = Field(default="", max_length=4_000)
    code: str = Field(default="", max_length=40_000)
    terminal_output: str = Field(default="", max_length=16_000)
    lesson_title: str = Field(default="", max_length=300)


class ReviewRequest(BaseModel):
    code: str = Field(default="", max_length=40_000)
    question: str = Field(default="", max_length=4_000)


@app.get("/api/health")
def health() -> dict[str, object]:
    return {
        "ok": True,
        "service": "pythonpages-version2",
        "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
        "supabase_jwt_configured": bool(os.getenv("SUPABASE_JWT_SECRET")),
    }


@app.post("/api/analyze")
def analyze(request: AnalyzeRequest) -> dict[str, object]:
    return analyze_code(request.code).to_dict()


@app.post("/api/chat")
def chat(request: ChatRequest, user: AuthUser = Depends(require_user)) -> dict[str, object]:
    analysis = analyze_code(request.code)
    payload = request_debug_help(
        message=request.message,
        code=request.code,
        terminal_output=request.terminal_output,
        analysis=analysis,
        lesson_title=request.lesson_title,
    )
    return {"user_id": user.id, "analysis": analysis.to_dict(), **payload}


@app.post("/api/review")
def review(request: ReviewRequest, user: AuthUser = Depends(require_user)) -> dict[str, object]:
    analysis = analyze_code(request.code)
    result = request_debug_help(
        message=request.question or "Review this learner code.",
        code=request.code,
        terminal_output="",
        analysis=analysis,
        lesson_title="Code review",
    )
    return {
        "review": {
            "what_went_wrong": result["reply"],
            "why_it_happens": "",
            "hint": "",
            "improvement": "",
            "try_this_next": "",
        },
        "analysis": analysis.to_dict(),
        "diagnostics": analysis.to_dict()["diagnostics"],
        "backend": result["backend"],
        "model": result["model"],
    }


if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")
    public_course = FRONTEND_DIST / "course-data.js"

    @app.get("/course-data.js")
    def course_data() -> FileResponse:
        return FileResponse(public_course)

    @app.get("/{full_path:path}")
    def spa(full_path: str):
        target = FRONTEND_DIST / full_path
        if target.exists() and target.is_file():
            return FileResponse(target)
        index = FRONTEND_DIST / "index.html"
        if index.exists():
            return FileResponse(index)
        return JSONResponse({"error": "Frontend build not found."}, status_code=404)


def main() -> None:
    import uvicorn

    host = os.getenv("PY_IDE_HOST", "0.0.0.0")
    port = int(os.getenv("PORT", os.getenv("PY_IDE_PORT", "8000")))
    uvicorn.run("app:app", host=host, port=port, reload=os.getenv("PY_IDE_RELOAD") == "1")


if __name__ == "__main__":
    main()
