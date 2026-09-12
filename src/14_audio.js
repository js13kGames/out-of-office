/* ---------- sound: the context, the noise, the effects ------------
   Nothing is sampled. `lit` is the click-to-start gate: browsers refuse an
   AudioContext before a gesture, so the title waits for one. The effects
   are the music's voices (16_music.js), so they share its chain.      */
let AC = 0, mute = 0, lit = 0, NB = 0;
function ac() {
  if (AC) return AC;
  AC = new (window.AudioContext || window.webkitAudioContext)();
  NB = AC.createBuffer(1, 22050, 22050);                       // one second of white noise
  const d = NB.getChannelData(0); for (let i = 0; i < 22050; i++) d[i] = rs() * 2 - 1;
  return AC;
}
/* effects are the music's voices (vc, nz in 16_music.js), so they run through the same compressor and reverb:
   a note f gliding to f2 over d seconds at gain v, and a hiss of noise through a lowpass at fc */
const snd = (f, d, type = 'square', v = .05, f2) => { if (!mute && lit) try { ac(); mix(); vc(f, AC.currentTime, d, type, v * 1.6, 0, 0, .15, 0, f2); } catch (e) {} };
const sh = (d, v, fc = 4000) => { if (!mute && lit) try { ac(); mix(); nz(AC.currentTime, d, v * 1.6, fc, .2); } catch (e) {} };
