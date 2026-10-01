// Backup/preview/merge approach adapted from Coucou windows/src-tauri/src/hooks.rs.
// Copyright (c) 2026 Louis Raillé. JavaScript/Codex implementation: TheoRossetto.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createHash, randomUUID } = require('node:crypto');
const { EVENTS, storageDir } = require('./protocol.cjs');
const MARKER = 'Orbit for Codex: local activity';
function home() { return process.env.CODEX_HOME || path.join(os.homedir(), '.codex'); }
function hash(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function read(file) { try { return fs.readFileSync(file); } catch (e) { if (e.code === 'ENOENT') return Buffer.alloc(0); throw e; } }
function parse(bytes) {
  const value = bytes.length ? JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, '')) : {};
  if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error('hooks.json must be a JSON object.');
  if (value.hooks !== undefined) {
    if (!value.hooks || Array.isArray(value.hooks) || typeof value.hooks !== 'object') throw new Error('Invalid hooks object.');
    for (const groups of Object.values(value.hooks)) {
      if (!Array.isArray(groups)) throw new Error('Invalid hook event list.');
      for (const group of groups) if (!group || !Array.isArray(group.hooks) || group.hooks.some(h => !h || typeof h !== 'object' || Array.isArray(h))) throw new Error('Invalid hook group.');
    }
  }
  return value;
}
function commands(nodePath, relayPath) {
  // Reject paths that shells would expand; no string-built user content executes.
  if ([nodePath, relayPath].some(p => /["'`$%\r\n]/.test(p))) throw new Error('Unsupported shell characters in installation path.');
  const n = nodePath.replace(/\\/g, '/');
  const r = relayPath.replace(/\\/g, '/');
  return { command: `"${n}" "${r}"`, commandWindows: `& '${n}' '${r}'` };
}
function owned(hook, cmd) {
  if (hook.type !== 'command' || hook.statusMessage !== MARKER || typeof hook.command !== 'string') return false;
  const old = /^"([^"]+)" "([^"]+)"$/.exec(hook.command);
  const current = /^"([^"]+)" "([^"]+)"$/.exec(cmd.command);
  if (!old || !current || old[2] !== current[2]) return false;
  try {
    // Exact relay identity survives a Node upgrade; both command forms must agree.
    const expected = commands(old[1], old[2]);
    return hook.command === expected.command && hook.commandWindows === expected.commandWindows;
  } catch { return false; }
}
function transform(current, cmd, install) {
  const value = structuredClone(current);
  value.hooks ||= {};
  for (const [event, groups] of Object.entries(value.hooks)) {
    value.hooks[event] = groups.flatMap(group => {
      if (!group.hooks.some(h => owned(h, cmd))) return [group];
      const hooks = group.hooks.filter(h => !owned(h, cmd));
      return hooks.length ? [{ ...group, hooks }] : [];
    });
    if (groups.length && !value.hooks[event].length) delete value.hooks[event];
  }
  if (install) for (const event of EVENTS) {
    (value.hooks[event] ||= []).push({ hooks: [{ type: 'command', ...cmd, timeout: event === 'PermissionRequest' ? 100 : 3, statusMessage: MARKER }] });
  }
  return value;
}
function preview({ install = true, codexHome = home(), dir = storageDir(), nodePath = process.execPath } = {}) {
  const file = path.join(codexHome, 'hooks.json');
  const bytes = read(file);
  const cmd = commands(nodePath, path.join(dir, 'bridge', 'relay.cjs'));
  const current = parse(bytes);
  const next = JSON.stringify(transform(current, cmd, install), null, 2) + '\n';
  return { file, before: bytes.toString('utf8'), after: next, fingerprint: hash(bytes), install, dir, nodePath,
    installed: EVENTS.every(event => current.hooks?.[event]?.some(group => group.hooks.some(h => owned(h, cmd)))) };
}
function apply(plan, sourceDir = __dirname) {
  // Recompute from trusted arguments, not renderer-provided file contents.
  const fresh = preview({ install: plan.install, codexHome: path.dirname(plan.file), dir: plan.dir, nodePath: plan.nodePath });
  if (fresh.fingerprint !== plan.fingerprint || fresh.after !== plan.after) throw new Error('Hooks changed since preview. Review again.');
  fs.mkdirSync(path.dirname(plan.file), { recursive: true });
  const lock = `${plan.file}.orbit.lock`;
  const lockFd = fs.openSync(lock, 'wx');
  let temp;
  try {
    const bytes = read(plan.file);
    if (hash(bytes) !== plan.fingerprint) throw new Error('Hooks changed since preview. Review again.');
    if (plan.install) {
      fs.mkdirSync(path.join(plan.dir, 'bridge'), { recursive: true, mode: 0o700 });
      for (const name of ['relay.cjs', 'protocol.cjs', 'permission.cjs']) fs.copyFileSync(path.join(sourceDir, name), path.join(plan.dir, 'bridge', name));
    }
    if (bytes.equals(Buffer.from(plan.after))) return { changed: false, backup: null };
    const backup = bytes.length ? `${plan.file}.orbit-backup-${randomUUID()}` : null;
    if (backup) fs.writeFileSync(backup, bytes, { flag: 'wx', mode: 0o600 });
    temp = `${plan.file}.orbit-${randomUUID()}.tmp`;
    fs.writeFileSync(temp, plan.after, { flag: 'wx', mode: 0o600 });
    if (hash(read(plan.file)) !== plan.fingerprint) throw new Error('Hooks changed while saving. No settings replaced.');
    fs.renameSync(temp, plan.file);
    temp = null;
    return { changed: true, backup };
  } finally {
    if (temp) fs.unlinkSync(temp);
    fs.closeSync(lockFd);
    fs.unlinkSync(lock);
  }
}
module.exports = { MARKER, commands, parse, transform, preview, apply };
