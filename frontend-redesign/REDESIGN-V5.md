# V5 — Shared UI/UX foundation and System workflow refinement

**Scope:** `frontend-redesign/` only; compared to V4. **No backend, ETL, MongoDB, endpoint, or data-schema changes.** Existing business-feature placeholders remain intentionally blank.

## Design direction

- One main **page heading in content**; the app bar shows the navigation section rather than duplicating the page title. The wide-screen scope picker is inline with the app bar, while small screens keep an accessible contextual scope row.
- Original blue analytics favicon is used on the login page and in the sidebar.
- Narrower default expanded sidebar (264px); remembered expanded state is read before first render. No Ctrl+B override of the browser shortcut.
- Admission navigation parent now visually indicates an active child without incorrectly assigning `aria-current="page"` to a non-page button.
- Related selection states (sidebar, admin tabs, partner selection) use **primary-container**. Enabled permissions use a quieter outlined treatment, not the success color reserved for status. Administrative sections have calmer surface nesting.
- Improved small-type readability and spacing for metadata, table headings, chip labels, permission descriptions, and filters. No new animation dependency.

## Interactions and data accuracy

- Admin tabs expose `role="tablist"` / `role="tab"` / `role="tabpanel"`, `aria-selected`, and ArrowLeft/ArrowRight/Home/End navigation.
- Switching admin tabs when partner permissions have unsaved edits shows a confirmation. Browser refresh/close also warns when there are unsaved changes. **Note:** in-app navigation via a different sidebar route is not yet covered by this guard.
- The shared native dialog tracks intentional user closes, avoids development StrictMode cleanup dismissals, and refuses Escape/backdrop/close while a mutation is pending. Theme dialog receives the same intentional-close guard.
- Partner saves now do **GET before PATCH**, aborting if the stored settings changed since the editor opened, and **GET after PATCH** to verify persistence. The GET preflight mitigates but **cannot eliminate** simultaneous-write races without backend atomic versioning.
- Numbered pagination with first/last navigation and server-side page clamping in quality logs; client-side audit pagination also clamps if filters reduce result count.
- Audit event details show labeled key–value fields rather than a raw JSON blob by default.
- Quality dashboard prioritizes two principal counts, collapses secondary diagnostics, and hides **global** pipeline/import metrics when the administrator has selected a partner scope. This avoids misleading comparisons; no backend data changed.
- Loading placeholders reserve layout space. Read-only refresh keeps previously loaded data on errors and offers retry (existing `useResource` behavior preserved).
- Upload and ETL-reload confirmations now use distinct typed phrases (`THAY THE` vs. `NAP LAI`). Both still use the original backend API and can modify backend data **only after explicit confirmation**. No dry-run endpoint is available.
- Profile theme/palette settings remain browser-local; changing colors applies instantly, and the dialog now says “Đóng” instead of implying a separate save action.

## Existing API endpoints used (unchanged)

`/api/auth/me`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/change-password`, `/api/meta/options`, `/api/admin/users`, `/api/admin/partners`, `/api/admin/audit`, `/api/admin/data-status`, `/api/admin/imports`, `/api/admin/reload-data`, `/api/admin/upload-file`, `/api/quality/summary`, `/api/quality/list`.

## Verification

- 64 `.ts` / `.tsx` files parsed successfully; local imports resolved at review time.
- Existing theme persistence and API-client contract tests pass with TypeScript available.
- Stylesheets parse without syntax errors.
- Full `npm run build` **not verified in this container**: npm dependency installation failed here (`Exit handler never called!`), and the required runtime package declarations were not installed. Syntax/import checks are not a substitute for TS typechecking or a Vite build.
- Live FastAPI/MongoDB writes **not tested** here. The non-destructive `npm run check:system-api` can validate real GET response shapes using an admin test account; its login generates the backend's normal login audit event.

## Recommended local checks

From repository root, replace/merge `frontend-redesign/` from the ZIP; first commit or back up any uncommitted frontend changes. Then:

```bash
cd frontend-redesign
npm ci
npm run test:local
npm run build
npm run dev
```

With FastAPI running at `http://127.0.0.1:8000`, use `npm run check:system-api` with `NEU_TEST_USERNAME` and `NEU_TEST_PASSWORD` set **locally** (do not paste credentials into chat). Afterward manually verify:

1. Login and profile color preference, reload persistence.
2. Admission active parent when collapsed; sidebar memory after reload.
3. Partner permission edits, tab-switch confirmation, save confirmation, read-back and refresh persistence.
4. User create/edit/lock/password-reset dialogs, especially Escape during a pending operation.
5. Quality filters, pagination, selected partner scope and audit details.
6. Explicit ETL and upload confirmation; **only test destructive operations in a disposable/test database**.
7. Keyboard tab navigation, mobile drawer, and reduced-motion preference.

## Still deferred (intentionally)

- Advanced CRM-specific tables: sorting, column visibility, record-detail routes and exports require product/design decisions for those still-blank business screens.
- A dedicated multi-route administration information architecture (for now, accessible tabs remain).
- Atomic conflict prevention, cross-tab real-time permission revocation, global-vs-partner metrics at the API level, and true upload/ETL previews require backend support. These are not silently changed in this frontend task.
- Full browser screenshot/visual QA on the user's actual device and live system integration.
