/* ---------- the meadow -------------------------------------------
   A grid of colour. sat[i] is how much is left in a cell: the grey drains it
   as it walks, kills and dying shots paint it back. Grey ground is slow ground,
   and if the whole meadow goes grey, that is the end too.               */
let fl = 0, fg = 0;                                // per cell: the flower (0 none; bit 6 set: species in bits 0-1, offset in 2-5), and how grown it is
const cell = (x, y) => clamp(x / 8 | 0, 0, GW - 1) + clamp(y / 8 | 0, 0, GH - 1) * GW;
function initMeadow() {
  sat = []; fh = []; fl = new Uint8Array(GW * GH); fg = new Float32Array(GW * GH);
  for (let i = 0; i < GW * GH; i++) {              // greens with a slow drift; a flower on a third of the cells, somewhere in the cell
    const x = i % GW, y = i / GW | 0;
    sat[i] = 1; fh[i] = 96 + sin(x * .32 + y * .1) * 22 + cos(y * .4 - x * .07) * 16;
    if (rs() < .33) { fl[i] = 64 | rs() * 64; fg[i] = 1; }
  }
}
function paint(x, y, rad, k) {                    // add k colour within rad cells of a point
  const cx = x / 8 | 0, cy = y / 8 | 0;
  for (let j = cy - rad; j <= cy + rad; j++) for (let i = cx - rad; i <= cx + rad; i++)
    if (i >= 0 && j >= 0 && i < GW && j < GH) { const n = i + j * GW; sat[n] = Math.min(1, sat[n] + k); }
}
function drain(x, y, k) {
  if (P.aura && hyp(x - P.x, y - P.y) < 48) return;
  const n = cell(x, y); sat[n] = Math.max(0, sat[n] - k); fg[n] = 0;      // and whatever walks there tramples the flower
}
/* only the cells in view are drawn; the camera translate is already applied */
function meadow() {
  const x0 = clamp(camX / 8 | 0, 0, GW - 1), y0 = clamp(camY / 8 | 0, 0, GH - 1), x1 = Math.min(GW, x0 + W / 8 + 2), y1 = Math.min(GH, y0 + H / 8 + 2);
  for (let p = 0; p < 2; p++) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {   // the ground first, then every flower, so none is painted over by the cell beside it
    const i = x + y * GW, s = sat[i], chk = (x + y) & 1, q = fl[i];
    if (p) { if (q) flower(x * 8 + 2 + (q >> 2 & 3), y * 8 + 1 + (q >> 4 & 3), q & 3, HUES[(q >> 2) % 7], fg[i] += (s - fg[i]) * .035, s, x + y); continue; }
    R(x * 8, y * 8, 8, 8, s < .3 ? C(0, 11 + chk * 3 + s * 10, 0) : C(fh[i], 20 + chk * 3 + 18 * s, 55 * s + 4));   // ash where the grey has walked
    if (!q && (x * 7 + y * 13) % 8 == 5) R(x * 8 + 5 - chk, y * 8 + 1 + chk * 4, 1, 3, C(fh[i], 30 + 16 * s, 40 * s + 4));   // a taller blade
  }
}
/* a flower: a sprout, a bud on a stem, then one of three blooms that opens
   as g (0..1) grows toward the colour of its cell, sways once open, and is
   trampled flat by anything that walks on it. Petals go grey with the ground. */
function flower(x, y, k, h, g, s, ph) {
  const st = C(110, 20 + 18 * s, 50 * s + 5), c = C(h, 30 + 42 * s, 85 * s + 5), c2 = C(h + 30, 50 + 35 * s, 80 * s + 5);
  if (g < .2) return R(x + 1, y + 3, 1, 1, st);                                       // a sprout
  R(x + 1, y + 2, 1, 2, st);                                                          // the stem
  if (g < .45) return R(x + 1, y + 1, 1, 1, c);                                       // a bud
  const w = sin(t * .05 + ph) > .6 && g > .8 ? 1 : 0, o = g > .8 ? 1 : 0;              // the sway, and the last petals
  if (k == 0) { R(x - o + w, y + 1, 3 + o * 2, 1, c); R(x + 1 + w, y - o, 1, 3 + o * 2, c); R(x + 1 + w, y + 1, 1, 1, C(52, 92, 100)); }         // a cross
  else if (k == 1) { R(x + w, y, 3, 3, c); if (o) { R(x + w, y, 1, 1, c2); R(x + 2 + w, y + 2, 1, 1, c2); } R(x + 1 + w, y + 1, 1, 1, C(h, 25, 60)); }   // a full head
  else { R(x + w, y, 1, 1, c); R(x + 2 + w, y, 1, 1, c); R(x + w, y + 2, 1, 1, c); R(x + 2 + w, y + 2, 1, 1, c); R(x + 1 + w, y + 1, 1, 1, o ? C(52, 92, 100) : c2); }   // four petals
}
/* the pit: the meadow is its floor and the edge of the world is a wall that
   leans away from you. A point b on the border has its top at
   b + (b - c) * k + (b - M) * e: a little perspective about the camera c and a
   fixed lean about the middle of the world M, so the four faces meet at the
   corners whatever the camera does. Drawn before the meadow, with the void. */
function walls() {
  const cx = camX + W / 2, cy = camY + H / 2, k = .22, e = .02;
  const T = (x, y, f = 1) => [x + ((x - cx) * k + (x - WW / 2) * e) * f, y + ((y - cy) * k + (y - WH / 2) * e) * f];
  R(camX - 9, camY - 9, W + 18, H + 18, C(260, 8, 5));                           // the void beyond the rim
  const Q = [[0, 0], [WW, 0], [WW, WH], [0, WH]], L = [34, 20, 14, 26];             // lit from the top left: each face its own light
  for (let i = 0; i < 4; i++) {
    const [ax, ay] = Q[i], [bx, by] = Q[(i + 1) % 4], [x1, y1] = T(ax, ay), [x2, y2] = T(bx, by);
    if (!inView(ax, ay, 400) && !inView(bx, by, 400) && !inView((ax + bx) / 2, (ay + by) / 2, 400)) continue;
    X.fillStyle = C(260, 14, L[i]); X.beginPath(); X.moveTo(ax, ay); X.lineTo(bx, by); X.lineTo(x2, y2); X.lineTo(x1, y1); X.fill();
    X.strokeStyle = C(260, 12, L[i] - 9); X.lineWidth = 1; X.beginPath();
    for (let s = 0; s <= 1; s += 40 / hyp(bx - ax, by - ay)) { const x = ax + (bx - ax) * s, y = ay + (by - ay) * s; if (inView(x, y, 80)) { const [tx, ty] = T(x, y); X.moveTo(x, y); X.lineTo(tx, ty); } }   // the planks
    for (let f = .35; f < 1; f += .35) { const [px, py] = T(ax, ay, f), [qx, qy] = T(bx, by, f); X.moveTo(px, py); X.lineTo(qx, qy); }   // the courses
    X.stroke();
  }
  X.lineWidth = 2; X.strokeStyle = C(260, 20, 8); X.strokeRect(1, 1, WW - 2, WH - 2);   // the foot of the wall
  X.strokeStyle = C(260, 22, 58); X.beginPath();                                     // the rim
  Q.forEach(([x, y], i) => { const [tx, ty] = T(x, y); i ? X.lineTo(tx, ty) : X.moveTo(tx, ty); }); X.closePath(); X.stroke();
}
