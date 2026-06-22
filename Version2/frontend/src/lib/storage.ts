import type { ProjectRecord } from "../types";
import { supabase } from "./supabase";
import type { Session } from "@supabase/supabase-js";

const LOCAL_KEY = "pythonpages:v2:projects";
const LOCAL_COMPLETIONS_KEY = "pythonpages:v2:course-completions";
const LOCAL_TASK_COMPLETIONS_KEY = "pythonpages:v2:challenge-task-completions";

export const starterCode = 'name = input("What is your name? ")\nprint("Hello", name)\n';

export function createLocalProject(title = "My Python project"): ProjectRecord {
  return {
    id: crypto.randomUUID(),
    title,
    active_lesson_url: "print().html",
    updated_at: new Date().toISOString(),
    files: [{ path: "main.py", language: "python", content: starterCode }]
  };
}

export function loadLocalProjects(): ProjectRecord[] {
  const raw = localStorage.getItem(LOCAL_KEY);
  if (!raw) {
    const first = createLocalProject();
    saveLocalProjects([first]);
    return [first];
  }
  try {
    const parsed = JSON.parse(raw) as ProjectRecord[];
    return parsed.length ? parsed : [createLocalProject()];
  } catch {
    return [createLocalProject()];
  }
}

export function saveLocalProjects(projects: ProjectRecord[]): void {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(projects));
}

export function loadLocalCompletions(): string[] {
  const raw = localStorage.getItem(LOCAL_COMPLETIONS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function markLocalCompletion(courseUrl: string): string[] {
  const next = Array.from(new Set([...loadLocalCompletions(), courseUrl]));
  localStorage.setItem(LOCAL_COMPLETIONS_KEY, JSON.stringify(next));
  return next;
}

export function taskCompletionKey(challengeUrl: string, taskId: string): string {
  return `${challengeUrl}::${taskId}`;
}

export function loadLocalTaskCompletions(): string[] {
  const raw = localStorage.getItem(LOCAL_TASK_COMPLETIONS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function markLocalTaskCompletion(challengeUrl: string, taskId: string): string[] {
  const next = Array.from(new Set([...loadLocalTaskCompletions(), taskCompletionKey(challengeUrl, taskId)]));
  localStorage.setItem(LOCAL_TASK_COMPLETIONS_KEY, JSON.stringify(next));
  return next;
}

export async function loadCloudProjects(session: Session): Promise<ProjectRecord[]> {
  if (!supabase) return loadLocalProjects();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id,user_id,title,active_lesson_url,updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;

  const ids = (projects ?? []).map((project) => project.id);
  const { data: files, error: fileError } = ids.length
    ? await supabase.from("project_files").select("id,project_id,user_id,path,language,content").in("project_id", ids)
    : { data: [], error: null };
  if (fileError) throw fileError;

  if (!projects?.length) {
    return [await createCloudProject(session, "My Python project")];
  }

  return projects.map((project) => ({
    ...project,
    files: (files ?? []).filter((file) => file.project_id === project.id)
  })) as ProjectRecord[];
}

export async function loadCloudCompletions(session: Session): Promise<string[]> {
  if (!supabase) return loadLocalCompletions();
  const { data, error } = await supabase
    .from("course_completions")
    .select("course_url")
    .eq("user_id", session.user.id)
    .order("completed_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((completion) => completion.course_url).filter((courseUrl): courseUrl is string => typeof courseUrl === "string");
}

export async function loadCloudTaskCompletions(session: Session): Promise<string[]> {
  if (!supabase) return loadLocalTaskCompletions();
  const { data, error } = await supabase
    .from("challenge_task_completions")
    .select("challenge_url,task_id")
    .eq("user_id", session.user.id)
    .order("completed_at", { ascending: true });
  if (error) throw error;
  return (data ?? [])
    .filter((completion) => typeof completion.challenge_url === "string" && typeof completion.task_id === "string")
    .map((completion) => taskCompletionKey(completion.challenge_url, completion.task_id));
}

export async function markCloudCompletion(session: Session, courseUrl: string): Promise<void> {
  if (!supabase) {
    markLocalCompletion(courseUrl);
    return;
  }
  const { error } = await supabase.from("course_completions").upsert(
    {
      user_id: session.user.id,
      course_url: courseUrl,
      completed_at: new Date().toISOString()
    },
    { onConflict: "user_id,course_url" }
  );
  if (error) throw error;
}

export async function markCloudTaskCompletion(session: Session, challengeUrl: string, taskId: string): Promise<void> {
  if (!supabase) {
    markLocalTaskCompletion(challengeUrl, taskId);
    return;
  }
  const { error } = await supabase.from("challenge_task_completions").upsert(
    {
      user_id: session.user.id,
      challenge_url: challengeUrl,
      task_id: taskId,
      completed_at: new Date().toISOString()
    },
    { onConflict: "user_id,challenge_url,task_id" }
  );
  if (error) throw error;
}

export async function createCloudProject(session: Session, title: string): Promise<ProjectRecord> {
  if (!supabase) return createLocalProject(title);
  const { data: project, error } = await supabase
    .from("projects")
    .insert({ user_id: session.user.id, title, active_lesson_url: "print().html" })
    .select("id,user_id,title,active_lesson_url,updated_at")
    .single();
  if (error) throw error;

  const { data: file, error: fileError } = await supabase
    .from("project_files")
    .insert({
      project_id: project.id,
      user_id: session.user.id,
      path: "main.py",
      language: "python",
      content: starterCode
    })
    .select("id,project_id,user_id,path,language,content")
    .single();
  if (fileError) throw fileError;
  return { ...project, files: [file] } as ProjectRecord;
}

export async function saveCloudProject(project: ProjectRecord, session: Session): Promise<void> {
  if (!supabase) return;
  await supabase
    .from("projects")
    .update({
      title: project.title,
      active_lesson_url: project.active_lesson_url,
      updated_at: new Date().toISOString()
    })
    .eq("id", project.id);

  const file = project.files[0];
  await supabase.from("project_files").upsert(
    {
      id: file.id,
      project_id: project.id,
      user_id: session.user.id,
      path: file.path,
      language: file.language,
      content: file.content,
      updated_at: new Date().toISOString()
    },
    { onConflict: "project_id,path" }
  );
}

export async function deleteCloudProject(projectId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from("projects").delete().eq("id", projectId);
}
