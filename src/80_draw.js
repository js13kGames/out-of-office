/* ---------- drawing ------------------------------------------------
   The world is drawn under translate(-camX, -camY); the HUD is not.   */
const inView = (x, y, m = 24) => x > camX - m && x < camX + W + m && y > camY - m && y < camY + H + m;
function drawGoo() { goo.forEach(g => { const k = g.l / 360; R(g.x - 9, g.y - 6, 18, 12, C(120, 45, 80, .5 * k)); R(g.x - 6, g.y - 9, 12, 18, C(120, 45, 80, .5 * k)); R(g.x - 3, g.y - 3, 6, 6, C(120, 65, 90, .7 * k)); }); }
const dia = (x, y, c) => { R(x - 1, y - 4, 2, 8, c); R(x - 3, y - 2, 6, 4, c); R(x - 4, y - 1, 8, 2, c); };
function drawPickups() {
  pu.forEach(u => {
    if (!inView(u.x, u.y)) return;
    const y = u.y + sin(u.t * .1) * 2, k = u.k, x = u.x;
    R(x - 3, u.y + 4, 6, 2, C(0, 0, 0, .2));
    if (k >= 1 && k < 7) dia(x, y, C(HUES[[0, 0, 6, 3, 4, 2, 1][k]], 60));
    else if (!k) { dia(x, y, C(350, 60)); R(x - 1, y - 1, 2, 2, C(0, 95, 100)); }
    else if (k == 7) { R(x - 3, y - 2, 6, 5, C(45, 60, 100)); R(x - 2, y - 3, 4, 7, C(45, 60, 100)); R(x - 1, y - 1, 2, 3, C(40, 45, 100)); }
    else if (k == 8) { R(x - 3, y - 3, 7, 7, C(0, 12, 0)); for (let i = 0; i < 7; i++) R(x - 3 + i, y - 2 + (i % 3), 1, 3, C(HUES[i], 60)); R(x + 3, y - 5, 1, 2, C(45, 90, 100, t / 3 & 1)); }
    else if (k == 9) { const q = 3 + (t / 6 & 1); R(x - q, y - 1, q * 2 + 1, 3, C(0, 100, 0)); R(x - 1, y - q, 3, q * 2 + 1, C(0, 100, 0)); R(x - 1, y - 1, 3, 3, C(50, 90, 100)); }
    else if (k == 10) { R(x - 3, y - 4, 6, 1, C(200, 70, 90)); R(x - 3, y + 3, 6, 1, C(200, 70, 90)); R(x - 2, y - 3, 4, 2, C(200, 70, 90, .7)); R(x - 1, y - 1, 2, 2, C(200, 70, 90)); R(x - 2, y + 1, 4, 2, C(200, 70, 90, .7)); }
    else if (k == 11) { X.lineWidth = 2; X.strokeStyle = C(HUES[t / 5 % 7 | 0], 65); X.beginPath(); X.arc(x, y, 4, 0, 7); X.stroke(); }
    else if (k == 12) { R(x - 3, y - 3, 6, 6, C(320, 75, 90)); R(x - 1 + (t / 8 & 1) * 2, y - 2, 1, 1, C(0, 100, 0)); R(x, y + 1, 1, 1, C(0, 100, 0)); }
    else { dia(x, y, C(HUES[(t / 3 + u.t) % 7 | 0], 75, 95)); R(x - 1, y - 2, 2, 4, C(0, 100, 0)); }   // a shard: white light through every hue
    if (u.t > 720 && u.t / 8 & 1) R(x - 4, y - 4, 8, 8, C(0, 100, 100, .5));
  });
}
function drawEnemies() {
  en.forEach(e => {
    if (!inView(e.x, e.y)) return;
    if (gl) { if (e.hit) R(e.x - e.r, e.y - e.r, e.r * 2, e.r * 2, C(0, 100, 0, .7)); return; }
    const f = e.t / 8 & 1, sl = e.slow ? C(195, 80, 90, .5) : 0;
    if (e.k == 0) rot(drab(f), e.x, e.y + (f ? 1 : 0));
    else if (e.k == 1) rot(moth(e.t / 3 & 1), e.x, e.y, atan2(P.y - e.y, P.x - e.x) - PI / 2);
    else if (e.k == 2) {                                          // the smudge: a wobbling pile of grey
      for (let i = 0; i < 5; i++) { const a = e.t * .05 + i * 1.3, r = 5 + sin(a) * 2;
        R(e.x + cos(a) * 3 - r, e.y + sin(a) * 2 - r, r * 2, r * 2, C(0, 30 + i * 5, 0)); }
      R(e.x - 3, e.y - 2, 2, 2, C(0, 8, 0)); R(e.x + 1, e.y - 2, 2, 2, C(0, 8, 0)); R(e.x - 2, e.y + 2, 4, 1 + (f ? 1 : 0), C(0, 8, 0));
    }
    else if (e.k == 3) {                                          // the censor: a bar over the world
      R(e.x - 19, e.y - 7, 38, 14, C(0, 0, 0)); R(e.x - 18, e.y - 6, 36, 12, C(0, 8, 0));
      txt('CENSORED', e.x, e.y - 2, C(0, 95, 0), 1, 1);
    }
    else if (e.k == 4) rot(spit(e.t % 90 < 12 ? 0 : 1), e.x, e.y, atan2(P.y - e.y, P.x - e.x));
    else if (e.k == 5) rot(blot(f), e.x, e.y);
    else if (e.k == 6) rot(shade(f), e.x, e.y);
    else if (e.k == 7) { if (e.t % 120 > 16 || t & 1) for (let i = 0; i < 12; i++) R(e.x - 5 + rs() * 9, e.y - 5 + rs() * 9, 2, 2, C(0, 20 + rs() * 70, 0)); }
    else if (e.k == 9) {                                          // the stapler: a bar with a jaw that opens before it bites
      const o = e.t % 120 > 96 ? 5 : 0;
      X.save(); X.translate(e.x | 0, e.y | 0); X.rotate(atan2(P.y - e.y, P.x - e.x));
      R(-14, -3, 28, 7, C(0, 22, 0)); R(-14, -8 - o, 28, 5, C(0, 40, 0)); R(8, -8 - o, 6, 5, C(0, 60, 0)); R(-14, -3, 4, 7, C(0, 50, 0));
      X.restore();
    }
    else if (e.k == 10) {                                         // the stamp: a handle, a block, and the word it leaves
      const c = e.t % 150, up = c < 45 ? 8 : 0;
      if (up) { X.strokeStyle = C(0, 70, 0, c / 45); X.lineWidth = 1; X.strokeRect(e.tx - 13, e.ty - 9, 26, 18); }   // where it will land
      R(e.x - 13, e.y - 9 - up, 26, 18, C(0, 30, 0)); R(e.x - 4, e.y - 17 - up, 8, 8, C(0, 45, 0)); txt('VOID', e.x, e.y - 2 - up, C(0, 85, 0), 1, 1);
    }
    else if (e.k == 12) {                                         // the photocopier: a slab, a glass, a tray, and the scan
      const c = e.t % 240, x = e.x | 0, y = e.y | 0;
      R(x - 56, y - 40, 112, 80, C(0, 30, 0)); R(x - 52, y - 36, 104, 72, C(0, 42, 0)); R(x - 44, y - 30, 88, 44, C(200, 14, 8));   // body, top, glass
      R(x - 52, y + 18, 104, 14, C(0, 24, 0)); R(x - 20, y + 20, 40, 10, C(0, 90, 0));                                          // the tray and its paper
      if (c < 60) { R(x - 44 + c * 88 / 60 | 0, y - 30, 3, 44, C(120, 90, 80)); R(x - 44, y - 30, 88, 44, C(120, 60, 60, .2)); }   // the scan
      txt('COPY', x, y - 4, C(0, 70, 0), 1, 1);
    }
    else if (e.k == 11) {                                         // the shredder: a box with a slot and moving teeth
      R(e.x - 15, e.y - 11, 30, 22, C(0, 35, 0)); R(e.x - 12, e.y - 4, 24, 4, C(0, 5, 0));
      for (let i = 0; i < 6; i++) R(e.x - 12 + i * 4, e.y - 4 + (t / 4 + i) % 3, 2, 2, C(0, 65, 0));
    }
    else {                                                        // the eraser: a rubber block with a worn end
      const a = atan2(e.vy, e.vx);
      X.save(); X.translate(e.x | 0, e.y | 0); X.rotate(a);
      R(-16, -9, 32, 18, C(0, 22, 0)); R(-15, -8, 30, 16, C(0, 48, 0)); R(6, -8, 9, 16, C(0, 36, 0)); R(-15, -8, 30, 3, C(0, 60, 0));
      X.restore();
    }
    if (isB(e)) R(e.x - 19 + 38 * (1 - e.hp / e.mh), e.y - e.r - 4, 38 * e.hp / e.mh, 2 + (e.r > 20), C(0, 80, 0));
    if (e.hit) R(e.x - e.r, e.y - e.r, e.r * 2, e.r * 2, C(0, 100, 0, .6));
    if (sl) R(e.x - e.r, e.y - e.r, e.r * 2, e.r * 2, sl);
  });
}
function drawBullets() {
  eb.forEach(b => { R(b.x - 2, b.y - 2, 5, 5, gl ? C(230, 60, 80) : C(0, 30, 0)); R(b.x - 1, b.y - 1, 3, 3, C(0, 55, 0)); });   // grey spit, with a cold ink glow
  bu.forEach(b => {
    if (!inView(b.x, b.y, 4)) return;
    const s = 2 + (b.k == 2) + gl * 3, o = s / 2 | 0;
    R(b.x - b.vx - o, b.y - b.vy - o, s, s, C(b.c, 60, 90, .45)); R(b.x - o, b.y - o, s, s, C(b.c, 70, 95));
  });
  rails.forEach(r => {                                             // the rail: seven bands side by side and a white core, fading out
    const a = r.l / 10; X.save(); X.translate(r.x, r.y); X.rotate(r.an);
    for (let i = 0; i < 7; i++) R(0, i - 3, 330, 1, C(HUES[i], 65, 95, a * .8));
    R(0, -1, 330, 2 + gl * 2, C(0, 100, 0, a)); X.restore();
  });
  X.lineWidth = 1;
  bolts.forEach(b => { X.strokeStyle = C(52, 70 + b.l * 4, 100, b.l / 6); X.beginPath(); X.moveTo(b.x, b.y);
    for (let k = .2; k < 1; k += .2) X.lineTo(b.x + (b.x2 - b.x) * k + rs() * 6 - 3, b.y + (b.y2 - b.y) * k + rs() * 6 - 3);
    X.lineTo(b.x2, b.y2); X.stroke(); });
}
function drawPlayer() {
  const p = P;
  if (dead) return;
  if (p.band) { X.strokeStyle = C(260, 10, 20, .35 + sin(t * .1) * .1); X.lineWidth = 3; X.beginPath(); X.arc(p.x, p.y, 34, 0, 7); X.stroke(); }
  if (p.aura) { X.strokeStyle = C(HUES[t / 6 % 7 | 0], 70, 90, .25); X.lineWidth = 1; X.beginPath(); X.arc(p.x, p.y, 48, 0, 7); X.stroke(); }
  p.fo.forEach(f => rot(foalS(t / 10 & 1), f.x, f.y, p.an));
  if (p.inv > 40) { X.lineWidth = 2; X.strokeStyle = C(HUES[t / 4 % 7 | 0], 70, 90, .6); X.beginPath(); X.arc(p.x, p.y, 13 + sin(t * .2), 0, 7); X.stroke(); }
  else if (p.inv && t / 3 & 1) return;                             // hit: flicker
  if (rush) R(p.x - 6 + rs() * 12, p.y - 6 + rs() * 12, 2, 2, C(320, 80, 90));
  if (mech) { X.lineWidth = 3; X.strokeStyle = C(0, 100, 0, .5 + sin(t * .3) * .3); X.beginPath(); X.arc(p.x, p.y, 16, 0, 7); X.stroke(); }
  R(p.x - 6, p.y + 4, 12, 3, C(0, 0, 0, .22));
  rot(uni(p.t / 6 & 1), p.x, p.y, p.an);
  if (cool > WP[wep][1] * p.rate - 3) R(p.x + cos(p.an) * 8 - 1, p.y + sin(p.an) * 8 - 1, 3, 3, C(45, 90, 100));   // the horn flares
}
/* sparks, and explosions: an explosion (r set) lives only in the glow layer, a square that grows and fades into a soft burst */
function drawFx() { fx.forEach(f => { if (f.r) { if (gl) { const s = f.r * (1.6 - f.l / 10); R(f.x - s, f.y - s, s * 2, s * 2, C(f.c, 75, 95, f.l / 20)); } } else R(f.x, f.y, 2 + gl, 2 + gl, f.c); }); }
const boom = (x, y, r, c = HUES[t % 7]) => fx.push({ x, y, vx: 0, vy: 0, l: 10, c, r });
const drawMsg = () => { if (msgT > 0) { R(W / 2 - msg.length * 4 - 3, 37, msg.length * 8 + 4, 16, C(260, 8, 12, .6)); txt(msg, W / 2, 40, C(0, 100, 0), 2, 1, msgT < 40 ? -1 : t / 4 % 7 | 0); } };   // on a dark plate, and never in the glow layer
function bloom() {
  X = G1X; X.clearRect(0, 0, W, H); gl = 1;
  X.save(); X.translate(-(camX | 0), -(camY | 0));
  drawGoo(); drawPickups(); drawEnemies(); drawBullets(); drawFx();
  if (!dead && cool > WP[wep][1] * P.rate - 3) R(P.x + cos(P.an) * 8 - 3, P.y + sin(P.an) * 8 - 3, 6, 6, C(45, 90, 100));   // the muzzle flash
  X.restore(); gl = 0; X = MX;
  G2X.drawImage(G1, 0, 0, W / 4, H / 4); G3X.drawImage(G2, 0, 0, W / 8, H / 8); G4X.drawImage(G3, 0, 0, W / 16, H / 16);
  X.imageSmoothingEnabled = true; X.globalCompositeOperation = 'lighter';
  X.globalAlpha = .6; X.drawImage(G2, 0, 0, W, H); X.drawImage(G3, 0, 0, W, H); X.globalAlpha = .4; X.drawImage(G4, 0, 0, W, H);
  X.globalAlpha = 1; X.globalCompositeOperation = 'source-over'; X.imageSmoothingEnabled = false;
}
function bar(x, y, w, v, c, bg) { R(x, y, w, 4, bg); R(x, y, w * clamp(v, 0, 1), 4, c); }
function hud() {
  const p = P;
  if (p.moon) R(0, 0, W, H, C(240, 20, 60, .3));                   // night
  R(0, 0, W, 11, C(260, 8, 20, .55));
  for (let i = 0; i < 7; i++) bar(4 + i * 6, 3, 6, clamp(p.hp / p.mhp * 7 - i, 0, 1), C(HUES[i], 60), C(0, 20, 0));   // health is a rainbow
  bar(50, 3, 40, xp / nxt, C(45, 70, 90), C(0, 20, 0)); txt('L' + lvl, 93, 3, C(45, 80), 1);
  for (let i = 0; i < 5 - (p.hoard | 0); i++) R(108 + i * 4, 3, 3, 4, i < shards ? C(HUES[i + 1], 75, 95) : C(0, 20, 0));   // shards toward WHITE LIGHT
  txt('BLINK', 48, H - 7, C(0, 85, 0), 1);                                                                   // blink charges: three, one back every 150 ticks
  for (let i = 0; i < 3; i++) { R(72 + i * 5, H - 7, 4, 5, C(0, 20, 0)); const h = i < bc ? 5 : i == bc ? 5 - bl / 30 | 0 : 0; if (h) R(72 + i * 5, H - 2 - h, 4, h, C(0, 100, 0)); }
  if (mech) bar(200, H - 7, 50, mech / 480, C(0, 100, 100), C(0, 20, 0));
  const sec = tm / 60 | 0;
  txt('WAVE ' + wave + '  ' + (sec / 60 | 0) + ':' + (sec % 60 < 10 ? '0' : '') + sec % 60, W / 2, 3, C(0, 92, 0), 1, 1);
  if (combo > 4) txt('X' + combo, p.x - camX, p.y - camY - 16, C(0, 100, 0), 1 + (combo > 24), 1, t / 3 % 7 | 0);
  const mark = (x, y, c) => {                                      // a marker at the edge for what you cannot see
    if (inView(x, y, -8)) return;
    const ex = clamp(x - camX, 6, W - 6), ey = clamp(y - camY, 14, H - 14);
    R(ex - 3, ey - 3, 6, 6, C(0, 0, 0)); R(ex - 2, ey - 2, 4, 4, c);
  };
  en.forEach(e => { if (isB(e)) mark(e.x, e.y, C(0, 90, 0, .5 + (t / 8 & 1) * .5)); });
  we.forEach(w => { if (hyp(w.x - p.x, w.y - p.y) < 360) mark(w.x, w.y, C(0, 35, 0)); });
  if (frz) R(0, 0, W, H, C(200, 80, 80, .1 + (frz < 60 && t / 4 & 1 ? .08 : 0)));
  if (flash) R(0, 0, W, H, C(0, 100, 100, flash / 12));
  txt(WP[wep][0] + (ammo && !p.inf ? ' ' + ammo : ''), W - 4, 3, C(HUES[[0, 0, 6, 3, 4, 2, 1][wep]], 72), 1, 2);
  R(0, H - 9, W, 9, C(260, 8, 20, .55));
  txt(kills + ' KILLS', 4, H - 7, C(0, 85, 0), 1);
  txt('ASH ' + (gry * 100 | 0) + '%', W / 2, H - 7, C(0, 85, 0), 1, 1);   // how much of the field has gone
  txt('SND' + (mute ? ' ' : '<'), W - 4, H - 7, C(0, 60, 0), 1, 2);
  {                                                                // the map: the world at one in forty. Wells, bosses and you; BRIGHT EYES adds every one of them
    const mx0 = W - 68, my0 = 13, q = 40; X.globalAlpha = .75; X.drawImage(MM, mx0, my0); X.globalAlpha = 1;
    en.forEach(e => { const b = isB(e); if (p.map || b) R(mx0 + e.x / q - b, my0 + e.y / q - b, 1 + 2 * b, 1 + 2 * b, C(0, 80, 0)); });
    we.forEach(w => { R(mx0 + w.x / q - 1, my0 + w.y / q - 1, 3, 3, C(0, 100, 0)); R(mx0 + w.x / q, my0 + w.y / q, 1, 1, C(0, 0, 0)); });
    R(mx0 + p.x / q, my0 + p.y / q, 2, 2, C(45, 80, 100));
    X.strokeStyle = C(0, 100, 0, .3); X.lineWidth = 1; X.strokeRect(mx0 + camX / q, my0 + camY / q, W / q, H / q);
  }
  if (!dead) {                                                     // the reticle: a pixel ring of four bars and a dot, with a shadow; the bars step out when a volley leaves
    const x = mx | 0, y = my | 0, o = 3 + (cool > WP[wep][1] * p.rate - 3);
    for (const [d, c] of [[1, C(0, 0, 0, .45)], [0, C(50, 40, 100, .85)]]) {
      R(x - 1 + d, y - o + d, 3, 1, c); R(x - 1 + d, y + o + d, 3, 1, c); R(x - o + d, y - 1 + d, 1, 3, c); R(x + o + d, y - 1 + d, 1, 3, c); R(x + d, y + d, 1, 1, c);
    }
  }
  if (msgT > 0 && st == 'play') { msgT--; drawMsg(); }   // the banner waits while a screen is up
}
