import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import runtime from '../app/node-runtime.cjs';

test('Node discovery accepts quoted PATH with spaces and skips missing paths/directories', t => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-node-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const name = process.platform === 'win32' ? 'node.exe' : 'node';
  const bad = path.join(base, 'bad'), good = path.join(base, 'Node Runtime');
  fs.mkdirSync(path.join(bad, name), {recursive:true}); fs.mkdirSync(good);
  fs.writeFileSync(path.join(good, name), 'fixture');
  assert.equal(runtime.findNode({Path:[path.join(base,'missing'),bad,'"'+good+'"'].join(path.delimiter)}), path.join(good,name));
  assert.equal(runtime.findNode({PATH:'.'}), null);
});
test('Node discovery handles an Explorer PATH without Node using standard install locations', t => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-node-'));
  t.after(() => fs.rmSync(base, {recursive:true,force:true}));
  const dir = path.join(base, 'nodejs'), name = process.platform === 'win32' ? 'node.exe' : 'node';
  fs.mkdirSync(dir);fs.writeFileSync(path.join(dir,name),'fixture');
  assert.equal(runtime.findNode({ProgramFiles:base}),path.join(dir,name));
  assert.equal(runtime.findNode({}),null);
});
