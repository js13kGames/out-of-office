/* Renders dist/title.png, dist/late.png and dist/zoo.png from a --test build under node-canvas. */
import { readFileSync, writeFileSync } from 'fs';
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
for (let i = 0; i < 40; i++) g.tick(); g.render(); writeFileSync('dist/title.png', cv.toBuffer('image/png'));
/* the zoo: every kind and every pickup in one view */
g.menu(); g.touch = 1; g.fire = 1;
for (let i = 0; i < 90; i++) g.tick();
g.en.length = 0; g.pu.length = 0;
const p = g.P;
[[0, -60, -40], [1, -30, -50], [2, 20, -50], [4, 60, -40], [5, -70, 0], [6, 70, 0], [7, -50, 40], [3, 30, 40], [8, -10, 55]].forEach(([k, x, y]) => g.spawn(k, p.x + x, p.y + y));
for (let k = 0; k < 14; k++) g.pu.push({ x: p.x - 66 + k * 11, y: p.y + 20, k, t: 0 });
p.fo.push({ x: p.x, y: p.y }); p.band = 1; p.map = 1; g.we.push({ x: p.x + 110, y: p.y - 30, hp: 40, mh: 60, t: 0, hit: 0 });
for (let i = 0; i < 3; i++) g.tick();
g.render(); writeFileSync('dist/zoo.png', cv.toBuffer('image/png'));
/* a late frame: the horde */
g.wave = 6;
for (let i = 0; i < 900 && g.st !== 'over'; i++) { g.K.d = i % 400 < 200; g.K.a = !g.K.d; g.K.w = i % 300 < 150; g.K.s = !g.K.w; g.tick(); if (g.st === 'perk') g.take(); }
g.render(); writeFileSync('dist/late.png', cv.toBuffer('image/png'));
console.log('en', g.en.length, 'wave', g.wave, 'st', g.st);
