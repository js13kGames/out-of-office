/* ---------- loop ------------------------------------------------------ */
let last = 0, acc = 0;
function frame(now) {
  requestAnimationFrame(frame);
  acc += Math.min(50, now - last); last = now;
  music();
  while (acc > 16.6) { acc -= 16.6; tick(); }
  render();
}
function tick() {
  t++;
  if (st != 'play' || paused) return;
  if (hstop) return hstop--;                        // hit-stop: a boss dying, a nova
  tm++; if (frz) frz--; if (rush) rush--; if (flash) flash--; if (bl) bl--; if (mech) mech--;
  if (!dead) { stepPlayer(); stepWaves(); }
  stepWells();
  camX += (clamp(P.x - W / 2, -48, WW - W + 48) - camX) * .12; camY += (clamp(P.y - H / 2, -48, WH - H + 48) - camY) * .12;   // a little past the edge, so you see the wall
  stepEnemies(); stepBullets(); stepPickups();
  fx = fx.filter(f => { f.x += f.vx; f.y += f.vy; return --f.l > 0; });
  if (t % 30 == 0) {
    let g = 0;                                        // the map: one pixel per five cells, and the field's grey share
    for (let y = 0; y < 36; y++) for (let x = 0; x < 64; x++) { const v = sat[x * 5 + y * 5 * GW], a = v < .3; g += a; MMX.fillStyle = a ? C(0, 8, 0) : C(110, 22 + 14 * v, 45); MMX.fillRect(x, y, 1, 1); }
    gry = g / 2304;
    ACH.forEach((a, i) => { if (!(ach >> i & 1) && a[1]()) { ach |= 1 << i; try { localStorage.OOO_ach = ach; } catch (e) {} say('UNLOCKED: ' + a[0], 180); snd(1000, .4, 'triangle', .05, 2000); } });
  }
  if (dead && t - stT > 90) { st = 'over'; stT = t; if (kills > best) { best = kills; try { localStorage.OOO_best = best; } catch (e) {} } }
  if (shake) shake--;
}
function render() {
  X.save();
  if (shake && st == 'play') X.translate(rs() * shake - shake / 2 | 0, rs() * shake - shake / 2 | 0);   // whole pixels, or every rectangle blurs
  if (st == 'title') title();
  else {
    X.save(); X.translate(-(camX | 0), -(camY | 0));
    walls(); meadow(); drawWells(); drawGoo(); drawPickups(); drawEnemies(); drawBullets(); drawPlayer(); drawFx();
    X.restore(); bloom();
    hud();
    if (st == 'perk') perkScreen();
    if (st == 'over') overScreen();
    if (paused) { R(0, 0, W, H, C(260, 8, 20, .5)); txt('PAUSED', W / 2, 80, C(0, 100, 0), 2, 1); }
    if (P.inv > 24) R(0, 0, W, H, C(0, 60, 90, .06));
  }
  X.restore();
}
initMeadow(); camX = 160; camY = 90;
requestAnimationFrame(frame);
