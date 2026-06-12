const API_BASE = "https://python-tutor-reviewer.onrender.com";

const courseType = document.querySelector("#courseType");
const courseSelect = document.querySelector("#courseSelect");
const lessonTitle = document.querySelector("#lessonTitle");
const lessonBody = document.querySelector("#lessonBody");
const fullPageLink = document.querySelector("#fullPageLink");
const toggleLesson = document.querySelector("#toggleLesson");
const runnerShell = document.querySelector("#runnerShell");
const editorHost = document.querySelector("#editorHost");
const runButton = document.querySelector("#runButton");
const stopButton = document.querySelector("#stopButton");
const terminalOutput = document.querySelector("#terminalOutput");
const terminalInput = document.querySelector("#terminalInput");
const runnerStatus = document.querySelector("#runnerStatus");

let editor = null;
let sessionId = null;
let waitingForInput = false;
let lastOutput = "";

const starterCode = `name = input("What is your name? ")\nprint("Hello", name)`;

initCoursePanel();
initLessonToggle();
initEditor();
initRunnerControls();

function initCoursePanel() {
  courseType.addEventListener("change", () => {
    populateCourseSelect();
    renderSelectedCourse();
  });
  courseSelect.addEventListener("change", renderSelectedCourse);
  populateCourseSelect();
  applyInitialCourseSelection();
  renderSelectedCourse();
}

function populateCourseSelect() {
  const type = courseType.value;
  const entries = window.COURSE_DATA.filter((entry) => entry.type === type);
  courseSelect.replaceChildren();
  for (const entry of entries) {
    const option = document.createElement("option");
    option.value = String(entry.number);
    option.textContent = entry.title;
    courseSelect.append(option);
  }
}

function applyInitialCourseSelection() {
  const params = new URLSearchParams(window.location.search);
  const requestedPage = params.get("page");
  if (!requestedPage) return;

  const selected = window.COURSE_DATA.find((entry) => entry.url === requestedPage);
  if (!selected) return;

  courseType.value = selected.type;
  populateCourseSelect();
  courseSelect.value = String(selected.number);
}

function renderSelectedCourse() {
  const selected = window.COURSE_DATA.find(
    (entry) => entry.type === courseType.value && String(entry.number) === courseSelect.value
  );
  if (!selected) return;
  lessonTitle.textContent = selected.title;
  lessonBody.innerHTML = selected.html;
  fullPageLink.href = selected.url;
}

function initLessonToggle() {
  toggleLesson.addEventListener("click", () => {
    const collapsed = runnerShell.classList.toggle("lesson-collapsed");
    toggleLesson.setAttribute("aria-expanded", String(!collapsed));
    toggleLesson.textContent = collapsed ? "Show lesson" : "Hide lesson";
    if (editor) {
      window.setTimeout(() => editor.layout(), 80);
    }
  });
}

function initEditor() {
  if (!window.require) {
    editorHost.textContent = "Editor could not load.";
    return;
  }

  window.require.config({
    paths: {
      vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs",
    },
  });

  window.require(["vs/editor/editor.main"], () => {
    editor = monaco.editor.create(editorHost, {
      value: starterCode,
      language: "python",
      theme: "vs",
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 15,
      tabSize: 4,
      insertSpaces: true,
      wordWrap: "on",
    });
  });
}

function initRunnerControls() {
  runButton.addEventListener("click", runCode);
  stopButton.addEventListener("click", stopCode);
  terminalInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && waitingForInput) {
      event.preventDefault();
      sendTerminalInput();
    }
  });
  setTerminalInput(false);
}

async function runCode() {
  const code = editor ? editor.getValue() : "";
  if (!code.trim()) {
    setStatus("Add some Python code first.");
    return;
  }

  resetTerminal();
  setStatus("Running...");
  setBusy(true);

  try {
    const payload = await postJson("/api/run/start", { code });
    handleRunnerPayload(payload);
  } catch (error) {
    showRunnerError(error);
    setBusy(false);
  }
}

async function sendTerminalInput() {
  const value = terminalInput.value;
  appendTerminal(value + "\n", "terminal-user-input");
  terminalInput.value = "";
  setTerminalInput(false);
  setStatus("Running...");

  try {
    const payload = await postJson("/api/run/input", { session_id: sessionId, stdin: value });
    handleRunnerPayload(payload);
  } catch (error) {
    showRunnerError(error);
    setBusy(false);
  }
}

async function stopCode() {
  if (!sessionId) {
    resetRunState();
    return;
  }
  try {
    const payload = await postJson("/api/run/stop", { session_id: sessionId });
    handleRunnerPayload(payload);
  } catch (error) {
    appendTerminal("\n[Stopped]\n", "terminal-error");
    resetRunState();
  }
}

function handleRunnerPayload(payload) {
  if (payload.error) {
    appendTerminal(`[Error] ${payload.error}\n`, "terminal-error");
  }

  appendNewOutput(payload.output || "");
  sessionId = payload.session_id || sessionId;

  if (payload.status === "waiting_for_input") {
    appendTerminal(payload.prompt || "", "terminal-prompt");
    waitingForInput = true;
    setTerminalInput(true);
    setStatus("Waiting for input...");
    return;
  }

  if (payload.status === "timed_out") {
    appendTerminal("\n[Program stopped because it took too long.]\n", "terminal-error");
  }

  if (payload.status === "stopped") {
    appendTerminal("\n[Stopped]\n", "terminal-error");
  }

  if (payload.status === "error" && !payload.error) {
    appendTerminal("\n[The program could not run.]\n", "terminal-error");
  }

  resetRunState();
  setStatus(payload.status === "finished" ? "Finished." : "Ready.");
}

async function postJson(path, body) {
  const response = await fetch(API_BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }
  return payload;
}

function appendNewOutput(output) {
  if (!output || output === lastOutput) return;
  const next = output.startsWith(lastOutput) ? output.slice(lastOutput.length) : output;
  appendTerminal(next, "terminal-program-output");
  lastOutput = output;
}

function appendTerminal(text, className) {
  if (!text) return;
  const span = document.createElement("span");
  span.className = className;
  span.textContent = text;
  terminalOutput.append(span);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function resetTerminal() {
  terminalOutput.replaceChildren();
  lastOutput = "";
  sessionId = null;
  waitingForInput = false;
  setTerminalInput(false);
}

function resetRunState() {
  sessionId = null;
  waitingForInput = false;
  setBusy(false);
  setTerminalInput(false);
}

function setBusy(isBusy) {
  runButton.disabled = isBusy;
  stopButton.disabled = !isBusy;
}

function setTerminalInput(enabled) {
  terminalInput.disabled = !enabled;
  terminalInput.placeholder = enabled ? "Type your answer and press Enter" : "Waiting for input...";
  if (enabled) terminalInput.focus();
}

function setStatus(message) {
  runnerStatus.textContent = message;
}

function showRunnerError(error) {
  const message = error && error.message ? error.message : "";
  if (message) {
    appendTerminal(`[Error] ${message}\n`, "terminal-error");
    setStatus("Ready.");
    return;
  }
  appendTerminal("The runner is not available right now. If Render is waking up or redeploying, wait a moment and try again.\n", "terminal-error");
  setStatus("Runner unavailable.");
}
