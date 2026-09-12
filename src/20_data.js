/* ---------- data: enemies, prisms, perks --------------------------
   The Grey: everything that comes at you is grey and eats colour. Each kind
   is [name, radius, hp, speed, damage, xp, drain per tick, wave it appears,
   ticks between shots (0: never fires)].                                    */
const EK = [
  ['DRAB', 5, 3, .55, 6, 1, .006, 1, 0],           // the blob
  ['MOTH', 4, 1, 1.4, 4, 1, .003, 2, 0],           // fast, wobbly
  ['SMUDGE', 9, 24, .3, 14, 8, .02, 4, 160],       // slow, splits into drabs, spits three at a time
  ['CENSOR', 16, 120, .45, 22, 40, .06, 5, 100],    // the boss: a black bar with a word on it; a ring of ink
  ['SPITTER', 5, 6, .5, 6, 3, .006, 3, 90],        // keeps its distance and spits grey
  ['BLOT', 3, 2, .8, 4, 1, .003, 4, 0],            // small; dies into a splat that drains the ground
  ['SHADE', 5, 5, .5, 8, 3, .01, 6, 0],            // fast on grey ground, slow on colour
  ['STATIC', 5, 4, .3, 8, 3, .005, 8, 120],         // blinks somewhere near you every two seconds and fires on arrival
  ['ERASER', 14, 300, .3, 20, 60, .04, 10, 75],    // the other boss: charges in straight lines, rubbing out a lane, and shoots
  ['STAPLER', 14, 200, .35, 18, 50, .05, 15, 120], // opens its jaw, then bites: a short lunge, and a pair of staples
  ['STAMP', 13, 260, .3, 24, 55, .05, 20, 0],      // marks where you stand, then slams down there: VOID
  ['SHREDDER', 15, 320, .25, 20, 60, .06, 25, 0],  // pulls you in, and feeds strips (moths) out of its slot
  ['PHOTOCOPIER', 56, 2400, .2, 40, 400, .3, 40, 60],   // gigantic. Rings of sixteen, and every four seconds it copies: a scan, and eight drabs off its edge
];
const isB = e => e.k == 3 || e.k >= 8, BK = [3, 8, 9, 10, 11], BM = { 3: 'UNCENSORED', 8: 'RUBBED OUT', 9: 'UNSTAPLED', 10: 'RETURN TO SENDER', 11: 'PAPER JAM', 12: 'OUT OF TONER' };   // the boss rota and what it says when one dies
const DN = ['EASY', 'NORMAL', 'HARD'], DM = [.7, 1, 1.4];   // difficulty: names, and the multiplier on enemy health and spawn counts
const SPW = [50, 25, 6, 0, 10, 14, 10, 6, 0, 0, 0, 0, 0];   // spawn weights by kind; bosses arrive on their own
/* Pickups by kind: 0 heart, 1..6 a prism, then 7 gold, 8 paint bomb, 9 nova,
   10 hourglass, 11 shield, 12 sugar, 13 a prism shard (five make WHITE LIGHT). DROP is the cumulative chance table. */
const PN = ['HEART', 0, 0, 0, 0, 0, 0, 'GOLD', 'PAINT BOMB', 'NOVA', 'HOURGLASS', 'SHIELD', 'SUGAR RUSH', 'SHARD'],
      DROP = [[.012, -1], [.024, 0], [.04, 7], [.046, 8], [.048, 9], [.051, 10], [.054, 11], [.057, 12], [.07, 13]];
/* Prisms: what the horn does. [name, ticks between shots, ammo]. Zero ammo is
   the prism you always have. `volley` in 72_bullets.js does the rest by index. */
const WP = [
  ['PRISM', 11, 0],          // seven bands, each its own speed: every shot fans into a rainbow
  ['REDSHIFT', 3, 180],      // a hose of slow red heat
  ['RAINBOW RAIL', 26, 24],  // one line through everything, all seven bands in its wake
  ['GREEN GOO', 16, 36],     // lobbed, leaves a puddle
  ['BLUE FROST', 5, 140],    // slows what it touches
  ['YELLOW ARC', 13, 50],    // chain lightning
  ['ORANGE BURST', 19, 40],  // shotgun
];
/* Achievements: [name, is it true right now]. Checked twice a second, kept for good. */
const ACH = [
  ['FIRST LIGHT', () => kills >= 100], ['A THOUSAND', () => kills >= 1000], ['TEN THOUSAND', () => kills >= 10000],
  ['OFFICE CLOSED', () => bossK >= 1], ['STATIONERY CUPBOARD', () => bossK >= 5],
  ['X50', () => bestC >= 50], ['WAVE TEN', () => wave >= 10], ['WAVE TWENTY', () => wave >= 20],
  ['WHITE LIGHT', () => mech > 0], ['LEGEND', () => Object.keys(P.c).some(n => PK.find(k => k[0] == n)[2] == 4)],
  ['UNTOUCHED', () => wave >= 3 && !P.hurt], ['STILL GREEN', () => tm > 18000 && gry < .05],
];
/* Perks: [name, what it says, rarity 0..4, how many times you may take it, apply].
   Rarity is rolled per card: common half the time, legend one in fifty.  */
