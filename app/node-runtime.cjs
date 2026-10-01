const fs = require('node:fs');
const path = require('node:path');

// Locate Node without starting a shell or a subprocess during application boot.
// Ignore relative PATH entries: hook commands must use a stable absolute runtime.
function findNode(env = process.env) {
  const value = key => Object.entries(env).find(([name]) => name.toLowerCase() === key.toLowerCase())?.[1] || '';
  const dirs = value('PATH').split(path.delimiter).map(p => p.trim().replace(/^"(.*)"$/, '$1'));
  for (const key of ['ProgramW6432', 'ProgramFiles', 'LOCALAPPDATA']) {
    const base = value(key);
    if (base) dirs.push(path.join(base, key === 'LOCALAPPDATA' ? 'Programs/nodejs' : 'nodejs'));
  }
  for (const dir of [...new Set(dirs)]) {
    if (!path.isAbsolute(dir)) continue;
    const candidate = path.join(dir, process.platform === 'win32' ? 'node.exe' : 'node');
    try { if (fs.statSync(candidate).isFile()) return candidate; } catch {}
  }
  return null;
}
module.exports = { findNode };
