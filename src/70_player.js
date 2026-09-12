/* ---------- the unicorn ------------------------------------------- */
function stepPlayer() {
  const p = P;
  let dx = (K.d || K.arrowright ? 1 : 0) - (K.a || K.arrowleft ? 1 : 0),
      dy = (K.s || K.arrowdown ? 1 : 0) - (K.w || K.arrowup ? 1 : 0);
  let d = hyp(dx, dy); if (d > 1) { dx /= d; dy /= d; d = 1; }
  const grey = sat[cell(p.x, p.y)] < .3, sp = p.spd * (grey && !p.sure ? .5 : 1), ox = p.x, oy = p.y;
  p.x = clamp(p.x + dx * sp, 6, WW - 6); p.y = clamp(p.y + dy * sp, 6, WH - 6);
  if (d) {
    p.t++; p.dx = dx; p.dy = dy;
    if (p.glit) paint(p.x, p.y, 0, .03);
    const n = cell(p.x, p.y); if (fl[n]) { if (fg[n] > .7) for (let i = 0; i < 3; i++) fx.push({ x: p.x, y: p.y, vx: rs() * 2 - 1, vy: rs() * 2 - 1, l: 14, c: C(HUES[(fl[n] >> 2) % 7], 65) }); fg[n] = 0; }   // hooves trample flowers, and petals fly
    if (t % 5 == 0) fx.push({ x: ox - dx * 6, y: oy - dy * 6 + 3, vx: -dx * .3, vy: -dy * .3, l: 12, c: C(40, 70, 30, .5) });   // dust
    if (p.comet && t % 2 == 0) bu.push({ x: ox, y: oy, vx: 0, vy: 0, d: .4, c: HUES[t / 2 % 7 | 0], l: 40, k: 0, b: 1, p: 99 });
  }
  p.an = atan2(my + camY - p.y, mx + camX - p.x);   // aim: the mouse
  if (cool > 0) cool--;
  else if (fire) { volley(); cool = WP[wep][1] * p.rate * (rush ? .5 : 1) * (mech ? .3 : 1); }
  if (mech) p.inv = Math.max(p.inv, 41);
  if (bc < 3 && !bl) { bc++; bl = 150 * p.blk | 0; }     // the blink recharges, one charge a second and a half
  if (p.inv) p.inv--;
  if (p.regen && !grey && p.hp < p.mhp && t % 60 == 0) p.hp++;   // one a second on colour
  if (p.band) en.forEach(e => { if (hyp(e.x - p.x, e.y - p.y) < 34) e.slow = 2; });
  /* foals trot behind and fire a small prism at whatever is nearest */
  p.fo.forEach((f, i) => {
    const an = p.an + PI + (i - (p.fo.length - 1) / 2) * .9;
    f.x += (p.x + 13 * cos(an) - f.x) * .08; f.y += (p.y + 13 * sin(an) - f.y) * .08;
    const e = nearest(f.x, f.y);
    if (e && (t + i * 18) % 36 == 0) { const a = atan2(e.y - f.y, e.x - f.x);
      for (let b = 0; b < 7; b += 2) shot(f.x, f.y, a + (b - 3) * .05, 2.2 + b * .2, 1, HUES[b], 45, 0); }
  });
}
/* the blink: a short teleport in the direction you are moving (or facing), three
   charges, straight through the grey. FLASH STEP makes the trail burn. */
function blink() {
  const p = P; if (!bc || st != 'play' || dead) return;
  bc--; if (!bl) bl = 150 * p.blk | 0; p.inv = Math.max(p.inv, 12); snd(1400, .12, 'sine', .05, 2800);
  for (let i = 0; i < 12; i++) {
    const x = p.x + p.dx * i * 4, y = p.y + p.dy * i * 4;
    fx.push({ x, y, vx: 0, vy: 0, l: 10 + i, c: C(HUES[i % 7], 65) });
    if (p.fs) near(x, y, e => { if (hyp(e.x - x, e.y - y) < e.r + 6) damage(e, 6); });
  }
  const j = 48 + (p.bd | 0) * 24; p.x = clamp(p.x + p.dx * j, 6, WW - 6); p.y = clamp(p.y + p.dy * j, 6, WH - 6);
}
function nearest(x, y) {
  let b = 0, bd = 1e9;
  en.forEach(e => { const d = abs(e.x - x) + abs(e.y - y); if (d < bd) { bd = d; b = e; } });
  return b;
}
function hurtP(n) {
  const p = P; if (p.inv || dead) return;
  p.hp -= n; p.inv = 20; p.hurt = 1; shake = 6; snd(200, .15, 'sawtooth', .05, 80);
  for (let i = 0; i < 6; i++) fx.push({ x: p.x, y: p.y, vx: rs() * 3 - 1.5, vy: rs() * 3 - 1.5, l: 18, c: C(0, 60, 90) });
  if (p.hp <= 0) {
    if (p.wind) { p.wind = 0; p.hp = 60; p.inv = 120; say('SECOND WIND'); en.forEach(e => { if (hyp(e.x - p.x, e.y - p.y) < 70) e.hp = 0; }); snd(440, .6, 'triangle', .06, 1760); return; }
    p.hp = 0; dead = 1; stT = t; snd(300, 1, 'sawtooth', .07, 30); sh(.8, .1, 400);
    for (let i = 0; i < 40; i++) fx.push({ x: p.x, y: p.y, vx: rs() * 6 - 3, vy: rs() * 6 - 3, l: 60, c: C(HUES[i % 7], 60) });
  }
}
