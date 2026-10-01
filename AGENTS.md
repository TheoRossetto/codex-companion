# Orbit for Codex

This repository is independent of any parent workspace. Do not modify the parent project to build, test or publish Orbit.

- Preserve the original Coucou attribution, MIT notice and provenance in NOTICE.md.
- Do not distribute upstream restricted assets, character drawings, sounds or branding.
- Do not include `.upstream`, `.test-output`, credentials, private paths or user hook files in commits or releases.
- Ordinary hooks are metadata-only. PermissionRequest may return only an authenticated explicit user decision for a live request; timeout/disconnect returns {}. Never bypass hook trust.
- Keep relay input/connection/time limits and metadata allowlists.
- Installation must preserve foreign hooks, preview changes and create a backup.
- Tests use isolated CODEX_HOME and ORBIT_DATA_DIR. Never use personal configs in automated tests.
- Increment package.json and lockfile versions together for each delivered feature/fix set.
- Run unit, build, desktop and installed-Codex integration tests; distinguish fixtures from live IDE validation.
- Commit/push/release only when authorized by the user.
