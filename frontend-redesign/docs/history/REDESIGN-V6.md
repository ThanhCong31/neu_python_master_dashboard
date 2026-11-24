# V6 — Account menu in the sidebar footer

Scope: `frontend-redesign/` only. This is a focused change from V5. **No backend or API changes.**

## Changes

- `src/shell/Shell.tsx`: the account menu moves out of the top app bar into the existing `SidebarFooter` below the scrollable navigation. The footer is part of the sidebar's flex layout, not absolutely positioned, and works in the desktop rail and the mobile drawer.
- `src/shell/Profile.tsx`: the full-width account trigger displays the real signed-in user's name and role/partner label. In collapsed rail mode, only the avatar remains visible, with an accessible button name and browser tooltip.
- The account menu opens upward to avoid covering the footer. It retains **Tài khoản**, appearance (system/light/dark), the color chooser, and logout. The mobile drawer closes when navigating to Tài khoản and on successful logout.
- The app bar still contains the navigation control and the current page group, plus partner data scope when applicable. It no longer contains the account avatar.

## No behavioral changes

- Login and logout endpoints remain `/api/auth/me` and `/api/auth/logout`.
- Theme mode and color selection continue to persist locally in the browser using the existing theme module.
- Sidebar expansion state and partner viewing scope remain unchanged.
- The unfinished business screens remain untouched.

## Verification

- `npm run test:local`: passed (theme persistence and API-client tests).
- TS/TSX parser: 64 files with no parse diagnostics.
- Local relative imports: 151 resolved, 0 missing.
- Shell static regression assertions: passed (footer placement, one profile invocation, existing menu).
- Full `npm run build`: not verified in this environment, because the installed dependency directory is missing `@types/node` and `vite/client`. Run `npm ci && npm run build` with the project's lockfile on your machine.
- Interactive/mobile visual testing against a running app: still required.

## Quick manual checks

1. Expanded desktop sidebar: account row remains at the bottom while the navigation section scrolls, and the name/role display correctly.
2. Collapse sidebar: only the avatar remains at the bottom; clicking it opens the account menu.
3. Mobile: open drawer, check the profile at its bottom, navigate to Tài khoản and confirm the drawer closes.
4. Change theme mode and palette through the profile menu, refresh, and check that they persist.
5. Log out and verify that the existing sign-out flow still works.
