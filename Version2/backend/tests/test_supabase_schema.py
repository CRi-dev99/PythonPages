from pathlib import Path


SCHEMA = Path(__file__).resolve().parents[2] / "supabase" / "schema.sql"


def test_schema_enables_rls_for_user_owned_tables() -> None:
    sql = SCHEMA.read_text(encoding="utf-8").lower()
    for table in [
        "profiles",
        "projects",
        "project_files",
        "chat_threads",
        "chat_messages",
        "course_completions",
        "challenge_task_completions",
    ]:
        assert f"alter table public.{table} enable row level security" in sql


def test_schema_restricts_rows_to_authenticated_owner() -> None:
    sql = SCHEMA.read_text(encoding="utf-8").lower()
    assert "auth.uid() = id" in sql
    assert "auth.uid() = user_id" in sql
    assert "unique (project_id, path)" in sql
    assert "primary key (user_id, course_url)" in sql
    assert "primary key (user_id, challenge_url, task_id)" in sql
