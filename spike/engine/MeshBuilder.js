/**
 * MeshBuilder - accumulates vertices/colors/indices into preallocated typed arrays.
 *
 * Everything in the engine draws through vertex colors (no textures, no normals),
 * so this is the single place geometry gets authored. Supports an optional
 * transform stack entry (translate + yaw + uniform scale) so model code can be
 * written in local space and stamped anywhere in the world.
 */

class MeshBuilder {
  constructor(maxVerts = 16000) {
    this.max = Math.min(maxVerts, 65535)
    this.v = new Float32Array(this.max * 3)
    this.c = new Float32Array(this.max * 4)
    this.s = new Float32Array(this.max)
    this.i = new Uint16Array(this.max * 3)
    this.nv = 0
    this.ni = 0
    this.xf = null
    this.surf = 0
  }

  reset() {
    this.nv = 0
    this.ni = 0
    this.xf = null
    this.surf = 0
    return this
  }

  /**
   * Surface id stamped onto every subsequent vertex. Shaders use it to pick a
   * procedural material; 0 means "untextured" and is the default, so anything
   * that doesn't opt in is unaffected.
   */
  surface(id) {
    this.surf = id
    return this
  }

  // Local -> world transform applied to every subsequent vert()
  xform(x, y, z, yaw = 0, s = 1) {
    this.xf = [x, y, z, Math.cos(yaw), Math.sin(yaw), s]
    return this
  }

  noXform() {
    this.xf = null
    return this
  }

  room(verts) {
    return this.nv + verts <= this.max && this.ni + verts * 3 <= this.i.length
  }

  vert(x, y, z, col) {
    const f = this.xf
    if (f) {
      x *= f[5]; y *= f[5]; z *= f[5]
      const nx = x * f[3] + z * f[4]
      const nz = -x * f[4] + z * f[3]
      x = nx + f[0]; y += f[1]; z = nz + f[2]
    }
    const k = this.nv
    this.v[k * 3] = x
    this.v[k * 3 + 1] = y
    this.v[k * 3 + 2] = z
    this.c[k * 4] = col[0]
    this.c[k * 4 + 1] = col[1]
    this.c[k * 4 + 2] = col[2]
    this.c[k * 4 + 3] = col[3] === undefined ? 1 : col[3]
    this.s[k] = this.surf
    this.nv++
    return k
  }

  tri3(a, b, c) {
    this.i[this.ni++] = a
    this.i[this.ni++] = b
    this.i[this.ni++] = c
  }

  // Triangle from three points (CCW when seen from the front)
  tri(p0, p1, p2, c0, c1, c2) {
    if (!this.room(3)) return
    const a = this.vert(p0[0], p0[1], p0[2], c0)
    const b = this.vert(p1[0], p1[1], p1[2], c1 || c0)
    const c = this.vert(p2[0], p2[1], p2[2], c2 || c0)
    this.tri3(a, b, c)
  }

  // Quad from four points in CCW order as seen from the front face
  quad(p0, p1, p2, p3, c0, c1, c2, c3) {
    if (!this.room(4)) return
    const a = this.vert(p0[0], p0[1], p0[2], c0)
    const b = this.vert(p1[0], p1[1], p1[2], c1 || c0)
    const c = this.vert(p2[0], p2[1], p2[2], c2 || c0)
    const d = this.vert(p3[0], p3[1], p3[2], c3 || c0)
    this.tri3(a, b, c)
    this.tri3(a, c, d)
  }

