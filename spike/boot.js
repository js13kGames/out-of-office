/* ============================================================
   OUT OF OFFICE, first person  -  a spike
   The same game, seen through the unicorn's eyes. The simulation modules
   under ../src load unchanged; this file stands in for src/00_boot.js and
   gives them the two things they expect from it: the 320 x 180 canvas the HUD
   and screens draw on (here a transparent overlay on top of the WebGL view)
   and the little map canvas. fps.js does the rest.
   ============================================================ */
const CV = document.getElementById('cv'), MX = CV.getContext('2d');
let X = MX;
const gcv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.globalCompositeOperation = 'copy'; return [c, x]; };
const W = 320, H = 180;
CV.width = W; CV.height = H;
X.imageSmoothingEnabled = false;
const [MM, MMX] = gcv(64, 36);
MMX.globalCompositeOperation = 'source-over';
/* the overlay fills the window at a whole-number scale, centred, like the 2D game */
const fitCV = () => {
  let k = Math.min(innerWidth / W, innerHeight / H);
  if (k >= 2) k |= 0;
  CV.style.width = W * k + 'px'; CV.style.height = H * k + 'px';
  CV.style.left = (innerWidth - W * k) / 2 + 'px'; CV.style.top = (innerHeight - H * k) / 2 + 'px';
};
addEventListener('resize', fitCV); fitCV();
