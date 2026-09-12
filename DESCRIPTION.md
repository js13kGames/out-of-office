# OUT OF OFFICE

The grey is the office. The bosses are its supplies. The goal is to be out of it.

A top-down arena survival shooter. You are a unicorn whose horn is a prism; every shot is a rainbow. The Grey climbs out of inkwells, eats the colour out of the meadow and comes for you in hundreds, up to a thousand at once. Kill it and the colour it was holding bursts back into the ground.

## Controls

- **WASD** or arrows move. The **mouse** aims; hold the button to fire.
- **Shift**, **Q**, **E** or the **right button** blinks: a short teleport straight through the grey, three charges.
- **P** or **Escape** pauses. **F** is fullscreen. **M** is sound.
- On the title, **left** and **right** pick EASY, NORMAL or HARD. On a level up, **click** a card; **R** rerolls the three, once a level.

## The meadow is a resource

Where the grey walks it leaves black ash. Ash is bad ground: you move at half speed on it, everything grey moves a third faster. Kills and dying shots repaint it. ASH in the HUD is how much of the field has gone, and the map in the corner shows where.

## Dispersion is the default weapon

The PRISM fires seven bullets, one per band, each at its own speed, so every volley fans into a rainbow with distance. Prism pickups shift the horn to one band with its own behaviour: REDSHIFT (a hose), RAINBOW RAIL (an instant beam through everything), GREEN GOO (puddles), BLUE FROST (slows), YELLOW ARC (chain lightning), ORANGE BURST (a shotgun). When the ammo runs out you are back to the PRISM.

## The office

Every fifth wave a boss walks in from a rota: the CENSOR, a black bar that fires rings of ink; the ERASER that charges in straight lines, rubbing out a lane; the STAPLER that opens its jaw and bites; the STAMP that marks where you stand and slams down with VOID; the SHREDDER that pulls you in and spits moths. From wave 30 they come in pairs, and every fortieth wave THE PHOTOCOPIER arrives on top: gigantic, rings of sixteen, and every four seconds it copies eight drabs off its edge.

## Perks and pickups

Three perk cards on every level, each rolling its own rarity from common to legend, thirty-six in all: stackable numbers, new rules (a magnet, regeneration on colour, a sharp horn, a repainting trail), the sky (bouncing shots, a foal that follows and fires, mirrored volleys, a burning blink), and legends (night falls, endless ammo, a burning trail, forty-second waves). Pickups drop from kills: hearts, prisms, gold, a paint bomb, a nova, an hourglass, a shield, sugar rush, and shards: five make WHITE LIGHT, eight seconds of every band at once, three times the fire rate, invulnerable, trampling.

Twelve achievements are kept between runs.

## Under the hood

Everything is generated at runtime, no assets:

- Sprites are strings, one character per pixel; the mane is seven hues by column, the tail seven by row.
- A thousand enemies live in a typed-array spatial hash; a full tick costs about a millisecond.
- Fire, sparks and explosions are drawn twice: once to the frame and once to a glow canvas that is shrunk three times and added back, which is the bloom.
- The meadow is 57,600 cells of colour with three species of flower that grow with their cell and are trampled flat by anything that walks on them.
- The music is one tracker: a 12/8 gallop over Am F C G with a filter-plucked bass, a ducking pad, a delayed arpeggio and a pentatonic lead, through a compressor and a reverb made of decaying noise. Every sound effect is one of the same voices. Kills pop in key and climb with the combo; the hourglass halves the tempo; near death the whole mix muffles.
- A 3x5 font in base-32 digits. 13,310 bytes.
