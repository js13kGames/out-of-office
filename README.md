# OUT OF OFFICE

The grey is the office; the bosses are its supplies; the goal is to be out
of it.

A js13k draft: a Crimsonland-style top-down arena survival shooter, with a
unicorn. One HTML file under 13,312 bytes zipped, no image, audio or font
assets: every pixel, note and word is generated from code at runtime.

    npm install
    npm run dev      # writes dev.html; open it in a browser, breakpoints land in real files
    npm run size     # per-module byte report
    npm run pack     # Terser + Roadroller + zip + advzip, checked against 13,312
    npm test         # headless: build with a test handle, play a scripted minute under node-canvas
    npm run shots    # dist/title.png, dist/zoo.png, dist/late.png from the packed build

The packed entry is `dist/index.html`; `dist/game.zip` is the submission.
Current draft: 13,301 B zipped, 11 B under the limit; every byte from here
is a trade.

## The idea

**The Grey is coming.** Everything that pours in from the edges of the meadow
is grey, and it eats colour: every step a grey thing takes drains the ground
under it. You are a unicorn whose horn is a prism, and every shot is a rainbow.
Kill things and the colour they were holding bursts back into the meadow.

Three things make it not just Crimsonland with a horse:

- **The meadow is a resource.** It is a grid of colour. Where the grey walks
  it leaves black ash, and ash is bad ground: you move at half speed on it and
  everything grey moves a third faster, so a drained patch is a trap that
  closes. Kills and dying shots repaint it. ASH in the HUD is how much of
  the field has gone.
- **Dispersion is the default weapon.** The PRISM fires seven bullets, one per
  band, and each band has its own speed, so every volley fans out into a
  rainbow with distance, exactly like light through glass. Red is slow and
  close, violet is fast and far. Prism pickups shift the horn to one band with
  its own behaviour: REDSHIFT (a hose), VIOLET RAIL (pierces everything),
  GREEN GOO (puddles), BLUE FROST (slows), YELLOW ARC (chain lightning),
  ORANGE BURST (shotgun). Ammo runs out and you are back to the PRISM.
- **The bosses are office supplies.** Every fifth wave one walks in from a
  rota of five: a black bar that says CENSORED that fires rings of ink and
  tries to cover you; an ERASER that charges across the meadow in straight
  lines, rubbing out a lane; a STAPLER that opens its jaw and bites, with a
  pair of staples; a STAMP that marks where you stand, lifts, and slams down
  there with VOID; a SHREDDER that pulls you in and feeds out strips (moths).
  From wave 30 they come in pairs and from 60 in threes, and every fortieth
  wave THE PHOTOCOPIER arrives on top: gigantic, rings of sixteen, and every
  four seconds it scans and copies eight drabs off its edge. Bosses scale with
  the wave and drop gold, a paint bomb and a prism.

The world is eight screens wide and eight tall, the floor of a pit whose
walls lean away from you at the edges; the camera follows you, and the grey spawns just outside whatever you can see,
up to a thousand at once, walking in from the inkwells. A map in the corner shows the world at one in forty
with the wells, the bosses, you and the view, painted with the meadow itself so
you can see where the ash is; the bottom bar gives the ash share of the whole
field. Waves last thirty seconds and
each new kind is announced when it first appears:

| kind | wave | what it does |
|---|---|---|
| DRAB | 1 | walks at you, in numbers |
| MOTH | 2 | fast and never in a straight line |
| SPITTER | 3 | keeps its distance and spits grey that greys the ground where it lands |
| SMUDGE | 4 | slow, tough, spits a fan of three, splits into three drabs |
| BLOT | 4 | tiny; dies into a splat that drains the ground under it, so kill it at range |
| CENSOR | 5 | boss; fires rings of ink |
| SHADE | 6 | fast on grey ground, slow on colour: it wants the world grey |
| STATIC | 8 | blinks to somewhere near you every two seconds and fires on arrival |
| ERASER | 10 | boss; charges, and shoots a fan |
| STAPLER | 15 | boss; opens its jaw, lunges, fires a pair of staples |
| STAMP | 20 | boss; marks your spot, then slams down on it |
| SHREDDER | 25 | boss; pulls you in and spits moths |
| PHOTOCOPIER | 40 | the gigantic boss; rings of sixteen, copies drabs |

**Inkwells** are where the grey comes from: every spawn burst climbs out of
one. A well is a dark hole of ink that opens out of your sight, 260 to 600
px away (the first one opens on screen, so you see where the grey comes from), bleeds the colour out of the ground around it, has health, blocks
you, shows on the map and gets an edge marker when it is near. Shoot one dry
and the colour floods back with gold and another pickup on top, and the flow
from it stops. One opens every wave, up to ten, each tougher than the last;
if none is left another opens within four seconds, and only with no well at
all does the grey come in from the screen edge. The grey walks from the wells
to you, so the ash trails on the map show you where they are.

