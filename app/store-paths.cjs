const path = require('node:path').win32;
function within(parent, child) {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith('..\\'));
}
function validateStorePaths({ home, localAppData, roamingAppData, codexHome, dir }) {
  const allowed = path.join(localAppData, 'OrbitForCodex');
  const appDataRoots = [path.join(home, 'AppData'), localAppData, roamingAppData].filter(Boolean);
  for (const [label, value] of [['CODEX_HOME', codexHome], ['ORBIT_DATA_DIR', dir]]) {
    if (appDataRoots.some(root => within(root, value)) && !within(allowed, value)) {
      throw new Error(`${label}: a versão Store não pode compartilhar esta pasta em AppData. Use o local padrão ou uma pasta fora de AppData e reabra o Orbit.`);
    }
  }
}
module.exports = { validateStorePaths };
