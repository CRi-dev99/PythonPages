import Editor from "@monaco-editor/react";
import type { Session } from "@supabase/supabase-js";
import {
  BookOpen,
  Bug,
  Cloud,
  FileCode2,
  FolderPlus,
  LogIn,
  LogOut,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Save,
  Square,
  Trash2,
  User
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { analyzeCode, askDebugger, emptyAnalysis } from "./lib/api";
import { getAccessToken, isSupabaseConfigured, supabase } from "./lib/supabase";
import {
  createCloudProject,
  createLocalProject,
  deleteCloudProject,
  loadCloudProjects,
  loadLocalProjects,
  saveCloudProject,
  saveLocalProjects
} from "./lib/storage";
import { usePyodideRunner } from "./lib/usePyodideRunner";
import type { RunnerState } from "./lib/usePyodideRunner";
import type { AnalysisResult, ChatMessage, CourseEntry, ProjectRecord } from "./types";

function App() {
  const courseData = useMemo(() => window.COURSE_DATA ?? [], []);
  const initialEntry = useMemo(() => pickInitialCourse(courseData), [courseData]);
  const [courseType, setCourseType] = useState<"tutorial" | "challenge">(initialEntry?.type ?? "tutorial");
  const [selectedNumber, setSelectedNumber] = useState(initialEntry?.number ?? 1);
  const [lessonCollapsed, setLessonCollapsed] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authStatus, setAuthStatus] = useState("");
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState("");
  const [saveStatus, setSaveStatus] = useState("Not saved yet");
  const [analysis, setAnalysis] = useState<AnalysisResult>(emptyAnalysis);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Run or review your code, then ask me what to debug."
    }
  ]);
  const [chatDraft, setChatDraft] = useState("");
  const [terminalInput, setTerminalInput] = useState("");
  const [busy, setBusy] = useState(false);
  const runner = usePyodideRunner();

  const selectedEntries = courseData.filter((entry) => entry.type === courseType);
  const selectedLesson = selectedEntries.find((entry) => entry.number === selectedNumber) ?? selectedEntries[0];
  const currentProject = projects.find((project) => project.id === currentProjectId) ?? projects[0];
  const currentFile = currentProject?.files[0];
  const code = currentFile?.content ?? "";

  useEffect(() => {
    if (!supabase) {
      const localProjects = loadLocalProjects();
      setProjects(localProjects);
      setCurrentProjectId(localProjects[0]?.id ?? "");
      return;
    }

    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (supabase && session) {
        setSaveStatus("Loading cloud projects...");
        try {
          const cloudProjects = await loadCloudProjects(session);
          if (!cancelled) {
            setProjects(cloudProjects);
            setCurrentProjectId(cloudProjects[0]?.id ?? "");
            setSaveStatus("Cloud projects loaded");
          }
        } catch (error) {
          if (!cancelled) setSaveStatus(error instanceof Error ? error.message : "Could not load cloud projects");
        }
        return;
      }
      if (!supabase) return;
      const localProjects = loadLocalProjects();
      setProjects(localProjects);
      setCurrentProjectId(localProjects[0]?.id ?? "");
      setSaveStatus("Local workspace active");
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [session]);

  useEffect(() => {
    if (!currentProject) return;
    setProjects((current) =>
      current.map((project) =>
        project.id === currentProject.id
          ? { ...project, active_lesson_url: selectedLesson?.url ?? project.active_lesson_url }
          : project
      )
    );
  }, [selectedLesson?.url]);

  useEffect(() => {
    if (!currentProject) return;
    const timer = window.setTimeout(() => {
      saveCurrentProject(false);
    }, 900);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, currentProject?.title, currentProject?.active_lesson_url]);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      setAuthStatus("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for cloud accounts.");
      return;
    }
    setAuthStatus(authMode === "signin" ? "Signing in..." : "Creating account...");
    const action =
      authMode === "signin"
        ? supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
        : supabase.auth.signUp({ email: authEmail, password: authPassword });
    const { error } = await action;
    setAuthStatus(error ? error.message : authMode === "signin" ? "Signed in." : "Check your email if confirmation is enabled.");
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setProjects([]);
    setCurrentProjectId("");
  }

  function updateCurrentProject(mutator: (project: ProjectRecord) => ProjectRecord) {
    setProjects((current) => current.map((project) => (project.id === currentProjectId ? mutator(project) : project)));
    setSaveStatus("Unsaved changes");
  }

  function updateCode(nextCode: string | undefined) {
    updateCurrentProject((project) => ({
      ...project,
      updated_at: new Date().toISOString(),
      files: [{ ...(project.files[0] ?? { path: "main.py", language: "python" }), content: nextCode ?? "" }]
    }));
  }

  async function saveCurrentProject(explicit: boolean) {
    if (!currentProject) return;
    try {
      if (supabase && session) {
        await saveCloudProject(currentProject, session);
        setSaveStatus(explicit ? "Saved to cloud" : "Autosaved to cloud");
      } else {
        saveLocalProjects(projects.length ? projects : [currentProject]);
        setSaveStatus(explicit ? "Saved locally" : "Autosaved locally");
      }
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : "Save failed");
    }
  }

  async function createProject() {
    const title = `Python project ${projects.length + 1}`;
    try {
      const project = supabase && session ? await createCloudProject(session, title) : createLocalProject(title);
      const nextProjects = [project, ...projects];
      setProjects(nextProjects);
      setCurrentProjectId(project.id);
      if (!supabase || !session) saveLocalProjects(nextProjects);
      setSaveStatus("New project created");
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : "Could not create project");
    }
  }

  async function deleteProject() {
    if (!currentProject) return;
    try {
      if (supabase && session) await deleteCloudProject(currentProject.id);
      const remaining = projects.filter((project) => project.id !== currentProject.id);
      const nextProjects = remaining.length ? remaining : [createLocalProject()];
      setProjects(nextProjects);
      setCurrentProjectId(nextProjects[0].id);
      if (!supabase || !session) saveLocalProjects(nextProjects);
      setSaveStatus("Project deleted");
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : "Could not delete project");
    }
  }

  async function reviewCode() {
    setBusy(true);
    try {
      const result = await analyzeCode(code);
      setAnalysis(result);
      setSaveStatus(result.safety === "block" ? "Code blocked by safety checks" : "Code reviewed");
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : "Review failed");
    } finally {
      setBusy(false);
    }
  }

  async function runCode() {
    setBusy(true);
    try {
      const result = await analyzeCode(code);
      setAnalysis(result);
      if (result.safety === "block") {
        setSaveStatus("Fix blocked code before running");
        return;
      }
      runner.run(code);
      setSaveStatus(result.safety === "warn" ? "Running with warnings" : "Running");
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : "Run failed");
    } finally {
      setBusy(false);
    }
  }

  function sendTerminalInput(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!terminalInput.trim() && terminalInput !== "") return;
    runner.sendInput(terminalInput);
    setTerminalInput("");
  }

  async function sendChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!chatDraft.trim()) return;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: chatDraft.trim() };
    setChatMessages((current) => [...current, userMessage]);
    setChatDraft("");
    setBusy(true);
    try {
      const latestAnalysis = analysis === emptyAnalysis ? await analyzeCode(code) : analysis;
      setAnalysis(latestAnalysis);
      const token = await getAccessToken(session);
      const response = await askDebugger({
        message: userMessage.content,
        code,
        terminal_output: runner.state.output,
        lesson_title: selectedLesson?.title ?? "",
        token
      });
      setChatMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", content: `${response.reply}\n\n(${response.backend}, ${response.model})` }
      ]);
    } catch (error) {
      setChatMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: error instanceof Error ? error.message : "The debugger could not answer right now."
        }
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ide-page">
      <aside className="sidebar" aria-label="Python tutorial navigation">
        <div className="brand-row">
          <a className="brand" href="./" aria-label="PythonPages IDE home">
            <span className="brand-mark">Py</span>
            <span>
              <strong>PythonPages IDE</strong>
              <small>Learn by doing</small>
            </span>
          </a>
          <button
            className="icon-button mobile-only"
            type="button"
            title={lessonCollapsed ? "Show lesson pane" : "Hide lesson pane"}
            onClick={() => setLessonCollapsed((value) => !value)}
          >
            {lessonCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <div className="picker" aria-label="Choose navigation list">
          <p className="picker-label">Show sidebar</p>
          <div className="picker-menu">
            <button className={courseType === "tutorial" ? "picker-option active" : "picker-option"} onClick={() => setCourseType("tutorial")}>
              Tutorials
            </button>
            <button className={courseType === "challenge" ? "picker-option active" : "picker-option"} onClick={() => setCourseType("challenge")}>
              Challenges
            </button>
          </div>
        </div>

        <select
          className="mobile-nav-select"
          value={`${courseType}:${selectedNumber}`}
          onChange={(event) => {
            const [type, number] = event.target.value.split(":");
            setCourseType(type as "tutorial" | "challenge");
            setSelectedNumber(Number(number));
          }}
        >
          {courseData.map((entry) => (
            <option key={`${entry.type}-${entry.number}`} value={`${entry.type}:${entry.number}`}>
              {entry.title}
            </option>
          ))}
        </select>

        <nav className="nav-list" aria-label={`${courseType} links`}>
          <h2>{courseType === "tutorial" ? "Tutorials" : "Challenges"}</h2>
          {selectedEntries.map((entry) => (
            <button
              key={entry.url}
              className={entry.number === selectedNumber ? "active" : ""}
              type="button"
              onClick={() => setSelectedNumber(entry.number)}
            >
              {entry.title}
            </button>
          ))}
        </nav>
      </aside>

      <main className={lessonCollapsed ? "ide-main lesson-hidden" : "ide-main"}>
        <section className="lesson-pane" aria-label="Selected tutorial or challenge">
          <div className="panel-title">
            <BookOpen size={18} />
            <h1>{selectedLesson?.title ?? "Python lesson"}</h1>
            <button className="icon-button" type="button" title="Hide lesson" onClick={() => setLessonCollapsed(true)}>
              <PanelLeftClose size={17} />
            </button>
          </div>
          <div className="lesson-body markdown-body" dangerouslySetInnerHTML={{ __html: selectedLesson?.html ?? "" }} />
        </section>

        <section className="workspace" aria-label="Python IDE workspace">
          <header className="topbar">
            <div className="project-controls">
              <FileCode2 size={18} />
              <select value={currentProjectId} onChange={(event) => setCurrentProjectId(event.target.value)} aria-label="Project">
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
              <input
                className="project-title"
                value={currentProject?.title ?? ""}
                aria-label="Project title"
                onChange={(event) =>
                  updateCurrentProject((project) => ({
                    ...project,
                    title: event.target.value,
                    updated_at: new Date().toISOString()
                  }))
                }
              />
            </div>
            <div className="toolbar">
              <button type="button" className="icon-text-button" title="New project" onClick={createProject}>
                <FolderPlus size={17} />
                New
              </button>
              <button type="button" className="icon-text-button" title="Save project" onClick={() => saveCurrentProject(true)}>
                <Save size={17} />
                Save
              </button>
              <button type="button" className="icon-text-button danger" title="Delete project" onClick={deleteProject}>
                <Trash2 size={17} />
                Delete
              </button>
            </div>
          </header>

          <div className="work-grid">
            <section className="editor-panel">
              <div className="panel-toolbar">
                <span>main.py</span>
                <div className="runner-actions">
                  <button className="icon-text-button" type="button" onClick={reviewCode} disabled={busy} title="Review code">
                    <Bug size={17} />
                    Review
                  </button>
                  <button className="primary-button" type="button" onClick={runCode} disabled={busy || !currentFile} title="Run code">
                    <Play size={17} />
                    Run
                  </button>
                  <button className="icon-text-button" type="button" onClick={runner.stop} title="Stop code">
                    <Square size={16} />
                    Stop
                  </button>
                </div>
              </div>
              <Editor
                height="100%"
                defaultLanguage="python"
                value={code}
                onChange={updateCode}
                theme="vs"
                options={{
                  minimap: { enabled: false },
                  fontSize: 15,
                  tabSize: 4,
                  insertSpaces: true,
                  wordWrap: "on",
                  automaticLayout: true
                }}
              />
            </section>

            <section className="right-stack">
              <section className="terminal-panel">
                <div className="panel-toolbar dark">
                  <span>Terminal</span>
                  <span>{runner.state.status}</span>
                </div>
                <pre className="terminal-output" aria-live="polite">
                  {terminalText(runner.state)}
                </pre>
                <form className="terminal-input-row" onSubmit={sendTerminalInput}>
                  <input
                    value={terminalInput}
                    onChange={(event) => setTerminalInput(event.target.value)}
                    disabled={runner.state.status !== "waiting"}
                    placeholder={runner.state.status === "waiting" ? runner.state.prompt || "Type input and press Enter" : "Waiting for input..."}
                  />
                </form>
              </section>

              <section className="diagnostics-panel">
                <div className="panel-toolbar">
                  <span>Diagnostics</span>
                  <span className={`safety-pill ${analysis.safety}`}>{analysis.safety}</span>
                </div>
                <ul className="diagnostics-list">
                  {[...analysis.safety_findings, ...analysis.diagnostics].length === 0 && <li>No diagnostics yet.</li>}
                  {analysis.safety_findings.map((item, index) => (
                    <li key={`safety-${index}`} className={item.severity}>
                      {formatIssue(item.category, item.line, item.message)}
                    </li>
                  ))}
                  {analysis.diagnostics.map((item, index) => (
                    <li key={`diag-${index}`} className={item.severity}>
                      {formatIssue(item.category, item.line, item.message)}
                    </li>
                  ))}
                </ul>
              </section>
            </section>
          </div>
        </section>

        <aside className="chat-panel" aria-label="AI debugging chat">
          <section className="account-panel">
            <div className="panel-toolbar">
              <span>
                <User size={16} /> Account
              </span>
              {session && (
                <button className="icon-button" type="button" title="Sign out" onClick={signOut}>
                  <LogOut size={16} />
                </button>
              )}
            </div>
            {session ? (
              <p className="account-status">
                <Cloud size={15} /> {session.user.email}
              </p>
            ) : (
              <form className="auth-form" onSubmit={handleAuth}>
                <input type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="Email" />
                <input
                  type="password"
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  placeholder="Password"
                />
                <button className="primary-button" type="submit">
                  <LogIn size={16} /> {authMode === "signin" ? "Sign in" : "Create account"}
                </button>
                <button className="text-button" type="button" onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}>
                  {authMode === "signin" ? "Create account" : "Use existing account"}
                </button>
                <p className="muted">{authStatus || (isSupabaseConfigured ? "Sign in to save code to Supabase." : "Supabase env vars are not set; local saves are active.")}</p>
              </form>
            )}
          </section>

          <section className="debug-chat">
            <div className="panel-toolbar">
              <span>
                <MessageSquare size={16} /> Debug chat
              </span>
            </div>
            <div className="chat-log">
              {chatMessages.map((message) => (
                <article key={message.id} className={`chat-message ${message.role}`}>
                  {message.content}
                </article>
              ))}
            </div>
            <form className="chat-form" onSubmit={sendChat}>
              <textarea
                value={chatDraft}
                onChange={(event) => setChatDraft(event.target.value)}
                placeholder="Ask what went wrong, or how to debug the output."
              />
              <button className="primary-button" type="submit" disabled={busy || !chatDraft.trim()}>
                <MessageSquare size={16} /> Ask
              </button>
            </form>
          </section>
        </aside>

        <footer className="statusbar">
          <span>{saveStatus}</span>
          <span>{supabase && session ? "Cloud account active" : "Local workspace active"}</span>
          <span>Allowed packages: numpy, pandas, matplotlib</span>
        </footer>
      </main>
    </div>
  );
}

function pickInitialCourse(courseData: CourseEntry[]): CourseEntry | undefined {
  const params = new URLSearchParams(window.location.search);
  const requestedPage = params.get("page");
  if (requestedPage) {
    const entry = courseData.find((item) => item.url === requestedPage);
    if (entry) return entry;
  }
  return courseData.find((entry) => entry.type === "tutorial" && entry.number === 1) ?? courseData[0];
}

function formatIssue(category: string, line: number | null | undefined, message: string) {
  return `${category}${line ? ` line ${line}` : ""}: ${message}`;
}

function terminalText(state: RunnerState) {
  if (state.output) return state.output;
  if (state.status === "loading") return "Loading Python runtime...";
  if (state.status === "running") return "Running Python...";
  if (state.status === "waiting") return state.prompt ? `Waiting for input: ${state.prompt}` : "Waiting for input...";
  if (state.status === "finished") return "Finished with no output.";
  if (state.status === "stopped") return "Stopped.";
  return "Run your code to see output here.";
}

export default App;
