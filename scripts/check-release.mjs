import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const pkg = JSON.parse(fs.readFileSync('package.json'));
const lock = JSON.parse(fs.readFileSync('package-lock.json'));
assert.equal(pkg.version, lock.version);
assert.equal(pkg.version, lock.packages[''].version);
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' }).trim().split(/\r?\n/);
assert.ok(files.length > 10);
for (const file of files) {
  assert.ok(!/(^|\/)(\.upstream|\.test-output|node_modules|release|\.env[^/]*)(\/|$)/.test(file), `Forbidden file: ${file}`);
  if (/\.(mjs|cjs|ts|json|md|html|css)$/.test(file)) {
    const text = fs.readFileSync(file, 'utf8');
    assert.ok(!(/C:[\\/]+Users[\\/]+[A-Z][0-9]{4,}/i.test(text)), `Private machine path: ${file}`);
    assert.ok(!text.includes('\uFFFD'), `Invalid Unicode: ${file}`);
  }
}
assert.ok(fs.readFileSync('LICENSE', 'utf8').includes('Louis Raillé'));
const artifact = path.join('release', `Orbit-for-Codex-${pkg.version}-Windows-x64.exe`);
if (!process.argv.includes('--source-only')) assert.ok(fs.statSync(artifact).size > 1024 * 1024);
console.log(`Release ${pkg.version}: ${files.length} source files checked; source validation passed; attribution, versions and exclusions passed.`);
