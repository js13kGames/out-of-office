/* ---------- 3x5 pixel font ------------------------------------
   Three columns per glyph, one base-32 character per column, bit r = row r.
   A character not in FK draws nothing (space, on purpose).            */
const FK = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ.!-:?/+><',%",
      FD = "VHVIVGPLIHLV74VNL9ULT1T3RLRNLFU5UVLAEHHVHEVLHV51EHTV4VHVH8GFV4RVGGV6VV1UEHEV5269MV5QIL91V1FGVFGFVCVR4R3S3PLJ0G00N04440A01L2O434E4HA44AH030G8094I";
/* al: 0 left, 1 centre, 2 right. rb >= 0: rainbow text, hue rb + band per letter */
function txt(s, x, y, c, sc = 1, al = 0, rb = -1) {
  s = (s + '').toUpperCase();
  const w = s.length * 4 * sc - sc;
  if (al == 1) x -= w / 2 | 0; else if (al == 2) x -= w;
  for (let i = 0; i < s.length; i++, x += 4 * sc) {
    const k = FK.indexOf(s[i]);
    if (k < 0) continue;
    const col = rb >= 0 ? C(HUES[(rb + i) % 7], 65) : c;
    for (let j = 0; j < 3; j++) { const v = parseInt(FD[k * 3 + j], 32);
      for (let r = 0; r < 5; r++) if (v >> r & 1) R(x + j * sc, y + r * sc, sc, sc, col); }
  }
}
