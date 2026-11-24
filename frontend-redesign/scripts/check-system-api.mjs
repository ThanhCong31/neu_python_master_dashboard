/**
 * Non-destructive integration smoke check against the EXISTING FastAPI backend.
 * After login, performs GET requests only. Login itself updates last_login and audit_logs.
 * Usage: NEU_TEST_USERNAME=... NEU_TEST_PASSWORD=... npm run check:system-api
 * Never paste a password, session cookie, or returned business data into bug reports.
 */
const base = (process.env.NEU_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const username = process.env.NEU_TEST_USERNAME;
const password = process.env.NEU_TEST_PASSWORD;
if (!username || !password) {
  console.error("Set NEU_TEST_USERNAME and NEU_TEST_PASSWORD locally. No credentials are written to disk.");
  process.exit(2);
}

const login = await fetch(`${base}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username, password }),
});
if (!login.ok) {
  console.error(`Login failed (HTTP ${login.status}). The checker does not print credentials or token values.`);
  process.exit(1);
}
const cookieHeaders = login.headers.getSetCookie?.() ?? [];
const cookie = cookieHeaders.find((h) => h.startsWith("neu_bi_session="))?.split(";")[0];
if (!cookie) {
  console.error("Missing expected HttpOnly session cookie `neu_bi_session`. Check the backend's login configuration.");
  process.exit(1);
}
const account = await login.json();
if (account.role !== "admin") {
  console.error("Use an admin test account to verify every Hệ thống endpoint. This checker does not change permissions.");
  process.exit(1);
}

const endpoints = [
  ["/api/auth/me", x => x?.role === "admin" && typeof x?.username === "string"],
  ["/api/meta/options", x => Array.isArray(x?.partners)],
  ["/api/admin/users", Array.isArray],
  ["/api/admin/partners", x => Array.isArray(x?.partners) && x?.modules && typeof x.modules === "object"],
  ["/api/admin/audit?limit=200", Array.isArray],
  ["/api/admin/data-status", x => ["contacts", "signups", "leads", "exam_candidates", "exam_scores"].every(k => typeof x?.[k] === "number")],
  ["/api/admin/imports", Array.isArray],
  ["/api/quality/summary", x => Array.isArray(x?.by_issue) && Array.isArray(x?.by_reason) && Array.isArray(x?.flags)],
  ["/api/quality/list?kind=issues&page=1&page_size=15", x => typeof x?.total === "number" && Array.isArray(x?.rows)],
  ["/api/quality/list?kind=duplicates&page=1&page_size=15", x => typeof x?.total === "number" && Array.isArray(x?.rows)],
];
let failures = 0;
for (const [path, valid] of endpoints) {
  try {
    const response = await fetch(`${base}${path}`, { headers: { Cookie: cookie } });
    const value = response.ok ? await response.json() : null;
    const ok = response.ok && Boolean(valid(value));
    console.log(`${ok ? "PASS" : "FAIL"}  ${path}  HTTP ${response.status}${response.ok && !ok ? " · unexpected data shape" : ""}`);
    if (!ok) failures++;
  } catch (error) {
    failures++;
    console.log(`FAIL  ${path}  network error (${error?.cause?.code ?? error?.name ?? "unknown"})`);
  }
}
console.log(`\n${endpoints.length - failures}/${endpoints.length} GET endpoint contract checks passed.`);
if (failures) process.exitCode = 1;
