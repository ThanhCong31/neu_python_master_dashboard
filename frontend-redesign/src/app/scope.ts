/** Do not mount scoped features until a saved viewing code has been validated. */
export function resolveScopeStatus(role: "admin" | "partner", partner: string | null, state: "loading" | "ready" | "error", partners: readonly {code:string}[] | null): "loading" | "ready" | "error" {
  if (role !== "admin") return "ready";
  if (state !== "ready") return state;
  if (!partners || (partner !== null && !partners.some(p=>p.code===partner))) return "loading";
  return "ready";
}
