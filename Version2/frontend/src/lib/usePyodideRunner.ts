import { useCallback, useEffect, useRef, useState } from "react";
import type { GradeResult, GradeTest } from "../types";

type WorkerMessage =
  | { type: "ready" }
  | { type: "status"; message: string }
  | { type: "output"; output: string; status: "finished" | "waiting_for_input" | "error"; prompt?: string; error?: string }
  | { type: "grade-result"; result: GradeResult }
  | { type: "error"; error: string };

export type RunnerState = {
  status: "idle" | "loading" | "running" | "waiting" | "finished" | "error" | "stopped";
  output: string;
  prompt: string;
  ready: boolean;
};

export type GraderState = {
  status: "idle" | "loading" | "checking" | "passed" | "failed" | "error";
  result: GradeResult | null;
  error: string;
};

function makeWorker(): Worker {
  return new Worker(new URL("../pyodideWorker.ts", import.meta.url), { type: "module" });
}

export function usePyodideRunner() {
  const workerRef = useRef<Worker | null>(null);
  const gradeResolverRef = useRef<{ resolve: (result: GradeResult) => void; reject: (error: Error) => void } | null>(null);
  const [state, setState] = useState<RunnerState>({
    status: "idle",
    output: "",
    prompt: "",
    ready: false
  });
  const [graderState, setGraderState] = useState<GraderState>({
    status: "idle",
    result: null,
    error: ""
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
      if (message.type === "grade-result") {
        setGraderState({ status: message.result.passed ? "passed" : "failed", result: message.result, error: "" });
        gradeResolverRef.current?.resolve(message.result);
        gradeResolverRef.current = null;
      }
      if (message.type === "error") {
        setState((current) => ({ ...current, status: "error", output: `${current.output}\n${message.error}`.trim(), ready: true }));
        setGraderState((current) =>
          current.status === "checking" || current.status === "loading"
            ? { status: "error", result: current.result, error: message.error }
            : current
        );
        gradeResolverRef.current?.reject(new Error(message.error));
        gradeResolverRef.current = null;
      }
    };
    worker.onerror = (event) => {
      setState((current) => ({ ...current, status: "error", output: `${current.output}\n${event.message}`.trim(), ready: true }));
      setGraderState((current) =>
        current.status === "checking" || current.status === "loading"
          ? { status: "error", result: current.result, error: event.message }
          : current
      );
      gradeResolverRef.current?.reject(new Error(event.message));
      gradeResolverRef.current = null;
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

  const grade = useCallback(
    (code: string, tests: GradeTest[]) => {
      const worker = ensureWorker();
      setGraderState({ status: state.ready ? "checking" : "loading", result: null, error: "" });
      return new Promise<GradeResult>((resolve, reject) => {
        gradeResolverRef.current = { resolve, reject };
        worker.postMessage({ type: "grade", code, tests });
      });
    },
    [ensureWorker, state.ready]
  );

  const resetGrade = useCallback(() => {
    setGraderState({ status: "idle", result: null, error: "" });
  }, []);

  const stop = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    gradeResolverRef.current?.reject(new Error("Python runner stopped."));
    gradeResolverRef.current = null;
    setState((current) => ({ ...current, status: "stopped", prompt: "", ready: false }));
    setGraderState((current) => (current.status === "checking" || current.status === "loading" ? { status: "idle", result: null, error: "" } : current));
  }, []);

  return { state, graderState, run, sendInput, grade, resetGrade, stop };
}
