import base64
import hashlib
import hmac
import json
import time

import pytest

from python_ide import auth


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def _token(header: dict[str, object], payload: dict[str, object], secret: str | None = None) -> str:
    first = _b64(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    second = _b64(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    if secret is None:
        signature = _b64(b"test-signature")
    else:
        signature = _b64(hmac.new(secret.encode("utf-8"), f"{first}.{second}".encode("ascii"), hashlib.sha256).digest())
    return f"{first}.{second}.{signature}"


def test_verifies_legacy_hs256_supabase_token(monkeypatch) -> None:
    monkeypatch.setenv("SUPABASE_JWT_ISSUER", "https://example.supabase.co/auth/v1")
    monkeypatch.setenv("SUPABASE_JWT_AUDIENCE", "authenticated")
    token = _token(
        {"alg": "HS256", "typ": "JWT"},
        {
            "sub": "user-123",
            "email": "student@example.com",
            "iss": "https://example.supabase.co/auth/v1",
            "aud": "authenticated",
            "exp": time.time() + 60,
        },
        "legacy-secret",
    )

    payload = auth.verify_supabase_jwt(token, "legacy-secret")

    assert payload["sub"] == "user-123"
    assert payload["email"] == "student@example.com"


def test_hs256_tokens_require_the_supabase_jwt_secret(monkeypatch) -> None:
    monkeypatch.delenv("SUPABASE_JWT_SECRET", raising=False)
    token = _token({"alg": "HS256", "typ": "JWT"}, {"sub": "user-123", "exp": time.time() + 60})

    with pytest.raises(auth.AuthConfigError, match="JWT secret"):
        auth.verify_supabase_jwt(token, "")


def test_verifies_asymmetric_supabase_token_with_jwks(monkeypatch) -> None:
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co/rest/v1")
    monkeypatch.setenv("SUPABASE_JWT_ISSUER", "https://example.supabase.co/auth/v1")
    monkeypatch.setenv("SUPABASE_JWT_AUDIENCE", "authenticated")
    token = _token({"alg": "ES256", "kid": "test-key", "typ": "JWT"}, {"sub": "user-123"})
    calls: dict[str, object] = {}

    class FakeSigningKey:
        key = "public-key"

    class FakeJwkClient:
        def __init__(self, url: str) -> None:
            calls["jwks_url"] = url

        def get_signing_key_from_jwt(self, incoming_token: str) -> FakeSigningKey:
            calls["token"] = incoming_token
            return FakeSigningKey()

    def fake_decode(incoming_token: str, key: str, **kwargs: object) -> dict[str, object]:
        calls["decode"] = {"token": incoming_token, "key": key, **kwargs}
        return {"sub": "user-123", "email": "student@example.com"}

    monkeypatch.setattr(auth, "PyJWKClient", FakeJwkClient)
    monkeypatch.setattr(auth.jwt, "decode", fake_decode)

    payload = auth.verify_supabase_jwt(token, "")

    assert payload["sub"] == "user-123"
    assert calls["jwks_url"] == "https://example.supabase.co/auth/v1/.well-known/jwks.json"
    assert calls["token"] == token
    assert calls["decode"] == {
        "token": token,
        "key": "public-key",
        "algorithms": ["ES256"],
        "audience": "authenticated",
        "issuer": "https://example.supabase.co/auth/v1",
        "options": {"verify_aud": True, "verify_iss": True},
    }
