/* ---------- input -----------------------------------------------
   Keys: WASD or arrows move; the mouse aims; hold the button to fire. Touch: drag on the left half to
   move, drag on the right half to aim and fire. M mutes.               */
const K = {};
let mx = W / 2, my = 0, jt = 0, fire = 0, jx = 0, jy = 0, jid = -1, jox = 0, joy = 0, aid = -1, aox = 0, aoy = 0, ax = 0, ay = 0, touch = 0;
const wake = () => { if (!lit) { lit = 1; ac(); snd(880, .08, 'sine', .04, 1320); } };
addEventListener('keydown', e => {
  const k = e.key.toLowerCase(); K[k] = 1;
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
  wake();
  if (k == 'm') mute ^= 1;
  if (e.repeat) return;
  if (k == 'shift' || k == 'q' || k == 'e') blink();
  if (st == 'perk') {
    if (k == 'arrowleft' || k == 'a') sel = (sel + 2) % 3;
    else if (k == 'arrowright' || k == 'd') sel = (sel + 1) % 3;
    else if (k >= '1' && k <= '3') { sel = +k - 1; take(); }
    else if (k == ' ' || k == 'enter') take();
    return;
  }
  if (st != 'play') menu();
});
addEventListener('keyup', e => K[e.key.toLowerCase()] = 0);
function pos(e) { const b = CV.getBoundingClientRect(); return [(e.clientX - b.left) / b.width * W, (e.clientY - b.top) / b.height * H]; }
CV.oncontextmenu = e => e.preventDefault();
CV.addEventListener('pointerdown', e => {
  wake(); const [x, y] = pos(e); touch = e.pointerType != 'mouse';
  if (st == 'perk') { const i = (x - 12) / 100 | 0; if (i >= 0 && i < 3) { sel = i; take(); } return; }
  if (st != 'play') return menu();
  if (y > H - 10 && x > W - 12) { mute ^= 1; return; }
  CV.setPointerCapture(e.pointerId);
  if (e.button == 2) return blink();
  if (!touch) { mx = x; my = y; fire = 1; return; }   // screen space; 70_player adds the camera
  if (x < W / 2) { jid = e.pointerId; jox = x; joy = y; jx = jy = 0; jt = t; }
  else { aid = e.pointerId; aox = x; aoy = y; ax = ay = 0; }
});
CV.addEventListener('pointermove', e => {
  const [x, y] = pos(e);
  if (!touch) { mx = x; my = y; return; }
  const stick = (ox, oy) => { const dx = x - ox, dy = y - oy, d = hyp(dx, dy); return d > 3 ? [dx / d, dy / d, d] : [0, 0, 0]; };
  if (e.pointerId == jid) { const [x1, y1, d] = stick(jox, joy); jx = x1 * Math.min(1, d / 12); jy = y1 * Math.min(1, d / 12); }
  if (e.pointerId == aid) { const [x1, y1, d] = stick(aox, aoy); ax = x1; ay = y1; fire = d > 3; }
});
for (const ev of ['pointerup', 'pointercancel']) addEventListener(ev, e => {
  if (e.pointerId == jid) { if (t - jt < 12 && !jx && !jy) blink(); jid = -1; jx = jy = 0; }   // a quick tap on the move half blinks
  if (e.pointerId == aid) { aid = -1; ax = ay = 0; fire = 0; }
  if (!touch) fire = 0;
});
function menu() {
  if (st == 'title') newGame();
  else if (st == 'over' && t - stT > 60) { st = 'title'; }
}
function take() {                                   // the chosen perk
  const o = opts[sel]; o[4](P); P.c[o[0]] = (P.c[o[0]] || 0) + 1; say(o[0]); snd(660, .2, 'triangle', .05, 1320); st = 'play';
}
