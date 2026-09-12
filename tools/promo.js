/* Renders promo/promo_800x500.png and promo/promo_320x320.png from the packed
   --test build under node-canvas: a real horde frame behind the name in the
   game's own 3x5 font, the unicorn and the grey at poster size. */
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
const { uni, drab, moth, spit, shade } = g.spr(), HUES = g.HUES, FK = g.FK, FD = g.FD;
const C = (h, l = 60, s = 80, a = 1) => `hsla(${h | 0},${s}%,${l}%,${a})`;
/* the game's font, drawn onto any context */
function txt(x, s, px, py, c, sc = 1, al = 0, rb = -1) {
  s = s.toUpperCase(); const w = s.length * 4 * sc - sc;
  if (al == 1) px -= w / 2 | 0; else if (al == 2) px -= w;
  for (let i = 0; i < s.length; i++, px += 4 * sc) {
    const k = FK.indexOf(s[i]); if (k < 0) continue;
    x.fillStyle = rb >= 0 ? C(HUES[(rb + i) % 7], 65) : c;
    for (let j = 0; j < 3; j++) { const v = parseInt(FD[k * 3 + j], 32); for (let r = 0; r < 5; r++) if (v >> r & 1) x.fillRect(px + j * sc, py + r * sc, sc, sc); }
  }
}
const shadowed = (x, s, px, py, sc, al, rb, c) => { txt(x, s, px + sc, py + sc, C(0, 0, 0, .6), sc, al); txt(x, s, px, py, c || C(0, 100, 0), sc, al, rb); };
/* a real frame of the horde for the background */
g.menu(); g.fire = 1; g.wave = 6; g.P.hp = g.P.mhp = 3000;
for (let i = 0; i < 700; i++) { g.K.d = i % 400 < 200; g.K.a = !g.K.d; g.aimNearest(); g.tick(); if (g.st === 'perk') g.take(); }
g.world();                                        // the world only: no bars, no banner
const sprite = (x, s, px, py, sc) => { x.imageSmoothingEnabled = false; x.drawImage(s, px, py, s.width * sc, s.height * sc); };
mkdirSync('promo', { recursive: true });
function poster(w, h, tall) {
  const out = createCanvas(w, h), x = out.getContext('2d');
  x.imageSmoothingEnabled = false;
  const k = Math.max(w / 320, h / 180); x.drawImage(cv, (w - 320 * k) / 2, (h - 180 * k) / 2, 320 * k, 180 * k);   // the frame, covering
  x.fillStyle = 'rgba(10,8,22,.55)'; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 7; i++) { x.fillStyle = C(HUES[i], 55, 80, .09); x.fillRect(0, h * (i / 7), w, h / 7 + 1); }   // the bow, faint, behind everything
  if (!tall) {
    shadowed(x, 'OUT OF OFFICE', w / 2, 34, 8, 1, 0);
    txt(x, 'THE GREY IS COMING. STAY COLOURFUL.', w / 2, 98, C(0, 92, 0), 2, 1);
    sprite(x, uni(0), 96, 218, 12);                                                              // the unicorn, 12 x 7 at twelve times
    for (let i = 0; i < 7; i++) { x.fillStyle = C(HUES[i], 62, 90); x.fillRect(300 + i * 22, 262 - i * 3, 14, 14); }   // a volley fanning out
    for (let i = 0; i < 7; i++) { x.fillStyle = C(HUES[i], 62, 90, .35); x.fillRect(300 + i * 22 + 4, 266 - i * 3, 30, 6); }
    sprite(x, drab(0), 560, 250, 9); sprite(x, drab(1), 660, 300, 8); sprite(x, spit(0), 470, 330, 8); sprite(x, moth(0), 620, 180, 7); sprite(x, shade(0), 730, 220, 7);
    x.fillStyle = C(0, 0, 0); x.fillRect(480, 130, 190, 46); x.fillStyle = C(0, 8, 0); x.fillRect(484, 134, 182, 38);
    txt(x, 'CENSORED', 575, 143, C(0, 95, 0), 4, 1);
    txt(x, 'A JS13K GAME. 13 KB, NO ASSETS.', w / 2, h - 28, C(0, 70, 0), 2, 1);
  } else {
    sprite(x, uni(0), 76, 40, 12);
    for (let i = 0; i < 7; i++) { x.fillStyle = C(HUES[i], 62, 90); x.fillRect(236 + i * 9, 78 - i * 3, 6, 6); }
    sprite(x, drab(0), 18, 190, 6); sprite(x, moth(1), 250, 150, 5); sprite(x, shade(1), 262, 200, 5);
    shadowed(x, 'OUT OF', w / 2, 178, 6, 1, 0); shadowed(x, 'OFFICE', w / 2, 216, 6, 1, 3);
    txt(x, 'THE GREY IS COMING.', w / 2, 262, C(0, 92, 0), 1, 1);
    txt(x, 'STAY COLOURFUL.', w / 2, 272, C(0, 92, 0), 1, 1);
    txt(x, 'A JS13K GAME', w / 2, 300, C(0, 70, 0), 1, 1);
  }
  return out;
}
writeFileSync('promo/promo_800x500.png', poster(800, 500, 0).toBuffer('image/png')); console.log('  promo/promo_800x500.png');
writeFileSync('promo/promo_320x320.png', poster(320, 320, 1).toBuffer('image/png')); console.log('  promo/promo_320x320.png');
