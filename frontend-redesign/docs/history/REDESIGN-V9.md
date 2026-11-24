# NEU Admissions BI — V9: UX and functional review

**Scope:** `frontend-redesign/` only. No FastAPI, ETL, MongoDB, database schema, or API changes.

## Reproduced source-level issues and adjustments

| Problem seen in V8 | V9 treatment |
|---|---|
| Audit action/result filters use floating labels and 56px Select controls, while the search uses an external label plus a separate 48px input | The three controls now use the shared M3 Select/TextField primitives, stable labels **above** the fields, identical 56px input surfaces and consistent grid alignment; small viewports stack the controls |
| Scope pill morphs from rounded pill to a squarer shape on hover | Removed border-radius morph and spring timing on hover; retained a modest state-layer/color response |
| Scope popover is overly tall | Removed the repeating explanation, reduced width and option height, bounded popover height; selected partner remains marked with a check |
| `test:local` assumes TS 6's JavaScript compiler API although dependency is TypeScript 7 | Theme and API fixture tests now use Node's built-in `stripTypeScriptTypes`, while source checking uses the `tsc` CLI and checks local imports (no TypeScript compiler API imports) |
| Potential ambiguous create-user errors | If the POST returns HTTP 500, use an **admin-only read** of `/admin/users` to check whether the exact new account exists before inviting the user to retry. Normal non-500 failures remain errors |
| Duplicate explanation of the audit endpoint's 200-event limit | Kept the explanation in the section subtitle; removed the repeated callout |
| Quality filters differ from the revised admin filter convention | Quality log filters use the same stable-label form variant |

**Important:** The create-user fallback is a UI outcome verification, not a fix for possible server serialization bugs. It does not make extra writes or change the API.

## Tests completed here

- PASS: TS/TSX syntax parse across 65 source files and local import path checks.
- PASS: theme test suite with Node 22 built-in TS stripping.
- PASS: API client test suite with Node 22 built-in TS stripping.
- PASS: the 10-endpoint, read-only system API checker against a local **mock** HTTP service.
- PASS: ZIP integrity.
- **NOT RUN:** the complete Vite + TypeScript 7 production build (npm dependencies were incomplete in this offline container).
- **NOT RUN:** browser interaction tests against the live app and any real FastAPI/MongoDB writes.

Source checks and mock responses are **not equivalent** to a successful production build or a live integration test.

## Run locally

```sh
cd ~/Projects/neu_python_master_dashboard/frontend-redesign
npm ci
npm run test:local
npm run build
npm run dev
```

If the frontend works but you still get a blank screen, open DevTools Console (F12), press the failing control, and copy the first error stack **without credentials, tokens, or personal data**. V8+ includes an error boundary to show a recovery screen for component-render exceptions.

For an optional safe read-only API shape check against your FastAPI server, consult `scripts/check-system-api.mjs`. Login updates the normal backend `last_login` and audit log but no business data is written; use an admin test account. Do not paste secrets in chat.

## Manual browser checklist (with real backend)

1. Open Hệ thống → Nhật ký. All three search/filter fields should align. Filter by action, result, and username; clearing them should restore rows.
2. Admin scope selector: hover without shape change; select a partner; confirm the menu closes and the visible name changes; switch pages and confirm scope persists for the session.
3. Hệ thống → Đối tác & quyền: choose a partner, toggle a module, cancel, save, and refresh the page; check that the server-persisted value appears.
4. Hệ thống → Tài khoản: create a *disposable test account* if authorized; edit, lock/unlock, reset password. Confirm rows update. Do not test with production credentials.
5. Chất lượng dữ liệu: filter source/type and paginate; change scope; confirm refreshed figures and logs correspond to the selected scope.
6. Theme settings: switch light/dark and palette; reload and confirm persistence.
7. Narrow viewport: inspect sidebar drawer, filter stacking, popover collision/scroll and large tables.

## Outstanding backend-side risks (documented, not modified)

See `neu-dashboard-existing-issues.md` for original issues D23–D25; the frontend cannot secure the server-side upload path or change global quality-scope behavior. The UI does not claim these issues are fixed.
