export type CourseEntry = {
  type: "tutorial" | "challenge";
  number: number;
  title: string;
  url: string;
  html: string;
};

export type Diagnostic = {
  category: string;
  message: string;
  line?: number | null;
  severity: "info" | "warning" | "error" | string;
};

export type SafetyFinding = {
  category: string;
  message: string;
  line?: number | null;
  severity: "warning" | "error";
};

export type AnalysisResult = {
  syntax_ok: boolean;
  diagnostics: Diagnostic[];
  safety: "allow" | "warn" | "block";
  safety_findings: SafetyFinding[];
  allowed_imports: string[];
  blocked_imports: string[];
  allowed_packages: string[];
};

export type ProjectFile = {
  id?: string;
  project_id?: string;
  user_id?: string;
  path: string;
  language: string;
  content: string;
};

export type ProjectRecord = {
  id: string;
  user_id?: string;
  title: string;
  active_lesson_url: string | null;
  updated_at: string;
  files: ProjectFile[];
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

declare global {
  interface Window {
    COURSE_DATA?: CourseEntry[];
  }
}

