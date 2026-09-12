/* ---------- sprites: pixel strings baked once -------------------
   Rows of characters, one per pixel; the palette is a function of the
   character and its position, so the mane can be seven hues by column.
   Every sprite gets a one-pixel dark rim for free: the canvas is padded by
   one and each filled pixel first paints a 3x3 of rim colour under itself. */
const SPR = {};
function spr(id, rows, pal) {
  if (SPR[id]) return SPR[id];
  const cv = document.createElement('canvas');
  cv.width = rows[0].length + 2; cv.height = rows.length + 2;
  const x = cv.getContext('2d');
  x.fillStyle = C(260, 10, 30);
  rows.forEach((r, y) => [...r].forEach((ch, i) => { if (ch != '.') x.fillRect(i, y, 3, 3); }));
  rows.forEach((r, y) => [...r].forEach((ch, i) => { if (ch != '.') { x.fillStyle = pal(ch, i, y); x.fillRect(i + 1, y + 1, 1, 1); } }));
  return SPR[id] = cv;
}
/* the unicorn from above, rearing, nose to the right: 12 x 7. Head and
   shoulders, the mane down the crest in the seven hues by column, the tail
   the seven by row, the forehooves up at its sides. Two frames of hooves. */
const UNI = [
  ['....FF......', 'T..BMMMB....', 'TT.BMMMMBE..', 'TTBBMMMMBBHH', 'TT.BMMMMBE..', 'T..BMMMB....', '......FF....'],
  ['......FF....', 'T..BMMMB....', 'TT.BMMMMBE..', 'TTBBMMMMBBHH', 'TT.BMMMMBE..', 'T..BMMMB....', '....FF......']];
const uniPal = (ch, i, y) => ch == 'B' ? C(40, 94, 30) : ch == 'H' ? C(45, 62, 100) : ch == 'E' ? C(40, 82, 30)
  : ch == 'F' ? C(280, 32, 40) : ch == 'M' ? C(HUES[(i - 3) % 7], 58) : C(HUES[y % 7], 58);
const uni = f => spr('u' + f, UNI[f], uniPal);
const FOAL = [['.F..F.....', 'TBBMMMBBE.', 'TBBMMMBBBH', 'TBBMMMBBE.', '..F..F....'], ['..F..F....', 'TBBMMMBBE.', 'TBBMMMBBBH', 'TBBMMMBBE.', '.F..F.....']];   // a small unicorn: mane, tail and a horn nub
const foalS = f => spr('o' + f, FOAL[f], (ch, i, y) => ch == 'B' ? C(40, 90, 30) : ch == 'E' ? C(40, 75, 30) : ch == 'F' ? C(280, 30, 40) : uniPal(ch, i + 1, y + 1));
/* the grey: a blob with eyes that squashes as it walks, and a moth with two frames of wing */
const DRAB = [['..GGGGGG..', '.GGGGGGGG.', 'GGgGGGGgGG', 'GGGGGGGGGG', 'GGGGGGGGGG', '.GGGGGGGG.', '..GGGGGG..'],
              ['..........', '.GGGGGGGG.', 'GGgGGGGgGG', 'GGGGGGGGGG', 'GGGGGGGGGG', '.GGGGGGGG.', '..GGGGGG..']];
const MOTH = [['WW.....WW', 'WWW.g.WWW', '.WWWgWWW.', '..WWgWW..'], ['.........', '.WW.g.WW.', '..WWgWW..', '...WgW...']];
const grey = (ch, i, y) => ch == 'g' ? C(0, 8, 0) : ch == 'W' ? C(0, 64, 0) : C(0, 40 + (y % 2) * 6, 0);
const drab = f => spr('d' + f, DRAB[f], grey), moth = f => spr('m' + f, MOTH[f], grey);
/* a spitter with its mouth open and shut, a blot, and a shade with white eyes */
const SPIT = [['..GGGGG..', '.GGgGgGG.', 'GGGGGGGGG', 'GGkkkkkGG', 'GGGkkkGGG', '.GGGGGGG.', '..GGGGG..'],
              ['..GGGGG..', '.GGgGgGG.', 'GGGGGGGGG', 'GGGGGGGGG', 'GGGkkkGGG', '.GGGGGGG.', '..GGGGG..']];
const BLOT = [['.G..G.', 'GGGGGG', '.GGGG.', 'GGgGGG', '.GGGG.', 'G..G.G'], ['G..G..', '.GGGG.', 'GGGGGG', 'GGgGGG', '.GGGG.', '.G..GG']];
const SHADE = [['..GGGG..', '.GGGGGG.', 'GGwGGwGG', 'GGGGGGGG', 'GGGGGGGG', '.GGGGGG.', 'G.G..G.G'], ['..GGGG..', '.GGGGGG.', 'GGwGGwGG', 'GGGGGGGG', 'GGGGGGGG', '.GGGGGG.', '.G.GG.G.']];
const grey2 = (ch, i, y) => ch == 'k' ? C(0, 3, 0) : ch == 'w' ? C(0, 96, 0) : grey(ch, i, y);
const spit = f => spr('p' + f, SPIT[f], grey2), blot = f => spr('b' + f, BLOT[f], grey2),
      shade = f => spr('h' + f, SHADE[f], (ch, i, y) => ch == 'w' ? C(0, 96, 0) : C(0, 16 + (y % 2) * 4, 0));
/* draw a sprite centred on a point, optionally rotated; nearest-neighbour keeps it chunky */
function rot(cv, x, y, an) {
  if (!an) return X.drawImage(cv, (x | 0) - (cv.width / 2 | 0), (y | 0) - (cv.height / 2 | 0));
  X.save(); X.translate(x | 0, y | 0); X.rotate(an); X.drawImage(cv, -cv.width / 2 | 0, -cv.height / 2 | 0); X.restore();
}
