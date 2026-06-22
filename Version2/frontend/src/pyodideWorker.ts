const PYODIDE_VERSION = "0.29.0";
const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.mjs`;
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

type PyodideApi = {
  loadPackage: (packages: string | string[]) => Promise<void>;
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (options: { batched: (text: string) => void }) => void;
  setStderr: (options: { batched: (text: string) => void }) => void;
};

type GradeMatch = "exact" | "contains" | "regex" | "line-count";

type GradeTest = {
  id: string;
  name: string;
  input?: string[];
  expectedOutput?: string;
  expectedLineCount?: number;
  match?: GradeMatch;
  visible?: boolean;
};

type GradeTestResult = {
  id: string;
  name: string;
  input: string[];
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  visible: boolean;
  message: string;
};

let pyodide: PyodideApi | null = null;
let pyodidePromise: Promise<PyodideApi> | null = null;
let currentCode = "";
let queuedInputs: string[] = [];
let outputBuffer = "";
let stderrBuffer = "";
let runToken = 0;
let gradeToken = 0;

const allowedPackages = new Set(["numpy", "pandas", "matplotlib"]);
const packageAliases = new Map([
  ["np", "numpy"],
  ["pd", "pandas"],
  ["plt", "matplotlib"]
]);

self.onmessage = async (event: MessageEvent) => {
  const message = event.data;
  try {
    if (message.type === "init") {
      await ensurePyodide();
      postMessage({ type: "ready" });
    }
    if (message.type === "run") {
      currentCode = String(message.code || "");
      queuedInputs = [];
      await execute(++runToken);
    }
    if (message.type === "input") {
      queuedInputs.push(String(message.value ?? ""));
      await execute(++runToken);
    }
    if (message.type === "grade") {
      await gradeCode(String(message.code || ""), Array.isArray(message.tests) ? message.tests : [], ++gradeToken);
    }
  } catch (error) {
    postMessage({ type: "error", error: error instanceof Error ? error.message : String(error) });
  }
};

async function ensurePyodide(): Promise<PyodideApi> {
  if (pyodide) return pyodide;
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      postMessage({ type: "status", message: "Loading Python runtime..." });
      // @ts-ignore Vite leaves this dynamic browser import alone.
      const module = await import(/* @vite-ignore */ PYODIDE_URL);
      const loaded = (await module.loadPyodide({ indexURL: PYODIDE_INDEX_URL })) as PyodideApi;
      loaded.setStdout({ batched: (text: string) => (outputBuffer += `${text}\n`) });
      loaded.setStderr({ batched: (text: string) => (stderrBuffer += `${text}\n`) });
      pyodide = loaded;
      return loaded;
    })();
  }
  return pyodidePromise;
}

async function execute(token: number): Promise<void> {
  const runtime = await ensurePyodide();
  outputBuffer = "";
  stderrBuffer = "";
  postMessage({ type: "status", message: "Running Python..." });
  const packages = packagesFor(currentCode);
  if (packages.length) {
    postMessage({ type: "status", message: `Loading ${packages.join(", ")}...` });
    await runtime.loadPackage(packages);
  }

  const result = (await runtime.runPythonAsync(buildScript(currentCode, queuedInputs))) as string;
  if (token !== runToken) return;
  const parsed = JSON.parse(result) as { status: string; prompt?: string; error?: string };
  const output = trimOutput(`${outputBuffer}${stderrBuffer}`);

  if (parsed.status === "waiting_for_input") {
    postMessage({ type: "output", status: "waiting_for_input", output, prompt: parsed.prompt || "" });
    return;
  }
  if (parsed.status === "error") {
    postMessage({ type: "output", status: "error", output, error: parsed.error || "Python error" });
    return;
  }
  postMessage({ type: "output", status: "finished", output });
}

async function gradeCode(code: string, tests: GradeTest[], token: number): Promise<void> {
  const runtime = await ensurePyodide();
  postMessage({ type: "status", message: "Checking answer..." });
  const packages = packagesFor(code);
  if (packages.length) {
    postMessage({ type: "status", message: `Loading ${packages.join(", ")}...` });
    await runtime.loadPackage(packages);
  }

  const results: GradeTestResult[] = [];
  for (const test of tests) {
    outputBuffer = "";
    stderrBuffer = "";
    const inputs = Array.isArray(test.input) ? test.input.map((item) => String(item)) : [];
    const result = (await runtime.runPythonAsync(buildScript(code, inputs, true))) as string;
    if (token !== gradeToken) return;

    const parsed = JSON.parse(result) as { status: string; prompt?: string; error?: string };
    const actualOutput = trimOutput(`${outputBuffer}${stderrBuffer}`);
    results.push(evaluateTest(test, parsed.status, actualOutput, parsed.error || parsed.prompt || ""));
  }

  postMessage({ type: "grade-result", result: { passed: results.every((result) => result.passed), tests: results } });
}

function evaluateTest(test: GradeTest, status: string, actualOutput: string, runtimeMessage: string): GradeTestResult {
  const expectedOutput = test.expectedOutput ?? "";
  if (status === "waiting_for_input") {
    return {
      id: test.id,
      name: test.name,
      input: test.input ?? [],
      expectedOutput,
      actualOutput,
      passed: false,
      visible: Boolean(test.visible),
      message: "The code asked for more input than this task provides."
    };
  }
  if (status === "error") {
    return {
      id: test.id,
      name: test.name,
      input: test.input ?? [],
      expectedOutput,
      actualOutput,
      passed: false,
      visible: Boolean(test.visible),
      message: runtimeMessage || "The code raised an error."
    };
  }

  const passed = outputMatches(test, actualOutput);
  return {
    id: test.id,
    name: test.name,
    input: test.input ?? [],
    expectedOutput: test.match === "line-count" ? `${test.expectedLineCount ?? 0} line(s)` : expectedOutput,
    actualOutput,
    passed,
    visible: Boolean(test.visible),
    message: passed ? "Passed" : "Expected output did not match."
  };
}

function outputMatches(test: GradeTest, actualOutput: string): boolean {
  const match = test.match ?? "exact";
  const actual = normalizeOutput(actualOutput);
  const expected = normalizeOutput(test.expectedOutput ?? "");
  if (match === "contains") return actual.includes(expected);
  if (match === "regex") return new RegExp(test.expectedOutput ?? "", "m").test(actual);
  if (match === "line-count") return countOutputLines(actualOutput) === (test.expectedLineCount ?? 0);
  return actual === expected;
}

function normalizeOutput(output: string): string {
  const lines = output.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").map((line) => line.trimEnd());
  while (lines.length && lines[lines.length - 1] === "") lines.pop();
  return lines.join("\n").trim();
}

function countOutputLines(output: string): number {
  const normalized = normalizeOutput(output);
  return normalized ? normalized.split("\n").length : 0;
}

function packagesFor(code: string): string[] {
  const found = new Set<string>();
  const importPattern = /^\s*(?:import|from)\s+([A-Za-z_][\w.]*)(?:\s+as\s+([A-Za-z_]\w*))?/gm;
  let match: RegExpExecArray | null;
  while ((match = importPattern.exec(code))) {
    const root = match[1].split(".")[0];
    const resolved = packageAliases.get(root) || root;
    if (allowedPackages.has(resolved)) found.add(resolved);
  }
  return [...found];
}

function buildScript(code: string, inputs: string[], isolated = false): string {
  return `
