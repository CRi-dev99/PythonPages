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

type AppView = "home" | "tutorials" | "challenges" | "setup" | "ide" | "login" | "signup";

function App() {
  const courseData = useMemo(() => window.COURSE_DATA ?? [], []);
  const initialEntry = useMemo(() => pickInitialCourse(courseData), [courseData]);
  const [view, setView] = useState<AppView>(() => (requestedCourseEntry(courseData) ? "ide" : "home"));
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

  function navigate(nextView: AppView) {
    setView(nextView);
    if (nextView !== "ide") {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }

  function openCourseEntry(entry: CourseEntry) {
    setCourseType(entry.type);
    setSelectedNumber(entry.number);
    setLessonCollapsed(false);
    setView("ide");
    window.history.replaceState(null, "", `?page=${encodeURIComponent(entry.url)}`);
  }

  function openAuth(nextMode: "signin" | "signup") {
    setAuthMode(nextMode);
    setAuthStatus("");
    navigate(nextMode === "signin" ? "login" : "signup");
  }

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
    if (!error && authMode === "signin") navigate("ide");
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setProjects([]);
    setCurrentProjectId("");
    navigate("home");
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
    <div className="app-shell">
      <header className="site-nav">
        <button className="brand nav-brand" type="button" onClick={() => navigate("home")} aria-label="PythonPages home">
          <span className="brand-mark">Py</span>
          <span>
            <strong>PythonPages IDE</strong>
            <small>Learn by doing</small>
          </span>
        </button>
        <nav className="top-nav" aria-label="Main navigation">
          <button className={view === "tutorials" ? "nav-link active" : "nav-link"} type="button" onClick={() => navigate("tutorials")}>
            Tutorials
          </button>
          <button className={view === "challenges" ? "nav-link active" : "nav-link"} type="button" onClick={() => navigate("challenges")}>
            Challenges
          </button>
          <button className={view === "setup" ? "nav-link active" : "nav-link"} type="button" onClick={() => navigate("setup")}>
            Set up Python
          </button>
          <button className={view === "ide" ? "nav-link active" : "nav-link"} type="button" onClick={() => navigate("ide")}>
            IDE
          </button>
          {session ? (
            <>
              <span className="nav-user">
                <Cloud size={15} /> {session.user.email}
              </span>
              <button className="nav-link" type="button" onClick={signOut}>
                <LogOut size={16} /> Sign out
              </button>
            </>
          ) : (
            <>
              <button className={view === "login" ? "nav-link active" : "nav-link"} type="button" onClick={() => openAuth("signin")}>
                Login
              </button>
              <button className="nav-cta" type="button" onClick={() => openAuth("signup")}>
                Sign up
              </button>
            </>
          )}
        </nav>
      </header>

      {view === "home" && (
        <HomeView
          onSignIn={() => openAuth("signin")}
          onSignUp={() => openAuth("signup")}
          onNavigate={navigate}
        />
      )}
      {view === "tutorials" && <CourseDirectory title="Tutorials" entries={courseData.filter((entry) => entry.type === "tutorial")} onOpen={openCourseEntry} />}
      {view === "challenges" && (
        <CourseDirectory title="Challenges" entries={courseData.filter((entry) => entry.type === "challenge")} onOpen={openCourseEntry} />
      )}
      {view === "setup" && <SetupView onOpenIde={() => navigate("ide")} onSignUp={() => openAuth("signup")} />}
      {(view === "login" || view === "signup") && (
        <AuthView
          authEmail={authEmail}
          authMode={authMode}
          authPassword={authPassword}
          authStatus={authStatus}
          onEmailChange={setAuthEmail}
          onModeChange={openAuth}
          onPasswordChange={setAuthPassword}
          onSubmit={handleAuth}
        />
      )}
      {view === "ide" && (
        <IdeView
          analysis={analysis}
          busy={busy}
          chatDraft={chatDraft}
          chatMessages={chatMessages}
          code={code}
          currentFile={currentFile}
          currentProject={currentProject}
          currentProjectId={currentProjectId}
          lessonCollapsed={lessonCollapsed}
          projects={projects}
          runner={runner}
          saveStatus={saveStatus}
          selectedLesson={selectedLesson}
          session={session}
          terminalInput={terminalInput}
          onChatDraftChange={setChatDraft}
          onCreateProject={createProject}
          onDeleteProject={deleteProject}
          onProjectChange={setCurrentProjectId}
          onReview={reviewCode}
          onRun={runCode}
          onSave={() => saveCurrentProject(true)}
          onSendChat={sendChat}
          onSendTerminalInput={sendTerminalInput}
          onSetLessonCollapsed={setLessonCollapsed}
          onTerminalInputChange={setTerminalInput}
          onUpdateCode={updateCode}
          onUpdateCurrentProject={updateCurrentProject}
        />
      )}
    </div>
  );
}

