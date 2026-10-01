// Metadata-only transport. Never forward prompt, tool_input, response or transcript.
const { createHash, createHmac, timingSafeEqual } = require('node:crypto');
const { homedir } = require('node:os');
const path = require('node:path');
const EVENTS = ['SessionStart', 'SessionEnd', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'PermissionRequest', 'Stop', 'Interrupt', 'SubagentStart', 'SubagentStop'];
const LIMIT = 8192;
function clean(value, max = 120) {
  return typeof value === 'string' ? value.replace(/[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/g, '').slice(0, max) : '';
}
function metadata(raw) {
  if (!raw || typeof raw !== 'object' || !EVENTS.includes(raw.hook_event_name)) return null;
  const session = clean(raw.session_id);
  if (!session) return null;
  const cwd = clean(raw.cwd, 2048).replace(/[\\/]+$/, '');
  return {
    hook_event_name: raw.hook_event_name, session_id: session,
    project: clean(raw.project || cwd.split(/[\\/]/).pop() || 'Codex'),
    tool_name: clean(raw.tool_name, 80),
  };
}
function storageDir() {
  return process.env.ORBIT_DATA_DIR || path.join(process.env.LOCALAPPDATA || path.join(homedir(), '.local', 'share'), 'OrbitForCodex');
}
function pipeName(dir = storageDir()) {
  const id = createHash('sha256').update(path.resolve(dir)).digest('hex').slice(0, 24);
  return process.platform === 'win32' ? `\\\\.\\pipe\\orbit-codex-${id}` : path.join(require('node:os').tmpdir(), `orbit-codex-${id}.sock`);
}
function sign(key, text) { return createHmac('sha256', key).update(text).digest('hex'); }
function verify(key, text, signature) {
  if (typeof signature !== 'string' || !/^[a-f0-9]{64}$/.test(signature)) return false;
  return timingSafeEqual(Buffer.from(sign(key, text), 'hex'), Buffer.from(signature, 'hex'));
}
module.exports = { EVENTS, LIMIT, metadata, storageDir, pipeName, sign, verify };