  /**
   * Axis-aligned box with outward-facing (CCW) winding.
   * colLo/colHi give a vertical gradient; shade dims faces by orientation so
   * geometry reads as 3D without any lighting maths in the shader.
   */
  /**
   * `surf3` optionally overrides the surface id per face orientation as
   * [xFacing, yFacing, zFacing], so a box can carry a different procedural
   * material on its sides and its top.
   */
  box(x0, y0, z0, x1, y1, z1, colLo, colHi, shade, surf3) {
    if (!this.room(24)) return
    const cH = colHi || colLo
    const sh = shade || MeshBuilder.SHADE
    const m = (c, k) => [c[0] * k, c[1] * k, c[2] * k, c[3] === undefined ? 1 : c[3]]

    const lo = m(colLo, sh.side), hi = m(cH, sh.side)
    const loB = m(colLo, sh.sideB), hiB = m(cH, sh.sideB)
    const keep = this.surf

    // +Z / -Z / +X / -X get slightly different shades for readability
    if (surf3) this.surf = surf3[2]
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], lo, lo, hi, hi)
    this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], lo, lo, hi, hi)
    if (surf3) this.surf = surf3[0]
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], loB, loB, hiB, hiB)
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], loB, loB, hiB, hiB)
    // top / bottom
    const t = m(cH, sh.top), b = m(colLo, sh.bottom)
    if (surf3) this.surf = surf3[1]
    this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], t)
    this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], b)
    this.surf = keep
  }

  // Bipyramid ("diamond"): rx/rz radius at the waist, +ty up, -by down.
  diamond(rx, ty, by, rz, colTop, colBot, sides = 6) {
    const cb = colBot || colTop
    if (!this.room(sides * 6)) return
    const rzz = rz === undefined ? rx : rz
    for (let s = 0; s < sides; s++) {
      const a0 = (s / sides) * Math.PI * 2
      const a1 = ((s + 1) / sides) * Math.PI * 2
      const x0 = Math.cos(a0) * rx, z0 = Math.sin(a0) * rzz
      const x1 = Math.cos(a1) * rx, z1 = Math.sin(a1) * rzz
      // shade each facet slightly by its angle so the silhouette reads
      const k = 0.72 + 0.28 * Math.abs(Math.cos(a0))
      const ct = [colTop[0] * k, colTop[1] * k, colTop[2] * k, colTop[3] === undefined ? 1 : colTop[3]]
      const cbb = [cb[0] * k * 0.8, cb[1] * k * 0.8, cb[2] * k * 0.8, cb[3] === undefined ? 1 : cb[3]]
      this.tri([0, ty, 0], [x0, 0, z0], [x1, 0, z1], ct)
      this.tri([0, -by, 0], [x1, 0, z1], [x0, 0, z0], cbb)
    }
  }

  /**
   * Tapered, optionally twisted cone built from stacked rings - used for the
   * unicorn horn. colFn(t) returns the colour for ring t in [0..1].
   */
  cone(r, h, rings, sides, twist, colFn) {
    if (!this.room((rings + 1) * sides + sides)) return
    let prev = null
    for (let ri = 0; ri <= rings; ri++) {
      const t = ri / rings
      const rr = r * (1 - t) * (1 - t * 0.25)
      const y = h * t
      const col = colFn(t)
      const ring = []
      for (let s = 0; s < sides; s++) {
        const a = (s / sides) * Math.PI * 2 + t * twist
        // ridged spiral profile
        const bump = 1 + 0.28 * Math.cos(s * 2 * Math.PI)
        ring.push(this.vert(Math.cos(a) * rr * bump, y, Math.sin(a) * rr * bump, col))
      }
      if (prev) {
        for (let s = 0; s < sides; s++) {
          const n = (s + 1) % sides
          this.tri3(prev[s], ring[s], ring[n])
          this.tri3(prev[s], ring[n], prev[n])
        }
      }
      prev = ring
    }
  }

  /**
   * Camera-facing disc with a bright centre fading to a transparent rim.
   * A flat billboard quad reads as a hard-edged square once it gets large;
   * this gets a real radial falloff out of vertex colours alone.
   */
  disc(x, y, z, size, col, right, up, segs = 10) {
    if (!this.room(segs + 1)) return
    const a = col[3] === undefined ? 1 : col[3]
    const centre = this.vert(x, y, z, [col[0], col[1], col[2], a])
    const rim = [col[0], col[1], col[2], 0]
    const first = this.nv
    for (let s = 0; s < segs; s++) {
      const ang = (s / segs) * Math.PI * 2
      const c = Math.cos(ang) * size, si = Math.sin(ang) * size
      this.vert(
        x + right[0] * c + up[0] * si,
        y + right[1] * c + up[1] * si,
        z + right[2] * c + up[2] * si,
        rim)
    }
    // CCW as seen from the camera, since right x up points back at the viewer
    for (let s = 0; s < segs; s++) {
      this.tri3(centre, first + s, first + ((s + 1) % segs))
    }
  }

  /**
   * Extrude a coloured cross-section along a polyline, twisting each rung to
   * face the eye so the strip never turns edge-on and vanishes.
   *
   * `cols` are laid across the width and get a transparent margin either side,
   * so the band reads as a soft-edged ribbon rather than a cut-out strip.
   * `alphaAt(t)` fades along the length, t=0 at the tail and 1 at the head.
   *
   * `perp` rotates the strip a quarter turn about the direction of travel. Two
   * calls, one with and one without, give a crossed cross-section that keeps
   * some width on screen from every angle - including looking straight down the
   * line of travel, where a single camera-facing strip collapses to nothing.
   */
  ribbon(pts, halfWidth, eye, cols, alphaAt, perp) {
    const n = pts.length
    const L = cols.length + 2
    if (n < 2 || !this.room(n * L)) return
    const first = this.nv

    for (let i = 0; i < n; i++) {
      const p = pts[i]
      const a = pts[i > 0 ? i - 1 : 0]
      const b = pts[i < n - 1 ? i + 1 : n - 1]

      let dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]
      const dl = Math.hypot(dx, dy, dz) || 1
      dx /= dl; dy /= dl; dz /= dl

      const cx = eye[0] - p[0], cy = eye[1] - p[1], cz = eye[2] - p[2]
      // side = travel x toEye, i.e. the screen-horizontal of this segment
      let sx = dy * cz - dz * cy
      let sy = dz * cx - dx * cz
      let sz = dx * cy - dy * cx
      let sl = Math.hypot(sx, sy, sz)

      if (sl < 1e-4) {
        // Travelling straight at or away from the eye, so that cross product
        // told us nothing. Any perpendicular to travel will do.
        sx = -dz; sy = 0; sz = dx                 // travel x worldUp
        sl = Math.hypot(sx, sy, sz)
        if (sl < 1e-4) { sx = 1; sy = 0; sz = 0; sl = 1 }   // travel was vertical
      }
      sx /= sl; sy /= sl; sz /= sl

      if (perp) {
        const px = dy * sz - dz * sy
        const py = dz * sx - dx * sz
        const pz = dx * sy - dy * sx
        const pl = Math.hypot(px, py, pz) || 1
        sx = px / pl; sy = py / pl; sz = pz / pl
      }

      const al = alphaAt(n > 1 ? i / (n - 1) : 1)
      for (let j = 0; j < L; j++) {
        const u = ((j / (L - 1)) * 2 - 1) * halfWidth
        const c = cols[Math.min(cols.length - 1, Math.max(0, j - 1))]
        const edge = j === 0 || j === L - 1
        this.vert(p[0] + sx * u, p[1] + sy * u, p[2] + sz * u,
          [c[0], c[1], c[2], edge ? 0 : al])
      }
    }

    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < L - 1; j++) {
        const a = first + i * L + j
        this.tri3(a, a + L, a + 1)
        this.tri3(a + 1, a + L, a + L + 1)
      }
    }
  }

  // Camera-facing quad, for particles and glows.
  billboard(x, y, z, size, col, right, up) {
    if (!this.room(4)) return
    const rx = right[0] * size, ry = right[1] * size, rz = right[2] * size
    const ux = up[0] * size, uy = up[1] * size, uz = up[2] * size
    this.quad(
      [x - rx - ux, y - ry - uy, z - rz - uz],
      [x + rx - ux, y + ry - uy, z + rz - uz],
      [x + rx + ux, y + ry + uy, z + rz + uz],
      [x - rx + ux, y - ry + uy, z - rz + uz],
      col)
  }

  // Views sized to what was actually written - safe to hand straight to bufferData
  verts() { return this.v.subarray(0, this.nv * 3) }
  colors() { return this.c.subarray(0, this.nv * 4) }
  surfaces() { return this.s.subarray(0, this.nv) }
  indices() { return this.i.subarray(0, this.ni) }
}

MeshBuilder.SHADE = { top: 1.0, bottom: 0.45, side: 0.78, sideB: 0.62 }

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MeshBuilder
}
