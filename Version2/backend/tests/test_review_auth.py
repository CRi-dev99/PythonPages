import pytest
from fastapi import HTTPException
from fastapi.routing import APIRoute

import app
from python_ide.auth import require_user


def test_review_route_requires_user_dependency() -> None:
    route = next(
        route
        for route in app.app.routes
        if isinstance(route, APIRoute) and route.path == "/api/review" and "POST" in route.methods
    )

    assert any(dependency.call is require_user for dependency in route.dependant.dependencies)


def test_require_user_rejects_missing_bearer_token(monkeypatch) -> None:
    monkeypatch.delenv("PY_IDE_ALLOW_DEV_AUTH", raising=False)

    with pytest.raises(HTTPException) as exc_info:
        require_user(None)

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Missing bearer token."
