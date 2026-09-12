/**
 * Ground-based first person camera.
 *
 * View rotation is Rz*Rx*Ry: yaw about world Y first, then pitch about the
 * (already yawed) view X axis, then roll as a screen-space lean. Composing it
 * the other way round — yaw last — means that once you are yawed 90 degrees,
 * pitching does nothing useful.
 *
 * Conventions that fall out of the matrix layout:
 *   forward = (-sin(yaw)*cos(pitch), sin(pitch), -cos(yaw)*cos(pitch))
 *   right   = ( cos(yaw), 0, -sin(yaw))            (always horizontal)
 * so +yaw turns left, +pitch looks up.
 *
 * The player controller owns the eye position exactly, so there is no
 * smoothing, no target position and no movement helpers here.
 */

class Camera {
  constructor(options = {}) {
    this.position = [0, 0, 0]
    this.pitchAngle = 0
    this.yawAngle = 0
    this.rollAngle = 0
    this.maxPitch = options.maxPitch || 1.52 // just under 90 degrees

    this.fov = options.fov || 45 * Math.PI / 180
    this.near = options.near || 0.1
    this.far = options.far || 8000

    this.viewMatrix = create()
    this.projectionMatrix = create()

    this.updateProjection(1)
    this.updateView()
  }

  updateProjection(aspect) {
    perspective(this.projectionMatrix, this.fov, aspect, this.near, this.far)
  }

  setEye(x, y, z) {
    this.position[0] = x
    this.position[1] = y
    this.position[2] = z
  }

  setAngles(pitch, yaw, roll) {
    this.pitchAngle = Math.max(-this.maxPitch, Math.min(this.maxPitch, pitch))
    this.yawAngle = yaw
    this.rollAngle = roll || 0
  }

  // NOTE: getX() rather than x() so nothing collides with a same-named field.
  getForward(out) {
    const cp = Math.cos(this.pitchAngle), sp = Math.sin(this.pitchAngle)
    const cy = Math.cos(this.yawAngle), sy = Math.sin(this.yawAngle)
    out = out || [0, 0, 0]
    out[0] = -sy * cp
    out[1] = sp
    out[2] = -cy * cp
    return out
  }

  getRight(out) {
    out = out || [0, 0, 0]
    out[0] = Math.cos(this.yawAngle)
    out[1] = 0
    out[2] = -Math.sin(this.yawAngle)
    return out
  }

  // View-space up, needed for camera-facing billboards.
  getUp(out) {
    out = out || [0, 0, 0]
    cross(out, this.getRight(), this.getForward())
    return out
  }

  getViewMatrix() {
    return this.viewMatrix
  }

  /**
   * view = Rz * Rx * Ry * T(-eye), written out directly.
   *
   * Composing it from four scratch matrices and three generic 4x4 multiplies
   * was the only caller of matrix.js's multiply(), so expanding the product by
   * hand deletes that function from the build as well. The closed form is
   * checked against the composed one over random poses; they agree to float32.
   */
  updateView() {
    const cx = Math.cos(this.pitchAngle), sx = Math.sin(this.pitchAngle)
    const cy = Math.cos(this.yawAngle), sy = Math.sin(this.yawAngle)
    const cz = Math.cos(this.rollAngle), sz = Math.sin(this.rollAngle)

    // rotation rows
    const r00 = cz * cy + sz * sx * sy, r01 = sz * cx, r02 = sz * sx * cy - cz * sy
    const r10 = cz * sx * sy - sz * cy, r11 = cz * cx, r12 = sz * sy + cz * sx * cy
    const r20 = cx * sy, r21 = -sx, r22 = cx * cy

    const [px, py, pz] = this.position
    const m = this.viewMatrix

    // column-major: m[col * 4 + row]
    m[0] = r00; m[1] = r10; m[2] = r20
    m[4] = r01; m[5] = r11; m[6] = r21
    m[8] = r02; m[9] = r12; m[10] = r22
    m[12] = -(r00 * px + r01 * py + r02 * pz)
    m[13] = -(r10 * px + r11 * py + r12 * pz)
    m[14] = -(r20 * px + r21 * py + r22 * pz)
    m[15] = 1
  }
}
