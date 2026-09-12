/**
 * Everything the renderer draws: geometry from a MeshBuilder, plus the GL state
 * that geometry wants around it.
 *
 * This used to be `Mesh extends RenderObject`, but Mesh overrode the whole
 * lifecycle without ever calling super, so the base class was 1 KB of
 * unreachable code plus state nothing read - ttl, interpolation targets,
 * collision flags, a `related` list.
 *
 * There is no model transform either: every builder writes world-space
 * vertices, so modelViewMatrix stays identity. VIEWMODEL is the one exception
 * and replaces getModelViewMatrix() on its own instances to place the horn in
 * view space.
 *
 * Shaders are required now. The old default vertex/fragment pair existed for a
 * Mesh constructed without them, which never happens.
 */

class Mesh {
  constructor(opts = {}) {
    this.vsSrc = opts.vs
    this.fsSrc = opts.fs
    this.dynamic = !!opts.dynamic
    this.builder = opts.builder || null

    this.factor = 1.0
    this.modelViewMatrix = create()

    this.shaderProgram = null
    this.vertexBufferId = null
    this.colorBufferId = null
    this.surfaceBufferId = null
    this.indexBufferId = null
    this.attribLocations = {}
    this.uniformLocations = {}

    this._verts = new Float32Array(0)
    this._cols = new Float32Array(0)
    this._surfs = new Float32Array(0)
    this._idx = new Uint16Array(0)
    this._dirty = false

    // preRender/postRender GL state overrides (additive blending, depth clear...)
    this.additive = !!opts.additive
    this.clearDepth = !!opts.clearDepth
    this.noDepthWrite = !!opts.noDepthWrite
    this.noCull = !!opts.noCull
  }

  indexBuffer() { return this._idx }

  getModelViewMatrix() { return this.modelViewMatrix }

  /** Rebuild geometry through the attached builder: mesh.build(mb => {...}) */
  build(fn) {
    const mb = this.builder
    mb.reset()
    fn(mb)
    this._verts = mb.verts()
    this._cols = mb.colors()
    this._surfs = mb.surfaces()
    this._idx = mb.indices()
    this._dirty = true
    return this
  }

  init(renderer) {
    this.renderer = renderer
    const gl = renderer.gl

    // shared, cached program (keyed on source) rather than one per object
    this.shaderProgram = renderer.getShader(this.vsSrc, this.fsSrc)
    if (!this.shaderProgram) return

    this.attribLocations.vertexPosition = gl.getAttribLocation(this.shaderProgram, 'aVertexPosition')
    this.attribLocations.vertexColor = gl.getAttribLocation(this.shaderProgram, 'aVertexColor')
    // -1 when the shader doesn't use it, in which case we never bind it and the
    // attribute falls back to its constant value of 0 ("untextured").
    this.attribLocations.vertexSurface = gl.getAttribLocation(this.shaderProgram, 'aVertexSurface')
    this.uniformLocations.projectionMatrix = gl.getUniformLocation(this.shaderProgram, 'uProjectionMatrix')
    this.uniformLocations.modelViewMatrix = gl.getUniformLocation(this.shaderProgram, 'uModelViewMatrix')
    this.uniformLocations.cameraMatrix = gl.getUniformLocation(this.shaderProgram, 'uCameraMatrix')
    this.uniformLocations.factor = gl.getUniformLocation(this.shaderProgram, 'factor')

    const usage = this.dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW
    this.vertexBufferId = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBufferId)
    gl.bufferData(gl.ARRAY_BUFFER, this._verts, usage)

    this.colorBufferId = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBufferId)
    gl.bufferData(gl.ARRAY_BUFFER, this._cols, usage)

    this.surfaceBufferId = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.surfaceBufferId)
    gl.bufferData(gl.ARRAY_BUFFER, this._surfs, usage)

    this.indexBufferId = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBufferId)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._idx, usage)
    this._dirty = false
  }

  preRender() {
    const gl = this.renderer.gl

    // Re-uploading into the same buffer objects keeps the vertexAttribPointer
    // bindings the renderer already made valid.
    if (this._dirty) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBufferId)
      gl.bufferData(gl.ARRAY_BUFFER, this._verts, gl.DYNAMIC_DRAW)
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBufferId)
      gl.bufferData(gl.ARRAY_BUFFER, this._cols, gl.DYNAMIC_DRAW)
      gl.bindBuffer(gl.ARRAY_BUFFER, this.surfaceBufferId)
      gl.bufferData(gl.ARRAY_BUFFER, this._surfs, gl.DYNAMIC_DRAW)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBufferId)
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._idx, gl.DYNAMIC_DRAW)
      this._dirty = false
    }

    // The renderer only knows about position and colour, so the surface
    // attribute is bound here - after its uploads, before the draw call.
    const sLoc = this.attribLocations.vertexSurface
    if (sLoc !== undefined && sLoc >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.surfaceBufferId)
      gl.enableVertexAttribArray(sLoc)
      gl.vertexAttribPointer(sLoc, 1, gl.FLOAT, false, 0, 0)
    }

    if (this.clearDepth) gl.clear(gl.DEPTH_BUFFER_BIT)
    if (this.additive) gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
    if (this.noDepthWrite || this.additive) gl.depthMask(false)
    if (this.noCull) gl.disable(gl.CULL_FACE)
  }

  postRender() {
    const gl = this.renderer.gl
    // Attribute arrays are global state: leaving this enabled would feed stale
    // surface ids to the next mesh drawn with the same program.
    const sLoc = this.attribLocations.vertexSurface
    if (sLoc !== undefined && sLoc >= 0) gl.disableVertexAttribArray(sLoc)

    if (this.additive) gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    if (this.noDepthWrite || this.additive) gl.depthMask(true)
    if (this.noCull) gl.enable(gl.CULL_FACE)
  }
}
