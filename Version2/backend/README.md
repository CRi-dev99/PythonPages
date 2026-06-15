# Version2 Backend

FastAPI backend for the PythonPages IDE.

## Environment

```text
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.5
SUPABASE_URL=...
SUPABASE_JWT_SECRET=...
SUPABASE_JWT_ISSUER=https://YOUR_PROJECT.supabase.co/auth/v1
SUPABASE_JWT_AUDIENCE=authenticated
PY_IDE_ALLOWED_ORIGINS=https://YOUR_SITE
```

For local development without Supabase JWT verification:

```powershell
$env:PY_IDE_ALLOW_DEV_AUTH = "1"
python -m uvicorn app:app --reload
```

Build the frontend first if you want the backend to serve the SPA.

