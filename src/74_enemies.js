/* ---------- the grey -------------------------------------------- */
const CAP = 1000;                                    // how many of the grey may be alive at once
function spawn(k, x, y) {
  const d = EK[k], boss = k == 3 || k >= 8;
  if (en.length >= CAP && !boss) return;              // the cap is for the horde; a boss always arrives
  if (x == null) {                                   // just outside the view, on a random side
    const s = rs() * 4 | 0, u = rs();
    x = s < 2 ? camX + u * W : s == 2 ? camX - 14 : camX + W + 14;
    y = s >= 2 ? camY + u * H : s ? camY + H + 14 : camY - 14;
  }
  const hp = d[2] * (boss ? 1 + wave / 10 : 1 + (wave - 1) * .08);
  en.push({ k, x, y, hp, mh: hp, r: d[1], sp: d[3] * (.85 + rs() * .3),
            slow: 0, hit: 0, t: rs() * 99 | 0, ph: rs() * 7, id: eid++, vx: 0, vy: 0 });
}
function stepWaves() {
  if (++waveT > 1800) {                              // thirty seconds a wave; every fifth brings a boss; every wave opens a well
    waveT = 0; wave++; snd(220, .3, 'square', .04, 440);
    const nu = EK.find(e => e[7] == wave);
    say('WAVE ' + wave + (nu ? ': ' + nu[0] : ''));
    if (wave % 5 == 0) { const n = wave / 5; for (let i = 0; i < 1 + (n / 6 | 0); i++) spawn(BK[(n - 1 + i) % 5]); if (wave % 40 == 0) spawn(12); }   // the rota; from wave 30 they come in pairs, from 60 in threes; every 40th the photocopier
    if (we.length < 10) addWell();
  }
  if (--spawnT <= 0) {                               // a burst climbs out of a well; only with no well left does it come in from the edge
    spawnT = Math.max(20, 60 - wave * 3);
    const n = Math.min(40, 4 + wave * 2 | 0), ks = SPW.map((w, i) => EK[i][7] <= wave ? w : 0), tot = ks.reduce((a, b) => a + b), w = we.length && pick(we);
    for (let i = 0; i < n; i++) {
      let r = rs() * tot, k = 0; while ((r -= ks[k]) > 0) k++;
      if (w) spawn(k, w.x + rs() * 16 - 8, w.y + rs() * 16 - 8); else spawn(k);
    }
    if (w) { for (let i = 0; i < 6; i++) fx.push({ x: w.x, y: w.y, vx: rs() * 3 - 1.5, vy: rs() * 3 - 1.5, l: 20, c: C(0, 30, 0) }); if (inView(w.x, w.y)) snd(70, .3, 'sawtooth', .04, 30); }
  }
  if (!we.length && t % 240 == 0) addWell();         // never dry for more than four seconds
}
/* a spatial hash, rebuilt every tick. The world is cut into 16 px cells and
   every cell keeps a linked list of the grey in it, as two typed arrays: HH is
   the head index per cell, HN the next index per enemy. No strings, no
   allocation, so a thousand of them cost a thousand stores a tick. Anything
   that wants its neighbours walks nine cells instead of looking at everyone.
   A uniform grid beats a quadtree here: every thing is about the same size,
   spread fairly evenly, and moves every tick, so a tree would be rebuilt
   every tick for no gain. */
