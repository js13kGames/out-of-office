# Speed zoom (shelved 2026-09-12)

Removed entirely for bytes on 2026-09-12 (machinery and speed link). The speed link, once the machinery below is back:

    70_player.js, in stepPlayer after the move:  p.mv = d * sp;
    90_loop.js, in tick before setZ():            zm += (1 / (1 + (P.mv || 0) * .2) - zm) * .04;

The original write-up follows.

The camera zoomed out the faster the unicorn ran: `zm` eased toward
`1 / (1 + speed * .2)` (about 0.78 at a full gallop), the view was `vw = 320 / zm`
by `vh = 180 / zm` world pixels, the world was drawn one pixel per world pixel
on its own canvas `WC` (resized in whole pixels, about the centre), then shrunk
smoothly onto the fixed 320 x 180 screen so the page's upscale stayed a whole
number. The HUD drew on the screen; world-to-screen conversions used
`zs = 320 / vw` (edge markers, combo text); the mouse went the other way
(`mx * vw / W + camX`). Any non-play screen eased `zm` back to 1.

Shelved because the fractional downscale softened the pixel art and the extra
canvas cost bytes; the design is sound if it comes back. Pieces to restore:

## state (30_state.js)
    zm = 1, vw = W, vh = H   // zoom, and how much world the view covers
    newGame: zm = 1; setZ(); camX = P.x - vw / 2; camY = P.y - vh / 2;

## boot (00_boot.js)
    const [WC, WX] = gcv(W, H);   // the world canvas, source-over
/* zoom: the world canvas grows in whole pixels; resizing a canvas resets its context, so the flags go back on */
function setZ() {
  const w = W / zm | 0, h = H / zm | 0; if (w == vw) return;
  camX += (vw - w) / 2; camY += (vh - h) / 2;       // grow or shrink about the centre of the view, not its corner
  vw = w; vh = h;
  [[WC, w, h], [G1, w, h], [G2, w / 4, h / 4], [G3, w / 8, h / 8], [G4, w / 16, h / 16]].forEach(([c, a, b], i) => { c.width = a; c.height = b; const x = c.getContext('2d'); x.globalCompositeOperation = i > 1 ? 'copy' : 'source-over'; x.imageSmoothingEnabled = false; });
}
const fitCV = () => {
  let k = Math.min((innerWidth || 320) / 320, (innerHeight || 180) / 180);
  if (k >= 2) k |= 0;
  CV.style.width = 320 * k + 'px'; CV.style.height = 180 * k + 'px';
};
addEventListener('resize', fitCV); fitCV();

## player (70_player.js)
    p.mv = d * sp;   // how fast you are going, in stepPlayer
    aim: p.an = atan2(my * vh / H + camY - p.y, mx * vw / W + camX - p.x);

## loop (90_loop.js)
    tick, not playing: zm += (1 - zm) * .1; setZ(); return;
    tick, playing:     zm += (1 / (1 + (P.mv || 0) * .2) - zm) * .04; setZ();
    camera clamps use vw/vh; render draws the world with X = WX, then
    X = MX; X.imageSmoothingEnabled = true; X.drawImage(WC, 0, 0, W, H); X.imageSmoothingEnabled = false;

## draw (80_draw.js)
    bloom() sizes G1..G4 from vw/vh and ends with X = WX
    hud(): const zs = 320 / vw; markers and the combo text multiply (x - camX) by zs
    everything that tested the view (inView, meadow, walls, spawn, flood, bounce, minimap rect) used vw/vh
