const { spawnSync } = require('child_process');
const path = require('path');

function printEnv() {
  const keys = Object.keys(process.env).filter(k => /JEST|npm|NPM_|PATH|NODE|JEST_/i.test(k)).sort();
  console.log('=== ENV KEYS ===');
  keys.forEach(k => console.log(k + '=' + process.env[k]));
  console.log('=== END ENV ===\n');
}

function runJest() {
  console.log('Running local jest binary via node_modules...');
  const jestBin = path.join(__dirname, '..', 'node_modules', 'jest', 'bin', 'jest.js');
  const args = ['--selectProjects', 'frontend', '--listTests', '--debug'];
  const res = spawnSync(process.execPath, [jestBin, ...args], { stdio: 'inherit', env: process.env });
  console.log('jest exit code:', res.status);
}

console.log('Node:', process.version, 'execPath:', process.execPath);
printEnv();
runJest();
