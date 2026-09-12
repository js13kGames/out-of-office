/**
 * Main 3D Engine class
 * Handles initialization, game loop, and coordination between systems
 */

class Engine {
  constructor(options = {}) {
    this.canvas3D = options.canvas3D || document.getElementsByTagName('canvas')[0]
    this.canvas2D = options.canvas2D || document.getElementsByTagName('canvas')[1]
    
    // WebGL context
    this.gl = this.canvas3D.getContext('webgl')
    if (!this.gl) {
      throw new Error('WebGL not supported')
    }
    
    // 2D context for UI/HUD
    this.ctx2D = this.canvas2D.getContext('2d')
    
    // Draw list. Order is draw order; nothing is ever removed, so this is a
    // plain array rather than a Scene with an id index and a ttl sweep.
    this.objects = []

    this.camera = options.camera || new Camera()
    this.renderer = new Renderer(this.gl)
    this.input = new InputManager()

    // Game loop
    this.lastTime = 0
    this.frameTime = options.frameTime || 20 // Fixed timestep in ms
    this.accumulator = 0
    this.clearColor = options.clearColor || [0, 0, 0, 1]

    // Event callbacks
    this.onUpdate = null
    this.onPreRender = null // (alpha) - runs before the objects are drawn
    this.onRender = null
    
    this.init()
  }
  
  init() {
    // Setup WebGL state
    this.gl.enable(this.gl.DEPTH_TEST)
    this.gl.depthFunc(this.gl.LEQUAL)
    this.gl.enable(this.gl.BLEND)
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)
    this.gl.enable(this.gl.CULL_FACE)
    
    // Setup canvas resize
    this.setupResize()
    
    // Initialize input
    this.input.init()
  }
  
  setupResize() {
    const resize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      this.canvas3D.width = width
      this.canvas3D.height = height
      this.canvas2D.width = width
      this.canvas2D.height = height
      
      this.gl.viewport(0, 0, width, height)
      
      this.camera.updateProjection(width / height)
    }
    
    window.addEventListener('resize', resize)
    resize() // Initial resize
  }
  
  start() {
    this.lastTime = performance.now()
    this.accumulator = 0
    this.isFirstFrame = true
    requestAnimationFrame(this.gameLoop)
  }

  gameLoop = (currentTime) => {
    // Handle first frame
    if (this.isFirstFrame) {
      this.lastTime = currentTime || performance.now()
      this.isFirstFrame = false
      requestAnimationFrame(this.gameLoop)
      return
    }
    
    if (!currentTime || currentTime === 0) {
      currentTime = performance.now()
    }
    
    const deltaTime = currentTime - this.lastTime
    this.lastTime = currentTime
    this.accumulator += deltaTime
    
    // Fixed timestep updates
    while (this.accumulator >= this.frameTime) {
      this.update(this.frameTime)
      this.accumulator -= this.frameTime
    }
    
    this.render(Math.min(1, this.accumulator / this.frameTime))
    
    requestAnimationFrame(this.gameLoop)
  }
  
  /** Adds a drawable. The renderer initialises it on its first frame. */
  add(object) {
    object._needsInit = true
    this.objects.push(object)
    return object
  }

  update(deltaTime) {

    // Game-specific update callback
    if (this.onUpdate) {
      this.onUpdate(deltaTime)
    }

    // Clear per-frame input state last, so isKeyPressed()/isKeyReleased() are
    // still readable by everything that ran during this step.
    this.input.update()
  }

  render(alpha) {
    // Interpolate anything that needs to be current before drawing
    if (this.onPreRender) {
      this.onPreRender(alpha)
    }

    // Clear buffers
    const c = this.clearColor
    this.gl.clearColor(c[0], c[1], c[2], c[3])
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)

    this.ctx2D.clearRect(0, 0, this.canvas2D.width, this.canvas2D.height)

    // Render 3D scene
    this.renderer.render(this.objects, this.camera)
    
    // Game-specific render callback (for HUD, UI, etc.)
    if (this.onRender) {
      this.onRender(this.ctx2D, alpha)
    }
  }

  get width() { return this.canvas3D.width }
  get height() { return this.canvas3D.height }
}

// Export for module systems (if available)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Engine
}