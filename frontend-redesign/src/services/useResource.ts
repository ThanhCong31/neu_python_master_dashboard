import { useEffect, useState } from "react";
import { api } from "./api";

type Result<T> =
  | { state: "loading"; refreshing: false; refreshError: null }
  | { state: "error"; message: string; refreshing: false; refreshError: null }
  | { state: "ready"; data: T; refreshing: boolean; refreshError: string | null };

type Snapshot<T> = {
  path: string;
  attempt: number;
  result: { state: "ready"; data: T; refreshError: string | null } | { state: "error"; message: string };
};
/**
 * Only reuse a successful response for retries of the SAME path. On refresh
 * failure retain the visible data, show a retryable notice, and never leave
 * the spinner running forever. New routes/scopes never see previous data.
 */
export function useResource<T>(path: string | null) {
  const [attempt, setAttempt] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot<T> | null>(null);

  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    api<T>(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setSnapshot({ path, attempt, result: { state: "ready", data, refreshError: null } });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : "Không thể tải dữ liệu.";
        setSnapshot((previous) => ({ path, attempt, result: previous?.path === path && previous.result.state === "ready"
          ? { state: "ready", data: previous.result.data, refreshError: `Không thể cập nhật dữ liệu: ${message}` }
          : { state: "error", message } }));
      });
    return () => controller.abort();
  }, [path, attempt]);

  let value: Result<T>;
  if (snapshot?.path === path && snapshot.result.state === "ready") {
    value = {
      state: "ready",
      data: snapshot.result.data,
      refreshing: snapshot.attempt !== attempt,
      refreshError: snapshot.attempt === attempt ? snapshot.result.refreshError : null,
    };
  } else if (snapshot?.path === path && snapshot.attempt === attempt && snapshot.result.state === "error") {
    value = { state: "error", message: snapshot.result.message, refreshing: false, refreshError: null };
  } else {
    value = { state: "loading", refreshing: false, refreshError: null };
  }
  return { ...value, retry: () => setAttempt((n) => n + 1) };
}
