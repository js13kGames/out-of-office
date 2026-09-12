/* ============================================================
   OUT OF OFFICE  -  js13k draft
   A top-down arena survival shooter in the Crimsonland mould, with a unicorn.
   The Grey pours in from every edge and drains the colour out of the meadow;
   your horn is a prism and every shot is a rainbow. Kill things, pick up
   prisms, choose perks, keep the world in colour.
   Everything is generated from code: no images, no audio files, no fonts.
   ============================================================ */
const CV = document.getElementById('cv'), MX = CV.getContext('2d');   // two letters: the packer's decoder owns the single ones
let X = MX;                                          // what everything draws to; the bloom pass points it at the glow layer for a moment
/* bloom: everything that shines is drawn again onto G1, shrunk to a quarter
   and an eighth (the bilinear shrink is the blur), then added back over the
   frame with 'lighter'. Three canvases, five drawImages a frame.       */
const gcv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.globalCompositeOperation = 'copy'; return [c, x]; };
const W = 320, H = 180;                 // virtual resolution, 16:9, CSS upscales it
CV.width = W; CV.height = H;
X.imageSmoothingEnabled = false;
const [G1, G1X] = gcv(W, H), [G2, G2X] = gcv(W / 4, H / 4), [G3, G3X] = gcv(W / 8, H / 8), [G4, G4X] = gcv(W / 16, H / 16);
const [MM, MMX] = gcv(64, 36);                        // the map
G1X.globalCompositeOperation = MMX.globalCompositeOperation = 'source-over';
const fitCV = () => {                                // fill the window at a whole-number scale (any scale under two)
  let k = Math.min((innerWidth || W) / W, (innerHeight || H) / H);
  if (k >= 2) k |= 0;
  CV.style.width = W * k + 'px'; CV.style.height = H * k + 'px';
};
addEventListener('resize', fitCV); fitCV();
