const fs = require('fs');
const p = 'backend/db.json';
if (!fs.existsSync(p)) {
  console.log('No backend/db.json found, nothing to do.');
  process.exit(0);
}
const raw = fs.readFileSync(p, 'utf8');
let d;
try {
  d = JSON.parse(raw);
} catch (e) {
  console.error('Failed to parse JSON:', e.message);
  process.exit(1);
}
const before = Array.isArray(d.errors) ? d.errors.length : 0;
const sensitiveRe = /apiKey|token|secret|Authorization|apikey|access_token|auth_token|BEGIN PRIVATE/i;
const filtered = (d.errors || []).filter((e) => !sensitiveRe.test(JSON.stringify(e)));
d.errors = filtered;
fs.writeFileSync(p, JSON.stringify(d, null, 2));
console.log('errors before:', before, 'after:', filtered.length);
