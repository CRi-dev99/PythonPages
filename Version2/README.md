# PythonPages Version2 IDE

Version2 is a new single-page Python IDE for the tutorial site. It keeps the Version1 course content and palette, but combines the code runner, review diagnostics, cloud projects, and debugging chat into one workspace.

## Local Development

Backend:

```powershell
cd Version2/backend
$env:PY_IDE_ALLOW_DEV_AUTH = "1"
python -m uvicorn app:app --host 127.0.0.1 --port 8000
```

Frontend:

```powershell
cd Version2/frontend
npm.cmd install
npm.cmd run dev -- --port 5173
```

Open:

```text
http://127.0.0.1:5173
```

## Production Notes

- Put OpenAI and Supabase JWT secrets only in the backend environment.
- Put Supabase URL/anon key and a hosted backend API URL in frontend build env vars.
- Apply `supabase/schema.sql` in Supabase before enabling real cloud saves.
- `Version2/frontend/dist` is the static build currently targeted by the root `index.html` redirect.

