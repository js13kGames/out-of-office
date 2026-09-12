/**
 * PointerLook - pointer-lock mouse look.
 *
 * Accumulates raw mouse deltas between simulation steps; the controller calls
 * consume() once per fixed update and gets the movement since the last call.
 */

class PointerLook {
  constructor(element) {
    this.el = element || document.body
    this.dx = 0
    this.dy = 0
    this.locked = false
    this.onLockChange = null
    this.onFire = null
    this.firing = false
  }

  init() {
    document.addEventListener('mousemove', e => {
      if (!this.locked) return
      this.dx += e.movementX || 0
      this.dy += e.movementY || 0
    })

    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.el
      if (!this.locked) this.firing = false
      if (this.onLockChange) this.onLockChange(this.locked)
    })

    document.addEventListener('mousedown', e => {
      if (this.locked && e.button === 0) this.firing = true
    })
    document.addEventListener('mouseup', e => {
      if (e.button === 0) this.firing = false
    })
  }

  request() {
    if (!this.locked && this.el.requestPointerLock) this.el.requestPointerLock()
  }

  release() {
    if (document.exitPointerLock) document.exitPointerLock()
  }

  consume() {
    const d = [this.dx, this.dy]
    this.dx = 0
    this.dy = 0
    return d
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PointerLook
}
