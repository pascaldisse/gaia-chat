const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

const checks = [
  {
    name: 'GaiaScript artifacts are removed',
    run() {
      return !exists('chat.gaia') && !exists('build-chat.sh');
    }
  }
];

let failed = false;

for (const check of checks) {
  const ok = check.run();
  console.log(`${ok ? 'PASS' : 'FAIL'} ${check.name}`);
  if (!ok) failed = true;
}

if (failed) {
  process.exitCode = 1;
}
