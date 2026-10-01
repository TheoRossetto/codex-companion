import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import protocol from '../bridge/protocol.cjs';
import installer from '../bridge/install.cjs';
import serverModule from '../bridge/server.cjs';
test('Node upgrade replaces old exact relay handlers without duplication', () => {
  const relay = 'C:/local/Orbit/bridge/relay.cjs';
  const old = installer.commands('C:/node-old/node.exe', relay);
  const next = installer.commands('C:/node-new/node.exe', relay);
  const initial = installer.transform({}, old, true);
  const migrated = installer.transform(initial, next, true);
  for (const groups of Object.values(migrated.hooks)) {
    assert.equal(groups.length, 1);
    assert.equal(groups[0].hooks[0].command, next.command);
  }
  assert.deepEqual(installer.transform(initial, next, false).hooks, {});
});
test('authenticated UTF-8 event survives a split inside a multibyte character', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-unicode-'));
  const events = [];
  const server = await serverModule.startServer(dir, event => events.push(event));
  try {
    const key = fs.readFileSync(path.join(dir, 'transport.key'), 'utf8');
    await new Promise((resolve, reject) => {
      const socket = net.createConnection(protocol.pipeName(dir));
      socket.setEncoding('utf8');
      let data = '', sent = false;
      socket.on('error', reject); socket.on('close', resolve);
      socket.on('data', chunk => {
        if (sent) return;
        data += chunk;
        if (!data.includes('\n')) return;
        sent = true;
        const { nonce } = JSON.parse(data);
        const body = JSON.stringify({ hook_event_name: 'Stop', session_id: 'utf8', project: 'Pousada São João' });
        const frame = Buffer.from(JSON.stringify({ body, proof: protocol.sign(key, `${nonce}:${body}`) }) + '\n');
        const split = frame.indexOf(Buffer.from('ã')) + 1;
        socket.write(frame.subarray(0, split));
        setTimeout(() => socket.write(frame.subarray(split)), 20);
      });
    });
    assert.equal(events[0].project, 'Pousada São João');
  } finally { await server.close(); fs.rmSync(dir, { recursive: true, force: true }); }
});
test('slow unauthenticated client is disconnected by an absolute deadline', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-deadline-'));
  const server = await serverModule.startServer(dir, () => assert.fail('unexpected event'));
  try {
    const started = Date.now();
    await new Promise(resolve => {
      const socket = net.createConnection(protocol.pipeName(dir));
      socket.on('data', () => {}); socket.on('error', () => {});
      const timer = setInterval(() => socket.write(' '), 150);
      socket.on('close', () => { clearInterval(timer); resolve(); });
    });
    assert.ok(Date.now() - started < 2400);
  } finally { await server.close(); fs.rmSync(dir, { recursive: true, force: true }); }
});