import builtins
import json
import traceback

__py_ide_result = {"status": "finished", "prompt": "", "error": ""}
__py_ide_inputs = ${JSON.stringify(inputs)}
__py_ide_blocked_imports = {
    "cffi", "ctypes", "http.client", "js", "micropip", "pyodide",
    "requests", "socket", "subprocess", "urllib"
}
__py_ide_original_import = builtins.__import__
__py_ide_original_input = builtins.input

class __PyIdeNeedInput(BaseException):
    pass

def __py_ide_import(name, globals=None, locals=None, fromlist=(), level=0):
    root = str(name).split(".")[0]
    if name in __py_ide_blocked_imports or root in __py_ide_blocked_imports:
        raise ImportError(f"{name} is blocked in the PythonPages browser runner")
    for blocked in __py_ide_blocked_imports:
        if str(name).startswith(blocked + "."):
            raise ImportError(f"{name} is blocked in the PythonPages browser runner")
    return __py_ide_original_import(name, globals, locals, fromlist, level)

def __py_ide_input(prompt=""):
    if not __py_ide_inputs:
        raise __PyIdeNeedInput(str(prompt))
    value = __py_ide_inputs.pop(0)
    print(str(prompt) + value)
    return value

try:
    builtins.__import__ = __py_ide_import
    builtins.input = __py_ide_input
    try:
        __py_ide_globals = {"__name__": "__main__"} if ${isolated ? "True" : "False"} else globals()
        exec(compile(${JSON.stringify(code)}, "student_code.py", "exec"), __py_ide_globals, __py_ide_globals)
    except __PyIdeNeedInput as exc:
        __py_ide_result["status"] = "waiting_for_input"
        __py_ide_result["prompt"] = str(exc)
    except BaseException:
        __py_ide_result["status"] = "error"
        __py_ide_result["error"] = traceback.format_exc()
        print(__py_ide_result["error"])
finally:
    builtins.__import__ = __py_ide_original_import
    builtins.input = __py_ide_original_input

json.dumps(__py_ide_result)
`;
}

function trimOutput(output: string): string {
  if (output.length <= 12000) return output;
  return `${output.slice(0, 12000)}\n[Output stopped because it is too long.]\n`;
}
