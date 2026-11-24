# NEU Admissions BI — M3 Expressive refinement V3

**Scope:** `frontend-redesign/` only. Reuse existing FastAPI/MongoDB/ETL unchanged. This archive does **not** contain `backend/` files.

## UI changes

- Restored the **exact favicon** used by the main branch: blue rounded 32×32 SVG containing three ascending white bars. It is now `public/favicon.svg` and referenced by `index.html`.
- Removed the duplicate palette icon from the top app bar. Appearance controls remain exclusively in the **profile avatar menu**.
- Kept **Theme: system / light / dark** in the avatar menu, plus the **Màu giao diện** dialog.
- Curated **four** M3 Expressive palettes: iris, NEU red, ocean blue and jade teal. They are **visual swatches**, without visible color names; accessible labels and hover tooltips identify them. Each palette generates full light/dark Material semantic color roles, not a plain CSS button tint.
- M3 dialogs are protected against a stale close event from React StrictMode development effect cleanup.

## What the app remembers

| Preference / state | Storage | Persistence |
|---|---|---|
| Light / dark / system | `localStorage: neu-bi-theme` | Reloads and new tabs on the same browser; cross-tab sync |
| Palette | `localStorage: neu-bi-color` | Reloads/new tabs; cross-tab sync; removed V2 palettes map to a supported palette |
| Sidebar expanded | `localStorage: neu-shell-sidebar` | Reloads |
| Tuyển sinh group expanded | `localStorage: neu-shell-admissions-expanded` | Reloads; navigating to a child expands it automatically |
| Admin viewing scope | `sessionStorage: neu-bi-scope:<username>` | Same browser tab/session; cleared on logout; checked against available backend partners |
| Selected partner in admin editor | `sessionStorage: neu-admin-selected:<username>` | Same browser tab/session; cleared on logout |
| Admin active tab | URL `?tab=...` | Refresh/bookmark |
| Unsaved form/permission drafts | React state, not persisted | Deliberately discarded on refresh or when closed, to avoid accidental future changes |
| Actual partner permissions and user changes | **Backend API** | Persist across browsers/users according to backend permissions |

**No password, bearer token or session cookie is stored in browser localStorage.** Existing HttpOnly session cookie remains controlled by FastAPI.

## Hệ thống correctness review

Checked the current UI endpoints against the code in `main/backend/app/routers/admin.py`, `misc.py`, `auth.py`, and `filters.py`:

| Screen | Existing API endpoints used | Behavior |
|---|---|---|
| Chất lượng dữ liệu | `GET /api/quality/summary`, `/api/quality/list` | Real counts, scoped issue/duplicate lists and pagination |
| Tài khoản | `GET/POST /api/admin/users`, `PATCH /api/admin/users/{username}`, `POST /api/admin/users/{username}/reset-password` | Create/edit, lock/unlock, reset password; check mutation responses |
| Đối tác & phân quyền | `GET /api/admin/partners`, `PATCH /api/admin/partners/{code}` | Save real config then re-read GET and verify it matches |
| Quản lý dữ liệu | `GET /api/admin/data-status`, `/api/admin/imports`, `POST /api/admin/reload-data`, `/api/admin/upload-file` | Counts/import history, reload/upload behind explicit confirmation; check server `ok` |
| Nhật ký | `GET /api/admin/audit?limit=200` | Lists 200 newest events, local filters and pagination |

**Bug fix:** `useResource` now retains last successfully loaded data when a same-URL refresh fails; it stops the refreshing state and shows an actionable error instead of blanking an editor or spinning indefinitely. It **never** reuses data across different partner/filter URLs.

**Important backend limitations, not frontend bugs we can remove:**
- The existing `/api/quality/summary` returns global pipeline / import metadata even for scoped queries. The frontend labels these values as global and does not show them to partner users, but **API-level disclosure risk still needs backend-team review** (audit D25). Frontend hiding is not a security boundary.
- The existing upload API does not fully enforce the frontend's file-size/target restrictions on the server (audit D24). Frontend validation/confirmation is a UX precaution only. No backend changes were made.
- `/api/admin/reload-data` and `/api/admin/upload-file` run the real ETL and are **not** dry-run actions. They should only be manually tested with backups and explicit approval.

## Verification performed in the packaging environment

- TypeScript/TSX syntax parsing: **64 source modules**, no syntax errors.
- Local import-resolution check: **153 local imports**, all resolved (at packaging time).
- `npm run test:local`: **passed** (mode/palette persistence and HTTP client contracts, using isolated mocks).
- `npm run check:system-api`: **10/10 passed against a local mocked HTTP server** to validate the smoke-check command itself. This is **not** evidence of a working live FastAPI deployment.
- `npm run build`: **not executable here** — the container lacks Vite/React/Node type dependencies. The partial placeholder `node_modules` is not included in the ZIP. Run `npm ci && npm run build` locally.

## Run checks on your machine

```bash
cd frontend-redesign
npm ci
npm run test:local
npm run build
npm run dev
```

For non-destructive integration checks (run only after starting FastAPI at `127.0.0.1:8000`), use your **own local terminal**. Do **not** paste credentials into chat. The login will update the backend's normal login timestamp and audit log, but all subsequent requests are GET-only:

```bash
read -rp 'Admin username: ' NEU_TEST_USERNAME
read -rsp 'Admin password: ' NEU_TEST_PASSWORD; echo
export NEU_TEST_USERNAME NEU_TEST_PASSWORD
npm run check:system-api
unset NEU_TEST_PASSWORD NEU_TEST_USERNAME
```

The command prints only the endpoints, status codes and whether each response has the required data shape; it prints no business records. You can send that output along with `npm run build` errors if any.

For a mutation test, manually toggle **one harmless module permission**, click **Lưu thay đổi**, check the confirmation, reload the page, verify it persisted, then restore the previous value. Avoid running the ETL commands just to test UI interactions.
