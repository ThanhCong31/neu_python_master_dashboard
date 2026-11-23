# V7 — Phạm vi dữ liệu (frontend only)

## Why this change

The previous outlined Select's floating label overlapped the rounded application surface at some viewport sizes. The scope is a viewing-context switch, not a form input.

## Changes

- Replaced `ScopeSelect` with an anchored M3 Expressive menu triggered by a compact tonal button. No floating label.
- Uses accessible radio items, keyboard navigation and a visible selected indicator.
- Includes 'Toàn hệ thống' and the partners returned by the existing `/api/meta/options` endpoint, without hardcoding partner names.
- Clearly explains that this filters data only and doesn't impersonate a partner account.
- Scope switcher is visible only for users with the `admin` role, on business modules, on both desktop and mobile.
- Removed the partner-facing scope display from the top bar/mobile scope band; non-admins still have their data restricted by the backend.
- Reuses the existing `changeScope` callback and sessionStorage behavior; no new API calls or backend changes.
- Did not alter page-specific “Làm mới” actions.

## Check locally

```
cd frontend-redesign
npm ci
npm run test:local
npm run build
npm run dev
```

Sign in as admin, switch between all data and one partner, navigate between modules, refresh the page, and confirm the scope persists for the browser tab. Sign in as partner and verify that no scope switch is available. Test the menu using Enter, arrow keys and Escape. Existing APIs must be running for live verification.