const HS = 16, HX = WW / HS + 4 | 0, HY = WH / HS + 4 | 0, HH = new Int32Array(HX * HY), HN = new Int32Array(CAP + 16);   // a few over the cap: bosses ignore it
const hc = (x, y) => clamp(x / HS + 2 | 0, 1, HX - 2) + clamp(y / HS + 2 | 0, 1, HY - 2) * HX;
let big = [];                                        // anything wider than a cell is checked by every bullet outright
function hashAll() { HH.fill(-1); big = []; en.forEach((e, i) => { const c = hc(e.x, e.y); HN[i] = HH[c]; HH[c] = i; if (e.r > 20) big.push(e); }); }
function near(x, y, f) {                             // f on everything within a cell of the point; return 1 to stop
  const c = hc(x, y);
  for (let j = -HX; j <= HX; j += HX) for (let i = -1; i < 2; i++) for (let n = HH[c + i + j]; n >= 0; n = HN[n]) if (f(en[n])) return;
}
function stepEnemies() {
  const p = P, mo = (p.moon ? .7 : 1) * (frz ? .15 : 1);
  hashAll();
  en.forEach(e => {
    e.t++; if (e.hit) e.hit--;
    const dx = p.x - e.x, dy = p.y - e.y, d = hyp(dx, dy) || 1, d0 = EK[e.k], k = e.k;
    let sp = e.sp * (e.slow ? .4 : 1) * (1 + wave * .05) * mo;
    if (e.slow) e.slow--;
    const ash = sat[cell(e.x, e.y)] < .3;
    sp *= k == 6 ? (ash ? 2.4 : .5) : ash ? 1.35 : 1;                          // a shade lives on grey ground; everything is quicker on it
    let vx = dx / d * sp, vy = dy / d * sp;
    if (k == 1) { const w = sin(e.t * .25 + e.ph) * 1.2; vx += -dy / d * w; vy += dx / d * w; }   // a moth never flies straight
    if (k == 4) {                                                            // a spitter keeps its distance
      if (d < 50) { vx = -vx; vy = -vy; } else if (d < 70) vx = vy = 0;
    }
    if (k == 7) {                                                            // static blinks to somewhere near you
      if (e.t % 120 == 0) { const an = rs() * 7; for (let i = 0; i < 6; i++) fx.push({ x: e.x, y: e.y, vx: rs() * 2 - 1, vy: rs() * 2 - 1, l: 12, c: C(0, 90, 0) });
        e.x = clamp(p.x + cos(an) * (44 + rs() * 40), 4, WW - 4); e.y = clamp(p.y + sin(an) * (44 + rs() * 40), 4, WH - 4); }
      if (e.t % 120 < 20) vx = vy = 0;
    }
    if (k == 8) {                                                            // the eraser: charge, rest, charge
      const c = e.t % 150;
      if (c == 0) { e.vx = dx / d * 2.6; e.vy = dy / d * 2.6; snd(80, .4, 'sawtooth', .06, 30); }
      if (c < 55) { vx = e.vx * mo; vy = e.vy * mo; for (let i = -1; i < 2; i++) drain(e.x + i * 8, e.y, .3), drain(e.x, e.y + i * 8, .3); }
      else { vx *= .3; vy *= .3; }
    }
    if (d0[8] && e.t % d0[8] == 0 && d < 240 && !frz && eb.length < 400) {     // it fires: one aimed, a fan of three, or a ring
      const a0 = atan2(dy, dx), n = k == 3 ? 10 : k == 12 ? 16 : k == 2 || k == 8 ? 3 : k == 9 ? 2 : 1;
      for (let i = 0; i < n; i++) { const a = k == 3 || k == 12 ? i * 2 * PI / n + e.t * .02 : a0 + (i - (n - 1) / 2) * (k == 9 ? .1 : .3); eb.push({ x: e.x, y: e.y, vx: cos(a) * 1.7, vy: sin(a) * 1.7, l: 100 }); }
      if (inView(e.x, e.y)) snd(160, .1, 'sawtooth', .02, 60);
    }
    if (k == 9 && e.t % 120 < 12) { vx *= 6; vy *= 6; }                    // the stapler bites: twelve ticks of lunge after its jaw opens
    if (k == 10) {                                                           // the stamp: mark, lift, slam
      const c = e.t % 150;
      if (c == 0) { e.tx = p.x; e.ty = p.y; }
      if (c == 45) { e.x = e.tx; e.y = e.ty; paint(e.x, e.y, 2, -1); shake = 8; boom(e.x, e.y, 30, 0); if (d < 30) hurtP(d0[4]); snd(60, .3, 'square', .07, 20); }
      if (c < 45) vx = vy = 0;
    }
    if (k == 12 && e.t % 240 == 0) { for (let i = 0; i < 8; i++) spawn(0, e.x + cos(i * .8) * 62, e.y + sin(i * .8) * 62); flash = 4; snd(500, .5, 'sawtooth', .05, 100); }   // the copier copies
    if (k == 11) {                                                           // the shredder pulls you in and spits strips
      if (d < 140 && !p.inv) { p.x -= dx / d * .6; p.y -= dy / d * .6; }
      if (e.t % 180 == 0) for (let i = 0; i < 3; i++) spawn(1, e.x + i * 6 - 6, e.y + 12);
    }
    e.x = clamp(e.x + vx, 2, WW - 2); e.y = clamp(e.y + vy, 2, WH - 2);
    near(e.x, e.y, o => {                            // keep them off each other, each pair once
      if (o.id <= e.id) return;
      const ox = o.x - e.x, oy = o.y - e.y, od = hyp(ox, oy), m = e.r + o.r;
      if (od < m && od) { const q = (m - od) / od * .3; e.x -= ox * q; e.y -= oy * q; o.x += ox * q; o.y += oy * q; }
    });
    drain(e.x, e.y, d0[6]);
    if (d < e.r + 5) { hurtP(d0[4]); if (p.horn || mech) damage(e, mech ? 4 : .5); }   // WHITE LIGHT tramples
  });
  const dead = en.filter(e => e.hp <= 0); en = en.filter(e => e.hp > 0);   // deaths after the cull: what they spawn joins the new list
  dead.forEach(e => {
    const d0 = EK[e.k], boss = isB(e); kills++;
    combo++; comboT = 90; bestC = Math.max(bestC, combo); xp += d0[5] * (1 + combo / 40);
    if (e.k == 5) { paint(e.x, e.y, 1, -.7); for (let i = 0; i < 6; i++) fx.push({ x: e.x, y: e.y, vx: rs() * 2 - 1, vy: rs() * 2 - 1, l: 20, c: C(0, 30, 0) }); }   // a blot splats
    else paint(e.x, e.y, (boss ? 4 : e.k == 2) + p.bloom, 1);   // the colour it was holding goes back to the meadow
    boom(e.x, e.y, 4 + e.r, HUES[kills % 7]);
    for (let i = 0; i < 4 + e.r && fx.length < 2500; i++) fx.push({ x: e.x, y: e.y, vx: rs() * 4 - 2, vy: rs() * 4 - 2, l: 15 + rs() * 15, c: C(HUES[i % 7], 62) });
    if (inView(e.x, e.y) && kills % 3 == 0) snd(fq(CH[(mstep / 12 | 0) % 4] + PENT[Math.min(9, combo >> 1)], boss ? 1 : 3), .14, 'square', .04, boss ? 30 : 0);   // a pop in key, climbing with the combo
    if (e.k == 2) for (let i = 0; i < 3; i++) spawn(0, e.x + rs() * 12 - 6, e.y + rs() * 12 - 6);
    if (boss) { bossK++; say(BM[e.k]); shake = 12; hstop = 10; flash = 8; boom(e.x, e.y, 60); for (let i = 0; i < 3; i++) pu.push({ x: e.x + i * 10 - 10, y: e.y, k: [7, 8, 1 + rs() * 6 | 0][i], t: 0 }); }
    if (p.thunder && rs() < .5) arc(e.x, e.y, 0, 2, 1);
    const r = rs() / p.luck; let dr = DROP.find(d => r < d[0]);
    if (dr && dr[1] > 8 && dr[1] < 13) { if (t - puT < 1200) dr = 0; else puT = t; }   // nova, hourglass, shield, sugar: one every twenty seconds at most
    if (dr && dr[1] == 0) { if (t - hT < 240) dr = 0; else hT = t; }                  // a heart every four seconds at most, however lucky
    if (dr) pu.push({ x: e.x, y: e.y, k: dr[1] < 0 ? 1 + rs() * 6 | 0 : dr[1], t: 0 });
  });
  hashAll();                                         // the bullets look things up next, in the new list
  if (comboT && !--comboT) combo = 0;
  if (xp >= nxt) { lvl++; nxt = nxt * 1.6 + 40 | 0; levelUp(); }
}
const damage = (e, n) => { e.hp -= n; e.hit = 3; };
/* three cards. Each rolls its own rarity, then draws a perk of that rarity
   you can still take; if that shelf is empty it steps down a shelf. */