function HomeView({
  onNavigate,
  onSignIn,
  onSignUp
}: {
  onNavigate: (view: AppView) => void;
  onSignIn: () => void;
  onSignUp: () => void;
}) {
  return (
    <main className="landing-view">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div>
          <span className="eyebrow">PythonPages</span>
          <h1 id="landing-title">Learn Python in a real browser IDE.</h1>
          <p>If you're new here, sign up. Otherwise, sign in.</p>
          <div className="landing-actions">
            <button className="primary-button" type="button" onClick={onSignUp}>
              Sign up
            </button>
            <button className="icon-text-button" type="button" onClick={onSignIn}>
              Sign in
            </button>
          </div>
        </div>
        <div className="landing-panel" aria-label="PythonPages overview">
          <strong>Run, review, and debug Python code in one workspace.</strong>
          <p>Open lessons, save projects to your account, and use the AI debugger when your output does not make sense.</p>
          <div className="landing-links">
            <button type="button" onClick={() => onNavigate("tutorials")}>
              Tutorials
            </button>
            <button type="button" onClick={() => onNavigate("challenges")}>
              Challenges
            </button>
            <button type="button" onClick={() => onNavigate("setup")}>
              Set up Python
            </button>
            <button type="button" onClick={() => onNavigate("ide")}>
              IDE
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function CourseDirectory({ entries, onOpen, title }: { entries: CourseEntry[]; onOpen: (entry: CourseEntry) => void; title: string }) {
  return (
    <main className="directory-view" aria-labelledby={`${title.toLowerCase()}-title`}>
      <div className="section-heading">
        <span className="eyebrow">Choose a lesson</span>
        <h1 id={`${title.toLowerCase()}-title`}>{title}</h1>
      </div>
      <div className="course-grid">
        {entries.map((entry) => (
          <button className="course-card" key={entry.url} type="button" onClick={() => onOpen(entry)}>
            <span>{entry.type === "tutorial" ? "Lesson" : "Challenge"} {entry.number}</span>
            <strong>{entry.title}</strong>
          </button>
        ))}
      </div>
    </main>
  );
}

function SetupView({ onOpenIde, onSignUp }: { onOpenIde: () => void; onSignUp: () => void }) {
  return (
    <main className="setup-view" aria-labelledby="setup-title">
      <section className="setup-panel">
        <span className="eyebrow">Set up Python</span>
        <h1 id="setup-title">Start in the browser, install locally when you are ready.</h1>
        <div className="setup-steps">
          <article>
            <strong>No install needed</strong>
            <p>The PythonPages IDE runs Python in your browser, so you can start lessons immediately.</p>
          </article>
          <article>
            <strong>Optional local setup</strong>
            <p>Install Python and Thonny if you want a local editor for classwork or offline practice.</p>
          </article>
          <article>
            <strong>Save your work</strong>
            <p>Create an account to save projects to Supabase and reload them on another device.</p>
          </article>
        </div>
        <div className="landing-actions">
          <button className="primary-button" type="button" onClick={onOpenIde}>
            Open IDE
          </button>
          <button className="icon-text-button" type="button" onClick={onSignUp}>
            Sign up
          </button>
        </div>
      </section>
    </main>
  );
}

function AuthView({
  authEmail,
  authMode,
  authPassword,
  authStatus,
  onEmailChange,
  onModeChange,
  onPasswordChange,
  onSubmit
}: {
  authEmail: string;
  authMode: "signin" | "signup";
  authPassword: string;
  authStatus: string;
  onEmailChange: (value: string) => void;
  onModeChange: (mode: "signin" | "signup") => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <main className="auth-view" aria-labelledby="auth-title">
      <section className="auth-card">
        <div className="section-heading">
          <span className="eyebrow">Account</span>
          <h1 id="auth-title">{authMode === "signin" ? "Login" : "Sign up"}</h1>
          <p>{authMode === "signin" ? "Sign in to load your saved projects." : "Create an account to save code to the cloud."}</p>
        </div>
        <form className="auth-form" onSubmit={onSubmit}>
          <input type="email" value={authEmail} onChange={(event) => onEmailChange(event.target.value)} placeholder="Email" />
          <input
            type="password"
            value={authPassword}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder="Password"
          />
          <button className="primary-button" type="submit">
            <LogIn size={16} /> {authMode === "signin" ? "Login" : "Sign up"}
          </button>
          <button className="text-button" type="button" onClick={() => onModeChange(authMode === "signin" ? "signup" : "signin")}>
            {authMode === "signin" ? "New here? Sign up" : "Already have an account? Login"}
          </button>
          <p className="muted">{authStatus || (isSupabaseConfigured ? "Accounts save your code to Supabase." : "Supabase env vars are not set; local saves are active.")}</p>
        </form>
      </section>
    </main>
  );
}

function IdeView({
  analysis,
  busy,
  chatDraft,
  chatMessages,
  code,
  currentFile,
  currentProject,
  currentProjectId,
  lessonCollapsed,
  projects,
  runner,
  saveStatus,
  selectedLesson,
  session,
  terminalInput,
  onChatDraftChange,
  onCreateProject,
  onDeleteProject,
  onProjectChange,
  onReview,
  onRun,
  onSave,
  onSendChat,
  onSendTerminalInput,
  onSetLessonCollapsed,
  onTerminalInputChange,
  onUpdateCode,
  onUpdateCurrentProject
}: {
  analysis: AnalysisResult;
  busy: boolean;
  chatDraft: string;
  chatMessages: ChatMessage[];
  code: string;
  currentFile: ProjectRecord["files"][number] | undefined;
  currentProject: ProjectRecord | undefined;
  currentProjectId: string;
  lessonCollapsed: boolean;
  projects: ProjectRecord[];
  runner: ReturnType<typeof usePyodideRunner>;
  saveStatus: string;
  selectedLesson: CourseEntry | undefined;
  session: Session | null;
  terminalInput: string;
  onChatDraftChange: (value: string) => void;
  onCreateProject: () => void;
  onDeleteProject: () => void;
  onProjectChange: (value: string) => void;
  onReview: () => void;
  onRun: () => void;
  onSave: () => void;
  onSendChat: (event: FormEvent<HTMLFormElement>) => void;
  onSendTerminalInput: (event: FormEvent<HTMLFormElement>) => void;
  onSetLessonCollapsed: (value: boolean) => void;
  onTerminalInputChange: (value: string) => void;
  onUpdateCode: (value: string | undefined) => void;
  onUpdateCurrentProject: (mutator: (project: ProjectRecord) => ProjectRecord) => void;
}) {
  return (
    <main className={lessonCollapsed ? "ide-main lesson-hidden" : "ide-main"}>
      <section className="lesson-pane" aria-label="Selected tutorial or challenge">
        <div className="panel-title">
          {!lessonCollapsed && <BookOpen size={18} />}
          {!lessonCollapsed && <h1>{selectedLesson?.title ?? "Python lesson"}</h1>}
          <button
            className="icon-button"
            type="button"
            title={lessonCollapsed ? "Show lesson" : "Hide lesson"}
            onClick={() => onSetLessonCollapsed(!lessonCollapsed)}
          >
            {lessonCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>
        <div className="lesson-body markdown-body" dangerouslySetInnerHTML={{ __html: selectedLesson?.html ?? "" }} />
      </section>

      <section className="workspace" aria-label="Python IDE workspace">
        <header className="topbar">
          <div className="project-controls">
            <FileCode2 size={18} />
            <select value={currentProjectId} onChange={(event) => onProjectChange(event.target.value)} aria-label="Project">
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
                onUpdateCurrentProject((project) => ({
                  ...project,
                  title: event.target.value,
                  updated_at: new Date().toISOString()
                }))
              }
            />
          </div>
          <div className="toolbar">
            <button type="button" className="icon-text-button" title="New project" onClick={onCreateProject}>
              <FolderPlus size={17} />
              New
            </button>
            <button type="button" className="icon-text-button" title="Save project" onClick={onSave}>
              <Save size={17} />
              Save
            </button>
            <button type="button" className="icon-text-button danger" title="Delete project" onClick={onDeleteProject}>
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
                <button className="icon-text-button" type="button" onClick={onReview} disabled={busy} title="Review code">
                  <Bug size={17} />
                  Review
                </button>
                <button className="primary-button" type="button" onClick={onRun} disabled={busy || !currentFile} title="Run code">
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
              onChange={onUpdateCode}
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
              <form className="terminal-input-row" onSubmit={onSendTerminalInput}>
                <input
                  value={terminalInput}
                  onChange={(event) => onTerminalInputChange(event.target.value)}
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
        <section className="debug-chat">
          <div className="panel-toolbar">
            <span>
              <MessageSquare size={16} /> Debug chat
            </span>
            {session && (
              <span className="account-status">
                <User size={15} /> Cloud account
              </span>
            )}
          </div>
          <div className="chat-log">
            {chatMessages.map((message) => (
              <article key={message.id} className={`chat-message ${message.role}`}>
                {message.content}
              </article>
            ))}
          </div>
          <form className="chat-form" onSubmit={onSendChat}>
            <textarea
              value={chatDraft}
              onChange={(event) => onChatDraftChange(event.target.value)}
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
  );
}

function requestedCourseEntry(courseData: CourseEntry[]): CourseEntry | undefined {
  const params = new URLSearchParams(window.location.search);
  const requestedPage = params.get("page");
  return requestedPage ? courseData.find((item) => item.url === requestedPage) : undefined;
}

function pickInitialCourse(courseData: CourseEntry[]): CourseEntry | undefined {
  return requestedCourseEntry(courseData) ?? courseData.find((entry) => entry.type === "tutorial" && entry.number === 1) ?? courseData[0];
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
