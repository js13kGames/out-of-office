/* ---------- first person ------------------------------------------
   Everything the 2D game simulates in pixels on a flat world is drawn here in
   metres on a flat floor: x stays x, the 2D y becomes 3D z, and S pixels make
   a metre. The eye rides 1.6 m above the unicorn's feet. Only three things
   change in the game itself, all in this file: the player step (movement is
   camera-relative and the aim is the yaw), the loop, and the drawing.     */
const S = 16, EYE = 1.6;
const cssRgb = c => {                                 // the game hands out hsla strings; cache the parse on the object that owns it
  const m = /hsla\(([\d.]+),([\d.]+)%,([\d.]+)%,([\d.]+)\)/.exec(c); return m ? [...rgb(+m[1], m[2] / 100, m[3] / 100), +m[4]] : [1, 1, 1, 1];
};
const band = (i, l = .6) => rgb(HUES[i % 7], .85, l);

/* ---------- shaders: vertex colours, fog on the world, additive glow, and a view-space one for the horn */
const WORLD_VS = `attribute vec4 aVertexPosition;attribute vec4 aVertexColor;uniform mat4 uModelViewMatrix,uProjectionMatrix,uCameraMatrix;varying vec4 vColor;varying float vFog;
void main(){vec4 v=uCameraMatrix*uModelViewMatrix*aVertexPosition;gl_Position=uProjectionMatrix*v;vColor=aVertexColor;vFog=clamp(1.0-(-v.z-12.0)/90.0,0.0,1.0);}`;
const WORLD_FS = `precision mediump float;varying vec4 vColor;varying float vFog;uniform float factor;
void main(){gl_FragColor=vec4(mix(vec3(0.07,0.06,0.13),vColor.rgb*factor,vFog),vColor.a);}`;
const GLOW_VS = `attribute vec4 aVertexPosition;attribute vec4 aVertexColor;uniform mat4 uModelViewMatrix,uProjectionMatrix,uCameraMatrix;varying vec4 vColor;varying float vFade;
void main(){vec4 v=uCameraMatrix*uModelViewMatrix*aVertexPosition;gl_Position=uProjectionMatrix*v;vColor=aVertexColor;vFade=clamp(1.0-(-v.z-20.0)/80.0,0.0,1.0);}`;
const GLOW_FS = `precision mediump float;varying vec4 vColor;varying float vFade;uniform float factor;
void main(){gl_FragColor=vec4(vColor.rgb*factor,vColor.a*vFade);}`;
const VIEW_VS = `attribute vec4 aVertexPosition;attribute vec4 aVertexColor;uniform mat4 uModelViewMatrix,uProjectionMatrix;varying vec4 vColor;
void main(){gl_Position=uProjectionMatrix*uModelViewMatrix*aVertexPosition;vColor=aVertexColor;}`;
const VIEW_FS = `precision mediump float;varying vec4 vColor;uniform float factor;void main(){gl_FragColor=vec4(vColor.rgb*factor,vColor.a);}`;

/* ---------- the scene */
const cam = new Camera({ fov: 74 * PI / 180, near: .05, far: 400 });
const eng = new Engine({ canvas3D: document.getElementById('c3'), canvas2D: document.createElement('canvas'), camera: cam, frameTime: 1000 / 60, clearColor: [.07, .06, .13, 1] });
const ground = eng.add(new Mesh({ vs: WORLD_VS, fs: WORLD_FS, dynamic: true, noCull: true, builder: new MeshBuilder(65000) }));
const actors = eng.add(new Mesh({ vs: WORLD_VS, fs: WORLD_FS, dynamic: true, noCull: true, builder: new MeshBuilder(65000) }));
const glow = eng.add(new Mesh({ vs: GLOW_VS, fs: GLOW_FS, dynamic: true, additive: true, noCull: true, builder: new MeshBuilder(40000) }));
const view = eng.add(new Mesh({ vs: VIEW_VS, fs: VIEW_FS, dynamic: true, clearDepth: true, builder: new MeshBuilder(4000) }));
const look = new PointerLook(document.body); look.init();
let yaw = -PI / 2, pitch = 0;                          // yaw -PI/2 faces +x, the 2D game's angle 0
const anOf = () => -yaw - PI / 2;                     // the camera's yaw as the game's aim angle, and back
look.onLockChange = on => { if (!on && st == 'play') paused = 1; };
CV.addEventListener('pointerdown', () => { if (st == 'play') look.request(); });
document.addEventListener('mousedown', e => { if (look.locked && e.button == 2) blink(); });

