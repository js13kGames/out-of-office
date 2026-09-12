/* Renders the README screenshots: boots the packed artifact under node-canvas,
   stages six moments, and writes each 320x180 frame to screenshots/ at 3x
   nearest-neighbour. Build with --test first (npm run shots does). */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { createCanvas } from 'canvas';
const cv = createCanvas(320, 180);
global.document = { getElementById: () => cv, createElement: () => createCanvas(16, 16) };
global.window = {}; global.addEventListener = () => {}; global.requestAnimationFrame = () => {};
global.innerWidth = 1280; global.innerHeight = 720; global.localStorage = {};
cv.addEventListener = () => {}; cv.setPointerCapture = () => {}; cv.style = {};
cv.getBoundingClientRect = () => ({ left: 0, top: 0, width: 320, height: 180 });
const html = readFileSync('dist/index.html', 'utf8');
(0, eval)(html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>')));
const g = globalThis.__g; g.lit = 1;
mkdirSync('screenshots', { recursive: true });
const SCALE = 3;
const shot = name => {
  g.render();
  const out = createCanvas(320 * SCALE, 180 * SCALE), x = out.getContext('2d');
  x.imageSmoothingEnabled = false; x.drawImage(cv, 0, 0, out.width, out.height);
  writeFileSync('screenshots/' + name + '.png', out.toBuffer('image/png')); console.log('  screenshots/' + name + '.png');
};
const run = (n, f) => { for (let i = 0; i < n; i++) { if (f) f(i); g.aimNearest(); g.tick(); if (g.st === 'perk') g.take(); } };
/* the title */
run(40); shot('title');
/* the zoo: every kind and every pickup in one view */
g.menu(); g.fire = 1; run(90);
g.en.length = 0; g.pu.length = 0;
const p = g.P;
[[0, -60, -40], [1, -30, -50], [2, 20, -50], [4, 60, -40], [5, -70, 0], [6, 70, 0], [7, -50, 40], [3, 30, 40], [8, -10, 55]].forEach(([k, x, y]) => g.spawn(k, p.x + x, p.y + y));
for (let k = 0; k < 14; k++) g.pu.push({ x: p.x - 72 + k * 11, y: p.y + 20, k, t: 0 });
p.fo.push({ x: p.x, y: p.y }); p.band = 1; g.we.push({ x: p.x + 110, y: p.y - 30, hp: 40, mh: 60, t: 0, hit: 0 });
run(3); shot('zoo');
/* the office: every boss at once, and nothing else on the field */
g.en.length = 0; g.pu.length = 0; g.we.length = 0; p.fo.length = 0; p.band = 0; p.hp = p.mhp = 9000;
[[12, 150, -10], [9, -90, -50], [10, 60, -65], [11, 10, 65], [3, -100, 35], [8, 100, 70]].forEach(([k, x, y]) => g.spawn(k, p.x + x, p.y + y));
run(130, () => { const b = g.en.filter(e => e.k == 3 || e.k >= 8); g.en.length = 0; g.en.push(...b); }); g.fx.length = 0; for (let i = 0; i < 130; i++) g.render(); shot('bosses');   // the banner counts down per frame
/* the horde, a minute into wave 6 */
g.newGame(); g.fire = 1; g.wave = 6; g.P.hp = g.P.mhp = 3000;
run(900, i => { g.K.d = i % 400 < 200; g.K.a = !g.K.d; g.K.w = i % 300 < 150; g.K.s = !g.K.w; }); shot('horde');
/* the perk screen */
g.K.d = g.K.a = g.K.w = g.K.s = 0; g.tick(); if (g.st !== 'perk') { g.xp = 1e9; g.tick(); }
shot('perk');
/* game over */
g.take(); g.P.hp = 1; g.P.inv = 0; g.P.wind = 0;
run(400, () => { if (g.st === 'play' && g.P.hp > 0) g.P.hp = 1; }); shot('over');
console.log('  wave', g.wave, 'state', g.st);
