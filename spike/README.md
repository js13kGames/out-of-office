# OUT OF OFFICE, first person (spike)

The same game seen through the unicorn's eyes, on the WebGL engine from the
2025 entry. A spike: it proves the simulation ports as-is and shows what the
arena reads like in first person. Nothing here is size-optimised.

    python3 -m http.server 8765        # from the repository root
    open http://127.0.0.1:8765/spike/

Click to start and grab the mouse. WASD moves relative to where you look,
the mouse looks, hold the button to fire, Shift or the right button blinks,
P or Escape pauses (Escape also releases the mouse; click to grab it again).
Perk cards and the difficulty pick work as in the 2D game.

## How it is put together

- `engine/` is the 2025 engine, copied verbatim: camera, renderer, mesh
  builder, pointer lock, fixed-step loop.
- `../src/*.js` are the game's own modules, loaded unchanged: data, state,
  meadow, input, player, bullets, enemies, wells, HUD and screens. The 2D
  drawing functions are simply never called.
- `boot.js` stands in for `src/00_boot.js`: it provides the 320 x 180 canvas the
  HUD draws on, as a transparent overlay above the WebGL view, and the map.
- `models.js` is the modelling layer. Every creature and prop is a cage of
  boxes; soft ones go through one or two levels of Catmull-Clark subdivision,
  which turns a box into a pebble and a stack of boxes into a body, and sharp
  ones (the censor bar, the stapler, lettering) stay as cages. Each part is
  baked once into flat-shaded triangles under a fixed light and stamped per
  instance with a position, yaw, scale, squash and tint. Small kinds are built
  twice, a high-detail body at two levels for close range and a lighter one
  at one level further out, with billboards beyond 24 m. Every kind has its
  own details: drabs have brows, mouths and feet; moths a thorax, abdomen,
  antennae and eyespots on the wings; spitters teeth and warts; smudges five
  lumps and drips; blots eight spikes and one big eye; shades a hood, a cloak
  flare and a face plate; statics a bright core. The censor has rounded ends
  and a lit edge, the eraser a paper sleeve and grit, the stapler a hinge,
  anvil plate, a staple and rubber feet, the stamp a rubber pad, grip ring and
  knob, the shredder a hood, teeth, a power light and paper strips, the copier
  a propped lid, control panel with buttons, paper stack, output slot and
  wheels. Bosses carry their words (CENSORED, VOID, COPY) as raised pixel
  blocks built from the game's own 3x5 font. Foals have a muzzle, ears,
  hooves, a horn, a mane and a tail in the seven hues. Flowers are a stem
  with two leaves and a yellow heart plus one of three heads, a double
  four-petal cross, a dimpled round head or a five-petal star with stamens,
  tinted by the cell's hue and grown by its colour. The view model is a
  rounded muzzle with nostrils and a lip under the horn.
- `fps.js` is the port. It redefines `stepPlayer` (movement relative to the
  view, aim from the yaw, fire from pointer lock), mirrors `tick` from the
  loop, and builds four meshes a frame: the meadow within 44 cells with its
  flowers and the pit walls; the actors, full models within 32 m and
  billboards with eyes beyond, with per-kind animation (drabs squash, moths
  flap, spitters open their mouths, the stapler's jaw lifts, the stamp rises
  and slams, the copier's scan bar sweeps), plus foals, stone-ringed wells and
  spinning pickup diamonds; the glow pass (shots, the rail, arcs, goo, spit,
  sparks and explosions, additive); and the muzzle and horn in view space.

Scale: 16 world pixels make a metre, so the field is 160 by 90 m, a drab is
about 0.7 m tall and the photocopier 7 m. The eye rides at 1.6 m. Enemies
still move on the flat plane the 2D game simulates; the 3D view is a faithful
projection of that plane, which is why the gameplay is identical.

## What a real port would need

- Limbs and faces with more character than boxes give, and idle animation.
- A sense of height for shots and spit: they fly at horn height today.
- Sound and music already work; the bloom is the additive pass, not the 2D
  glow canvases.
- The size budget. The engine alone is around 3 KB zipped after the 2025
  build; this spike is nowhere near 13 KB and was not meant to be.