/* ---------- the player step: the same as the game's, except that WASD is
   relative to where you look and the aim is where you look */
function stepPlayer() {
  const p = P;
  const [mdx, mdy] = look.consume(); yaw -= mdx * .0022; pitch = clamp(pitch - mdy * .0022, -1.3, 1.3);
  p.an = anOf();
  const fx0 = cos(p.an), fy0 = sin(p.an), rx = -fy0, ry = fx0;
  let dx = 0, dy = 0;
  if (K.w || K.arrowup) { dx += fx0; dy += fy0; } if (K.s || K.arrowdown) { dx -= fx0; dy -= fy0; }
  if (K.d || K.arrowright) { dx += rx; dy += ry; } if (K.a || K.arrowleft) { dx -= rx; dy -= ry; }
  let d = hyp(dx, dy); if (d > 1) { dx /= d; dy /= d; d = 1; }
  const grey = sat[cell(p.x, p.y)] < .3, sp = p.spd * (grey && !p.sure ? .5 : 1), ox = p.x, oy = p.y;
  p.x = clamp(p.x + dx * sp, 6, WW - 6); p.y = clamp(p.y + dy * sp, 6, WH - 6);
  if (d) {
    p.t++; p.dx = dx; p.dy = dy;
    if (p.glit) paint(p.x, p.y, 0, .03);
    const n = cell(p.x, p.y); if (fl[n]) { if (fg[n] > .7) for (let i = 0; i < 3; i++) fx.push({ x: p.x, y: p.y, vx: rs() * 2 - 1, vy: rs() * 2 - 1, l: 14, c: C(HUES[(fl[n] >> 2) % 7], 65) }); fg[n] = 0; }
    if (t % 5 == 0) fx.push({ x: ox - dx * 6, y: oy - dy * 6 + 3, vx: -dx * .3, vy: -dy * .3, l: 12, c: C(40, 70, 30, .5) });
    if (p.comet && t % 2 == 0) bu.push({ x: ox, y: oy, vx: 0, vy: 0, d: .4, c: HUES[t / 2 % 7 | 0], l: 40, k: 0, b: 1, p: 99 });
  } else p.dx = fx0, p.dy = fy0;                     // a blink while standing still goes where you look
  if (look.locked) fire = look.firing;
  if (cool > 0) cool--;
  else if (fire) { volley(); cool = WP[wep][1] * p.rate * (rush ? .5 : 1) * (mech ? .3 : 1); }
  if (mech) p.inv = Math.max(p.inv, 41);
  if (bc < 3 && !bl) { bc++; bl = 150 * p.blk | 0; }
  if (p.inv) p.inv--;
  if (p.regen && !grey && p.hp < p.mhp && t % 60 == 0) p.hp++;
  if (p.band) en.forEach(e => { if (hyp(e.x - p.x, e.y - p.y) < 34) e.slow = 2; });
  p.fo.forEach((f, i) => {
    const an = p.an + PI + (i - (p.fo.length - 1) / 2) * .9;
    f.x += (p.x + 13 * cos(an) - f.x) * .08; f.y += (p.y + 13 * sin(an) - f.y) * .08;
    const e = nearest(f.x, f.y);
    if (e && (t + i * 18) % 36 == 0) { const a = atan2(e.y - f.y, e.x - f.x); for (let b = 0; b < 7; b += 2) shot(f.x, f.y, a + (b - 3) * .05, 2.2 + b * .2, 1, HUES[b], 45, 0); }
  });
}

