# Chromatic split (shelved 2026-09-12)

Drawn at the end of bloom() in 80_draw.js, after the three glow layers and before the composite flags are reset. The full-res glow G1 is drawn twice more, hue-rotated 120 degrees each way and shifted by k pixels, so glowing things get a warm and a cold fringe. Shelved: about 70 B zipped for an effect only visible on glow at a high combo.

```js
  /* the split: the wide glow again, pulled apart into a warm and a cold copy. It opens with the combo and when you are nearly dead */
  const k = Math.min(4, combo / 20 | 0) + (P.hp < P.mhp * .3) * 3 + (mech > 0) * 3;
  if (k) { X.globalAlpha = .5; X.filter = 'hue-rotate(-120deg)'; X.drawImage(G1, -k, 0); X.filter = 'hue-rotate(120deg)'; X.drawImage(G1, k, 0); X.filter = 'none'; }
```
