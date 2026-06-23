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
  assertion?: string;
  sourceIncludes?: string[];
  sourceExcludes?: string[];
  sourceRegexes?: string[];
  sourceNotRegexes?: string[];
  stepLimit?: number;
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

  const result = (await runtime.runPythonAsync(buildScript(currentCode, queuedInputs, { isolated: false, echoInput: true }))) as string;
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
  postMessage({ type: "grade-status", message: "Checking answer..." });
  const packages = packagesFor(code);
  if (packages.length) {
    postMessage({ type: "grade-status", message: `Loading ${packages.join(", ")}...` });
    await runtime.loadPackage(packages);
  }

  const results: GradeTestResult[] = [];
  for (const test of tests) {
    outputBuffer = "";
    stderrBuffer = "";
    const inputs = Array.isArray(test.input) ? test.input.map((item) => String(item)) : [];
    const sourceResult = evaluateSourceChecks(test, code);
    if (!shouldRunPython(test)) {
      results.push(sourceResult);
      continue;
    }

    const result = (await runtime.runPythonAsync(
      buildScript(code, inputs, {
        assertion: test.assertion,
        echoInput: false,
        isolated: true,
        stepLimit: test.stepLimit ?? 60000
      })
    )) as string;
    if (token !== gradeToken) return;

    const parsed = JSON.parse(result) as { status: string; prompt?: string; error?: string };
    const actualOutput = trimOutput(`${outputBuffer}${stderrBuffer}`);
    const runtimeResult = evaluateTest(test, parsed.status, actualOutput, parsed.error || parsed.prompt || "");
    results.push({
      ...runtimeResult,
      passed: sourceResult.passed && runtimeResult.passed,
      message: sourceResult.passed ? runtimeResult.message : sourceResult.message
    });
  }

  postMessage({ type: "grade-result", result: { passed: results.every((result) => result.passed), tests: results } });
}

function evaluateTest(test: GradeTest, status: string, actualOutput: string, runtimeMessage: string): GradeTestResult {
  const expectedOutput = test.expectedOutput ?? "";
  const checksOutput = hasOutputExpectation(test);
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
      message: conciseRuntimeMessage(runtimeMessage) || "The code raised an error."
    };
  }

  const passed = checksOutput ? outputMatches(test, actualOutput) : true;
  return {
    id: test.id,
    name: test.name,
    input: test.input ?? [],
    expectedOutput: test.match === "line-count" ? `${test.expectedLineCount ?? 0} line(s)` : expectedOutput,
    actualOutput,
    passed,
    visible: Boolean(test.visible),
    message: passed ? "Passed" : checksOutput ? "Expected output did not match." : "Hidden behavior check failed."
  };
}

function shouldRunPython(test: GradeTest): boolean {
  return hasOutputExpectation(test) || Boolean(test.assertion);
}

function hasOutputExpectation(test: GradeTest): boolean {
  return typeof test.expectedOutput === "string" || typeof test.expectedLineCount === "number";
}

