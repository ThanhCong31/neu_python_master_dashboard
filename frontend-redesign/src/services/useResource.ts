import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

type Result<T> =
  | { state: "loading"; refreshing: false; refreshError: null }
  | { state: "error"; message: string; refreshing: false; refreshError: null }
  | { state: "ready"; data: T; refreshing: boolean; refreshError: string | null };

type Snapshot<T> = {
  path: string;
  generation: number;
  attempt: number;
  result: { state: "ready"; data: T; refreshError: string | null } | { state: "error"; message: string };
};
/**
 * Only reuse a successful response for retries of the SAME path. On refresh
 * failure retain the visible data, show a retryable notice, and never leave
 * the spinner running forever. New routes/scopes never see previous data.
 */
export function useResource<T>(path: string | null, { clearWhenDisabled = false }: { clearWhenDisabled?: boolean } = {}) {
  const [attempt, setAttempt] = useState(0);
  const [identity, setIdentity] = useState({path,generation:0});
  if (identity.path !== path) setIdentity({path,generation:identity.generation+1});
  const generation=identity.generation;
  const current=identity.path===path;
  const retry=useCallback(()=>setAttempt(n=>n+1),[]);
  const [snapshot, setSnapshot] = useState<Snapshot<T> | null>(null);

  useEffect(() => {
    if (!path) {
      if (clearWhenDisabled) setSnapshot(null);
      return;
    }
    const controller = new AbortController();
    api<T>(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setSnapshot({ path, generation, attempt, result: { state: "ready", data, refreshError: null } });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : "Không thể tải dữ liệu.";
        setSnapshot((previous) => ({ path, generation, attempt, result: previous?.path === path && previous.generation===generation && previous.result.state === "ready"
          ? { state: "ready", data: previous.result.data, refreshError: `Không thể cập nhật dữ liệu: ${message}` }
          : { state: "error", message } }));
      });
    return () => controller.abort();
  }, [path, generation, attempt, clearWhenDisabled]);

  let value: Result<T>;
  if (current && snapshot?.path === path && snapshot.generation===generation && snapshot.result.state === "ready") {
    value = {
      state: "ready",
      data: snapshot.result.data,
      refreshing: snapshot.attempt !== attempt,
      refreshError: snapshot.attempt === attempt ? snapshot.result.refreshError : null,
    };
  } else if (current && snapshot?.path === path && snapshot.generation===generation && snapshot.attempt === attempt && snapshot.result.state === "error") {
    value = { state: "error", message: snapshot.result.message, refreshing: false, refreshError: null };
  } else {
    value = { state: "loading", refreshing: false, refreshError: null };
  }
  return { ...value, retry };
}
