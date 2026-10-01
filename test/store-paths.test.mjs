import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { validateStorePaths } = createRequire(import.meta.url)('../app/store-paths.cjs');
const defaults = {
  home: 'C:\\Users\\Example', localAppData: 'C:\\Users\\Example\\AppData\\Local',
  roamingAppData: 'C:\\Users\\Example\\AppData\\Roaming',
  codexHome: 'C:\\Users\\Example\\.codex', dir: 'C:\\Users\\Example\\AppData\\Local\\OrbitForCodex',
};
test('Store paths allow default external bridge and reject virtualized custom destinations', () => {
  assert.doesNotThrow(() => validateStorePaths(defaults));
  assert.doesNotThrow(() => validateStorePaths({ ...defaults, codexHome: 'D:\\Codex', dir: 'D:\\Orbit' }));
  for (const codexHome of [defaults.roamingAppData + '\\.codex', defaults.dir + '-other', defaults.dir + '\\..\\Other']) {
    assert.throws(() => validateStorePaths({ ...defaults, codexHome }), /CODEX_HOME/);
  }
  assert.throws(() => validateStorePaths({ ...defaults, dir: defaults.roamingAppData + '\\Orbit' }), /ORBIT_DATA_DIR/);
  assert.doesNotThrow(() => validateStorePaths({ ...defaults, dir: defaults.dir.toUpperCase() }));
});
