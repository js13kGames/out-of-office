/* Plays whole games headlessly and reports how they went: a tool for checking
   that everything runs and for tuning the difficulty curve.
   Boots the packed --test build under node-canvas (no rendering), drives a bot
   that kites, sidesteps spit, keeps the mouse on the nearest thing, blinks when surrounded, chases
   pickups when it is safe and picks perks by a priority list, then prints a
   per-wave curve for each game and a summary across games.

     npm run sim                       # build, then 3 games of up to 5 minutes
     node tools/sim.js --games 5 --minutes 8 --seed 3
     node tools/sim.js --wave 10       # start at wave 10
     node tools/sim.js --policy random # random perks instead of the priority list
     node tools/sim.js --dif 2         # 0 easy, 1 normal, 2 hard
     node tools/sim.js --json          # machine-readable summary on the last line   */
import { readFileSync } from 'fs';
import { createCanvas } from 'canvas';
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i < 0 ? d : process.argv[i + 1] == null || process.argv[i + 1].startsWith('--') ? true : process.argv[i + 1]; };
const DIF = +arg('dif', 1), GAMES = +arg('games', 3), MIN = +arg('minutes', 5), SEED = +arg('seed', 1), WAVE0 = +arg('wave', 1), POLICY = arg('policy', 'smart'), JSONOUT = arg('json', false);

