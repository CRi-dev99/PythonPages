from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from dataclasses import dataclass

from fastapi import Header, HTTPException
import jwt
from jwt import PyJWKClient
from jwt.exceptions import ExpiredSignatureError, InvalidAudienceError, InvalidIssuerError, PyJWTError


ASYMMETRIC_ALGORITHMS = {"ES256", "RS256"}


@dataclass
class AuthUser:
    id: str
    email: str = ""


class AuthConfigError(RuntimeError):
    pass


def require_user(authorization: str | None = Header(default=None)) -> AuthUser:
    secret = os.getenv("SUPABASE_JWT_SECRET", "")
    allow_dev = os.getenv("PY_IDE_ALLOW_DEV_AUTH") == "1"

    if not authorization or not authorization.lower().startswith("bearer "):
        if allow_dev:
            return AuthUser(id="dev-user", email="dev@example.local")
        raise HTTPException(status_code=401, detail="Missing bearer token.")

    token = authorization.split(" ", 1)[1].strip()
    if not secret and not _supabase_project_url():
        if allow_dev:
            return AuthUser(id="dev-user", email="dev@example.local")
        raise HTTPException(status_code=503, detail="Supabase JWT verification is not configured.")

    try:
        payload = verify_supabase_jwt(token, secret)
    except AuthConfigError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
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
    algorithm = str(header.get("alg") or "")
    if algorithm in ASYMMETRIC_ALGORITHMS:
        return _verify_supabase_jwt_with_jwks(token, algorithm)
    if algorithm != "HS256":
        raise ValueError("Unsupported token algorithm.")
    if not secret:
        raise AuthConfigError("Supabase JWT secret is required for HS256 tokens.")

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


def _verify_supabase_jwt_with_jwks(token: str, algorithm: str) -> dict[str, object]:
    supabase_url = _supabase_project_url()
    if not supabase_url:
        raise AuthConfigError("SUPABASE_URL is required for Supabase asymmetric JWT verification.")

    audience = os.getenv("SUPABASE_JWT_AUDIENCE", "")
    issuer = os.getenv("SUPABASE_JWT_ISSUER", "")
    jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
    client = PyJWKClient(jwks_url)
    try:
        signing_key = client.get_signing_key_from_jwt(token)
        options = {"verify_aud": bool(audience), "verify_iss": bool(issuer)}
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=[algorithm],
            audience=audience or None,
            issuer=issuer or None,
            options=options,
        )
    except ExpiredSignatureError as exc:
        raise ValueError("Token has expired.") from exc
    except InvalidAudienceError as exc:
        raise ValueError("Unexpected token audience.") from exc
    except InvalidIssuerError as exc:
        raise ValueError("Unexpected token issuer.") from exc
    except PyJWTError as exc:
        raise ValueError("Invalid token signature.") from exc
    if not isinstance(payload, dict):
        raise ValueError("JWT payload is not an object.")
    return payload


def _supabase_project_url() -> str:
    url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
    for suffix in ("/rest/v1", "/auth/v1"):
        if url.endswith(suffix):
            url = url[: -len(suffix)]
    return url


def _json_b64(value: str) -> dict[str, object]:
    decoded = _b64decode(value)
    data = json.loads(decoded.decode("utf-8"))
    if not isinstance(data, dict):
        raise ValueError("JWT part is not an object.")
    return data


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)
