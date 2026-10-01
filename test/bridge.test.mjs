import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import protocol from '../bridge/protocol.cjs';
import serverModule from '../bridge/server.cjs';
import installer from '../bridge/install.cjs';
import sessionModule from '../app/sessions.cjs';
const { Sessions } = sessionModule;
const { startServer } = serverModule;
const { metadata, EVENTS, pipeName } = protocol;
const relay = fileURLToPath(new URL('../bridge/relay.cjs', import.meta.url));
function temp(t) { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-test-')); t.after(() => fs.rmSync(dir, { recursive: true, force: true })); return dir; }
function send(dir, value, raw = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [relay], { env: { ...process.env, ORBIT_DATA_DIR: dir }, windowsHide: true });
    let stdout = '', stderr = '';
    child.stdout.on('data', b => stdout += b); child.stderr.on('data', b => stderr += b);
    child.on('error', reject); child.on('close', code => resolve({ code, stdout, stderr }));
    child.stdin.on('error', () => {});
    child.stdin.end(raw ? value : JSON.stringify(value));
  });
}
const event = (name, session = 'session-a') => ({ hook_event_name: name, session_id: session, cwd: 'C:\\workspace\\hotel', tool_name: 'Bash' });
test('metadata drops secrets, commands, transcripts and control characters', () => {
  const result = metadata({ ...event('PreToolUse'), prompt: 'secret', tool_input: { command: 'secret' }, transcript_path: 'secret', cwd: 'C:\\users\\private\\hotel\n' });
  assert.deepEqual(result, { hook_event_name: 'PreToolUse', session_id: 'session-a', project: 'hotel', tool_name: 'Bash' });
  assert.equal(metadata(event('MadeUp')), null);
  assert.equal(metadata({ ...event('Stop'), session_id: '' }), null);
});
test('parallel sessions and expiring approval state', () => {
  const state = new Sessions();
  state.accept(event('PermissionRequest'), 100); state.accept(event('UserPromptSubmit', 'b'), 110);
  assert.deepEqual(state.snapshot(120).map(x => x.state), ['thinking', 'approval']);
  assert.equal(state.snapshot(130000).find(x => x.id === 'session-a').state, 'unknown');
  state.accept(event('Stop', 'b'), 140000);
  assert.equal(state.snapshot(140000)[0].state, 'finished');
  state.accept(event('Interrupt', 'b'), 140001);
  assert.equal(state.snapshot(140001)[0].state, 'interrupted');
  for (let i = 0; i < 70; i++) state.accept(event('SessionStart', `id-${i}`), 150000);
  assert.equal(state.snapshot(150001).length, 40);
});
test('real relay to authenticated pipe handles all supported events without private input', async t => {
  const dir = temp(t), received = [];
  const server = await startServer(dir, e => received.push(e));
  try {
    for (const name of EVENTS) assert.deepEqual(await send(dir, { ...event(name), prompt: 'do-not-send' }), { code: 0, stdout: '{}\n', stderr: '' });
    assert.equal(received.length, EVENTS.length);
    assert.equal(JSON.stringify(received).includes('do-not-send'), false);
  } finally { await server.close(); }
});
test('relay fails open for absent app, invalid JSON and excessive input', async t => {
  const dir = temp(t);
  for (const value of ['not-json', 'x'.repeat(1024 * 1024 + 1), JSON.stringify(event('Stop'))]) {
    const start = Date.now();
    assert.deepEqual(await send(dir, value, true), { code: 0, stdout: '{}\n', stderr: '' });
    assert.ok(Date.now() - start < 2500);
  }
});
test('forged client cannot inject events', async t => {
  const dir = temp(t), received = [];
  const server = await startServer(dir, e => received.push(e));
  try {
    await new Promise(resolve => {
      const socket = net.createConnection(pipeName(dir));
      socket.on('data', () => socket.write(JSON.stringify({ body: JSON.stringify(event('Stop')), proof: '0'.repeat(64) }) + '\n'));
      socket.on('close', resolve);
    });
    assert.equal(received.length, 0);
  } finally { await server.close(); }
});
test('installer preserves third-party hooks and is idempotent; uninstall preserves mixed siblings', t => {
  const dir = temp(t), codexHome = path.join(dir, 'codex'), dataDir = path.join(dir, 'data');
  fs.mkdirSync(codexHome);
  const foreign = { type: 'command', command: 'echo third-party' };
  const before = { description: 'mine', hooks: { Stop: [{ matcher: 'x', hooks: [foreign] }], CustomEvent: [{ hooks: [] }] } };
  const file = path.join(codexHome, 'hooks.json');
  fs.writeFileSync(file, JSON.stringify(before));
  const args = { codexHome, dir: dataDir };
  const result = installer.apply(installer.preview(args));
  assert.ok(result.backup);
  assert.deepEqual(JSON.parse(fs.readFileSync(result.backup)), before);
  assert.equal(installer.apply(installer.preview(args)).changed, false);
  const mixed = JSON.parse(fs.readFileSync(file));
  mixed.hooks.Stop[1].hooks.push(foreign);
  fs.writeFileSync(file, JSON.stringify(mixed));
  installer.apply(installer.preview({ ...args, install: false }));
  const after = JSON.parse(fs.readFileSync(file));
  assert.deepEqual(after.hooks.CustomEvent, before.hooks.CustomEvent);
  assert.equal(after.hooks.Stop.flatMap(g => g.hooks).length, 2);
  assert.ok(after.hooks.Stop.every(g => g.hooks.every(h => h.command === foreign.command)));
});
test('corrupt JSON and concurrent changes cannot replace settings', t => {
  const dir = temp(t), file = path.join(dir, 'hooks.json');
  const args = { codexHome: dir, dir: path.join(dir, 'data') };
  for (const value of ['{', '[]', '{"hooks":null}', '{"hooks":{"Stop":{}}}', '{"hooks":{"Stop":[{}]}}']) {
    fs.writeFileSync(file, value); assert.throws(() => installer.preview(args));
    assert.equal(fs.readFileSync(file, 'utf8'), value);
  }
  fs.writeFileSync(file, '{}'); const plan = installer.preview(args);
  fs.writeFileSync(file, '{"changed":true}');
  assert.throws(() => installer.apply(plan), /changed/);
  assert.equal(fs.readFileSync(file, 'utf8'), '{"changed":true}');
});
