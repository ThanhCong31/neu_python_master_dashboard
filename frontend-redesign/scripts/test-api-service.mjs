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

// A response may arrive after AbortController or an authentication change.
const deferred = () => { let resolve; const promise=new Promise(r=>{resolve=r;}); return {promise,resolve}; };
const pending=[]; const lateEvents=[];
const late=evaluateTypescript(new URL("../src/services/api.ts",import.meta.url),{context:{exports:{},fetch:()=>{const d=deferred();pending.push(d);return d.promise;},window:{dispatchEvent:e=>lateEvents.push(e.type)},Event:class{constructor(type){this.type=type;}}},exports:["api","apiFile","invalidateApiSession"]});
const aborted=new AbortController();const old=late.api('/contacts/list',{signal:aborted.signal});aborted.abort();pending.shift().resolve({ok:false,status:401,json:async()=>({detail:'expired'})});await assert.rejects(old,e=>e.name==='AbortError');assert.deepEqual(lateEvents,[]);
const json=deferred();const prior=late.api('/contacts/list');pending.shift().resolve({ok:false,status:401,json:()=>json.promise});await Promise.resolve();await Promise.resolve();late.invalidateApiSession();json.resolve({detail:'old session'});await assert.rejects(prior,e=>e.name==='AbortError');assert.deepEqual(lateEvents,[]);
const blob=deferred();const oldFile=late.apiFile('/overview/export?format=pdf');pending.shift().resolve({ok:true,status:200,blob:()=>blob.promise});await Promise.resolve();await Promise.resolve();late.invalidateApiSession();blob.resolve({type:'application/pdf',size:10});await assert.rejects(oldFile,e=>e.name==='AbortError');
const fresh=late.api('/auth/me');pending.shift().resolve({ok:true,status:200,json:async()=>({username:'new'})});assert.equal((await fresh).username,'new');console.log('PASS  Aborted and previous-session responses cannot expire a new session or deliver old files');
