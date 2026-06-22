import Editor from "@monaco-editor/react";
import type { Session } from "@supabase/supabase-js";
import {
  ArrowRight,
  BookOpen,
  Bug,
  CheckCircle,
  Cloud,
  FileCode2,
  FolderPlus,
  LogIn,
  LogOut,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Play,
  Save,
  Square,
  Trash2,
  User
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { analyzeCode, askDebugger, emptyAnalysis } from "./lib/api";
import { getAccessToken, getAuthRedirectUrl, isSupabaseConfigured, supabase } from "./lib/supabase";
import {
  createCloudProject,
  createLocalProject,
  deleteCloudProject,
  loadCloudCompletions,
  loadCloudProjects,
  loadLocalCompletions,
  loadLocalProjects,
  markCloudCompletion,
  markLocalCompletion,
  saveCloudProject,
  saveLocalProjects
} from "./lib/storage";
import { usePyodideRunner } from "./lib/usePyodideRunner";
import type { RunnerState } from "./lib/usePyodideRunner";
import type { AnalysisResult, ChatMessage, CourseEntry, ProjectRecord } from "./types";

type AppView = "home" | "tutorials" | "challenges" | "setup" | "ide" | "login" | "signup";
type ResizeKey = "lessonWidth" | "chatWidth" | "outputHeight" | "diagnosticsWidth";

type IdeLayout = Record<ResizeKey, number>;

const IDE_LAYOUT_KEY = "pythonpages-ide-layout";
const DEFAULT_IDE_LAYOUT: IdeLayout = {
  lessonWidth: 320,
  chatWidth: 360,
  outputHeight: 240,
  diagnosticsWidth: 320
};
const IDE_LAYOUT_LIMITS: Record<ResizeKey, { min: number; max: number }> = {
  lessonWidth: { min: 260, max: 460 },
  chatWidth: { min: 300, max: 460 },
  outputHeight: { min: 220, max: 520 },
  diagnosticsWidth: { min: 260, max: 420 }
};

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
  const [completedCourseUrls, setCompletedCourseUrls] = useState<Set<string>>(() => new Set(loadLocalCompletions()));
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
  const nextCourseEntry = selectedLesson ? getNextCourseEntry(courseData, selectedLesson) : undefined;
  const selectedLessonDone = selectedLesson ? completedCourseUrls.has(selectedLesson.url) : false;
  const currentProject = projects.find((project) => project.id === currentProjectId) ?? projects[0];
  const currentFile = currentProject?.files[0];
  const code = currentFile?.content ?? "";

  useEffect(() => {
    const authCallback = readAuthCallback();
    if (authCallback.errorMessage) {
      setAuthMode("signin");
      setAuthStatus(authCallback.errorMessage);
      setView("login");
      cleanAuthCallbackUrl();
    }

    if (!supabase) {
      const localProjects = loadLocalProjects();
      setProjects(localProjects);
      setCurrentProjectId(localProjects[0]?.id ?? "");
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!authCallback.hasCallback || authCallback.errorMessage) return;
      if (data.session) {
        setAuthStatus("Account confirmed. You are signed in.");
        setView("ide");
      } else {
        setAuthMode("signin");
        setAuthStatus("Email confirmed. Please log in to continue.");
        setView("login");
      }
      cleanAuthCallbackUrl();
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (authCallback.hasCallback && !authCallback.errorMessage && nextSession) {
        setAuthStatus("Account confirmed. You are signed in.");
        setView("ide");
        cleanAuthCallbackUrl();
      }
    });
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
    let cancelled = false;
    async function loadCompletions() {
      if (supabase && session) {
        try {
          const cloudCompletions = await loadCloudCompletions(session);
          if (!cancelled) setCompletedCourseUrls(new Set(cloudCompletions));
        } catch (error) {
          if (!cancelled) setSaveStatus(error instanceof Error ? error.message : "Could not load course progress");
        }
        return;
      }
      setCompletedCourseUrls(new Set(loadLocalCompletions()));
    }
    loadCompletions();
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

  async function markCourseDone(entry: CourseEntry | undefined) {
    if (!entry || completedCourseUrls.has(entry.url)) return;
    setCompletedCourseUrls((current) => new Set([...current, entry.url]));
    try {
      if (supabase && session) {
        await markCloudCompletion(session, entry.url);
        setSaveStatus(`${entry.title} marked done`);
      } else {
        markLocalCompletion(entry.url);
        setSaveStatus(`${entry.title} marked done locally`);
      }
    } catch (error) {
      setCompletedCourseUrls((current) => {
        const next = new Set(current);
        next.delete(entry.url);
        return next;
      });
      setSaveStatus(error instanceof Error ? error.message : "Could not save course progress");
    }
  }

  async function openNextCourseEntry(currentEntry: CourseEntry | undefined, nextEntry: CourseEntry) {
    await markCourseDone(currentEntry);
    openCourseEntry(nextEntry);
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
        : supabase.auth.signUp({
            email: authEmail,
            password: authPassword,
            options: { emailRedirectTo: getAuthRedirectUrl() }
          });
    const { error } = await action;
    setAuthStatus(
      error
        ? error.message
        : authMode === "signin"
          ? "Signed in."
          : "Check your email to confirm your account. The link should bring you back to PythonPages."
    );
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
              <button className={view === "signup" ? "nav-cta active" : "nav-cta"} type="button" onClick={() => openAuth("signup")}>
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
      {view === "tutorials" && (
        <CourseDirectory
          title="Tutorials"
          entries={courseData.filter((entry) => entry.type === "tutorial")}
          completedCourseUrls={completedCourseUrls}
          onOpen={openCourseEntry}
        />
      )}
      {view === "challenges" && (
        <CourseDirectory
          title="Challenges"
          entries={courseData.filter((entry) => entry.type === "challenge")}
          completedCourseUrls={completedCourseUrls}
          onOpen={openCourseEntry}
        />
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
          nextCourseEntry={nextCourseEntry}
          selectedLessonDone={selectedLessonDone}
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
          onMarkCourseDone={() => markCourseDone(selectedLesson)}
          onOpenNextCourseEntry={(entry) => openNextCourseEntry(selectedLesson, entry)}
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

function CourseDirectory({
  completedCourseUrls,
  entries,
  onOpen,
  title
}: {
  completedCourseUrls: Set<string>;
  entries: CourseEntry[];
  onOpen: (entry: CourseEntry) => void;
  title: string;
}) {
  return (
    <main className="directory-view" aria-labelledby={`${title.toLowerCase()}-title`}>
      <div className="section-heading">
        <span className="eyebrow">Choose a lesson</span>
        <h1 id={`${title.toLowerCase()}-title`}>{title}</h1>
      </div>
      <div className="course-grid">
        {entries.map((entry) => {
          const isDone = completedCourseUrls.has(entry.url);
          return (
            <button className={isDone ? "course-card done" : "course-card"} key={entry.url} type="button" onClick={() => onOpen(entry)}>
              <span>{entry.type === "tutorial" ? "Lesson" : "Challenge"} {entry.number}</span>
              <strong>{entry.title}</strong>
              {isDone && (
                <small className="done-badge">
                  <CheckCircle size={14} /> Done
                </small>
              )}
            </button>
          );
        })}
      </div>
    </main>
  );
}

function SetupView({ onOpenIde, onSignUp }: { onOpenIde: () => void; onSignUp: () => void }) {
  return (
    <main className="setup-view" aria-labelledby="setup-title">
      <section className="setup-panel">
        <span className="eyebrow">Set up Python</span>
        <h1 id="setup-title">No setup required.</h1>
        <p>
          Because you are using PythonPages, you can learn Python directly on this website. The browser IDE runs your code,
          shows your output, and keeps the lesson beside your editor, so you can start learning without installing anything.
        </p>
        <div className="landing-actions">
          <button className="primary-button" type="button" onClick={onOpenIde}>
            Open IDE
          </button>
          <button className="icon-text-button" type="button" onClick={onSignUp}>
            Sign up
          </button>
        </div>
        <section className="setup-local" aria-labelledby="local-setup-title">
          <div>
            <span className="eyebrow">Optional</span>
            <h2 id="local-setup-title">Set up Python locally</h2>
            <p>
              If you want to build your own projects outside PythonPages, install Python and VS Code on your computer.
            </p>
          </div>
          <ol className="setup-steps">
            <li>
              <strong>Download Python</strong>
              <p>
                Go to{" "}
                <a href="https://www.python.org/downloads/" target="_blank" rel="noreferrer">
                  python.org/downloads
                </a>{" "}
                and download the latest version for your computer.
              </p>
            </li>
            <li>
              <strong>Install Python</strong>
              <p>Run the installer and tick <strong>Add Python to PATH</strong> before you click install.</p>
            </li>
            <li>
              <strong>Check Python works</strong>
              <p>
                Open a terminal and type <code>python --version</code>. If Python is installed, it will print the version
                number.
              </p>
            </li>
            <li>
              <strong>Download VS Code</strong>
              <p>
                Go to{" "}
                <a href="https://code.visualstudio.com/" target="_blank" rel="noreferrer">
                  code.visualstudio.com
                </a>{" "}
                and install Visual Studio Code.
              </p>
            </li>
            <li>
              <strong>Install the Python extension</strong>
              <p>
                In VS Code, install the{" "}
                <a href="https://marketplace.visualstudio.com/items?itemName=ms-python.python" target="_blank" rel="noreferrer">
                  Microsoft Python extension
                </a>
                .
              </p>
            </li>
            <li>
              <strong>Create a project</strong>
              <p>Open a folder in VS Code, create a file called <code>main.py</code>, and save your work there.</p>
            </li>
            <li>
              <strong>Run your first file</strong>
              <p>
                Type <code>print("Hello, Python!")</code>, then use the Run button or type <code>python main.py</code> in
                the VS Code terminal.
              </p>
            </li>
          </ol>
        </section>
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
  nextCourseEntry,
  projects,
  runner,
  saveStatus,
  selectedLesson,
  selectedLessonDone,
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
  onMarkCourseDone,
  onOpenNextCourseEntry,
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
  nextCourseEntry: CourseEntry | undefined;
  projects: ProjectRecord[];
  runner: ReturnType<typeof usePyodideRunner>;
  saveStatus: string;
  selectedLesson: CourseEntry | undefined;
  selectedLessonDone: boolean;
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
  onMarkCourseDone: () => void;
  onOpenNextCourseEntry: (entry: CourseEntry) => void;
  onSetLessonCollapsed: (value: boolean) => void;
  onTerminalInputChange: (value: string) => void;
  onUpdateCode: (value: string | undefined) => void;
  onUpdateCurrentProject: (mutator: (project: ProjectRecord) => ProjectRecord) => void;
}) {
  const [chatCollapsed, setChatCollapsed] = useState(true);
  const [diagnosticsCollapsed, setDiagnosticsCollapsed] = useState(false);
  const [layout, setLayout] = useState<IdeLayout>(loadIdeLayout);
  const diagnostics = [...analysis.safety_findings, ...analysis.diagnostics];
  const mainClass = [
    "ide-main",
    lessonCollapsed ? "lesson-hidden" : "",
    chatCollapsed ? "chat-hidden" : "",
    diagnosticsCollapsed ? "diagnostics-hidden" : ""
  ]
    .filter(Boolean)
    .join(" ");
  const layoutStyle = {
    "--lesson-width": `${lessonCollapsed ? 48 : layout.lessonWidth}px`,
    "--lesson-resizer-width": lessonCollapsed ? "0px" : "8px",
    "--chat-width": `${chatCollapsed ? 52 : layout.chatWidth}px`,
    "--chat-resizer-width": chatCollapsed ? "0px" : "8px",
    "--output-height": `${layout.outputHeight}px`,
    "--diagnostics-width": `${diagnosticsCollapsed ? 52 : layout.diagnosticsWidth}px`,
    "--diagnostics-resizer-width": diagnosticsCollapsed ? "0px" : "8px"
  } as CSSProperties;

  useEffect(() => {
    saveIdeLayout(layout);
  }, [layout]);

  function startResize(key: ResizeKey, event: ReactPointerEvent<HTMLDivElement>) {
    if (window.matchMedia("(max-width: 860px)").matches) return;
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const startValue = layout[key];

    document.body.classList.add("is-resizing");
    const move = (pointerEvent: PointerEvent) => {
      const nextValue = startValue + resizeMovement(key, startX, startY, pointerEvent.clientX, pointerEvent.clientY);
      const limits = resizeLimits(key);
      setLayout((current) => ({
        ...current,
        [key]: clamp(Math.round(nextValue), limits.min, limits.max)
      }));
    };
    const stop = () => {
      document.body.classList.remove("is-resizing");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  }

  return (
    <main className={mainClass} style={layoutStyle}>
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
        {!lessonCollapsed && selectedLesson && (
          <div className={selectedLessonDone ? "lesson-progress done" : "lesson-progress"}>
            {selectedLessonDone && <CheckCircle size={15} />}
            {selectedLessonDone ? "Done" : "In progress"}
          </div>
        )}
        <div className="lesson-body markdown-body" dangerouslySetInnerHTML={{ __html: selectedLesson?.html ?? "" }} />
        {selectedLesson && (
          <div className="lesson-actions">
            {nextCourseEntry ? (
              <button className="primary-button" type="button" onClick={() => onOpenNextCourseEntry(nextCourseEntry)}>
                Go to {nextCourseEntry.title} <ArrowRight size={17} />
              </button>
            ) : (
              <button className="primary-button" type="button" onClick={onMarkCourseDone} disabled={selectedLessonDone}>
                <CheckCircle size={17} /> Done
              </button>
            )}
          </div>
        )}
      </section>

      {!lessonCollapsed && (
        <div
          aria-label="Resize lesson panel"
          className="resize-handle vertical lesson-resize-handle"
          data-testid="lesson-resize-handle"
          onPointerDown={(event) => startResize("lessonWidth", event)}
          role="separator"
        />
      )}

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

          <div
            aria-label="Resize terminal and diagnostics"
            className="resize-handle horizontal output-resize-handle"
            data-testid="output-resize-handle"
            onPointerDown={(event) => startResize("outputHeight", event)}
            role="separator"
          />

          <section className="output-dock" aria-label="Run output and diagnostics">
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

            {!diagnosticsCollapsed && (
              <div
                aria-label="Resize diagnostics panel"
                className="resize-handle vertical diagnostics-resize-handle"
                data-testid="diagnostics-resize-handle"
                onPointerDown={(event) => startResize("diagnosticsWidth", event)}
                role="separator"
              />
            )}

            <section className={diagnosticsCollapsed ? "diagnostics-panel collapsed" : "diagnostics-panel"} aria-label="Diagnostics">
              {diagnosticsCollapsed ? (
                <button
                  aria-label="Show diagnostics"
                  className="panel-rail diagnostics-rail"
                  onClick={() => setDiagnosticsCollapsed(false)}
                  title="Show diagnostics"
                  type="button"
                >
                  <PanelRightOpen size={17} />
                  <span>Diagnostics</span>
                </button>
              ) : (
                <>
                  <div className="panel-toolbar">
                    <span>Diagnostics</span>
                    <div className="panel-toolbar-actions">
                      <span className={`safety-pill ${analysis.safety}`}>{analysis.safety}</span>
                      <button
                        className="icon-button"
                        type="button"
                        title="Collapse diagnostics"
                        onClick={() => setDiagnosticsCollapsed(true)}
                      >
                        <PanelRightClose size={17} />
                      </button>
                    </div>
                  </div>
                  <ul className="diagnostics-list">
                    {diagnostics.length === 0 && <li>No diagnostics yet.</li>}
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
                </>
              )}
            </section>
          </section>
        </div>
      </section>

      {!chatCollapsed && (
        <div
          aria-label="Resize debug chat"
          className="resize-handle vertical chat-resize-handle"
          data-testid="chat-resize-handle"
          onPointerDown={(event) => startResize("chatWidth", event)}
          role="separator"
        />
      )}

      <aside className={chatCollapsed ? "chat-panel collapsed" : "chat-panel"} aria-label="AI debugging chat">
        {chatCollapsed ? (
          <button
            aria-label="Open debug chat"
            className="panel-rail chat-rail"
            onClick={() => setChatCollapsed(false)}
            title="Open debug chat"
            type="button"
          >
            <MessageSquare size={17} />
            <span>Debug chat</span>
          </button>
        ) : (
          <section className="debug-chat">
            <div className="panel-toolbar">
              <span>
                <MessageSquare size={16} /> Debug chat
              </span>
              <div className="panel-toolbar-actions">
                {session && (
                  <span className="account-status">
                    <User size={15} /> Cloud account
                  </span>
                )}
                <button className="icon-button" type="button" title="Collapse debug chat" onClick={() => setChatCollapsed(true)}>
                  <PanelRightClose size={17} />
                </button>
              </div>
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
        )}
      </aside>

      <footer className="statusbar">
        <span>{saveStatus}</span>
        <span>{supabase && session ? "Cloud account active" : "Local workspace active"}</span>
        <span>Allowed packages: numpy, pandas, matplotlib</span>
      </footer>
    </main>
  );
}

function loadIdeLayout(): IdeLayout {
  if (typeof window === "undefined") return DEFAULT_IDE_LAYOUT;
  try {
    const stored = window.localStorage.getItem(IDE_LAYOUT_KEY);
    if (!stored) return DEFAULT_IDE_LAYOUT;
    const parsed = JSON.parse(stored) as Partial<IdeLayout>;
    return {
      lessonWidth: clampNumber(parsed.lessonWidth, "lessonWidth"),
      chatWidth: clampNumber(parsed.chatWidth, "chatWidth"),
      outputHeight: clampNumber(parsed.outputHeight, "outputHeight"),
      diagnosticsWidth: clampNumber(parsed.diagnosticsWidth, "diagnosticsWidth")
    };
  } catch {
    return DEFAULT_IDE_LAYOUT;
  }
}

function getNextCourseEntry(courseData: CourseEntry[], current: CourseEntry): CourseEntry | undefined {
  const nextType = current.type === "tutorial" ? "challenge" : "tutorial";
  const nextNumber = current.type === "tutorial" ? current.number : current.number + 1;
  return courseData.find((entry) => entry.type === nextType && entry.number === nextNumber);
}

function saveIdeLayout(layout: IdeLayout) {
  try {
    window.localStorage.setItem(IDE_LAYOUT_KEY, JSON.stringify(layout));
  } catch {
    // Local storage can be unavailable in private browsing or strict browser modes.
  }
}

function clampNumber(value: number | undefined, key: ResizeKey) {
  const limits = resizeLimits(key);
  return clamp(typeof value === "number" ? value : DEFAULT_IDE_LAYOUT[key], limits.min, limits.max);
}

function resizeMovement(key: ResizeKey, startX: number, startY: number, currentX: number, currentY: number) {
  if (key === "lessonWidth") return currentX - startX;
  if (key === "outputHeight") return startY - currentY;
  return startX - currentX;
}

function resizeLimits(key: ResizeKey) {
  if (key !== "outputHeight" || typeof window === "undefined") return IDE_LAYOUT_LIMITS[key];
  return {
    min: IDE_LAYOUT_LIMITS.outputHeight.min,
    max: Math.max(IDE_LAYOUT_LIMITS.outputHeight.min, Math.round(window.innerHeight * 0.45))
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function requestedCourseEntry(courseData: CourseEntry[]): CourseEntry | undefined {
  const params = new URLSearchParams(window.location.search);
  const requestedPage = params.get("page");
  return requestedPage ? courseData.find((item) => item.url === requestedPage) : undefined;
}

function readAuthCallback() {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const errorMessage = hash.get("error_description") || query.get("error_description") || hash.get("error") || query.get("error") || "";
  const hasCallback =
    Boolean(errorMessage) ||
    hash.has("access_token") ||
    hash.has("refresh_token") ||
    hash.has("type") ||
    query.has("code") ||
    query.has("token_hash");
  return { hasCallback, errorMessage };
}

function cleanAuthCallbackUrl() {
  window.history.replaceState(null, "", window.location.pathname);
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
