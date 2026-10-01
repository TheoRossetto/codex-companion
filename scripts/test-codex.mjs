// Real Codex runtime + installed hooks + authenticated pipe; no hosted model.
// A loopback-only Responses fixture returns a fixed, tool-free assistant reply.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import installer from '../bridge/install.cjs';
import serverModule from '../bridge/server.cjs';
const executable = process.env.CODEX_EXECUTABLE || 'codex';
const base = path.join(process.cwd(), '.test-output', `codex-${Date.now()}`);
const codexHome = path.join(base, 'home');
const dir = path.join(base, 'orbit');
const cwd = path.join(base, 'project');
fs.mkdirSync(cwd, { recursive: true });
installer.apply(installer.preview({ codexHome, dir }));
const received = [];
const transport = await serverModule.startServer(dir, event => received.push(event));
let requests = 0;
const fixture = http.createServer((req, res) => {
  if (req.method !== 'POST' || !req.url.endsWith('/responses')) {
    res.writeHead(404).end(); return;
  }
  req.resume();
  req.on('end', () => {
    requests++;
    const item = { id: 'msg_orbit_fixture', type: 'message', role: 'assistant', status: 'completed',
      content: [{ type: 'output_text', text: 'Orbit runtime fixture complete.', annotations: [] }] };
    const response = { id: 'resp_orbit_fixture', object: 'response', status: 'completed',
      output: [item], usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 } };
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
    for (const event of [
      { type: 'response.created', response: { ...response, status: 'in_progress', output: [] } },
      { type: 'response.output_item.added', output_index: 0, item: { ...item, status: 'in_progress', content: [] } },
      { type: 'response.output_text.delta', item_id: item.id, output_index: 0, content_index: 0, delta: item.content[0].text },
      { type: 'response.output_item.done', output_index: 0, item },
      { type: 'response.completed', response },
    ]) res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
    res.end();
  });
});
await new Promise(resolve => fixture.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${fixture.address().port}/v1`;
const env = { ...process.env, CODEX_HOME: codexHome, ORBIT_DATA_DIR: dir, NO_PROXY: '127.0.0.1,localhost' };
for (const key of ['OPENAI_API_KEY', 'CODEX_API_KEY', 'OPENAI_BASE_URL', 'OPENAI_ORG_ID', 'OPENAI_PROJECT_ID']) delete env[key];
const args = ['exec', '--ephemeral', '--skip-git-repo-check', '--ignore-rules',
  '--dangerously-bypass-hook-trust', '--json', '-C', cwd, '-s', 'read-only',
  '-c', 'model_provider="orbit_fixture"', '-c', 'model="orbit-fixture"',
  '-c', `model_providers.orbit_fixture={name="Orbit local test fixture",base_url="${url}",wire_api="responses",requires_openai_auth=false}`,
  '-c', 'features.remote_plugin=false', '-c', 'features.plugins=false', '-c', 'features.apps=false',
  'Return the fixed fixture response. Do not invoke any tools.'];
let child, stdout = '', stderr = '', timer;
try {
  child = spawn(executable, args, { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', chunk => stdout += chunk);
  child.stderr.on('data', chunk => stderr += chunk);
  const exitCode = await new Promise((resolve, reject) => {
    timer = setTimeout(() => { child.kill(); reject(new Error('Codex runtime fixture timed out')); }, 45000);
    child.once('error', reject);
    child.once('exit', resolve);
  });
  await new Promise(resolve => setTimeout(resolve, 500));
  fs.writeFileSync(path.join(base, 'diagnostics.txt'), stderr);
  fs.writeFileSync(path.join(base, 'events.json'), JSON.stringify(received, null, 2));
  fs.writeFileSync(path.join(base, 'codex.jsonl'), stdout);
  assert.equal(exitCode, 0, `Codex exit ${exitCode}. Diagnostics: ${base}\n${stderr.slice(-2000)}`);
  assert.equal(requests, 1, 'Exactly one local fixture response, without hosted inference');
  for (const event of ['SessionStart', 'UserPromptSubmit', 'Stop']) {
    assert.ok(received.some(item => item.hook_event_name === event), `Missing real ${event}. Diagnostics: ${base}`);
  }
  console.log(`PASS: actual Codex runtime -> installed commandWindows hook -> authenticated pipe: ${received.map(e => e.hook_event_name).join(', ')}.`);
  console.log('One loopback fixture response; no hosted model or personal credentials. Artifacts:', base);
} finally {
  clearTimeout(timer);
  child?.kill();
  await transport.close();
  await new Promise(resolve => fixture.close(resolve));
}