const cv = createCanvas(320, 180);
global.document = { getElementById: () => cv, createElement: () => createCanvas(16, 16) };
global.window = {}; global.addEventListener = () => {}; global.requestAnimationFrame = () => {};
global.innerWidth = 1280; global.innerHeight = 720; global.localStorage = {};
cv.addEventListener = () => {}; cv.setPointerCapture = () => {}; cv.style = {};
cv.getBoundingClientRect = () => ({ left: 0, top: 0, width: 320, height: 180 });
const html = readFileSync('dist/index.html', 'utf8');
(0, eval)(html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>')));
const g = globalThis.__g;
if (!g) { console.error('build with --test first (npm run sim does)'); process.exit(1); }

/* perks the bot wants, best first; anything else is taken in card order */
const WANT = ['PIERCING LIGHT', 'HARD LIGHT', 'HORN OF PLENTY', 'SUPERNUMERARY', 'THICK HIDE', 'SECOND WIND', 'MEADOW REGEN', 'GALLOP', 'FULL SPECTRUM', 'A FOAL', 'FROSTBITE', 'SURE FOOTED', 'LONG SHOT', 'PRISM HEART', 'END OF THE RAINBOW', 'A SNACK'];
const hyp = (a, b) => Math.sqrt(a * a + b * b);

function playOne(seed) {
  g.seed = seed; g.dif = DIF; g.newGame(); g.fire = 1;                // a fresh game whatever state the last one left
  if (WAVE0 > 1) g.wave = WAVE0;
  const P = () => g.P, curve = [], perks = [];
  let lastWave = g.wave, peak = 0, blinks = 0, hpLow = 100, inViewSum = 0, samples = 0;
  const limit = MIN * 3600;
  for (let i = 0; i < limit && g.st !== 'over'; i++) {
    if (g.st === 'perk') {                                       // pick a perk
      const names = g.opts.map(o => o[0]);
      let k = names.findIndex(n => WANT.includes(n)); if (POLICY === 'random' || k < 0) k = POLICY === 'random' ? Math.floor(Math.random() * 3) : 0;
      if (POLICY === 'smart' && k >= 0) k = names.map((n, j) => [WANT.indexOf(n) < 0 ? 99 : WANT.indexOf(n), j]).sort((a, b) => a[0] - b[0])[0][1];
      g.sel = k; perks.push(names[k]); g.take(); continue;
    }
    const p = P(), en = g.en;
    /* kite: away from everything close, weighted by closeness; towards the nearest pickup when nothing is near */
    let fx = 0, fy = 0, near = 0, close = 0;
    for (const e of en) { const dx = e.x - p.x, dy = e.y - p.y, d = hyp(dx, dy); if (d < 90) { const w = (90 - d) / 90; fx -= dx / (d || 1) * w * (e.r > 10 ? 3 : 1); fy -= dy / (d || 1) * w * (e.r > 10 ? 3 : 1); near++; if (d < e.r + 10) close++; } }
    if (near < 3) { let b = 0, bd = 200; for (const u of g.pu) { const d = hyp(u.x - p.x, u.y - p.y); if (d < bd && (u.k != 0 || p.hp < p.mhp * .8)) { bd = d; b = u; } } if (b) { fx += (b.x - p.x) / bd; fy += (b.y - p.y) / bd; } }
    for (const w of g.we) { const dx = w.x - p.x, dy = w.y - p.y, d = hyp(dx, dy); if (d < 40) { fx -= dx / d; fy -= dy / d; } }
    for (const b of g.eb) {                                        // sidestep spit that is heading this way
      const dx = p.x - b.x, dy = p.y - b.y, d = hyp(dx, dy); if (d > 60) continue;
      const along = (dx * b.vx + dy * b.vy) / (hyp(b.vx, b.vy) * d || 1); if (along < .7) continue;
      const w = 2 * (60 - d) / 60; fx += -b.vy / 1.7 * w * (dx * b.vy - dy * b.vx > 0 ? -1 : 1); fy += b.vx / 1.7 * w * (dx * b.vy - dy * b.vx > 0 ? -1 : 1);
    }
    if (p.x < 60) fx += 1; if (p.x > 2500) fx -= 1; if (p.y < 60) fy += 1; if (p.y > 1380) fy -= 1;   // off the walls
    g.K.d = fx > .2; g.K.a = fx < -.2; g.K.s = fy > .2; g.K.w = fy < -.2;
    if (close >= 4 && g.bc > 0) { g.blink(); blinks++; }
    g.aimNearest(); g.tick();
    peak = Math.max(peak, en.length); hpLow = Math.min(hpLow, p.hp / p.mhp);
    if (i % 60 == 0) { let v = 0; for (const e of en) if (Math.abs(e.x - p.x) < 170 && Math.abs(e.y - p.y) < 100) v++; inViewSum += v; samples++; }
    if (g.wave !== lastWave) { curve.push({ wave: g.wave, t: Math.round(g.tm / 60), hp: Math.round(p.hp), mhp: p.mhp, kills: g.kills, lvl: g.lvl, alive: en.length }); lastWave = g.wave; }
  }
  return { seed, over: g.st === 'over', t: Math.round(g.tm / 60), wave: g.wave, kills: g.kills, lvl: g.lvl, bosses: g.bossK, peak, blinks, hpLow: Math.round(hpLow * 100), avgInView: Math.round(inViewSum / (samples || 1)), ash: Math.round(g.gry * 100), perks, curve };
}

const results = [];
for (let n = 0; n < GAMES; n++) {
  const r = playOne(SEED + n); results.push(r);
  console.log(`\n  game ${n + 1}  seed ${r.seed}  ${r.over ? 'died' : 'survived the limit'} at ${fmt(r.t)}  wave ${r.wave}  kills ${r.kills}  level ${r.lvl}  bosses ${r.bosses}  peak alive ${r.peak}  avg in view ${r.avgInView}  lowest hp ${r.hpLow}%  blinks ${r.blinks}  ash ${r.ash}%`);
  console.log('    perks: ' + r.perks.join(', '));
  console.log('    wave   time    hp/max   kills  level  alive');
  for (const c of r.curve) console.log('    ' + String(c.wave).padStart(4) + '  ' + fmt(c.t).padStart(5) + '  ' + (c.hp + '/' + c.mhp).padStart(8) + '  ' + String(c.kills).padStart(5) + '  ' + String(c.lvl).padStart(5) + '  ' + String(c.alive).padStart(5));
}
const mean = k => Math.round(results.reduce((s, r) => s + r[k], 0) / results.length);
console.log(`\n  ${GAMES} games, ${POLICY} perks, difficulty ${['easy', 'normal', 'hard'][DIF]}, from wave ${WAVE0}, limit ${MIN} min`);
console.log(`  survival  mean ${fmt(mean('t'))}  min ${fmt(Math.min(...results.map(r => r.t)))}  max ${fmt(Math.max(...results.map(r => r.t)))}   ${results.filter(r => !r.over).length} reached the limit`);
console.log(`  wave      mean ${mean('wave')}   kills mean ${mean('kills')}   level mean ${mean('lvl')}   bosses mean ${mean('bosses')}   peak alive mean ${mean('peak')}   avg in view ${mean('avgInView')}`);
if (JSONOUT) console.log(JSON.stringify({ games: GAMES, policy: POLICY, wave0: WAVE0, minutes: MIN, results }));
function fmt(s) { return (s / 60 | 0) + ':' + (s % 60 < 10 ? '0' : '') + s % 60; }
