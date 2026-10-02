# `_unscreens/`

Screens that exist but are **not wired into the navigator**, and are excluded
from `tsc`. Kept rather than deleted because they are committed work that may be
finished later.

## Why they are excluded

`TargetLoupe.tsx` and `ExportableTargetCard.tsx` import three packages this app
does not depend on:

- `react-native-gesture-handler`
- `react-native-reanimated`
- `react-native-view-shot`

None are in `package.json` and none are in `node_modules`. They have therefore
**never been able to run**. They are not wired into `App.jsx`, so nothing in the
live app references them and there is no crash — but they cannot be typechecked
either, because the imports cannot resolve.

## Verified 1 Oct 2026

Found when the app was typechecked for the first time ever. Before that,
`apps/ballistics/tsconfig.json` had `include: ["packages/**/*.ts"]` and
`exclude: ["apps/ballistics"]`, so it matched **zero files** and `tsc` reported
`TS18003` — a config error that had been sitting unnoticed, meaning no part of
this app was ever typechecked.

## To revive one

1. Add the packages via `npx expo install <pkg>` — Expo pins versions, and
   installing them by hand breaks the SDK contract.
2. Remove the screen's `_unscreens` exclusion, or move it back to `screens/`.
3. Wire it into the navigator in `App.jsx`.
4. Run `npm run typecheck:ballistics`.