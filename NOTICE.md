# Attribution and provenance

Orbit for Codex is an independent adaptation of **Coucou by Louis Raillé**.

- Original: https://github.com/Louis-CFM/coucou
- Author: https://github.com/Louis-CFM
- Upstream commit: `835421c7fff260f0f0be48927591b96bfad81cad`
- Original source license: MIT, copyright (c) 2026 Louis Raillé. The full notice is preserved in LICENSE.
- Adaptation, Codex/Electron integration and Orbit identity: TheoRossetto.

## Adapted MIT source

The Windows island layout, state machine, generic animation helpers, views, task ticker, integration cards, preferences, drop orchestration and CSS are adapted from `windows/src/`. The bridge was replaced with an isolated Electron implementation. Integration pollers adapt `windows/src-tauri/src/integrations.rs`; hook installation follows the original preview/backup/preserve approach in `hooks.rs`. `app/sessions.cjs` expands the upstream task/event approach to independent Codex sessions.

The satellite drawing, greeting and file illustration in `src/mochi/engine.ts`, `greeting.ts` and `src/upload/canvas.ts` are new artwork. `src/core/sound.ts` synthesizes original tones. The mini-canvas plumbing is adapted MIT code and renders only the new satellite. UI glyph paths are generic MIT source, not the upstream app or menu-bar icon.

## Before / after

| Coucou Windows | Orbit for Codex 0.4 |
| --- | --- |
| Horizontal hidden/compact/expanded island | Same layout and state-machine structure |
| Mochi character and recorded sounds | Original satellite and synthesized sounds |
| Claude chat and Claude Code permissions | Codex app-server chat and authenticated Codex hook permissions |
| Integration pills, preferences and task ticker | Preserved with Electron provider adapters |
| File context and PDF/image/text | Explicit sending through Codex; local PDF rendering |

Coucou/Mochi names, character appearance and character animations, app/menu-bar icons, recorded sounds and promotional media are not distributed. They remain governed by upstream LICENSE-ASSETS.md. Attribution does not imply endorsement. OpenAI and VS Code names identify compatible tools.

PDF.js is copyright Mozilla Foundation and contributors, licensed Apache-2.0. Its distributed license and notices are retained in the dependency. Electron, Chromium, native canvas and other dependencies retain their own notices.
