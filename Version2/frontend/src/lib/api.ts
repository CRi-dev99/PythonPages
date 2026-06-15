import type { AnalysisResult } from "../types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export const emptyAnalysis: AnalysisResult = {
  syntax_ok: true,
  diagnostics: [],
  safety: "allow",
  safety_findings: [],
  allowed_imports: [],
  blocked_imports: [],
  allowed_packages: ["matplotlib", "numpy", "pandas"]
};

export async function analyzeCode(code: string): Promise<AnalysisResult> {
  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code })
  });
  if (!response.ok) throw new Error("The analyzer is not available.");
  return (await response.json()) as AnalysisResult;
}

export async function askDebugger(input: {
  message: string;
  code: string;
  terminal_output: string;
  lesson_title: string;
  token: string | null;
}): Promise<{ reply: string; backend: string; model: string }> {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(input.token ? { Authorization: `Bearer ${input.token}` } : {})
    },
    body: JSON.stringify(input)
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.detail || payload.error || "The AI debugger is not available.");
  }
  return payload;
}
