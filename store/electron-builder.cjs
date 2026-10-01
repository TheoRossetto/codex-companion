// Public identity assigned by Partner Center. Must match the reservation exactly.
const pkg = require('../package.json');
module.exports = {
  ...pkg.build,
  directories: { output: 'release/store', buildResources: 'store' },
  win: { ...pkg.build.win, target: 'appx' },
  appx: {
    identityName: 'ThoRossetto.OrbitforCodex',
    publisher: 'CN=FDA162DF-9BCB-4964-A02A-BDC8644EB29F',
    publisherDisplayName: 'Théo Rossetto',
    applicationId: 'Orbit',
    displayName: 'Orbit for Codex',
    languages: ['pt-BR'],
    minVersion: '10.0.22000.0',
    maxVersionTested: '10.0.22000.0',
    customManifestPath: 'AppxManifest.xml',
    capabilities: ['runFullTrust', 'unvirtualizedResources'],
    backgroundColor: '#10192e',
    artifactName: 'Orbit-for-Codex-${version}-Store-x64.msix',
  },
};
