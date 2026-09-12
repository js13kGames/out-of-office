/* ---------- inkwells ---------------------------------------------
   Where the grey comes from: every spawn burst climbs out of a well. A well
   is a hole full of grey ink that opens out of your sight, 260 to 600 px away,
   and bleeds the colour out of the ground around it. Shoot it dry and the
   colour floods back, with gold and something else on top. One opens every
   wave, up to ten, and if none is left another opens within four seconds;
   only with no well at all does the grey come in from the edge.          */
function addWell(seen) {                             // seen: the first one, on screen, so you learn where the grey comes from
  for (let n = 0; n < 40; n++) {
    const a = rs() * 7, r = seen ? 90 + rs() * 30 : 260 + rs() * 340, x = clamp(P.x + cos(a) * r, 40, WW - 40), y = clamp(P.y + sin(a) * r, 40, WH - 40);
    if ((inView(x, y, 60) && !seen) || we.some(w => hyp(w.x - x, w.y - y) < 160)) continue;      // out of sight, and not on top of another
    const hp = 60 * (1 + wave / 5);
    we.push({ x, y, hp, mh: hp, t: rs() * 200 | 0, hit: 0 }); return;
  }
}
function stepWells() {
  const p = P;
  we = we.filter(w => {
    w.t++; if (w.hit) w.hit--;
    if (w.t % 3 == 0) paint(w.x, w.y, 2, -.012);                        // it bleeds
    const dx = p.x - w.x, dy = p.y - w.y, d = hyp(dx, dy);
    if (d < 14 && d) { p.x = w.x + dx / d * 14; p.y = w.y + dy / d * 14; }   // you cannot stand in it
    if (w.hp > 0) return 1;
    xp += 25 + wave * 3; paint(w.x, w.y, 5, 1); say('INKWELL DRY'); shake = 8; hstop = 4; boom(w.x, w.y, 36);
    for (let i = 0; i < 50; i++) fx.push({ x: w.x, y: w.y, vx: rs() * 6 - 3, vy: rs() * 6 - 3, l: 20 + rs() * 25, c: C(HUES[i % 7], 62) });
    pu.push({ x: w.x - 6, y: w.y, k: 7, t: 0 }, { x: w.x + 6, y: w.y, k: [0, 8, 10, 11, 12, 1 + rs() * 6 | 0][rs() * 6 | 0], t: 0 });
    snd(700, .8, 'sawtooth', .16, 50); sh(.7, .22, 2500); snd(1400, .25, 'square', .08, 2800);   // the drain, and a splash
    return 0;
  });
}
function drawWells() {
  we.forEach(w => {
    if (!inView(w.x, w.y)) return;
    const x = w.x | 0, y = w.y | 0;
    R(x - 13, y - 9, 26, 18, C(0, 14, 0)); R(x - 9, y - 13, 18, 26, C(0, 14, 0));                 // the stained rim
    R(x - 11, y - 7, 22, 14, C(0, 22, 0)); R(x - 7, y - 11, 14, 22, C(0, 22, 0));
    R(x - 9, y - 5, 18, 10, C(0, 4, 0)); R(x - 5, y - 9, 10, 18, C(0, 4, 0));                    // the ink
    for (let i = 0; i < 4; i++) { const k = (w.t + i * 25) % 100; R(x - 6 + i * 4, y + 6 - k / 8, 2, 2, C(0, 30 + i * 8, 0, 1 - k / 100)); }   // bubbles
    if (w.hp < w.mh) R(x - 12, y - 16, 24 * w.hp / w.mh, 2, C(0, 80, 0));
    if (w.hit) { R(x - 9, y - 5, 18, 10, C(0, 100, 0, .5)); R(x - 5, y - 9, 10, 18, C(0, 100, 0, .5)); }
  });
}
