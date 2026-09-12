/* Build chain: concat src/*.js in filename order -> Terser -> (optional)
   Roadroller -> inline into the HTML shell -> zip (+advzip) -> report against
   13,312 bytes. `--test` exposes globalThis.__g for tools/smoke.js. */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { minify } from 'terser';

const BUDGET = 13312;
const args = process.argv.slice(2);
const useRR = args.includes('--roadroller');
const report = args.includes('--report');
const test = args.includes('--test');
const reopt = args.includes('--reopt');

const files = readdirSync('src').filter(f => f.endsWith('.js')).sort();
const parts = files.map(f => ({ f, src: readFileSync('src/' + f, 'utf8') }));
let source = parts.map(p => p.src).join('\n');
if (test) source += `
;globalThis.__g = { tick, render, menu, take, newGame, blink, set touch(v){touch=v}, set fire(v){fire=v}, get mech(){return mech}, get shards(){return shards},
  get st(){return st}, set st(v){st=v}, get P(){return P}, get en(){return en}, get kills(){return kills},
  get wave(){return wave}, get lvl(){return lvl}, get gry(){return gry}, get K(){return K}, get opts(){return opts}, get pu(){return pu}, get we(){return we}, set wave(v){wave=v}, spawn, set lit(v){lit=v} };`;

const min = await minify(source, {
  ecma: 2020,
  compress: { passes: 4, unsafe: true, unsafe_arrows: true, unsafe_math: true,
              unsafe_comps: true, unsafe_methods: true, booleans_as_integers: true,
              drop_console: true, pure_getters: true, toplevel: true },
  mangle: { toplevel: true },
  format: { comments: false }
});
if (min.error) { console.error(min.error); process.exit(1); }
let code = min.code;

if (useRR) {
  /* Parameters found by optimize(2) are frozen in tools/rr-params.json so the
     build is deterministic; --reopt runs the search again and prints the best
     set for freezing by hand. allowFreeVars needs no single-letter element ids
     (the canvas is `cv`). */
  const { Packer } = await import('roadroller');
  const pf = 'tools/rr-params.json';
  const RR = existsSync(pf) ? JSON.parse(readFileSync(pf, 'utf8')).options : {};
  const packer = new Packer([{ data: code, type: 'js', action: 'eval' }],
                            reopt ? { allowFreeVars: true } : { ...RR, allowFreeVars: true });
  if (reopt) { const r = await packer.optimize(2); console.log('  optimize(2) found', JSON.stringify(r.best)); }
  code = packer.makeDecoder().firstLine + packer.makeDecoder().secondLine;
}

mkdirSync('dist', { recursive: true });
const html = readFileSync('src/index.html', 'utf8').replace('/*GAME*/', () => code);
writeFileSync('dist/index.html', html);
if (/[^\x00-\x7f]/.test(html)) console.log('  WARNING: non-ASCII byte in dist/index.html; add <meta charset=utf-8> or fix the string');

let zipper = 'none';
try {
  execSync('cd dist && rm -f game.zip && zip -qX9 game.zip index.html');
  zipper = 'zip -9';
  try { execSync('advzip -z -4 -i 500 -q dist/game.zip'); zipper = 'advzip (zopfli)'; }
  catch { console.log('  (no advzip; brew install advancecomp for ~400 B less)'); }
} catch { console.log('  (no zip binary; install zip for a real size figure)'); }

writeFileSync('dist/game.min.js', min.code);
const raw = source.length, minified = code.length;
const zipped = existsSync('dist/game.zip') ? statSync('dist/game.zip').size : 0;
const pct = n => (n / BUDGET * 100).toFixed(1) + '%';

console.log('\n  OUT OF OFFICE build' + (useRR ? '  [roadroller]' : ''));
console.log('  ' + '-'.repeat(46));
if (report) {
  const total = parts.reduce((s, p) => s + p.src.length, 0);
  for (const p of parts)
    console.log('  ' + p.f.padEnd(20) + String(p.src.length).padStart(7) + ' B  ' +
                (p.src.length / total * 100).toFixed(1).padStart(5) + '%');
  console.log('  ' + '-'.repeat(46));
}
console.log('  source   ' + String(raw).padStart(7) + ' B');
console.log('  minified ' + String(minified).padStart(7) + ' B');
console.log('  zipped   ' + String(zipped).padStart(7) + ' B   ' + pct(zipped) + ' of 13,312');
console.log('  packed with ' + zipper);
console.log('  ' + (zipped <= BUDGET ? 'UNDER BUDGET by ' + (BUDGET - zipped) + ' B'
                                     : 'OVER BUDGET by ' + (zipped - BUDGET) + ' B') + '\n');
