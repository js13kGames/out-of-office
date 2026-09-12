/**
 * Keyboard state.
 *
 * Mouse input goes through PointerLook, so nothing here tracks it: the mouse
 * position, button map, wheel and the six callback lists were all unread, as
 * were isKeyReleased() and dispose().
 *
 * `keys` holds what is currently held; `keysPressed` holds this frame's fresh
 * presses and is cleared at the end of every fixed step by Engine.update, so
 * edge-triggered reads work anywhere in the step.
 */

// Only the keys whose names are not just their character.
const KEY_NAMES = {
  9: 'TAB', 13: 'ENTER', 16: 'SHIFT', 17: 'CTRL', 18: 'ALT', 27: 'ESC',
  32: 'SPACE', 37: 'LEFT', 38: 'UP', 39: 'RIGHT', 40: 'DOWN'
}

class InputManager {
  constructor() {
    this.keys = {}
    this.keysPressed = {}
  }

  init() {
    window.addEventListener('keydown', e => {
      const key = this.getKeyName(e.keyCode)
      if (!this.keys[key]) this.keysPressed[key] = true
      this.keys[key] = true
    })
    window.addEventListener('keyup', e => { this.keys[this.getKeyName(e.keyCode)] = false })
    window.addEventListener('contextmenu', e => e.preventDefault())
  }

  // A-Z and 0-9 are already their own names, so only the rest need a table.
  getKeyName(keyCode) {
    return KEY_NAMES[keyCode] || String.fromCharCode(keyCode)
  }

  isKeyDown(key) { return !!this.keys[key.toUpperCase()] }
  isKeyPressed(key) { return !!this.keysPressed[key.toUpperCase()] }

  update() { this.keysPressed = {} }
}
