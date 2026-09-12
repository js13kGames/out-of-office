/**
 * WebGL Renderer class
 * Handles WebGL rendering operations and shader management
 */

class Renderer {
  constructor(gl) {
    this.gl = gl
    this.shaderCache = new Map()
    this.currentShader = null
  }
  
  // Shader compilation (extracted from render.js)
  buildShader(type, source) {
    const gl = this.gl
    const shader = gl.createShader(type === 'fragment' ? gl.FRAGMENT_SHADER : gl.VERTEX_SHADER)
    
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(shader)
      console.error(`Shader compilation error (${type}):`, error)
      console.error('Source:', source)
      gl.deleteShader(shader)
      return null
    }
    
    return shader
  }
  
  buildShaderProgram(vertexSource, fragmentSource) {
    const gl = this.gl
    const program = gl.createProgram()
    
    const vertexShader = this.buildShader('vertex', vertexSource)
    const fragmentShader = this.buildShader('fragment', fragmentSource)
    
    if (!vertexShader || !fragmentShader) {
      return null
    }
    
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const error = gl.getProgramLinkInfoLog(program)
      console.error('Shader program linking error:', error)
      gl.deleteProgram(program)
      return null
    }
    
    // Clean up shaders (they're linked into the program now)
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)
    
    return program
  }
  
  // Get or create shader program
  getShader(vertexSource, fragmentSource) {
    const key = vertexSource + '|' + fragmentSource
    
    if (!this.shaderCache.has(key)) {
      const program = this.buildShaderProgram(vertexSource, fragmentSource)
      if (program) {
        this.shaderCache.set(key, program)
      }
    }
    
    return this.shaderCache.get(key)
  }
  
  // Use shader program
  useShader(program) {
    if (this.currentShader !== program) {
      this.gl.useProgram(program)
      this.currentShader = program
    }
  }
  
  // Main render method
  render(objects, camera) {
    for (const object of objects) this.renderObject(object, camera)
  }
  
  /**
   * Draws one Mesh.
   *
   * Everything drawn is a Mesh now, so the duck-typing this used to do — does
   * it have attribLocations, a preRender, an indexBuffer — is all provably
   * true and gone. Uniform locations are still allowed to be null: that is what
   * getUniformLocation returns for a uniform the shader does not declare, and
   * gl.uniform* with a null location is a defined no-op.
   */
  renderObject(object, camera) {
    if (object._needsInit) {
      object.init(this)
      object._needsInit = false
    }

    if (!object.shaderProgram || object.factor === 0) return

    const gl = this.gl
    const attrib = object.attribLocations
    const uniform = object.uniformLocations

    this.useShader(object.shaderProgram)

    gl.bindBuffer(gl.ARRAY_BUFFER, object.vertexBufferId)
    gl.enableVertexAttribArray(attrib.vertexPosition)
    gl.vertexAttribPointer(attrib.vertexPosition, 3, gl.FLOAT, false, 0, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, object.colorBufferId)
    gl.enableVertexAttribArray(attrib.vertexColor)
    gl.vertexAttribPointer(attrib.vertexColor, 4, gl.FLOAT, false, 0, 0)

    gl.uniformMatrix4fv(uniform.projectionMatrix, false, camera.projectionMatrix)
    gl.uniformMatrix4fv(uniform.cameraMatrix, false, camera.getViewMatrix())
    gl.uniformMatrix4fv(uniform.modelViewMatrix, false, object.getModelViewMatrix())
    gl.uniform1f(uniform.factor, object.factor)

    object.preRender()

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.indexBufferId)
    gl.drawElements(gl.TRIANGLES, object.indexBuffer().length, gl.UNSIGNED_SHORT, 0)

    object.postRender()

    gl.disableVertexAttribArray(attrib.vertexPosition)
    gl.disableVertexAttribArray(attrib.vertexColor)
  }

}

// Export for module systems (if available)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Renderer
}