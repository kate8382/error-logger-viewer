const path = require('path');
const fs = require('fs');
// lightweight glob -> regexp converter for our simple patterns
function globToRegExp(glob) {
  let s = glob.replace(/\\/g, '/');
  s = s.replace(/\./g, '\\.');
  s = s.replace(/\*\*\//g, '(?:.*/)?');
  s = s.replace(/\*\*/g, '.*');
  s = s.replace(/\*/g, '[^/]*');
  return new RegExp('^' + s + '$');
}

const cfg = require(path.join(__dirname, '..', 'jest.config.cjs'));
const project = cfg.projects.find(p => p.displayName === 'frontend');
if (!project) {
  console.error('frontend project not found in jest.config.cjs');
  process.exit(1);
}
const rootDir = path.resolve(process.cwd());
const roots = project.roots.map(r => r.replace('<rootDir>', rootDir));
console.log('roots:', roots);
console.log('testMatch:', project.testMatch);

function walk(dir, files = []) {
  const entries = fs.readdirSync(dir);
  for (const name of entries) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, files);
    else files.push(p);
  }
  return files;
}

for (const r of roots) {
  if (!fs.existsSync(r)) {
    console.log('root does not exist:', r);
    continue;
  }
  const all = walk(r);
  console.log('files under', r, all.map(f => path.relative(rootDir, f)));
  for (const m of project.testMatch) {
    const mm = m.replace('**/', '**/');
    const re = globToRegExp(mm);
    const matched = all.filter(f => re.test(path.relative(r, f).replace(/\\/g, '/')));
    console.log('pattern', m, '->', matched.map(x => path.relative(rootDir, x)));
  }
}