function evaluateSourceChecks(test: GradeTest, code: string): GradeTestResult {
  const failures: string[] = [];
  for (const required of test.sourceIncludes ?? []) {
    if (!code.includes(required)) failures.push(`Use ${required} in your code.`);
  }
  for (const forbidden of test.sourceExcludes ?? []) {
    if (code.includes(forbidden)) failures.push(`Do not use ${forbidden} for this task.`);
  }
  for (const pattern of test.sourceRegexes ?? []) {
    if (!new RegExp(pattern, "m").test(code)) failures.push("A required code pattern is missing.");
  }
  for (const pattern of test.sourceNotRegexes ?? []) {
    if (new RegExp(pattern, "m").test(code)) failures.push("This task forbids one of the code patterns used.");
  }

  return {
    id: test.id,
    name: test.name,
    input: test.input ?? [],
    expectedOutput: test.match === "line-count" ? `${test.expectedLineCount ?? 0} line(s)` : (test.expectedOutput ?? ""),
    actualOutput: "",
    passed: failures.length === 0,
    visible: Boolean(test.visible),
    message: failures[0] ?? "Passed"
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

function conciseRuntimeMessage(message: string): string {
  if (!message) return "";
  const lines = message.trim().split("\n").filter(Boolean);
  const assertion = [...lines].reverse().find((line) => line.startsWith("AssertionError"));
  const timeout = [...lines].reverse().find((line) => line.includes("TimeoutError"));
  return assertion || timeout || lines[lines.length - 1] || "";
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

function buildScript(
  code: string,
  inputs: string[],
  options: { assertion?: string; echoInput?: boolean; isolated?: boolean; stepLimit?: number | null } = {}
): string {
  const assertion = options.assertion ?? "";
  const echoInput = options.echoInput ?? true;
  const stepLimit = options.stepLimit ?? null;
  return `
import ast
import builtins
import json
import sys
import traceback

__py_ide_result = {"status": "finished", "prompt": "", "error": ""}
__py_ide_inputs = ${JSON.stringify(inputs)}
__py_ide_step_limit = ${stepLimit === null ? "None" : JSON.stringify(stepLimit)}
__py_ide_steps = 0
__py_ide_blocked_imports = {
    "cffi", "ctypes", "http.client", "js", "micropip", "pyodide",
    "operator", "requests", "socket", "subprocess", "urllib"
}
__py_ide_blocked_calls = {"eval", "exec", "compile", "__import__"}
__py_ide_blocked_reflection_calls = {"getattr", "setattr", "delattr", "globals", "locals", "vars", "dir"}
__py_ide_blocked_format_methods = {"format", "format_map", "vformat", "get_field"}
__py_ide_original_import = builtins.__import__
__py_ide_original_input = builtins.input

class __PyIdeNeedInput(BaseException):
    pass

def __py_ide_validate_source(source):
    try:
        tree = ast.parse(source or "\\n")
    except SyntaxError:
        return
    for node in ast.walk(tree):
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            names = []
            if isinstance(node, ast.Import):
                names = [alias.name for alias in node.names]
            else:
                module = "." * node.level + (node.module or "")
                names = [
                    module if alias.name == "*" else f"{module}.{alias.name}" if module else alias.name
                    for alias in node.names
                ]
            for name in names:
                root = str(name).lstrip(".").split(".")[0]
                if name in __py_ide_blocked_imports or root in __py_ide_blocked_imports:
                    raise PermissionError(f"{name} is blocked in the PythonPages browser runner")
                for blocked in __py_ide_blocked_imports:
                    if str(name).startswith(blocked + "."):
                        raise PermissionError(f"{name} is blocked in the PythonPages browser runner")
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name):
                name = node.func.id
                if name in __py_ide_blocked_calls or name in __py_ide_blocked_reflection_calls:
                    raise PermissionError(f"{name} is blocked in the PythonPages browser runner")
            if isinstance(node.func, ast.Attribute) and node.func.attr in __py_ide_blocked_format_methods:
                raise PermissionError(f".{node.func.attr}() is blocked in the PythonPages browser runner")
        if isinstance(node, ast.Attribute) and node.attr.startswith("__"):
            raise PermissionError("Dunder attribute access is blocked in the PythonPages browser runner")
        if isinstance(node, ast.Name) and node.id.startswith("__"):
            raise PermissionError("Dunder names are blocked in the PythonPages browser runner")

def __py_ide_import(name, globals=None, locals=None, fromlist=(), level=0):
    root = str(name).split(".")[0]
    if name in __py_ide_blocked_imports or root in __py_ide_blocked_imports:
        raise ImportError(f"{name} is blocked in the PythonPages browser runner")
    for blocked in __py_ide_blocked_imports:
        if str(name).startswith(blocked + "."):
            raise ImportError(f"{name} is blocked in the PythonPages browser runner")
    return __py_ide_original_import(name, globals, locals, fromlist, level)

class __PyIdeInput:
    __slots__ = ()

    def __call__(self, prompt=""):
        if not __py_ide_inputs:
            raise __PyIdeNeedInput(str(prompt))
        value = __py_ide_inputs.pop(0)
        if ${echoInput ? "True" : "False"}:
            print(str(prompt) + value)
        return value

    def __getattribute__(self, name):
        if str(name).startswith("_"):
            raise AttributeError(name)
        return object.__getattribute__(self, name)

def __py_ide_trace(frame, event, arg):
    global __py_ide_steps
    if event == "line" and __py_ide_step_limit is not None:
        __py_ide_steps += 1
        if __py_ide_steps > __py_ide_step_limit:
            raise TimeoutError("Code took too long while checking the answer.")
    return __py_ide_trace

try:
    __py_ide_validate_source(${JSON.stringify(code)})
    builtins.__import__ = __py_ide_import
    builtins.input = __PyIdeInput()
    if __py_ide_step_limit is not None:
        sys.settrace(__py_ide_trace)
    try:
        __py_ide_globals = {"__name__": "__main__"}
        exec(compile(${JSON.stringify(code)}, "student_code.py", "exec"), __py_ide_globals, __py_ide_globals)
        if ${assertion ? "True" : "False"}:
            exec(compile(${JSON.stringify(assertion)}, "hidden_checks.py", "exec"), __py_ide_globals, __py_ide_globals)
    except __PyIdeNeedInput as exc:
        __py_ide_result["status"] = "waiting_for_input"
        __py_ide_result["prompt"] = str(exc)
    except BaseException:
        __py_ide_result["status"] = "error"
        __py_ide_result["error"] = traceback.format_exc()
        print(__py_ide_result["error"])
finally:
    sys.settrace(None)
    builtins.__import__ = __py_ide_original_import
    builtins.input = __py_ide_original_input

json.dumps(__py_ide_result)
`;
}

function trimOutput(output: string): string {
  if (output.length <= 12000) return output;
  return `${output.slice(0, 12000)}\n[Output stopped because it is too long.]\n`;
}
