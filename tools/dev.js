/* Writes dev.html: every module as its own <script> in load order, so
   breakpoints land in real files. Top-level let/const are shared across classic
   scripts, exactly like the concatenated build. */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
const files = readdirSync('src').filter(f => f.endsWith('.js')).sort();
const tags = files.map(f => `<script src="src/${f}"></script>`).join('\n');
writeFileSync('dev.html', readFileSync('src/index.html', 'utf8')
  .replace('<script>/*GAME*/</script>', tags)
  .replace('<title>OoO</title>', '<title>OoO [dev]</title>'));
console.log('dev.html written with ' + files.length + ' modules');