/* ---------- the loop: the game's tick, verbatim but for the mouse pin */
function tick() {
  t++; mx = W / 2; my = H / 2;                        // the reticle sits at the centre
  if (st != 'play' || paused) return;
  if (hstop) return hstop--;
  tm++; if (frz) frz--; if (rush) rush--; if (flash) flash--; if (bl) bl--; if (mech) mech--;
  if (!dead) { stepPlayer(); stepWaves(); }
  stepWells();
  camX += (clamp(P.x - W / 2, -48, WW - W + 48) - camX) * .12; camY += (clamp(P.y - H / 2, -48, WH - H + 48) - camY) * .12;
  stepEnemies(); stepBullets(); stepPickups();
  fx = fx.filter(f => { f.x += f.vx; f.y += f.vy; return --f.l > 0; });
  if (t % 30 == 0) {
    let g = 0;
    for (let y = 0; y < 36; y++) for (let x = 0; x < 64; x++) { const v = sat[x * 5 + y * 5 * GW], a = v < .3; g += a; MMX.fillStyle = a ? C(0, 8, 0) : C(110, 22 + 14 * v, 45); MMX.fillRect(x, y, 1, 1); }
    gry = g / 2304;
    ACH.forEach((a, i) => { if (!(ach >> i & 1) && a[1]()) { ach |= 1 << i; try { localStorage.OOO_ach = ach; } catch (e) {} say('UNLOCKED: ' + a[0], 180); snd(1000, .4, 'triangle', .05, 2000); } });
  }
  if (dead && t - stT > 90) { st = 'over'; stT = t; look.release(); if (kills > best) { best = kills; try { localStorage.OOO_best = best; } catch (e) {} } }
  if (st == 'perk' || st == 'over') look.release();
  if (shake) shake--;
}
const stWas = () => { if (st == 'perk') look.release(); };   // the cards want a real mouse
eng.onUpdate = () => { music(); tick(); stWas(); };

