export class ApiError extends Error {
  public status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
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
let sessionGeneration = 0;
/** Invalidate results from requests started under an earlier login. Does not undo server writes. */
export function invalidateApiSession() { sessionGeneration++; }
function assertCurrent(generation: number, signal?: AbortSignal) {
  if (signal?.aborted || generation !== sessionGeneration) {
    const error = new Error("Yêu cầu không còn thuộc phiên hiện tại."); error.name = "AbortError"; throw error;
  }
}
async function request(path: string, options: ApiOptions, generation: number): Promise<Response> {
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
  assertCurrent(generation,signal);
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    assertCurrent(generation,signal);
    if (response.status === 401 && path !== "/auth/login") window.dispatchEvent(new Event("session-expired"));
    let message = `Yêu cầu thất bại (HTTP ${response.status}).`;
    if (payload && typeof payload === "object" && "detail" in payload) {
      const detail = (payload as { detail: unknown }).detail;
      if (typeof detail === "string") message = detail;
    }
    throw new ApiError(response.status, message);
  }
  return response;
}
export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const generation=sessionGeneration;
  const response = await request(path, options,generation);
  assertCurrent(generation,options.signal);
  if (response.status === 204) return undefined as T;
  const data=await response.json() as T;
  assertCurrent(generation,options.signal);
  return data;
}

/** Same authenticated error handling as JSON API, for file downloads. */
export async function apiFile(path: string, options: ApiOptions = {}): Promise<Blob> {
  const generation=sessionGeneration;
  const response = await request(path, options,generation);
  const blob=await response.blob();
  assertCurrent(generation,options.signal);
  return blob;
}
