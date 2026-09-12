/* Headless smoke test: boots dist/index.html under node-canvas, plays a
   scripted minute and picks perks. Fails loudly. */
import { readFileSync } from 'fs';
import { createCanvas } from 'canvas';
const cv = createCanvas(320, 180);
global.document = { getElementById: () => cv, createElement: () => createCanvas(16, 16) };
global.window = {}; global.addEventListener = () => {}; global.requestAnimationFrame = () => {};
global.innerWidth = 1280; global.innerHeight = 720; global.localStorage = {};
cv.addEventListener = () => {}; cv.setPointerCapture = () => {}; cv.style = {};
cv.getBoundingClientRect = () => ({ left: 0, top: 0, width: 320, height: 180 });
const html = readFileSync('dist/index.html', 'utf8');
const code = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
(0, eval)(code);
const g = globalThis.__g;
if (!g) { console.error('  build was not made with --test'); process.exit(1); }
let fails = 0;
const ck = (n, c) => { console.log((c ? '  ok   ' : '  FAIL ') + n); if (!c) fails++; };
ck('boots to title', g.st === 'title');
g.render();
g.menu(); ck('a key starts a game', g.st === 'play');
g.fire = 1;                                     // hold to fire; the mouse follows the nearest thing each tick
let perks = 0, shot = 0, peak = 0; const rar = new Set(), kinds = new Set(), picks = new Set(), wells = new Set();
for (let i = 0; i < 5400 && g.st !== 'over'; i++) {
  g.K.d = i % 400 < 200; g.K.a = !g.K.d; g.K.w = i % 300 < 150; g.K.s = !g.K.w;   // wander
  if (i === 300) { g.wave = 6; g.P.hp = g.P.mhp = 3000; }   // skip ahead to a real horde; a tougher pilot, since the bot cannot dodge
  if (i % 200 == 0) g.blink();
  g.aimNearest(); g.tick(); peak = Math.max(peak, g.en.length); if (i % 30 === 0) { g.en.forEach(e => kinds.add(e.k)); g.pu.forEach(u => picks.add(u.k)); g.we.forEach(w => wells.add(w)); }
  if (i === 900) { g.render(); shot = 1; }
  if (g.st === 'perk') { g.opts.forEach(o => rar.add(o[2])); g.render(); perks++; g.take(); }
}
g.render();
ck('renders a frame mid-game', shot);
ck('the grey came', g.kills > 0);
ck('waves advanced', g.wave >= 2);
ck('a horde: over 200 on the field at once', peak > 200);
ck('perk rarities seen: ' + [...rar].sort().join(' '), rar.size >= 2);
ck('levelled up and took perks', perks > 0);
ck('some of the field went to ash', g.gry > 0);
ck('kinds seen: ' + [...kinds].sort().join(' '), kinds.size >= 4);
ck('inkwells opened: ' + wells.size, wells.size >= 3);
ck('pickups dropped: ' + [...picks].sort().join(' '), picks.size >= 3);
console.log('  peak enemies ' + peak);
console.log('  kills ' + g.kills + '  wave ' + g.wave + '  lvl ' + g.lvl + '  ash ' + g.gry.toFixed(2) + '  hp ' + g.P.hp + '  state ' + g.st);
console.log(fails ? '\n  ' + fails + ' FAILURES\n' : '\n  all checks passed\n');
process.exit(fails ? 1 : 0);
