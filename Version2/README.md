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

## GitHub Pages Deployment

This repo uses GitHub Actions to build and deploy `Version2/frontend` automatically.

In GitHub, open **Settings -> Pages** and set **Build and deployment -> Source** to **GitHub Actions**.

Then add these repository variables under **Settings -> Secrets and variables -> Actions -> Variables**:

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_API_BASE_URL=https://YOUR_BACKEND_HOST
```

After that, every push to `master` that changes `Version2/frontend` will rebuild and publish the site. You do not need to commit `Version2/frontend/dist`.

## Production Notes

- Put OpenAI and Supabase JWT secrets only in the backend environment.
- Put Supabase URL/anon key and a hosted backend API URL in frontend build env vars.
- Apply `supabase/schema.sql` in Supabase before enabling real cloud saves.
- GitHub Pages serves the workflow-built `dist` artifact, not the source TypeScript files.
