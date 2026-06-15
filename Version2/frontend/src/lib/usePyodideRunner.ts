import { useCallback, useEffect, useRef, useState } from "react";

type WorkerMessage =
  | { type: "ready" }
  | { type: "status"; message: string }
  | { type: "output"; output: string; status: "finished" | "waiting_for_input" | "error"; prompt?: string; error?: string }
  | { type: "error"; error: string };

export type RunnerState = {
  status: "idle" | "loading" | "running" | "waiting" | "finished" | "error" | "stopped";
  output: string;
  prompt: string;
  ready: boolean;
};

function makeWorker(): Worker {
  return new Worker(new URL("../pyodideWorker.ts", import.meta.url), { type: "module" });
}

export function usePyodideRunner() {
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<RunnerState>({
    status: "idle",
    output: "",
    prompt: "",
    ready: false
  });

  const ensureWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current;
    const worker = makeWorker();
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const message = event.data;
      if (message.type === "ready") {
        setState((current) => ({ ...current, ready: true, status: current.status === "loading" ? "idle" : current.status }));
      }
      if (message.type === "status") {
        setState((current) => ({ ...current, status: "running", prompt: "", output: current.output || message.message }));
      }
      if (message.type === "output") {
        setState((current) => ({
          ...current,
          output: message.output,
          status:
            message.status === "waiting_for_input"
              ? "waiting"
              : message.status === "error"
                ? "error"
                : "finished",
          prompt: message.prompt || "",
          ready: true
        }));
      }
      if (message.type === "error") {
        setState((current) => ({ ...current, status: "error", output: `${current.output}\n${message.error}`.trim(), ready: true }));
      }
    };
    worker.onerror = (event) => {
      setState((current) => ({ ...current, status: "error", output: `${current.output}\n${event.message}`.trim(), ready: true }));
    };
    return worker;
  }, []);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const run = useCallback(
    (code: string) => {
      const worker = ensureWorker();
      setState((current) => ({ ...current, status: current.ready ? "running" : "loading", output: "", prompt: "" }));
      worker.postMessage({ type: "run", code });
    },
    [ensureWorker]
  );

  const sendInput = useCallback((value: string) => {
    setState((current) => ({ ...current, status: "running", prompt: "" }));
    workerRef.current?.postMessage({ type: "input", value });
  }, []);

  const stop = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setState((current) => ({ ...current, status: "stopped", prompt: "", ready: false }));
  }, []);

  return { state, run, sendInput, stop };
}
