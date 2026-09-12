/* ---------- all mutable state ----------------------------------- */
const WW = 2560, WH = 1440, GW = WW / 8, GH = WH / 8;   // the world is eight screens each way; the meadow is 8 px cells
let st = 'title', t = 0, P = {}, en = [], bu = [], pu = [], goo = [], fx = [], sat = [], fh = [], camX = 0, camY = 0,
    wave = 1, waveT = 0, kills = 0, xp = 0, nxt = 60, lvl = 1, wep = 0, ammo = 0, cool = 0, spawnT = 0, vol = 0,
    opts = [], sel = 0, best = 0, shake = 0, msg = '', msgT = 0, dead = 0, stT = 0, bolts = [], rails = [], eid = 0, eb = [], we = [], combo = 0, comboT = 0, bestC = 0, frz = 0, rush = 0, hstop = 0, tm = 0, flash = 0,
    bl = 0, bc = 3,                                 // blink: ticks until the next charge, charges held
    shards = 0, mech = 0,                            // prism shards held, ticks of WHITE LIGHT left
    gl = 0,                                          // set while the glow layer is being drawn
    gry = 0, bossK = 0, ach = 0,                     // share of the field that is ash, bosses killed this run, achievements (a bitmask, kept)
    puT = -9e9, hT = -9e9,                           // when the last powerup and the last heart dropped: luck cannot beat the clock
    paused = 0, rr = 0, dif = 1;                     // paused, the perk reroll spent, difficulty 0..2 (picked on the title)
try { best = +localStorage.OOO_best || 0; ach = +localStorage.OOO_ach || 0; } catch (e) {}
function newGame() {
  P = { x: WW / 2, y: WH / 2, an: 0, hp: 100, mhp: 100, spd: 1.45, rate: 1, extra: 0, dmg: 1, life: 1, luck: 1, bloom: 0, pierce: 0,
        inv: 0, t: 0, fo: [], c: {}, dx: 1, dy: 0, blk: 1 };
  camX = P.x - W / 2; camY = P.y - H / 2;
  en = []; bu = []; pu = []; goo = []; fx = []; bolts = []; rails = []; eb = []; we = []; combo = comboT = bestC = frz = rush = hstop = tm = flash = bl = shards = mech = bossK = paused = 0; bc = 3; puT = hT = -9e9;
  wave = 1; waveT = 0; kills = 0; xp = 0; nxt = 60; lvl = 1; wep = 0; ammo = 0; cool = 0; spawnT = 40; dead = 0; vol = 0;
  initMeadow(); addWell(1);
  st = 'play'; say('THE GREY IS COMING');
}
const say = (s, n = 120) => { msg = s; msgT = n; };
