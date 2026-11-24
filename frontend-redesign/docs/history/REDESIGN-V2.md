# NEU Admissions BI — M3 Expressive UX revision 2

## Scope

**Frontend only.** No file in `backend/`, no database schema or ETL logic changes. This ZIP contains only `frontend-redesign/` source and its documentation. Continue using the existing FastAPI instance at `127.0.0.1:8000` via Vite's `/api` proxy.

## What changed

### Partner permissions

- Replaced partner list + repeated green “Cấu hình” pills with **single-selection list**. Selected partner has a clear filled treatment, left indicator and check symbol. Header explicitly states which partner is being edited. The “Hoạt động” badge is reserved for persisted partner state.
- Replaced flat checkbox columns with accessible interactive permission tiles. Module choices, PII access and active state are visibly separated and explained.
- Persistent summary shows **N changes not saved**, with Undo and Save actions. Clicking Save opens a modal listing exactly which module grants/revocations and state changes will be sent.
- Switching partners or refreshing with unsaved changes prompts before discarding them.
- Save calls `PATCH /api/admin/partners/{code}` and then **GET `/api/admin/partners`** to check that the server persisted the expected state. Success appears only after this verification, not after an optimistic local update. If verification fails, an actionable warning is displayed.
- Dialog mounting now defers native `showModal()` by one animation frame, preventing StrictMode effect replay from producing an immediate close-event flash during development.
- Refreshing the same API resource no longer blanks the editor temporarily: `useResource` keeps the last successful response visible while a retry is in flight. Path/partner changes still enter loading state, preventing stale cross-scope data.

### Dropdowns

- Quality logs: `Nguồn dữ liệu`, `Loại vấn đề` / `Lý do gộp trùng`
- Admin audit: action and outcome
- User editor: role and partner
- Data import: target dataset

All now use the actual installed **Expressive Select** component (Base UI keyboard interaction, typeahead, selection states, floating labels and color tokens) rather than native `<select>` with a generic border. They preserve the exact existing backend query values.

### Theme palette

- Added **palette icon in the app bar** and a **Màu giao diện** action in the profile menu.
- Six generated themes: purple, NEU red, teal, blue, rose, amber. These are **M3 color utility schemes**, not button-only recolors: light and dark semantic color roles are regenerated from the chosen seed.
- Persists only the **UI color preference** in localStorage. Existing light/dark/system choice remains independent. No backend profile API is called.

## Real API endpoints

| UI | Endpoint | Method |
|---|---|---|
| Partner list, role labels, verification | `/api/admin/partners` | GET |
| Save partner permissions | `/api/admin/partners/{code}` | PATCH |
| Quality summary | `/api/quality/summary` | GET |
| Quality logs and filters | `/api/quality/list?kind=&partner=&source=&issue=&page=&page_size=` | GET |
| Audit | `/api/admin/audit?limit=200` | GET |
| Data status | `/api/admin/data-status` | GET |
| Data reload | `/api/admin/reload-data` | POST |
| Upload | `/api/admin/upload-file?filename=...` | POST |
| User management | `/api/admin/users`, `/api/admin/users/{username}` | GET / POST / PATCH |

**Backend authority remains unchanged**: `GET /admin/partners` data comes from MongoDB and `PATCH` updates it through FastAPI. Frontend cannot grant permissions beyond backend role checks. Security findings D24/D25 in the original audit remain backend-team issues, not changed in this ZIP.

## Test checklist on your machine

1. Run FastAPI and MongoDB, then `cd frontend-redesign && npm ci && npm run dev`.
2. Sign in as admin; navigate to `Quản trị` > `Đối tác & quyền`.
3. Select a different partner. Confirm that **the selected row and header change together**.
4. Toggle a module. Confirm **“1 thay đổi chưa lưu”**, click Save, read the before/after details, confirm.
5. Check **“Đã lưu và kiểm tra lại”** after the actual API round trip; refresh the browser, verify persisted selection values.
6. Toggle then switch partner without saving: verify the discard dialog.
7. Return to `Chất lượng dữ liệu`, open both dropdowns with keyboard and mouse and confirm list filters actually update.
8. Open palette chooser (app bar), switch colors, switch dark/light mode, reload; verify preferences persist.
9. Check mobile narrow width and keyboard navigation; buttons and dialogs should remain usable.

## Verification here

- All TS/TSX files parsed using the TypeScript compiler parser; zero syntax diagnostics.
- Local relative imports checked (no missing local modules).
- npm package installation could not complete in this environment due to unavailable registry tarballs; **full `npm run build` and live FastAPI/MongoDB integration tests have not been run**.
