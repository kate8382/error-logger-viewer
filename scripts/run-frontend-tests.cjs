const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function findFiles(dir, results = []) {
  const entries = fs.readdirSync(dir);
  for (const name of entries) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      findFiles(p, results);
    } else if (st.isFile() && /\.test\.ts$/.test(name)) {
      results.push(p);
    }
  }
  return results;
}

const cwd = process.cwd();
const testDir = path.join(cwd, 'tests', 'ui');
console.log('DEBUG run-frontend-tests cwd=', cwd);
console.log('DEBUG run-frontend-tests testDir=', testDir);
if (!fs.existsSync(testDir)) {
  console.error('tests/ui not found');
  process.exit(1);
}
const files = findFiles(testDir);
if (files.length === 0) {
  console.error('No frontend test files found under tests/ui');
  process.exit(1);
}

console.log('Found %d test files', files.length);
const jestBin = path.join(__dirname, '..', 'node_modules', 'jest', 'bin', 'jest.js');
const args = ['--selectProjects', 'frontend', '--runInBand', '--runTestsByPath', ...files];
console.log('Spawning:', process.execPath, jestBin, args.join(' '));
const res = spawnSync(process.execPath, [jestBin, ...args], { stdio: 'inherit', env: process.env });
process.exit(res.status);
