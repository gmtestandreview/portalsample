try {
  const mod = require('./ClientApp/src/components/forms/WizardForm/errorState.ts');
  process.stdout.write(`Import succeeded: ${JSON.stringify(Object.keys(mod))}\n`);
} catch (e) {
  process.stdout.write(`Import failed: ${e.message}\n`);
}