Pickups drop from kills (the strong ones on a clock, whatever your luck: one
of nova, hourglass, shield or sugar rush every twenty seconds at most, a heart
every four): hearts, the six prisms, GOLD (experience), PAINT
BOMB (repaints a wide circle), NOVA (kills everything in view), HOURGLASS
(the grey nearly stops for six seconds), SHIELD (seven seconds of
invulnerability), SUGAR RUSH (double fire rate for nine seconds) and SHARDS.
Shards always drift to you, and five of them make WHITE LIGHT: twelve seconds
of every band at once, three times the fire rate, shots that pierce three
more, invulnerability and a horn that tramples. It is Tesla vs Lovecraft's
mech, in prism form.

You can also **blink**: Shift, Q, E, the right mouse button, or a quick tap
on the move half of a touch screen teleports you a short way in the direction
you are moving (or facing), straight through the grey, with a moment of
invulnerability. Three charges, one back every second and a half; the pips
next to the kill count show them. Tesla's quantum teleport, in short.

Perks come three at a time on every level, Crimsonland-style. Each card rolls
its own rarity, common half the time and LEGEND one in fifty, and the card is
coloured to match. Thirty-two perks over five shelves:

- **Common** (stackable numbers): GALLOP, THICK HIDE, HORN OF PLENTY,
  SUPERNUMERARY, HARD LIGHT, LONG SHOT, A SNACK, LUCKY HORSESHOE.
- **Uncommon** (a new rule): POT OF GOLD, MEADOW REGEN, SHARP HORN, GLITTER
  HOOVES, SURE FOOTED, BLOOM, AMMO BELT, BRIGHT EYES (every enemy on the map).
- **Rare** (the sky): DOUBLE RAINBOW (shots bounce), ALEXANDER'S BAND (the
  dark ring between the bows slows what is near), A FOAL (up to two follow
  you and shoot), FROSTBITE, PIERCING LIGHT, MIRROR (every volley also fires
  backwards), FLASH STEP (the blink burns what it crosses).
- **Epic**: SECOND WIND, FULL SPECTRUM (every eighth volley is a ring),
  THUNDERHEAD (kills arc lightning onward), COLOURFAST (nothing drains the
  ground near you).
- **Legend**: MOONBOW (night falls, the grey is slower for good), PRISM HEART
  (ammo never runs out), COMET TAIL (your trail is a rainbow that burns), END
  OF THE RAINBOW (a hundred health and all the gold).

Detail: everything that shines blooms (see below), enemies flash when hit, a
boss death and a nova freeze the frame for a beat, kills within a second and
a half chain into a combo that multiplies experience, off-screen bosses get a blinking marker at the edge, the HUD
keeps a survival clock, and hooves kick up dust. Twelve achievements (a
hundred kills, a boss, X50, wave twenty, WHITE LIGHT, a legend perk, wave
three untouched, five minutes with the field under 5% grey...) are checked
twice a second, announced when they unlock, kept in localStorage and counted
on the title screen. Health is a rainbow too:
seven bars, one per band, red goes last.

## How to play

Keyboard and mouse: WASD or arrows move, the mouse aims, hold the button to
fire. Shift, Q, E or the right button blinks. Touch:
drag on the left half to move, drag on the right half to aim and fire. On a
perk screen, arrows and Enter, 1 2 3, or a tap. M mutes; the SND label in the
corner does the same.

## Art and sound

Sprites are strings, one character per pixel, and a palette is a function of
the character and its position: the mane is seven hues by column, the tail
seven hues by row. The unicorn is seen from above, rearing: head and
shoulders, the forehooves up at its sides, the horn forward. Every sprite is baked once with a one-pixel dark rim
underneath, so the unicorn reads on any ground. The unicorn is seen from
above and rotates to the aim; nearest-neighbour rotation keeps it chunky.

**Bloom.** Fire and only fire: shots, the muzzle flash, sparks, explosions
(every kill leaves a burst that lives only in the glow layer; bosses, novas,
paint bombs and dry wells leave big ones), hit flashes and pickups are drawn a second time onto a glow canvas, which is
shrunk to a quarter, an eighth and a sixteenth of the screen with bilinear
sampling (the shrink is the blur) and added back over the frame with the
`lighter` composite. Three small canvases and five drawImage calls a frame;
the grey and the unicorn never touch the glow layer, so they stay flat while
the colour burns.

