/* ---------- a gallop ---------------------------------------------
   One tracker, scheduled a third of a second ahead, patterns as strings, 24
   steps to two bars of 12/8: three steps a beat, soft-soft-HARD, a horse.
   The chords go Am F C G, a bar each; the bass plucks the root through a
   filter that closes, the pad is six detuned saws that duck under the kick,
   the arpeggio runs the chord tones through a delay, the lead is a four-bar
   tune on the minor pentatonic in twin detuned squares. Everything goes
   through a compressor, and a reverb made from a second and a half of
   decaying noise. Layers join as the waves climb; the title is the pad and
   the arpeggio alone. */
let mstep = 0, mnext = 0, MG = 0, RV = 0, DL = 0, PG = 0, LP = 0;
const CH = [0, 8, 3, 10], CT = [[0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7]],   // chord roots from A, and their tones
      PENT = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22],
      KICK = '..K..K..K..k..K..K..K.kK', SNR = '.....S.....S.....S..s..S', HAT = 'HhhHhhHhhOhhHhhHhhHhhOhh',
      BASS = 'R..R..R..R.rR..R..R.rR.R', ARP = 'x.xx.xx.x.xxx.xx.xx.x.x.',
      LEAD = '4.2.0...2.4.7...5.4.2.0.0.2.4.5.4.....2.4...7.9.';
const fq = (n, o) => 55 * Math.pow(2, o + n / 12);
function mix() {                                     // the master chain, built once
  if (MG) return;
  const cmp = AC.createDynamicsCompressor(); cmp.threshold.value = -20; cmp.ratio.value = 8; cmp.connect(AC.destination);
  LP = AC.createBiquadFilter(); LP.frequency.value = 18000; LP.connect(cmp);     // closes when you are nearly dead
  MG = AC.createGain(); MG.gain.value = .9; MG.connect(LP);
  PG = AC.createGain(); PG.connect(MG);
  const n = AC.sampleRate * 1.6, b = AC.createBuffer(2, n, AC.sampleRate);
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (rs() * 2 - 1) * Math.pow(1 - i / n, 2.5); }
  RV = AC.createConvolver(); RV.buffer = b; const rg = AC.createGain(); rg.gain.value = .4; RV.connect(rg); rg.connect(MG);
  DL = AC.createDelay(); DL.delayTime.value = .3; const fb = AC.createGain(); fb.gain.value = .45; DL.connect(fb); fb.connect(DL);
  const dg = AC.createGain(); dg.gain.value = .4; DL.connect(dg); dg.connect(MG); dg.connect(RV);
}
/* a voice: one or two oscillators (detuned det cents apart), an envelope, an optional filter pluck from fc down, sends to the reverb and the delay */
function vc(f, at, d, type, v, det = 0, fc = 0, rv = 0, dl = 0, f2 = 0, dest = MG) {
  const g = AC.createGain(); g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(v, at + .006); g.gain.exponentialRampToValueAtTime(.0001, at + d);
  for (const dt of det ? [-det, det] : [0]) { const o = AC.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, at); if (f2) o.frequency.exponentialRampToValueAtTime(f2, at + d); o.detune.value = dt; o.connect(g); o.start(at); o.stop(at + d + .05); }
  let out = g;
  if (fc) { out = AC.createBiquadFilter(); out.Q.value = 6; out.frequency.setValueAtTime(fc, at); out.frequency.exponentialRampToValueAtTime(fc / 8 + 60, at + d * .7); g.connect(out); }
  out.connect(dest);
  if (rv) { const s = AC.createGain(); s.gain.value = rv; out.connect(s); s.connect(RV); }
  if (dl) { const s = AC.createGain(); s.gain.value = dl; out.connect(s); s.connect(DL); }
}
function nz(at, d, v, fc, rv = 0, hp = 0) {         // noise through a lowpass (or highpass), with an envelope and a reverb send
  const s = AC.createBufferSource(), g = AC.createGain(), f = AC.createBiquadFilter();
  s.buffer = NB; s.loop = 1; f.frequency.value = fc; f.type = hp ? 'highpass' : 'lowpass';
  g.gain.setValueAtTime(v, at); g.gain.exponentialRampToValueAtTime(.0001, at + d);
  s.connect(f); f.connect(g); g.connect(MG); if (rv) { const r = AC.createGain(); r.gain.value = rv; g.connect(r); r.connect(RV); }
  s.start(at); s.stop(at + d + .02);
}
function music() {
  if (!lit || mute) return;
  ac(); mix();
  const go = st == 'play' || st == 'perk', sp = go ? frz ? .2 : .1 : .17, v = go ? Math.min(wave, 9) : 0, low = go && P.hp < P.mhp * .3;   // the hourglass halves the tempo
  DL.delayTime.value = sp * 3; LP.frequency.setTargetAtTime(low ? 500 : 18000, AC.currentTime, .15);
  if (mnext < AC.currentTime) mnext = AC.currentTime + .05;
  while (mnext < AC.currentTime + .3) {
    const i = mstep % 24, w = mnext, bar = mstep / 12 | 0, c = bar % 4, root = CH[c], fill = bar % 4 == 3 && i % 12 > 5;
    if (i % 12 == 0) {                                                                   // a new bar: the pad, and a crash after a fill
      CT[c].forEach(n => vc(fq(root + n, 2), w, sp * 12, 'sawtooth', go ? .035 : .05, 9, 1200, .5, 0, 0, PG));
      if (go && c == 0 && v > 1) nz(w, 1.2, .08, 9000, .8, 1);
    }
    if (go && KICK[i] != '.') {                                                          // the kick, and the pad ducks under it
      vc(KICK[i] == 'K' ? 150 : 110, w, .16, 'sine', KICK[i] == 'K' ? .5 : .25, 0, 0, 0, 0, 40); nz(w, .02, .15, 3000);
      PG.gain.cancelScheduledValues(w); PG.gain.setValueAtTime(.25, w); PG.gain.linearRampToValueAtTime(1, w + sp * 2.5);
    }
    if (go && v > 1 && !low && (SNR[i] != '.' || fill)) { nz(w, fill ? .08 : .18, fill ? .12 : .25, 1800, .5); vc(190, w, .1, 'triangle', .2, 0, 0, 0, 0, 90); }
    if (go && !low && HAT[i] != '.' && (HAT[i] != 'O' || v > 3)) nz(w, HAT[i] == 'O' ? .25 : HAT[i] == 'H' ? .05 : .03, HAT[i] == 'h' ? .04 : .07, 7000, .1, 1);
    if (BASS[i] != '.' && go) vc(fq(root + (BASS[i] == 'r' ? 7 : 0), 0), w, sp * 2.6, 'sawtooth', .28, 5, 900, 0, 0, 0);
    if (ARP[i] != '.' && (!go || v > 0)) vc(fq(root + CT[c][i % 3] + (i % 6 > 2 ? 12 : 0), 3), w, sp * 1.4, go ? 'square' : 'triangle', go ? .045 : .06, 4, 0, .3, .5);
    const L = LEAD[(bar % 4) * 12 + i % 12];
    if (go && v > 2 && L != '.') { const f = fq(PENT[+L], 3); vc(f, w, sp * 1.8, 'square', .06, 7, 0, .4, .35); if (v > 5) vc(f * 2, w, sp * 1.8, 'triangle', .05, 5, 0, .4, .35); }
    mnext += sp; mstep++;
  }
}
