/* ---------- models ---------------------------------------------------
   Every creature and prop is a cage of boxes. Cages meant to be soft go
   through Catmull-Clark subdivision once or twice, which turns a box into a
   pebble and a stack of boxes into a body; cages meant to be sharp (a censor
   bar, a stapler, pixel lettering) stay at level zero. Each part is baked
   once into flat-shaded triangles under a fixed light, then stamped into the
   frame's mesh with a position, a yaw, a scale and a tint. Front is +x, which
   is the 2D game's angle zero, so a creature's yaw is minus its 2D heading.
   Small kinds come in two levels of detail: `hi` up close, `lo` further out;
   beyond that the scene falls back to a billboard.                      */

const rgb = (h, s, l) => {                            // hsl in 0..360, 0..1, 0..1 -> [r, g, b]
  const a = s * Math.min(l, 1 - l), f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return [f(0), f(8), f(4)];
};
const LIGHT = (() => { const l = [.45, 1, .35], n = Math.hypot(...l); return l.map(v => v / n); })();

/* a quad mesh: v = [[x, y, z]], f = [[a, b, c, d]] with outward, anticlockwise winding */
const cage = () => ({ v: [], f: [] });
function addBox(m, x0, y0, z0, x1, y1, z1) {
  const b = m.v.length;
  m.v.push([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
  for (const q of [[4, 5, 6, 7], [1, 0, 3, 2], [5, 1, 2, 6], [0, 4, 7, 3], [7, 6, 2, 3], [0, 1, 5, 4]]) m.f.push(q.map(i => i + b));
  return m;
}
/* a box centred on (x, y, z) with half sizes */
const cbox = (m, x, y, z, hx, hy, hz) => addBox(m, x - hx, y - hy, z - hz, x + hx, y + hy, z + hz);
function addQuad(m, a, b, c, d) { const k = m.v.length; m.v.push(a, b, c, d); m.f.push([k, k + 1, k + 2, k + 3]); return m; }
const avg = pts => { const o = [0, 0, 0]; for (const p of pts) { o[0] += p[0]; o[1] += p[1]; o[2] += p[2]; } return o.map(v => v / pts.length); };
/* one level of Catmull-Clark. Cages here are closed boxes, so every edge has two faces and no boundary rule is needed */
function catmull(m) {
  const fp = m.f.map(f => avg(f.map(i => m.v[i])));
  const key = (a, b) => a < b ? a + ',' + b : b + ',' + a;
  const edges = new Map();
  m.f.forEach((f, fi) => f.forEach((a, k) => { const b = f[(k + 1) % 4], kk = key(a, b); let e = edges.get(kk); if (!e) edges.set(kk, e = { a, b, faces: [] }); e.faces.push(fi); }));
  const vf = m.v.map(() => []), ve = m.v.map(() => []);
  m.f.forEach((f, fi) => f.forEach(i => vf[i].push(fp[fi])));
  edges.forEach(e => { const mid = avg([m.v[e.a], m.v[e.b]]); ve[e.a].push(mid); ve[e.b].push(mid); });
  const out = { v: m.v.map((p, i) => { const n = vf[i].length; if (!n) return p; const F = avg(vf[i]), R = avg(ve[i]); return [0, 1, 2].map(k => (F[k] + 2 * R[k] + (n - 3) * p[k]) / n); }), f: [] };
  const fpi = fp.map(p => out.v.push(p) - 1), epi = new Map();
  edges.forEach((e, kk) => epi.set(kk, out.v.push(avg([m.v[e.a], m.v[e.b], ...e.faces.map(fi => fp[fi])])) - 1));
  m.f.forEach((f, fi) => { for (let k = 0; k < 4; k++) { const a = f[k], b = f[(k + 1) % 4], d = f[(k + 3) % 4]; out.f.push([a, epi.get(key(a, b)), fpi[fi], epi.get(key(d, a))]); } });
  return out;
}
/* bake a cage into flat-shaded triangles: col(centre, normal) -> [r, g, b] */
function bake(m, col, levels = 0) {
  for (let i = 0; i < levels; i++) m = catmull(m);
  const pos = [], cols = [];
  for (const f of m.f) {
    const [a, b, c, d] = f.map(i => m.v[i]), cen = avg([a, b, c, d]);
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    const lit = .5 + .5 * Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) + .12 * Math.max(0, -ny);
    const cc = col(cen, [nx, ny, nz]).map(v => Math.min(1, v * lit));
    for (const p of [a, b, c, a, c, d]) { pos.push(p[0], p[1], p[2]); cols.push(cc[0], cc[1], cc[2]); }
  }
  return { pos: new Float32Array(pos), col: new Float32Array(cols), n: pos.length / 3 };
}
/* several baked parts as one model */
const model = (...parts) => ({ parts, n: parts.reduce((s, p) => s + p.n, 0) });
/* stamp: local +x turns to the 2D heading a; s scales, sy squashes, tint multiplies, alpha */
function stamp(mb, mdl, x, y, z, a, s = 1, tint = null, sy = 1, alpha = 1) {
  if (!mb.room(mdl.n)) return;
  const c = Math.cos(-a), sn = Math.sin(-a);
  for (const part of mdl.parts) {
    const P = part.pos, Cc = part.col, first = mb.nv;
    for (let i = 0, k = 0; i < part.n; i++, k += 3) {
      const lx = P[k] * s, ly = P[k + 1] * s * sy, lz = P[k + 2] * s;
      const r = tint ? Cc[k] * tint[0] : Cc[k], g = tint ? Cc[k + 1] * tint[1] : Cc[k + 1], b = tint ? Cc[k + 2] * tint[2] : Cc[k + 2];
      mb.vert(x + lx * c + lz * sn, y + ly, z - lx * sn + lz * c, [r, g, b, alpha]);
    }
    for (let i = 0; i < part.n; i += 3) mb.tri3(first + i, first + i + 1, first + i + 2);
  }
}
/* raised pixel lettering from the game's own 3x5 font: axis 'x' runs the text along x on a face at fixed z, 'z' runs it along -z on a face at fixed x */
function lettering(m, str, ox, oy, oz, px, depth, axis) {
  str = str.toUpperCase();
  for (let i = 0; i < str.length; i++) {
    const k = FK.indexOf(str[i]); if (k < 0) continue;
    for (let j = 0; j < 3; j++) { const v = parseInt(FD[k * 3 + j], 32);
      for (let r = 0; r < 5; r++) if (v >> r & 1) {
        const u = (i * 4 + j) * px, w = (4 - r) * px;
        if (axis == 'x') addBox(m, ox + u, oy + w, oz, ox + u + px, oy + w + px, oz + depth);
        else addBox(m, ox, oy + w, oz - u - px, ox + depth, oy + w + px, oz - u);
      } }
  }
  return m;
}
const grey = l => () => [l, l, l * 1.08];
const flat = c => () => c;
const white = flat([.96, .96, 1]), dark = flat([.03, .03, .04]);
/* two eyes on the front (+x) face: plain dark dots, or whites with a dark pupil */
const eyes = (x, y, z, s, l = .03, pupil) => {
  const m = cage();
  for (const side of [-1, 1]) { cbox(m, x, y, z + side * s * 2, s * .5, s, s); if (pupil) cbox(m, x + s * .5, y, z + side * s * 2, s * .3, s * .5, s * .5); }
  return bake(m, c => pupil && c[0] > x + s * .3 ? [.03, .03, .05] : [l, l, l * 1.2], 0);
};

const MODELS = {};
/* ---- the grey. build(L) makes a kind at body subdivision L; hi is L2, lo is L1 */
const kinds = {};
kinds.drab = L => model(
  bake(addBox(cage(), -.36, 0, -.3, .36, .72, .3), c => { const l = .38 + c[1] * .12 + (c[1] < .2 ? .06 : 0); return [l, l, l * 1.08]; }, L),
  bake(addBox(cage(), .2, .5, -.22, .34, .58, .22), grey(.3), L - 1),                              // the brow
  bake(cbox(cage(), .34, .24, 0, .02, .015, .1), dark, 0),                                        // a mouth
  bake(addBox(addBox(cage(), .14, 0, -.28, .34, .1, -.1), .14, 0, .1, .34, .1, .28), grey(.34), L - 1),   // two feet
  eyes(.33, .44, 0, .045, .03));
kinds.moth = (L, f) => model(
  bake(addBox(cage(), -.02, .32, -.07, .16, .48, .07), grey(.52), L),                            // thorax
  bake(addBox(cage(), -.26, .3, -.06, -.02, .44, .06), grey(.42), L),                            // abdomen
  bake(addBox(addBox(cage(), -.24, .38 + f * .12, .08, .12, .41 + f * .12, .46), -.24, .38 + f * .12, -.46, .12, .41 + f * .12, -.08),
    c => Math.abs(c[2]) > .3 && Math.abs(c[0] + .06) < .1 ? [.35, .35, .4] : [.68, .68, .72], L - 1),   // wings with a dark eyespot
  bake(addBox(addBox(cage(), .14, .48, .02, .16, .62, .04), .14, .48, -.04, .16, .62, -.02), grey(.3), 0),   // antennae
  eyes(.15, .42, 0, .025, .04));
kinds.spitter = (L, open) => model(
  bake(addBox(cage(), -.32, 0, -.3, .32, .82, .3), c => { const l = .4 + c[1] * .06; return [l, l * 1.02, l * 1.1]; }, L),
  bake(addBox(cage(), .18, .26, -.16, .36, .34 + open * .18, .16), dark, 0),                     // the mouth
  bake([-.12, -.04, .04, .12].reduce((m, z) => cbox(m, .34, .33 + open * .18, z, .015, .03, .02), cage()), white, 0),   // teeth
  bake([[-.1, .7, .18], [.05, .76, -.14], [-.2, .62, -.22]].reduce((m, p) => cbox(m, p[0], p[1], p[2], .05, .05, .05), cage()), grey(.5), L - 1),   // warts
  eyes(.31, .6, 0, .045, .03));
kinds.smudge = L => model(
  bake([[-.5, 0, -.45, .3, .5, .35], [-.2, .1, -.2, .55, .75, .5], [-.55, .05, -.05, .05, .6, .55], [.1, 0, -.5, .5, .4, -.1], [-.3, .3, .1, .2, .9, .5]].reduce((m, b) => addBox(m, ...b), cage()),
    c => { const l = .28 + c[1] * .16; return [l, l, l * 1.1]; }, L),
  bake([[.5, .05, .3], [-.45, .02, -.3], [.3, .04, -.45]].reduce((m, p) => cbox(m, p[0], p[1] + .1, p[2], .03, .12, .03), cage()), grey(.26), 0),   // drips
  eyes(.5, .5, .1, .055, .03));
kinds.blot = L => model(
  bake(addBox(cage(), -.15, 0, -.15, .15, .3, .15), grey(.4), L - 1),
  bake([0, 1, 2, 3, 4, 5, 6, 7].reduce((m, i) => { const a = i * Math.PI / 4; return cbox(m, Math.cos(a) * .14, .15 + (i % 2) * .1, Math.sin(a) * .14, .03, .09, .03); }, cage()), grey(.5), 0),   // spikes
  bake(cbox(addBox(cage(), .1, .1, -.06, .16, .2, .06), .16, .15, 0, .01, .025, .025), c => c[0] > .15 ? [.03, .03, .05] : [.95, .95, 1], 0));   // one big eye
kinds.shade = L => model(
  bake(addBox(addBox(cage(), -.3, 0, -.25, .3, .6, .25), -.22, .55, -.18, .22, .98, .18), grey(.17), L),   // hood on body
  bake(addBox(cage(), -.36, 0, -.32, .36, .12, .32), grey(.12), L - 1),                           // the cloak's flare
  bake(addBox(cage(), .18, .62, -.12, .24, .82, .12), flat([.06, .06, .09]), 0),                  // a dark face plate
  eyes(.24, .72, 0, .045, .96));
kinds.static = () => model(
  bake([[0, 0, 0, .3], [.2, .3, -.1, .2], [-.15, .25, .15, .22], [.05, .55, .05, .18], [-.2, .5, -.2, .14], [.25, .1, .2, .1], [-.28, .05, -.05, .12], [.1, .7, -.15, .09], [-.05, .78, .12, .08]]
    .reduce((m, p) => cbox(m, p[0], p[1] + p[3], p[2], p[3], p[3], p[3]), cage()), grey(.6), 0),
  bake(cbox(cage(), .02, .35, 0, .08, .08, .08), flat([.9, .9, 1]), 0));                          // a bright core
for (const k of ['drab', 'smudge', 'blot', 'shade']) MODELS[k] = { hi: kinds[k](2), lo: kinds[k](1) };
MODELS.moth = { hi: [0, 1].map(f => kinds.moth(2, f)), lo: [0, 1].map(f => kinds.moth(1, f)) };
MODELS.spitter = { hi: [0, 1].map(o => kinds.spitter(2, o)), lo: [0, 1].map(o => kinds.spitter(1, o)) };
MODELS.static = { hi: kinds.static(), lo: kinds.static() };
/* the model for an enemy in its current state: lod 0 up close, 1 further out */
function modelFor(e, lod) {
  const k = e.k, q = lod ? 'lo' : 'hi';
  if (k == 0) return MODELS.drab[q]; if (k == 1) return MODELS.moth[q][e.t / 3 & 1]; if (k == 2) return MODELS.smudge[q];
  if (k == 4) return MODELS.spitter[q][e.t % 90 < 12 ? 1 : 0]; if (k == 5) return MODELS.blot[q]; if (k == 6) return MODELS.shade[q]; if (k == 7) return MODELS.static[q];
  if (k == 3) return MODELS.censor; if (k == 8) return MODELS.eraser; if (k == 9) return MODELS.stapler[e.t % 120 > 96 || e.t % 120 < 12 ? 1 : 0];
  if (k == 10) return MODELS.stamp; if (k == 11) return MODELS.shredder; return MODELS.copier;
}
/* ---- the office */
MODELS.censor = model(
  bake(addBox(cage(), -1.15, 0, -.5, 1.15, .95, .5), dark, 0),
  bake(addBox(addBox(cage(), 1.05, 0, -.5, 1.35, .95, .5), -1.35, 0, -.5, -1.05, .95, .5), dark, 1),   // rounded ends
  bake(addBox(cage(), -1.2, .9, -.52, 1.2, .96, .52), flat([.2, .2, .24]), 0),                    // a lighter edge on top
  bake(lettering(cage(), 'CENSORED', 1.25, .3, 1.05, .07, .04, 'z'), white, 0),
  bake(lettering(cage(), 'CENSORED', -1.29, .3, 1.05, .07, .04, 'z'), white, 0));
MODELS.eraser = model(
  bake(addBox(cage(), -1, 0, -.55, 1, .75, .55), c => c[0] > .55 ? [.66, .58, .62] : [.5, .48, .55], 1),
  bake(addBox(cage(), -.35, -.01, -.57, .25, .77, .57), flat([.2, .22, .3]), 0),                   // the paper sleeve
  bake([[.6, .77, .2], [.8, .77, -.3], [.45, .77, -.1], [.9, .4, .57]].reduce((m, p) => cbox(m, p[0], p[1], p[2], .04, .01, .04), cage()), flat([.3, .28, .32]), 0));   // grit
MODELS.stapler = [0, 1].map(open => model(
  bake(addBox(cage(), -.9, 0, -.26, .9, .26, .26), grey(.36), 1),
  bake(addBox(cage(), .2, .26, -.2, .85, .3, .2), flat([.8, .8, .84]), 0),                        // the anvil plate
  bake(addBox(cage(), -.95, .12, -.24, -.65, .5, .24), grey(.28), 1),                             // the hinge
  bake(addBox(cage(), -.9, .3 + open * .4, -.22, .9, .56 + open * .4, .22), c => c[0] > .5 ? [.7, .7, .74] : [.5, .5, .54], 1),   // the jaw
  bake(addBox(cage(), .55, .31 + open * .4, -.08, .58, .34 + open * .4, .08), flat([.9, .9, .95]), 0),   // a staple
  bake([[-.7, -.2], [-.7, .2], [.7, -.2], [.7, .2]].reduce((m, p) => cbox(m, p[0], .02, p[1], .06, .02, .06), cage()), dark, 0)));   // rubber feet
MODELS.stamp = model(
  bake(addBox(cage(), -.85, .06, -.6, .85, .62, .6), grey(.32), 1),
  bake(addBox(cage(), -.8, 0, -.55, .8, .07, .55), flat([.2, .08, .1]), 0),                       // the rubber
  bake(addBox(cage(), -.26, .6, -.26, .26, 1.2, .26), grey(.5), 2),                               // the handle
  bake(addBox(cage(), -.34, 1.15, -.34, .34, 1.62, .34), grey(.56), 2),                           // its knob
  bake(addBox(cage(), -.3, .62, -.3, .3, .74, .3), grey(.22), 1),                                 // a grip ring
  bake(lettering(cage(), 'VOID', .85, .18, .55, .09, .05, 'z'), flat([.9, .9, .95]), 0));
MODELS.shredder = model(
  bake(addBox(cage(), -.95, 0, -.72, .95, 1.05, .72), grey(.4), 1),                               // the bin
  bake(addBox(cage(), -1.05, 1.02, -.8, 1.05, 1.42, .8), grey(.46), 1),                           // the hood
  bake(addBox(cage(), -.7, 1.38, -.1, .7, 1.46, .1), dark, 0),                                    // the slot
  bake([0, 1, 2, 3, 4, 5].reduce((m, i) => addBox(m, -.6 + i * .24, 1.4, -.04, -.5 + i * .24, 1.48, .04), cage()), grey(.7), 0),   // teeth
  bake(cbox(cage(), 1.05, 1.25, .5, .02, .03, .03), flat([.2, 1, .3]), 0),                       // a power light
  bake([[-.5, .1], [.1, .3], [.5, -.2]].reduce((m, p) => addBox(m, 1.0, .1, p[0] - .06, 1.04, .6 + p[1], p[0] + .06), cage()), white, 0));   // strips of paper out the front
MODELS.copier = model(
  bake(addBox(cage(), -3.5, 0, -2.5, 3.5, 2.1, 2.5), grey(.45), 1),
  bake(addBox(cage(), -2.9, 2.08, -1.9, 2.9, 2.22, 1.4), flat([.12, .15, .22]), 0),               // the glass
  bake(addBox(cage(), -2.95, 2.6, -2, 2.95, 2.75, -1.6), grey(.5), 1),                            // the lid, propped open at the back
  bake(addBox(cage(), -2.95, 2.22, -2.05, 2.95, 2.62, -1.95), grey(.42), 0),
  bake(addBox(cage(), .6, 2.1, 1.5, 3.2, 2.25, 2.4), flat([.16, .16, .2]), 0),                     // the control panel
  bake([1, 1.5, 2, 2.5].reduce((m, x) => cbox(m, x, 2.3, 1.95, .12, .05, .12), cage()), c => c[0] < 1.25 ? [.9, .2, .2] : c[0] < 1.75 ? [.2, .8, .3] : c[0] < 2.25 ? [.9, .8, .2] : [.3, .5, 1], 0),   // buttons
  bake(addBox(cage(), -3.2, .9, 2.5, 3.2, 1.1, 3.5), grey(.3), 0),                                // the tray
  bake([0, 1, 2].reduce((m, i) => addBox(m, -1.6 + i * .05, 1.1 + i * .06, 2.55, 1.6, 1.16 + i * .06, 3.35), cage()), flat([.95, .95, .95]), 0),   // a stack of paper
  bake(addBox(cage(), -3.4, .35, 2.5, -1.2, .8, 2.6), dark, 0),                                    // an output slot
  bake([[-3, -2], [3, -2], [-3, 2], [3, 2]].reduce((m, p) => cbox(m, p[0], .12, p[1], .25, .12, .25), cage()), flat([.1, .1, .12]), 1),   // wheels
  bake(lettering(cage(), 'COPY', -.8, 2.22, -.4, .12, .04, 'x'), grey(.75), 0));
MODELS.scan = model(bake(addBox(cage(), -.06, 2.2, -1.9, .06, 2.3, 1.4), flat([.5, 1, .6]), 0));
/* ---- friends and props */
MODELS.foal = model(
  bake(addBox(cage(), -.36, .28, -.15, .36, .6, .15), flat([.95, .9, .78]), 2),                    // body
  bake(addBox(cage(), .3, .42, -.1, .6, .74, .1), flat([.95, .9, .78]), 2),                        // head
  bake(addBox(cage(), .52, .4, -.07, .7, .54, .07), flat([.92, .85, .72]), 2),                     // muzzle
  bake(addBox(addBox(cage(), .34, .72, .03, .42, .86, .07), .34, .72, -.07, .42, .86, -.03), flat([.9, .85, .75]), 1),   // ears
  bake([[.26, .12], [.26, -.12], [-.26, .12], [-.26, -.12]].reduce((m, p) => addBox(m, p[0] - .05, .08, p[1] - .05, p[0] + .05, .32, p[1] + .05), cage()), flat([.85, .8, .68]), 1),   // legs
  bake([[.26, .12], [.26, -.12], [-.26, .12], [-.26, -.12]].reduce((m, p) => addBox(m, p[0] - .06, 0, p[1] - .06, p[0] + .06, .09, p[1] + .06), cage()), flat([.4, .3, .35]), 0),   // hooves
  bake(addBox(cage(), .6, .72, -.02, .82, .78, .02), flat([1, .85, .3]), 0),                       // horn
  bake([0, 1, 2, 3, 4, 5, 6].reduce((m, i) => addBox(m, .3 - i * .1, .58, -.03, .38 - i * .1, .68, .03), cage()), c => rgb(HUES[Math.min(6, Math.max(0, Math.round((0.34 - c[0]) / .1)))], .85, .6), 0),   // mane
  bake([0, 1, 2].reduce((m, i) => addBox(m, -.5 - i * .08, .38 - i * .1, -.02, -.4 - i * .08, .5 - i * .1, .02), cage()), c => rgb(HUES[(Math.round((-.4 - c[0]) / .08) * 2) % 7], .85, .6), 0),   // tail
  bake(cbox(cage(), .7, .43, .03, .01, .012, .012), dark, 0),                                       // nostril
  eyes(.58, .62, 0, .022, .96, 1));
MODELS.well = model(bake([0, 1, 2, 3, 4, 5, 6, 7].reduce((m, i) => { const a = i * Math.PI / 4, r = 1.15 + (i % 3) * .05, s = .16 + (i % 2) * .06; return cbox(m, Math.cos(a) * r, s, Math.sin(a) * r, s + .04, s, s); }, cage()), c => [.16 + c[1] * .2, .14 + c[1] * .2, .22 + c[1] * .2], 1));
MODELS.muzzle = model(
  bake(addBox(cage(), -.16, -.16, -.34, .16, .1, .12), c => [.98, .95 - c[2] * .05, .85], 2),
  bake(addBox(addBox(cage(), -.11, -.08, -.37, -.05, -.02, -.31), .05, -.08, -.37, .11, -.02, -.31), flat([.35, .25, .3]), 1),   // nostrils
  bake(cbox(cage(), 0, -.14, -.34, .1, .006, .01), flat([.6, .45, .5]), 0));                        // the lip
/* ---- flowers: a stem with leaves and a yellow heart (untinted), and a head that takes the cell's hue as a tint */
const petal = (m, a, r0, r1, w, y, tilt) => addQuad(m,
  [Math.cos(a) * r0, y, Math.sin(a) * r0], [Math.cos(a) * r1 - Math.sin(a) * w, y + tilt, Math.sin(a) * r1 + Math.cos(a) * w],
  [Math.cos(a) * (r1 + w), y + tilt * 1.3, Math.sin(a) * (r1 + w)], [Math.cos(a) * r1 + Math.sin(a) * w, y + tilt, Math.sin(a) * r1 - Math.cos(a) * w]);
MODELS.stem = model(
  bake(addBox(cage(), -.014, 0, -.014, .014, .23, .014), c => [.25, .5 + c[1] * .3, .2], 0),
  bake(addQuad(addQuad(cage(), [0, .08, 0], [.07, .1, .03], [.11, .14, 0], [.07, .1, -.03]), [0, .13, 0], [-.06, .15, -.03], [-.1, .19, 0], [-.06, .15, .03]), flat([.3, .6, .25]), 0),   // two leaves
  bake(addBox(cage(), -.03, .22, -.03, .03, .27, .03), flat([1, .9, .3]), 0));
MODELS.heads = [
  model(bake([0, 1, 2, 3].reduce((m, i) => petal(m, i * Math.PI / 2, .03, .09, .045, .245, .03), cage()), flat([1, 1, 1]), 0),
    bake([0, 1, 2, 3].reduce((m, i) => petal(m, i * Math.PI / 2 + Math.PI / 4, .03, .06, .03, .25, .04), cage()), flat([.85, .85, .85]), 0)),   // an inner ring of smaller petals
  model(bake(addBox(cage(), -.09, .2, -.09, .09, .32, .09), c => [1, 1, 1].map(v => v * (.8 + c[1] * .6)), 1),
    bake([[.05, .05], [-.05, -.05], [0, 0]].reduce((m, p) => cbox(m, p[0], .33, p[1], .012, .012, .012), cage()), flat([.6, .6, .6]), 0)),   // dimples on the head
  model(bake([0, 1, 2, 3, 4].reduce((m, i) => petal(m, i * Math.PI * 2 / 5, .025, .1, .035, .245, .05), cage()), flat([1, 1, 1]), 0),
    bake([0, 1, 2, 3, 4].reduce((m, i) => { const a = i * Math.PI * 2 / 5 + .6; return cbox(m, Math.cos(a) * .045, .27, Math.sin(a) * .045, .008, .02, .008); }, cage()), flat([.9, .9, .9]), 0)),   // stamens
];
