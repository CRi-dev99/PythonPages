create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled project',
  active_lesson_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  path text not null,
  language text not null default 'python',
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, path)
);

create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Debugging chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.course_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_url text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, course_url)
);

create table if not exists public.challenge_task_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_url text not null,
  task_id text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, challenge_url, task_id)
);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_files enable row level security;
alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;
alter table public.course_completions enable row level security;
alter table public.challenge_task_completions enable row level security;

create policy "profiles are owned by the signed in user"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "projects are owned by the signed in user"
  on public.projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "project files are owned by the signed in user"
  on public.project_files for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id and exists (
      select 1 from public.projects
      where projects.id = project_files.project_id
        and projects.user_id = auth.uid()
    )
  );

create policy "chat threads are owned by the signed in user"
  on public.chat_threads for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "chat messages are owned by the signed in user"
  on public.chat_messages for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id and exists (
      select 1 from public.chat_threads
      where chat_threads.id = chat_messages.thread_id
        and chat_threads.user_id = auth.uid()
    )
  );

create policy "course completions are owned by the signed in user"
  on public.course_completions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "challenge task completions are owned by the signed in user"
  on public.challenge_task_completions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
