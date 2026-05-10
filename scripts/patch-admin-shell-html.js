const fs = require('fs');
const path = require('path');

const files = [
  'dashboard.html',
  'workers.html',
  'attendance.html',
  'performance.html',
  'projects.html',
  'tasks.html',
  'overtime.html',
  'advances.html',
  'salary.html',
  'penalties.html',
  'targets.html',
  'permissions.html',
  'shift-change.html',
  'documents.html',
  'safety.html',
  'notifications.html',
  'reports.html'
];

const re = /<aside class="sidebar" id="sidebar">[\s\S]*?<\/aside>/;
const asideNew = '<aside class="sidebar" id="sidebar" aria-label="Əsas menyu"></aside>';

const root = path.join(__dirname, '..');

for (const f of files) {
  const p = path.join(root, f);
  let s = fs.readFileSync(p, 'utf8');
  if (!re.test(s)) {
    console.error('NO MATCH', f);
    continue;
  }
  s = s.replace(re, asideNew);
  if (!s.includes('admin-shell.js')) {
    const n = s.replace(
      /(\n)(\s*)<script src="app\.js"><\/script>/,
      '$1$2<script src="admin-shell.js"></script>$1$2<script src="app.js"></script>'
    );
    if (n === s) {
      console.error('NO APP.JS LINE', f);
      continue;
    }
    s = n;
  }
  fs.writeFileSync(p, s);
  console.log('OK', f);
}
