/* ---------- input -----------------------------------------------
   Keys: WASD or arrows move; the mouse aims; hold the button to fire; Shift,
   Q, E or the right button blinks. P or Escape pauses, F goes fullscreen. R
   rerolls the perks once a level; the cards themselves are clicked. Left and
   right pick the difficulty on the title. M mutes.                        */
const K = {};
let mx = W / 2, my = 0, fire = 0;
const wake = () => { if (!lit) { lit = 1; ac(); snd(880, .08, 'sine', .04, 1320); } };
addEventListener('keydown', e => {
  const k = e.key.toLowerCase(); K[k] = 1;
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
  wake();
  if (k == 'm') mute ^= 1;
  if (e.repeat) return;
  if (k == 'shift' || k == 'q' || k == 'e') blink();
  if (st == 'play' && (k == 'p' || k == 'escape')) paused ^= 1;
  if (k == 'f') CV.requestFullscreen();
  if (st == 'perk') { if (k == 'r' && !rr) { rr = 1; levelUp(); } return; }   // cards are clicked; R is one reroll a level
  if (st == 'title' && (k == 'arrowleft' || k == 'arrowright' || k == 'a' || k == 'd')) { dif = (dif + (k == 'arrowleft' || k == 'a' ? 2 : 1)) % 3; return; }
  if (st != 'play') menu();
});
addEventListener('keyup', e => K[e.key.toLowerCase()] = 0);
function pos(e) { const b = CV.getBoundingClientRect(); return [(e.clientX - b.left) / b.width * W, (e.clientY - b.top) / b.height * H]; }
CV.oncontextmenu = e => e.preventDefault();
CV.addEventListener('pointerdown', e => {
  wake(); const [x, y] = pos(e);
  if (st == 'perk') { const i = (x - 12) / 100 | 0; if (i >= 0 && i < 3) { sel = i; take(); } return; }
  if (st != 'play') return menu();
  if (y > H - 10 && x > W - 12) { mute ^= 1; return; }
  CV.setPointerCapture(e.pointerId);
  if (e.button == 2) return blink();
  mx = x; my = y; fire = 1;                          // screen space; 70_player adds the camera
});
CV.addEventListener('pointermove', e => { [mx, my] = pos(e); });
for (const ev of ['pointerup', 'pointercancel']) addEventListener(ev, () => fire = 0);
function menu() {
  if (st == 'title') newGame();
  else if (st == 'over' && t - stT > 60) { st = 'title'; }
}
function take() {                                   // the chosen perk
  const o = opts[sel]; o[4](P); P.c[o[0]] = (P.c[o[0]] || 0) + 1; say(o[0]); snd(660, .2, 'triangle', .05, 1320); st = 'play';
}
