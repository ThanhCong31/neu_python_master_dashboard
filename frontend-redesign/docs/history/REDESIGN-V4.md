# V4 — Brand identity, color curation, and restrained M3 Expressive motion

**Scope:** `frontend-redesign` only. This release does not modify FastAPI, MongoDB, ETL, API contracts, or permissions.

## Design decisions

1. The original dashboard favicon was a blue rounded square with three white ascending bars. `Shell.tsx` now uses `/favicon.svg` directly in the sidebar header, in place of the previous `N` placeholder. Both the browser tab and the sidebar share the same icon. The product identity remains blue when users change the UI color theme.
2. Five curated color themes use Google's Material color utilities (`@material/material-color-utilities`) to generate all semantic color roles in **light and dark**. The selected theme is stored in `localStorage`, and old V2/V3 color IDs are mapped to the closest new palette. The default is Campus Blue, matched to the original logo.
3. Color variant is `tonal-spot` for coherent, restrained surfaces and accents appropriate for a data-heavy administrative application. M3 Expressive motion/shape tokens are separate from the color variant and remain in place.
4. Sidebar and nested navigation active indicators now use `primary-container` / `on-primary-container` rather than a potentially mismatched `secondary-container`. This establishes a single recognizable selection accent across palette changes.
5. Palette choices appear as a miniature preview of the app's real semantic roles (navigation, surface, primary action), rather than flat raw color circles. Visible names are omitted as requested; assistive text and hover titles remain.
6. Avoid animation libraries for routine dashboard interactions. Reuse Expressive's CSS spring tokens for navigation/controls; do not animate data tables. Reduce-motion preferences continue to disable springs. Removed the expensive modal backdrop blur.
7. No new top-bar theme button. Appearance controls remain under profile menu. The `system/light/dark` preference also continues to persist in browser storage.

## Palette choices

| ID | Seed | Direction |
|---|---|---|
| campus | `#2A78D6` | clear academic blue; default |
| iris | `#7358A9` | expressive violet |
| lagoon | `#006E75` | calm deep teal |
| ember | `#B55544` | warm earthy coral |
| moss | `#506D4E` | restrained nature green |

The seed colors are **inputs to Material color generation**; UI components must use semantic roles such as `primary`, `primary-container`, `surface-container`, and their paired `on-` colors rather than hard-coded seeds.

## Relevant files

- `src/shell/Shell.tsx` — original icon, shared with tab favicon
- `src/components/expressive/sidebar.tsx` — coherent active role
- `src/shell/theme.ts` — curated seeds, old preference migration, memoized Material schemes
- `src/shell/ThemeStudio.tsx` — thumbnail previews, accessibility
- `src/shell/theme-studio.css` — semantic presentation and performance
- `scripts/test-theme.mjs` — storage/mode/migration checks

## Test locally

```bash
cd frontend-redesign
npm ci
npm run test:local
npm run build
npm run dev
```

Then verify: favicon and sidebar icon match; each palette updates sidebar and cards; dark/system modes work; theme choice survives browser reload; older color preferences migrate to the intended replacement; `prefers-reduced-motion` disables animation. There are no API or database changes in V4.

## References consulted (2026-11-23)

- Material 3 Expressive research: https://design.google/library/expressive-material-design-google-research
- Expressive color semantics and variants: https://expressive.grenishrai.pro/docs/color
- Expressive CSS-spring motion: https://expressive.grenishrai.pro/docs/motion
- Expressive theming: https://expressive.grenishrai.pro/docs/theming
- WCAG 2.2 motion preferences: https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions
