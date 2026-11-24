# Tic Tac Toe Universe — v0.1 foundation

A responsive React + Vite browser game foundation. This is the first playable development build, not the completed online platform.

## Included and working
- Classic 3×3 against a perfect minimax AI (Smart setting) or a local second player
- Reverse / misère, 4×4, 5×5 and sliding-three rule variants
- Game setup, restart, win/draw detection and winning-line highlighting
- Local profile name, XP, coins, levels, match stats and streaks
- Achievement unlocks and coin rewards
- Unlockable/equippable board colour skins
- Four themes, sound effects toggle, responsive mobile navigation
- Browser localStorage persistence

## Run locally
1. Install Node.js (LTS).
2. In this folder run `npm install`.
3. Run `npm run dev`.
4. Open the local URL printed by Vite.
5. Run `npm run build` to create the production build in `dist/`.

## Deployment
Deploy the project to a static host such as Cloudflare Pages using:
- Build command: `npm run build`
- Build output directory: `dist`

## Important current limitations
- Online multiplayer, accounts, friends, matchmaking, cloud sync, leaderboards, tournaments, real daily resets, and server-validated rewards are not connected yet. These require a backend (planned: Supabase) and environment configuration.
- The AI's perfect minimax strategy is implemented for Classic 3×3. Other variants currently use a simpler tactical/random opponent; difficulty selection is a starting point and will be refined.
- Progress is local to this browser/device. Clearing browser data can erase it. There is no cloud backup yet.
- This build uses a Google Fonts import when online and falls back to system fonts offline.
- The sound effects are generated with Web Audio; no external audio assets are required.

## Next engineering milestones
1. Extract and unit-test the game engine for every mode, including edge cases.
2. Add automated tests for AI, win conditions, reward calculations and save migration.
3. Add Supabase authentication, profiles, realtime private rooms and server-side move validation.
4. Add full challenge scheduler, campaign/boss content, replay timeline, rankings and moderation/privacy controls.
5. Add PWA service worker/offline asset caching and accessibility pass.
