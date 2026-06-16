# Version2 Backend

FastAPI backend for the PythonPages IDE.

## Environment

```text
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.5
SUPABASE_URL=...
SUPABASE_JWT_ISSUER=https://YOUR_PROJECT.supabase.co/auth/v1
SUPABASE_JWT_AUDIENCE=authenticated
PY_IDE_ALLOWED_ORIGINS=https://YOUR_SITE
```

`SUPABASE_URL` should be the project root, for example `https://YOUR_PROJECT.supabase.co`.
The backend uses it to verify newer Supabase `ES256`/`RS256` tokens through JWKS.
`SUPABASE_JWT_SECRET` is only needed for older Supabase projects that still issue legacy `HS256` tokens.

For local development without Supabase JWT verification:

```powershell
$env:PY_IDE_ALLOW_DEV_AUTH = "1"
python -m uvicorn app:app --reload
```

Build the frontend first if you want the backend to serve the SPA.