**Crowds.** Up to a thousand of the grey are alive at once. Every tick they go
into a spatial hash: the world is cut into 16 px cells and each cell keeps a
linked list of what is in it as two Int32Arrays (a head index per cell, a next
index per enemy), so rebuilding it is a thousand stores with no allocation.
Separation, bullets, goo and the blink then look at nine cells instead of at
everyone; a full tick with a thousand alive costs about a millisecond. A
uniform grid wins over a quadtree here because everything is about the same
size, spread evenly and moves every tick, so a tree would be rebuilt every
tick for nothing.

The meadow is 320 by 180 cells of drifting greens with a flower on a third of
the cells: three species, each growing from a sprout to a bud to a bloom
that sways, as fast as the colour of its cell allows, and trampled flat by
anything that walks on it (hooves send petals flying); it regrows in about a
second, each
cell holding a saturation value that the game reads as colour and draws as
lightness and saturation together, so a drained cell is flat grey.

The music is one tracker with patterns as strings, scheduled a third of a
second ahead. The beat is a gallop: 12/8, three steps to a beat,
soft-soft-HARD on the kick. The chords go Am F C G, a bar each: the bass
plucks the root through a filter that closes, the pad is six detuned saws
that duck under the kick, the arpeggio runs the chord tones through a
feedback delay, and the lead is a four-bar tune on the minor pentatonic in
twin detuned squares. Everything runs through a compressor and a reverb made
from a second and a half of decaying noise; the snare, hats and crash are the
same second of noise through filters. A voice joins every few waves so the
arena gets louder as it gets worse, with a snare fill every fourth bar and a
crash after it; the title is the pad and the arpeggio alone. Every sound
effect is one of the same voices, through the same compressor and reverb.
Kills pop in key, a pentatonic note over the bar's chord that climbs with the
combo; the hourglass halves the tempo; below 30% health a lowpass closes over
everything and the drums thin to the kick.

## Structure

`src/*.js` are concatenated in filename order into one scope: no bundler, no
imports. Top-level `const`s initialise in sequence, so the numbering is the
load order. Insert new modules at a free number, never renumber.

    00_boot        canvas and context, 320x180
    10_core        colour, rect, clamp, PRNG, the seven hues
    12_font        3x5 pixel font, one base-32 character per column
    14_audio       the click-to-start gate; effects are music voices through the same chain
    16_music       the gallop tracker
    20_data        enemy kinds, prisms, achievements, perks
    30_state       all mutable state, newGame
    40_sprites     pixel strings baked with a rim; rotated drawing
    50_meadow      the colour grid: paint, drain, draw what the camera sees
    60_input       keys, mouse, two touch sticks, menus
    70_player      movement, aim, the blink, the foal, getting hurt
    72_bullets     every prism, chain lightning, goo, what the grey spits
    74_enemies     spawning, waves, seven kinds and six bosses, the spatial hash, deaths, pickups, shards, level-ups
    76_wells       inkwells: the spawners
    80_draw        world, the bloom pass and HUD
    82_screens     title, perk pick, game over
    90_loop        fixed-step loop and render

Rules that carry over from the last entry: colours use the comma form
`hsla(h,s%,l%,a)` so node-canvas and the headless test agree; no element has
a single-letter id because the packer's decoder uses bare globals; every game
string is ASCII because the shell has no charset meta; only distinct code
costs bytes under Roadroller, so measure the zip and not the minified size.

## Roadmap

The draft plays end to end. What it needs next, roughly in order:

1. **Tuning.** Spawn curve, enemy speed per wave, perk balance, prism ammo,
   drop rates. The scripted (and stupid) player now dies in wave 2, so the
   early curve wants a real playtest before it is softened.
2. **Quests.** Crimsonland's other half: short fixed scenarios (kill 50 moths
   with the rail, survive a wave with no colour left) that unlock prisms.
3. **Zoom.** Shelved in `tools/patches/zoom.md`, machinery and speed link
   both, with the design written up.
4. **Juice.** A colour wave when the meadow is fully repainted, the meadow
   bleeding grey along the paths.
5. **Roadroller.** Freeze the parameters in `tools/rr-params.json` once the
   source settles (`npm run reopt` prints them).

## Other ideas considered

Kept here in case the arena does not hold up in play:

- **Antisolar.** A side-view puzzle where you are the unicorn who sees the
  rainbow. A real rainbow is centred on the shadow of your own head, 42
  degrees wide, and only exists where rain falls, so it moves when you move
  and you can never walk it yourself. A herd of foals can. Stand so the bow
  bridges the gap, wait for the sun to bring it level with the ledge, poke a
  cloud with your horn to make it rain. Winter days keep the bow all day and
  low; summer days only have it at dawn and dusk.
- **Sevenfold.** A grid puzzle where a prism splits the unicorn into seven
  coloured copies that all move together and each only pass their own
  colour's gate; recombine them to make white and finish.

## License

Apache License 2.0. Copyright 2026 Raimon Rafols.
