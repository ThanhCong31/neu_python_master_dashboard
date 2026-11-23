export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
/** API paths are relative to /api and use the existing HttpOnly session cookie. */
export interface ApiOptions {
  json?: unknown;
  signal?: AbortSignal;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** Raw upload bytes: mutually exclusive with json. */
  body?: BodyInit | null;
  headers?: Record<string, string>;
}
export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { json, signal, method, body, headers } = options;
  if (json !== undefined && body !== undefined) throw new Error("Use either json or body, not both.");
  if (!path.startsWith("/") || path.startsWith("//")) throw new Error("Invalid API path.");
  const response = await fetch(`/api${path}`, {
    method: method ?? (json === undefined && body === undefined ? "GET" : "POST"),
    credentials: "same-origin",
    headers: { ...(json === undefined ? {} : { "Content-Type": "application/json" }), ...headers },
    body: json !== undefined ? JSON.stringify(json) : body,
    signal,
  });
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    if (response.status === 401 && path !== "/auth/login") window.dispatchEvent(new Event("session-expired"));
    let message = `Yêu cầu thất bại (HTTP ${response.status}).`;
    if (payload && typeof payload === "object" && "detail" in payload) {
      const detail = (payload as { detail: unknown }).detail;
      if (typeof detail === "string") message = detail;
    }
    throw new ApiError(response.status, message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
