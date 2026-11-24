/** Local tests for cookie-backed API helper; no backend needed. */
import assert from "node:assert/strict";
import { evaluateTypescript } from "./test-loader.mjs";
const calls = []; const events = [];
let status = 200;
const context = {
  exports: {},
  fetch: async (path, options) => {
    calls.push({ path, options });
    return { ok: status >= 200 && status < 300, status,
      json: async () => status >= 400 ? ({ detail: "API rejected the operation" }) : ({ ok: true }),
      blob: async () => ({ type: "application/pdf", size: 10 }) };
  },
  window: { dispatchEvent: event => events.push(event.type) },
  Event: class { constructor(type) { this.type = type; } },
};
const { api, apiFile, ApiError } = evaluateTypescript(new URL("../src/services/api.ts", import.meta.url), { context, exports: ["api", "apiFile", "ApiError"] });
const result = await api("/admin/partners/NEU", { method: "PATCH", json: { modules: ["quality"] } });
assert.equal(result.ok, true);
assert.equal(calls[0].path, "/api/admin/partners/NEU");
assert.equal(calls[0].options.method, "PATCH");
assert.equal(calls[0].options.credentials, "same-origin");
assert.equal(calls[0].options.headers["Content-Type"], "application/json");
assert.deepEqual(JSON.parse(calls[0].options.body), { modules: ["quality"] });
await assert.rejects(api("https://bad.example"), /Invalid API path/);
status = 400;
await assert.rejects(api("/admin/partners/NEU", { method: "PATCH", json: {} }), e => e instanceof ApiError && e.status === 400 && e.message === "API rejected the operation");
status = 401;
await assert.rejects(api("/admin/users"), e => e.status === 401);
assert.deepEqual(events, ["session-expired"]);
console.log("PASS  API paths, PATCH JSON payload, same-origin session, errors and expired-session event");

status = 200;
const file = await apiFile("/overview/export?format=pdf");
assert.equal(file.type, "application/pdf");
assert.equal(calls.at(-1).options.credentials, "same-origin");
status = 401;
await assert.rejects(apiFile("/overview/export?format=pdf"), e => e.status === 401);
assert.deepEqual(events, ["session-expired", "session-expired"]);
console.log("PASS  Authenticated binary response and expired-session handling");
