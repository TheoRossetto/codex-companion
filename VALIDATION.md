# Validation — Orbit for Codex 0.4.0

Reviewed 2026-10-01. Local implementation and source desktop tests passed. Microsoft Store certification and installed-package acceptance remain separate.

## Confirmed

- TypeScript and Vite production build passed.
- 19 Node tests passed: authenticated metadata/permission transport, forged/slow clients, fragmented UTF-8, installer preservation/backups/concurrency, session bounds, stale turn isolation, disconnect cleanup, permission scope, seven read-only integration adapters and Store paths.
- Actual installed Codex 0.155.0-alpha.16.3 completed two chat turns with streaming and reset through the production client and a loopback provider, using isolated CODEX_HOME.
- The generated Windows hooks ran under actual Codex: SessionStart, UserPromptSubmit, Stop and SessionEnd.
- Actual Codex PermissionRequest was exercised with a harmless local fixture command. Allow executed it, Deny did not, and disconnect returned to Codex's normal approval RPC without automatically approving. Hook trust bypass existed only in the isolated reviewed fixture.
- Electron desktop test passed: horizontal 640 px overview, compact island, two chat turns, text attachment, PDF text and rendered page images, preferences, hook installation, independent observed sessions, actual authenticated relay approval via UI click and Esc collapse.
- An additional authenticated test used the user's existing ChatGPT login and read-only temporary project, without tools or file access. On 2026-10-01 at 12:39 UTC, the configured Codex returned “Orbit conectado.” This was a live model response, separate from the fixture tests.
- Independent reviews identified and corrected approval details, immutable request routing, renderer acknowledgement, stale turn completions, failed RPC runtime cleanup and temporary PDF cleanup.
- Release source scan passed: versions agree, original attribution retained, no private machine paths in source, no ignored upstream/fixtures/credentials in distribution source.

## Remaining operational validation

- Real integration accounts were not exercised. All seven adapter shapes and disabled-provider behavior were tested with fixtures; external API permissions/connectivity still depend on user configuration.
- Automated Electron screenshots and actions do not prove physical mouse click-through, Explorer OLE drag, mixed-DPI displays, monitor removal or accessibility in every Windows setup. These require device acceptance.
- The prior unsigned EXE was blocked by corporate Defender ASR rule 01443614-CD74-433A-B99E-2ECDC07BFC25. No Defender exclusion, bypass, trusted root installation or policy change was made.
- The new Store package must replace the old draft, including screenshots and privacy text. Local package generation does not mean Store certification/publication or installed-MSIX acceptance.
- Chat app-server approvals, VS Code hook approvals and observed session status are distinct mechanisms. Shared login does not give Orbit control of an arbitrary live VS Code RPC session.

The parity reference is Coucou Windows at the source commit in NOTICE.md. PARITY.md records platform differences and explicit attachment limits.
The packaged ASAR was also exercised through the development Electron runtime: chat, text/PDF attachments and approval UI passed. This validates archive contents, not corporate Defender acceptance or installed MSIX behavior.

Current 0.4.1 validation: 21 unit tests, TypeScript/Vite build and actual installed-Codex hook integration passed locally. Node discovery now resolves absolute PATH and standard installation directories without launching where.exe or using a startup timeout, and retries when preferences query hook status. New regression tests cover quoted paths, invalid candidates, missing PATH and standard installations. Local Electron launch is now blocked by corporate Defender ASR, including the development runtime; no exclusion or policy change was made. Fresh Windows CI desktop validation and Windows App Certification Kit results are pending. The earlier 0.4.0 Windows CI packaged desktop run passed (36865298048).
