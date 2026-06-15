const PYODIDE_VERSION = "0.29.0";
const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.mjs`;
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

type PyodideApi = {
  loadPackage: (packages: string | string[]) => Promise<void>;
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (options: { batched: (text: string) => void }) => void;
  setStderr: (options: { batched: (text: string) => void }) => void;
};

let pyodide: PyodideApi | null = null;
let pyodidePromise: Promise<PyodideApi> | null = null;
let currentCode = "";
let queuedInputs: string[] = [];
let outputBuffer = "";
let stderrBuffer = "";
let runToken = 0;

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

function buildScript(code: string, inputs: string[]): string {
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
        exec(compile(${JSON.stringify(code)}, "student_code.py", "exec"), globals(), globals())
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