/* ---------- drawing */
const px = () => (P.x || WW / 2) / S, pz = () => (P.y || WH / 2) / S;
function buildGround(mb) {
  const cx = P.x / S | 0, cz = P.y / S | 0;
  const x0 = Math.max(0, (P.x / 8 | 0) - 40), x1 = Math.min(GW, x0 + 80), y0 = Math.max(0, (P.y / 8 | 0) - 40), y1 = Math.min(GH, y0 + 80);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const i = x + y * GW, s = sat[i], chk = (x + y) & 1;
    const c = s < .3 ? [.11 + chk * .03 + s * .1, .11 + chk * .03 + s * .1, .13 + chk * .03 + s * .1] : rgb(fh[i], .55 * s + .04, .2 + chk * .03 + .18 * s);
    const X0 = x / 2, Z0 = y / 2;
    mb.quad([X0, 0, Z0], [X0, 0, Z0 + .5], [X0 + .5, 0, Z0 + .5], [X0 + .5, 0, Z0], c);
  }
  /* the flowers near you are little models: a stem, and a head that opens as the cell's colour lets it */
  for (let y = Math.max(0, (P.y / 8 | 0) - 8); y < Math.min(GH, (P.y / 8 | 0) + 8); y++) for (let x = Math.max(0, (P.x / 8 | 0) - 8); x < Math.min(GW, (P.x / 8 | 0) + 8); x++) {
    const i = x + y * GW, q = fl[i]; if (!q) continue;
    const s = sat[i], g = fg[i] += (s - fg[i]) * .035, fx0 = x / 2 + .12 + (q >> 2 & 3) * .08, fz0 = y / 2 + .12 + (q >> 4 & 3) * .08, sway = sin(t * .05 + x + y) * .08;
    const fs = .3 + .4 * g;
    stamp(mb, MODELS.stem, fx0, 0, fz0, sway, fs);
    if (g > .4) stamp(mb, MODELS.heads[(q & 3) % 3], fx0, 0, fz0, sway + t * .01, fs, rgb(HUES[(q >> 2) % 7], .85 * s + .05, .45 + .2 * s));
  }
  /* the pit: four walls leaning away, a bright rim on top */
  const w = WW / S, d = WH / S, hgt = 5, lean = 2, lo = [.13, .11, .2], hi = [.32, .28, .45], rim = [.5, .45, .7];
  mb.quad([0, 0, 0], [w, 0, 0], [w, hgt, -lean], [0, hgt, -lean], lo, lo, hi, hi);
  mb.quad([0, 0, d], [0, hgt, d + lean], [w, hgt, d + lean], [w, 0, d], lo, hi, hi, lo);
  mb.quad([0, 0, 0], [0, 0, d], [-lean, hgt, d], [-lean, hgt, 0], lo, lo, hi, hi);
  mb.quad([w, 0, 0], [w + lean, hgt, 0], [w + lean, hgt, d], [w, 0, d], lo, hi, hi, lo);
  for (const [a, b] of [[[0, hgt, -lean], [w, hgt, -lean]], [[0, hgt, d + lean], [w, hgt, d + lean]], [[-lean, hgt, 0], [-lean, hgt, d]], [[w + lean, hgt, 0], [w + lean, hgt, d]]])
    mb.quad([a[0], a[1], a[2]], [b[0], b[1], b[2]], [b[0], b[1] + .15, b[2]], [a[0], a[1] + .15, a[2]], rim);
}
const eyeCol = [.02, .02, .03, 1];
function buildActors(mb, R, U) {
  const p = P, lim = 90 * S, near = 24 * S;
  for (const e of en) {
    if (abs(e.x - p.x) > lim || abs(e.y - p.y) > lim) continue;
    const x = e.x / S, z = e.y / S, k = e.k, big = k == 3 || k >= 8, d = hyp(e.x - p.x, e.y - p.y);
    const tint = e.hit ? [2.2, 2.2, 2.2] : e.slow ? [.6, .9, 1.25] : null, head = k == 8 ? atan2(e.vy, e.vx) : atan2(p.y - e.y, p.x - e.x);
    if (d > near && !big) {                                  // far off: a square with eyes is all you can see anyway
      const hm = e.r / S * 2.2, l = e.hit ? .95 : k == 6 ? .18 : .42;
      mb.billboard(x, hm / 2, z, hm / 2, [l, l, l * 1.08, 1], R, U);
      mb.billboard(x - R[0] * hm * .22, hm * .62, z - R[2] * hm * .22, hm * .07, eyeCol, R, U);
      mb.billboard(x + R[0] * hm * .22, hm * .62, z + R[2] * hm * .22, hm * .07, eyeCol, R, U);
      continue;
    }
    const c = e.t % 150, lod = d > 11 * S ? 1 : 0, m = modelFor(e, lod);
    if (k == 0) stamp(mb, m, x, 0, z, head, 1, tint, 1 + sin(e.t * .3) * .07);
    else if (k == 2) stamp(mb, m, x, 0, z, head + sin(e.t * .05) * .2, 1, tint);
    else if (k == 5) stamp(mb, m, x, 0, z, head + e.t * .1, 1, tint);
    else if (k == 7) { if (e.t % 120 > 16 || t & 1) stamp(mb, m, x + rs() * .1 - .05, 0, z + rs() * .1 - .05, rs() * 7, .9 + rs() * .2, tint); }
    else if (k == 10) { const up = c < 45 ? .8 : 0; stamp(mb, m, x, up, z, head, 1, tint); if (up) mb.disc(e.tx / S, .03, e.ty / S, 1, [1, 1, 1, .3 + c / 90], [1, 0, 0], [0, 0, 1], 8); }
    else if (k == 12) { const cc = e.t % 240; stamp(mb, m, x, 0, z, head, 1, tint); if (cc < 60) stamp(mb, MODELS.scan, x + (-2.8 + cc * 5.6 / 60) * cos(head), 0, z - (-2.8 + cc * 5.6 / 60) * sin(head), head, 1); }
    else stamp(mb, m, x, 0, z, head, 1, tint);
    if (big) { const f = e.hp / e.mh, hm = e.r / S * 2.2 + .6; mb.billboard(x, hm, z, hm / 2 * f, [.1, .9, .1, 1], R, [0, .06, 0]); }
  }
  for (const b of eb) mb.billboard(b.x / S, 1, b.y / S, .14, [.25, .25, .3, 1], R, U);
  for (const f of p.fo || []) stamp(mb, MODELS.foal, f.x / S, 0, f.y / S, p.an, 1, null, 1 + sin(t * .3) * .04);
  for (const w of we) {                                  // inkwells: a dark hole and a ring of stones
    const x = w.x / S, z = w.y / S;
    mb.disc(x, .02, z, 1.1, [.02, .02, .03, 1], [1, 0, 0], [0, 0, 1], 10);
    stamp(mb, MODELS.well, x, 0, z, w.t * .002, 1, w.hit ? [2, 2, 2] : null);
  }
  const PU = k => k >= 1 && k < 7 ? band([0, 0, 6, 3, 4, 2, 1][k]) : k == 0 ? rgb(350, .8, .55) : k == 7 ? rgb(45, .9, .6) : k == 8 ? rgb(120, .7, .5) : k == 9 ? [1, 1, 1] : k == 10 ? rgb(200, .7, .7) : k == 11 ? band(t / 5 % 7 | 0) : k == 12 ? rgb(320, .75, .7) : band((t / 3 + 1) % 7 | 0, .75);
  for (const u of pu) {
    mb.xform(u.x / S, .45 + sin(u.t * .1) * .08, u.y / S, u.t * .05);
    const c = PU(u.k); mb.diamond(.16, .26, .22, .16, [...c, 1], [c[0] * .6, c[1] * .6, c[2] * .6, 1]);
    mb.noXform();
  }
}
function buildGlow(mb, R, U, eye) {
  const p = P;
  for (const b of bu) { const c = band(b.c, .7); mb.disc(b.x / S, 1.35, b.y / S, .16, [...c, .95], R, U, 6); mb.disc((b.x - b.vx * 2) / S, 1.35, (b.y - b.vy * 2) / S, .12, [...c, .4], R, U, 6); }
  for (const r of rails) {                                // the rail: seven bands, crossed strips so it reads from every angle
    const a = r.l / 10, sx = r.x / S, sz = r.y / S, ex = sx + cos(r.an) * 330 / S, ez = sz + sin(r.an) * 330 / S, nx = -sin(r.an) * .05, nz = cos(r.an) * .05;
    for (let i = 0; i < 7; i++) { const c = [...band(i, .65), a * .8], y = 1.2 + i * .05;
      mb.quad([sx, y, sz], [ex, y, ez], [ex, y + .05, ez], [sx, y + .05, sz], c);
      mb.quad([sx + nx * (i - 3), y + .02, sz + nz * (i - 3)], [ex + nx * (i - 3), y + .02, ez + nz * (i - 3)], [ex + nx * (i - 2), y + .02, ez + nz * (i - 2)], [sx + nx * (i - 2), y + .02, sz + nz * (i - 2)], c); }
    mb.quad([sx, 1.33, sz], [ex, 1.33, ez], [ex, 1.4, ez], [sx, 1.4, sz], [1, 1, 1, a]);
  }
  for (const b of bolts) { const c = [1, .95, .5, b.l / 6]; mb.quad([b.x / S, 1.3, b.y / S], [b.x2 / S, 1.3, b.y2 / S], [b.x2 / S, 1.36, b.y2 / S], [b.x / S, 1.36, b.y / S], c); mb.quad([b.x / S - .03, 1.33, b.y / S], [b.x2 / S - .03, 1.33, b.y2 / S], [b.x2 / S + .03, 1.33, b.y2 / S], [b.x / S + .03, 1.33, b.y / S], c); }
  for (const g of goo) mb.disc(g.x / S, .03, g.y / S, .75, [.3, .9, .3, .45 * g.l / 360], [1, 0, 0], [0, 0, 1], 8);
  for (const b of eb) mb.disc(b.x / S, 1, b.y / S, .3, [.3, .4, 1, .5], R, U, 6);
  for (const f of fx) {
    const c = f.rgb || (f.rgb = cssRgb(f.c));
    if (f.r) { const s = f.r / S * (1.6 - f.l / 10); mb.disc(f.x / S, .9, f.y / S, s, [c[0], c[1], c[2], f.l / 12], R, U, 8); }
    else { const h = .4 + ((f.x * 7 + f.y * 13) % 11) * .1; mb.disc(f.x / S, h, f.y / S, .08, [c[0], c[1], c[2], c[3] * Math.min(1, f.l / 8)], R, U, 4); }
  }
  for (const u of pu) { const c = u.k == 13 ? band(t / 3 % 7 | 0, .8) : [1, 1, 1]; mb.disc(u.x / S, .5, u.y / S, .5, [c[0], c[1], c[2], .18 + sin(u.t * .1) * .05], R, U, 8); }
  if (p.inv > 40 || mech) { const c = mech ? [1, 1, 1] : band(t / 4 % 7 | 0, .7); mb.disc(px(), 1, pz(), 1.2, [c[0], c[1], c[2], .12], [1, 0, 0], [0, 0, 1], 12); }
  if (cool > WP[wep][1] * P.rate - 3) {                   // the muzzle flash, at the horn's tip
    const f = cam.getForward(); mb.disc(eye[0] + f[0] * .9 + R[0] * .22, eye[1] + f[1] * .9 - .1, eye[2] + f[2] * .9 + R[2] * .22, .3, [1, .95, .7, .8], R, U, 8);
  }
}
function buildView(mb) {                                 // the muzzle at the bottom right of the frame, the horn rising from it
  const kick = cool > WP[wep][1] * P.rate - 4 ? .06 : 0, bob = sin(P.t * .35) * .01;
  stamp(mb, MODELS.muzzle, .3, -.36 + kick + bob, -.62, 0, .5);
  mb.xform(.3, -.32 + kick + bob, -.66, 0, 1);
  mb.cone(.03, .4, 7, 7, 4, q => band(q * 7 | 0, .6));
  mb.noXform();
}
eng.onPreRender = () => {
  const ex = px(), ez = pz(), bob = st == 'play' ? sin(P.t * .35) * .02 : 0;
  cam.setEye(ex, EYE + bob, ez); cam.setAngles(pitch, yaw, 0); cam.updateView();
  const R = cam.getRight(), U = [0, 1, 0], eye = cam.position;
  ground.build(buildGround);
  actors.build(mb => buildActors(mb, R, U));
  glow.build(mb => buildGlow(mb, R, U, eye));
  view.build(buildView); view.factor = st == 'play' || st == 'perk' ? 1 : 0;
};
/* the HUD and the screens, on the transparent overlay */
eng.onRender = () => {
  X.clearRect(0, 0, W, H);
  if (st == 'title') {
    for (let i = 0; i < 7; i++) R(40, 58 + i * 3, 240, 3, C(HUES[i], 60, 90, .5));
    txt('OUT OF OFFICE', W / 2, 40, C(0, 100, 0), 4, 1, t / 6 % 7 | 0);
    txt('FIRST PERSON SPIKE', W / 2, 96, C(45, 80), 1, 1);
    txt('< ' + DN[dif] + ' >', W / 2, 114, C(45, 80), 1, 1);
    txt('WASD MOVE   MOUSE LOOK   HOLD TO FIRE   SHIFT: BLINK', W / 2, 140, C(0, 70, 0), 1, 1);
    if (t / 30 & 1) txt('CLICK TO START', W / 2, 159, C(45, 80), 1, 1);
    return;
  }
  hud();
  if (st == 'perk') perkScreen();
  if (st == 'over') overScreen();
  if (paused) { R(0, 0, W, H, C(260, 8, 20, .5)); txt('PAUSED', W / 2, 80, C(0, 100, 0), 2, 1); txt('CLICK TO RESUME', W / 2, 100, C(0, 70, 0), 1, 1); }
  if (P.inv > 24) R(0, 0, W, H, C(0, 60, 90, .15));
  if (P.hurt && P.inv > 12) R(0, 0, W, H, C(0, 80, 50, .12));
};
/* a click on the overlay unpauses and grabs the mouse again */
CV.addEventListener('pointerdown', () => { if (paused) { paused = 0; look.request(); } });
initMeadow(); camX = 160; camY = 90;
eng.start();