const RN = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGEND'], RW = [50, 30, 13, 5, 2],
      RC = [[0, 72, 0], [120, 55, 70], [215, 62, 85], [285, 60, 85], [45, 62, 100]];   // card colours by rarity
const PK = [
  /* common: numbers, and you can stack them */
  ['GALLOP', '+20% SPEED', 0, 4, p => p.spd *= 1.2],
  ['THICK HIDE', '+30 HEALTH', 0, 9, p => { p.mhp += 30; p.hp += 30; }],
  ['HORN OF PLENTY', '+33% FIRE RATE', 0, 4, p => p.rate *= .75],
  ['SUPERNUMERARY', '+1 SHOT A VOLLEY', 0, 9, p => p.extra++],
  ['HARD LIGHT', '+25% DAMAGE', 0, 9, p => p.dmg *= 1.25],
  ['LONG SHOT', '+33% RANGE', 0, 4, p => p.life *= 1.33],
  ['A SNACK', 'HEAL 40 NOW', 0, 9, p => p.hp = Math.min(p.mhp, p.hp + 40)],
  ['LUCKY HORSESHOE', '+50% DROPS', 0, 3, p => p.luck *= 1.5],
  ['STEADY HOOVES', 'BLINK RECHARGES FASTER', 0, 3, p => p.blk *= .75],
  /* uncommon: a new rule */
  ['POT OF GOLD', 'PICKUPS DRIFT TO YOU', 1, 1, p => p.magnet = 1],
  ['MEADOW REGEN', 'HEAL ON COLOUR', 1, 1, p => p.regen = 1],
  ['SHARP HORN', 'TOUCH HURTS THEM', 1, 1, p => p.horn = 1],
  ['GLITTER HOOVES', 'TRAIL REPAINTS', 1, 1, p => p.glit = 1],
  ['SURE FOOTED', 'ASH NO LONGER SLOWS', 1, 1, p => p.sure = 1],
  ['BLOOM', 'KILLS REPAINT WIDER', 1, 2, p => p.bloom++],
  ['AMMO BELT', 'DOUBLE AMMO', 1, 1, p => p.belt = 1],
  ['BRIGHT EYES', 'ALL GREY ON THE MAP', 1, 1, p => p.map = 1],
  ['HOARDER', 'FOUR SHARDS MAKE LIGHT', 1, 1, p => p.hoard = 1],
  ['LONG BLINK', 'BLINK HALF AGAIN AS FAR', 1, 1, p => p.bd = 1],
  /* rare: the sky */
  ['DOUBLE RAINBOW', 'SHOTS BOUNCE', 2, 1, p => p.bounce = 1],
  ["ALEXANDER'S BAND", 'A RING THAT SLOWS', 2, 1, p => p.band = 1],
  ['A FOAL', 'A FOAL SHOOTS TOO', 2, 2, p => p.fo.push({ x: p.x, y: p.y })],
  ['FROSTBITE', 'SHOTS SLOW', 2, 1, p => p.frost = 1],
  ['PIERCING LIGHT', 'SHOTS PIERCE +1', 2, 2, p => p.pierce++],
  ['MIRROR', 'VOLLEYS FIRE BOTH WAYS', 2, 1, p => p.mirror = 1],
  ['FLASH STEP', 'BLINK BURNS', 2, 1, p => p.fs = 1],
  /* epic: bigger than you */
  ['SECOND WIND', 'SURVIVE DEATH ONCE', 3, 1, p => p.wind = 1],
  ['FULL SPECTRUM', '8TH VOLLEY IS A RING', 3, 1, p => p.ring = 1],
  ['THUNDERHEAD', 'KILLS ARC LIGHTNING', 3, 1, p => p.thunder = 1],
  ['COLOURFAST', 'NO DRAIN NEAR YOU', 3, 1, p => p.aura = 1],
  ['INKPROOF', 'SPIT CANNOT HURT YOU', 3, 1, p => p.ink = 1],
  /* legend: the sky changes */
  ['MOONBOW', 'NIGHT: GREY SLOWER', 4, 1, p => p.moon = 1],
  ['PRISM HEART', 'ENDLESS AMMO', 4, 1, p => p.inf = 1],
  ['COMET TAIL', 'A BURNING TRAIL', 4, 1, p => p.comet = 1],
  ['OVERTIME', 'WAVES LAST 40 SECONDS', 4, 1, p => p.over = 1],
  ['END OF THE RAINBOW', '+100 HP, ALL THE GOLD', 4, 1, p => { p.mhp += 100; p.hp = p.mhp; p.magnet = 1; p.luck *= 2; }],
];