function levelUp() {
  const p = P; opts = [];
  while (opts.length < 3) {
    let r = 0, roll = rs() * 100; for (let i = 4; i > 0; i--) if (roll < RW[i]) { r = i; break; } else roll -= RW[i];
    for (; r >= 0; r--) {
      const pool = PK.filter(k => k[2] == r && (p.c[k[0]] || 0) < k[3] && !opts.includes(k));
      if (pool.length) { opts.push(pick(pool)); break; }
    }
    if (r < 0) break;
  }
  sel = 0; st = 'perk'; snd(880, .3, 'triangle', .05, 1760);
}
function stepPickups() {
  const p = P;
  pu = pu.filter(u => {
    u.t++; const dx = p.x - u.x, dy = p.y - u.y, d = hyp(dx, dy);
    if (d < (p.magnet ? 64 : u.k == 13 ? 36 : 0)) { u.x += dx / d * 1.8; u.y += dy / d * 1.8; }   // a short pull: shards always, everything with POT OF GOLD
    if (d < 9) {
      const k = u.k;
      if (k >= 1 && k < 7) { wep = k; ammo = WP[k][2] * (p.belt ? 2 : 1); say(WP[k][0]); snd(700, .15, 'square', .04, 1400); return 0; }
      if (k == 13) {                                                       // five shards make WHITE LIGHT: twelve seconds of everything
        if (++shards < 5) { say('SHARD ' + shards + '/5', 60); snd(900 + shards * 200, .15, 'sine', .04, 1800 + shards * 400); }
        else { shards = 0; mech = 480; flash = 10; shake = 6; say('WHITE LIGHT'); snd(400, .8, 'triangle', .07, 3200); sh(.6, .08, 5000); }
        return 0;
      }
      say(PN[k]);
      if (!k) { p.hp = Math.min(p.mhp, p.hp + 20); snd(500, .2, 'sine', .05, 1000); }
      else if (k == 7) { xp += 4 + wave * 2; snd(1200, .1, 'square', .04); snd(1800, .2, 'square', .04); }
      else if (k == 8) { paint(u.x, u.y, 7, 1); boom(u.x, u.y, 50); snd(300, .5, 'triangle', .06, 1200); for (let i = 0; i < 40; i++) fx.push({ x: u.x, y: u.y, vx: cos(i / 6.4) * 3, vy: sin(i / 6.4) * 3, l: 25, c: C(HUES[i % 7], 62) }); }
      else if (k == 9) { en.forEach(e => { if (inView(e.x, e.y)) e.hp -= isB(e) ? 100 : 999; }); flash = 12; shake = 12; hstop = 6; boom(p.x, p.y, 120, 0); sh(1, .12, 600); }
      else if (k == 10) { frz = 360; snd(1500, .8, 'sine', .04, 200); }
      else if (k == 11) { p.inv = 420; snd(600, .3, 'triangle', .05, 1200); }
      else { rush = 540; snd(900, .1, 'square', .04, 1800); snd(1350, .2, 'square', .04, 2700); }
      return 0;
    }
    return u.t < 900;
  });
}
