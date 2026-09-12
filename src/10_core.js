/* ---------- micro helpers ------------------------------------ */
const C = (h, l = 60, s = 80, a = 1) => `hsla(${h|0},${s}%,${l}%,${a})`;   // comma form: node-canvas needs it
const R = (x, y, w, h, c) => { X.fillStyle = c; X.fillRect(x | 0, y | 0, w, h); };
const PI = Math.PI, sin = Math.sin, cos = Math.cos, sqrt = Math.sqrt, abs = Math.abs, atan2 = Math.atan2;
const hyp = (a, b) => sqrt(a * a + b * b);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
let seed = 7;
const rs = () => (seed = seed * 48271 % 2147483647) / 2147483647;   // tiny PRNG
const pick = a => a[rs() * a.length | 0];
/* the seven bands, red first */
const HUES = [355, 25, 52, 120, 195, 235, 280];
