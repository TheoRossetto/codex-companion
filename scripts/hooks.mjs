import installer from '../bridge/install.cjs';
const plan = installer.preview({ install: !process.argv.includes('--uninstall') });
console.log(`File: ${plan.file}\nBefore:\n${plan.before || '(absent)'}\nAfter:\n${plan.after}`);
if (process.argv.includes('--apply')) {
  console.log(installer.apply(plan));
  console.log('Review/trust hooks in Codex /hooks, then restart the VS Code conversation.');
} else console.log('Preview only. Add --apply to save; --uninstall --apply removes Orbit hooks.');
