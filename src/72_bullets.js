/* ---------- what the horn fires ----------------------------------
   Kinds: 0 plain, 2 goo (leaves a puddle when it lands), 3 frost (slows what
   it hits); the rail is a beam, not a bullet (see rail). p: things it may
   still pass through. Every dying shot paints the meadow a little.    */
function shot(x, y, an, sp, d, hue, l, k) {
  bu.push({ x, y, vx: cos(an) * sp, vy: sin(an) * sp, d: d * P.dmg, c: hue, l: l * P.life, k, p: P.pierce + (mech ? 3 : 0) });
}
function volley() {
  const p = P, x = p.x + cos(p.an) * 2, y = p.y + sin(p.an) * 2, an = p.an, s = (a, sp, d, hue, l, k) => shot(x, y, a, sp, d, hue, l, k);   // from the centre, so a thing standing on you still gets hit
  const w = wep, xs = p.extra, n0 = bu.length;
  if (w == 0) { for (let b = 0; b < 7 + xs; b++) s(an + (b - 3 - xs / 2) * .055, 2.4 + (b % 7) * .28, 1, HUES[b % 7], 55, 0); snd(900, .09, 'square', .07, 1800); }
  else if (w == 1) { for (let i = 0; i <= xs / 2; i++) s(an + (rs() - .5) * .35, 3.6, 1, HUES[0], 20, 0); snd(160, .06, 'sawtooth', .05, 70); }
  else if (w == 2) { rail(x, y, an); for (let i = 0; i < xs; i++) rail(x, y, an + (i + 1) * .1 * (i % 2 ? 1 : -1)); if (p.mirror) rail(x, y, an + PI); snd(1600, .2, 'sawtooth', .09, 150); shake = 3; }
  else if (w == 3) { for (let i = 0; i <= xs / 2; i++) s(an + (i - xs / 4) * .2, 2.4, 1, HUES[3], 34, 2); snd(320, .14, 'sine', .08, 90); }
  else if (w == 4) { for (let i = 0; i <= xs / 2; i++) s(an + (rs() - .5) * .5, 3, .6, HUES[4], 18, 3); sh(.06, .06, 4500); }
  else if (w == 5) arc(x, y, an, 3 + xs);
  else { for (let i = 0; i < 6 + xs; i++) s(an + (rs() - .5) * .6, 3.4 + rs(), 2, HUES[1], 13, 0); snd(140, .14, 'square', .1, 35); shake = 3; }
  if (p.mirror) for (let i = n0, n1 = bu.length; i < n1; i++) { const b = bu[i]; bu.push({ ...b, x: p.x - (b.x - p.x), y: p.y - (b.y - p.y), vx: -b.vx, vy: -b.vy }); }
  if (p.ring && ++vol % 8 == 0) { for (let i = 0; i < 14; i++) shot(p.x, p.y, i * PI / 7, 3, 1, HUES[i % 7], 50, 0); snd(700, .3, 'triangle', .04, 1400); }
  if (ammo && !p.inf && !--ammo) { wep = 0; say('PRISM'); }
}
/* the rail: an instant beam. Everything on the line takes the hit at once,
   wells included, the meadow is repainted along it, and it shows for ten frames */
function rail(x, y, an) {
  const cx = cos(an), sy = sin(an), L = 330, d = 7 * P.dmg;
  rails.push({ x, y, an, l: 10 });
  const on = (ox, oy, r) => { const dx = ox - x, dy = oy - y, a = dx * cx + dy * sy; return a > 0 && a < L && abs(dx * sy - dy * cx) < r; };
  en.forEach(e => { if (on(e.x, e.y, e.r + 2)) { damage(e, d); if (P.frost) e.slow = 40; } });
  we.forEach(w => { if (on(w.x, w.y, 12)) { w.hp -= d; w.hit = 3; } });
  for (let i = 0; i < L; i += 16) paint(x + cx * i, y + sy * i, 0, .3);
}
/* chain lightning: the nearest thing in front, then the nearest to that, some hops */
function arc(x, y, an, hops, quiet) {
  let cx = x, cy = y, hit = [];
  for (let n = 0; n < hops; n++) {
    let b = 0, bd = n ? 60 : 100;
    en.concat(we).forEach(e => { if (hit.includes(e)) return; const dx = e.x - cx, dy = e.y - cy, d = hyp(dx, dy);   // inkwells are targets too
      if (d < bd && (n || quiet || dx * cos(an) + dy * sin(an) > 0)) { bd = d; b = e; } });
    if (!b) break;
    bolts.push({ x: cx, y: cy, x2: b.x, y2: b.y, l: 6 }); hit.push(b); damage(b, 3 * P.dmg); paint(b.x, b.y, 0, .5);
    cx = b.x; cy = b.y;
  }
  if (!quiet) snd(2000 + rs() * 1000, .1, 'square', hit.length ? .07 : .03, 300);
}
function stepBullets() {
  bu = bu.filter(b => {
    b.x += b.vx; b.y += b.vy; b.l--;
    if (b.x < 0 || b.x > WW || b.y < 0 || b.y > WH) return 0;
    if (b.l <= 0) { if (b.k == 2) { goo.push({ x: b.x, y: b.y, l: 360 }); paint(b.x, b.y, 1, .6); } else paint(b.x, b.y, 0, .3); return 0; }
    for (const w of we) if (abs(w.x - b.x) < 10 && abs(w.y - b.y) < 10) { w.hp -= b.d; w.hit = 3; fx.push({ x: b.x, y: b.y, vx: -b.vx * .2, vy: -b.vy * .2, l: 10, c: C(b.c, 70) }); if (!b.p) return 0; b.p--; }
    let live = 1;
    const hit = e => { if (abs(e.x - b.x) < e.r + 2 && abs(e.y - b.y) < e.r + 2 && !(b.h && b.h.includes(e))) {
      damage(e, b.d); if (b.k == 3 || P.frost) e.slow = 40;
      fx.push({ x: b.x, y: b.y, vx: -b.vx * .2, vy: -b.vy * .2, l: 10, c: C(b.c, 70) });
      if (b.p) { b.p--; (b.h = b.h || []).push(e); return; }
      paint(b.x, b.y, 0, .25); return live = 0, 1;
    } };
    big.forEach(e => live && hit(e)); live && near(b.x, b.y, hit);
    return live;
  });
  bolts = bolts.filter(b => --b.l > 0); rails = rails.filter(r => --r.l > 0);
  eb = eb.filter(b => {                             // what the grey spits: hurts you, greys the ground where it lands
    b.x += b.vx; b.y += b.vy;
    if (hyp(b.x - P.x, b.y - P.y) < 7) { if (!P.ink) hurtP(8); return 0; }   // INKPROOF shrugs it off
    if (--b.l <= 0) { drain(b.x, b.y, .5); return 0; }
    return 1;
  });
  goo = goo.filter(g => { near(g.x, g.y, e => { if (hyp(e.x - g.x, e.y - g.y) < 12) damage(e, .06); }); return --g.l > 0; });
}
