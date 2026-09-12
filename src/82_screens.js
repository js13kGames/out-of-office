/* ---------- screens ------------------------------------------------- */
function title() {
  X.save(); X.translate(-camX, -camY); walls(); meadow(); X.restore();
  R(0, 0, W, H, C(260, 8, 30, .45));
  for (let i = 0; i < 7; i++) R(40, 58 + i * 3, 240, 3, C(HUES[i], 60, 90, .5));                   // a bow behind the name
  txt('OUT OF OFFICE', W / 2, 40, C(0, 100, 0), 4, 1, t / 6 % 7 | 0);
  X.save(); X.translate(W / 2, 96); X.scale(3, 3); X.drawImage(uni(t / 12 & 1), -7, -4); X.restore();
  txt('< ' + DN[dif] + ' >', W / 2, 114, C(45, 80), 1, 1);
  txt('THE GREY IS COMING. STAY COLOURFUL.', W / 2, 128, C(0, 90, 0), 1, 1);
  txt('WASD MOVE   MOUSE AIM   HOLD TO FIRE   SHIFT: BLINK', W / 2, 140, C(0, 70, 0), 1, 1);
  txt('F: FULLSCREEN   M: SOUND', W / 2, 148, C(0, 60, 0), 1, 1);
  if (t / 30 & 1) txt('PRESS ANY KEY', W / 2, 159, C(45, 80), 1, 1);
  if (best) txt('BEST ' + best + ' KILLS   ' + ACH.filter((a, i) => ach >> i & 1).length + '/' + ACH.length + ' UNLOCKED', W / 2, 170, C(0, 60, 0), 1, 1);
}
const cardX = i => 12 + i * 100;                    // three cards of 96, centred
function perkScreen() {
  R(0, 0, W, H, C(260, 8, 30, .6));
  const y = H / 2 - 40 | 0;
  txt('LEVEL ' + lvl, W / 2, y - 26, C(0, 100, 0), 2, 1);
  opts.forEach((o, i) => {
    const x = cardX(i), on = i == (mx - 12) / 100 | 0, r = o[2], rc = RC[r], leg = r == 4;   // the card under the mouse lights up
    R(x, y, 96, 80, on ? C(leg ? HUES[(t / 8 | 0) % 7] : rc[0], leg ? 60 : rc[1] + 15, rc[2]) : C(rc[0], rc[1] * .5, rc[2] * .6));
    R(x + 2, y + 2, 92, 76, C(260, 8, 20));
    txt(i + 1, x + 8, y + 8, C(45, 80), 2);
    txt(RN[r], x + 88, y + 8, C(rc[0], rc[1], rc[2]), 1, 2, leg ? t / 5 % 7 | 0 : -1);
    txt(o[0], x + 48, y + 32, C(0, 100, 0), 1, 1);
    txt(o[1], x + 48, y + 48, C(0, 70, 0), 1, 1);   // every description fits one line of 22
  });
  txt('CHOOSE' + (rr ? '' : ' OR R: REROLL'), W / 2, y + 100, C(0, 60, 0), 1, 1);
}
function overScreen() {
  R(0, 0, W, H, C(260, 8, 20, .7));
  txt('THE GREY GOT YOU', W / 2, 40, C(0, 100, 0), 2, 1);
  txt(kills + ' KILLS   WAVE ' + wave + '   LEVEL ' + lvl, W / 2, 80, C(0, 90, 0), 1, 1);
  const sec = tm / 60 | 0;
  txt('SURVIVED ' + (sec / 60 | 0) + ':' + (sec % 60 < 10 ? '0' : '') + sec % 60 + '   BEST COMBO X' + bestC + '   ASH ' + (gry * 100 | 0) + '%', W / 2, 92, C(0, 70, 0), 1, 1);
  if (kills >= best) txt('A NEW BEST', W / 2, 108, C(45, 80), 1, 1, t / 5 % 7 | 0);
  if (t - stT > 60) txt('PRESS ANY KEY', W / 2, 140, C(0, 60, 0), 1, 1);
}
