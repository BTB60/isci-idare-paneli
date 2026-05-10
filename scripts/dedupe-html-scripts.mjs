import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const dup =
  /\s*<script src="config\.js"><\/script>\s*<script src="auth-backend\.js"><\/script>\s*<script src="data-layer\.js"><\/script>\s*<script src="config\.js"><\/script>\s*<script src="auth-backend\.js"><\/script>\s*<script src="data-layer\.js"><\/script>/g;

const once = `\n    <script src="config.js"></script>\n    <script src="auth-backend.js"></script>\n    <script src="data-layer.js"></script>`;

for (const f of fs.readdirSync(root)) {
  if (!f.endsWith('.html')) continue;
  const fp = path.join(root, f);
  let c = fs.readFileSync(fp, 'utf8');
  const orig = c;
  let prev;
  do {
    prev = c;
    c = c.replace(dup, once);
  } while (c !== prev);
  if (c !== orig) {
    fs.writeFileSync(fp, c);
    console.log('deduped', f);
  }
}
