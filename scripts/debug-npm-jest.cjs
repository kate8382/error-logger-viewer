const { spawnSync } = require('child_process');
const path = require('path');

console.log('=== debug-npm-jest START ===');
console.log('cwd:', process.cwd());
console.log('execPath:', process.execPath);
console.log('argv:', process.argv.slice(2));
const keys = Object.keys(process.env).filter(k => /npm|NODE|PATH|JEST|HOME|USER/i.test(k)).sort();
console.log('--- selected env vars ---');
keys.forEach(k => console.log(k + '=' + process.env[k]));
console.log('--- end env ---\n');

const jestBin = path.join(__dirname, '..', 'node_modules', 'jest', 'bin', 'jest.js');
const args = process.argv.slice(2);
console.log('Spawning:', process.execPath, jestBin, args.join(' '));
const res = spawnSync(process.execPath, [jestBin, ...args], { stdio: 'inherit', env: process.env });
console.log('Child exit code:', res.status);
console.log('=== debug-npm-jest END ===');
