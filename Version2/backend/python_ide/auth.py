from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from dataclasses import dataclass

from fastapi import Header, HTTPException


@dataclass
class AuthUser:
    id: str
    email: str = ""


def require_user(authorization: str | None = Header(default=None)) -> AuthUser:
    secret = os.getenv("SUPABASE_JWT_SECRET", "")
    allow_dev = os.getenv("PY_IDE_ALLOW_DEV_AUTH") == "1"

    if not authorization or not authorization.lower().startswith("bearer "):
        if allow_dev:
            return AuthUser(id="dev-user", email="dev@example.local")
        raise HTTPException(status_code=401, detail="Missing bearer token.")

    token = authorization.split(" ", 1)[1].strip()
    if not secret:
        if allow_dev:
            return AuthUser(id="dev-user", email="dev@example.local")
        raise HTTPException(status_code=503, detail="Supabase JWT verification is not configured.")

    try:
        payload = verify_supabase_jwt(token, secret)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    user_id = str(payload.get("sub") or "")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token does not contain a user id.")
    return AuthUser(id=user_id, email=str(payload.get("email") or ""))


def verify_supabase_jwt(token: str, secret: str) -> dict[str, object]:
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid token shape.")

    header = _json_b64(parts[0])
    payload = _json_b64(parts[1])
    if header.get("alg") != "HS256":
        raise ValueError("Unsupported token algorithm.")

    expected = hmac.new(secret.encode("utf-8"), f"{parts[0]}.{parts[1]}".encode("ascii"), hashlib.sha256).digest()
    actual = _b64decode(parts[2])
    if not hmac.compare_digest(expected, actual):
        raise ValueError("Invalid token signature.")

    exp = payload.get("exp")
    if isinstance(exp, (int, float)) and exp < time.time():
        raise ValueError("Token has expired.")

    issuer = os.getenv("SUPABASE_JWT_ISSUER", "")
    if issuer and payload.get("iss") != issuer:
        raise ValueError("Unexpected token issuer.")

    audience = os.getenv("SUPABASE_JWT_AUDIENCE", "")
    if audience:
        aud = payload.get("aud")
        valid = aud == audience or (isinstance(aud, list) and audience in aud)
        if not valid:
            raise ValueError("Unexpected token audience.")

    return payload


def _json_b64(value: str) -> dict[str, object]:
    decoded = _b64decode(value)
    data = json.loads(decoded.decode("utf-8"))
    if not isinstance(data, dict):
        raise ValueError("JWT part is not an object.")
    return data


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)

