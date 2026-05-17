/**
 * jointAngles.js
 *
 * Pure math utilities. No MediaPipe imports — just vectors.
 *
 * MediaPipe Pose landmarks are normalised {x, y, z, visibility} objects
 * where x/y are 0–1 fractions of the video frame.
 *
 * We compute the angle AT the vertex landmark, formed by:
 *   vector_A  = A  - VERTEX
 *   vector_B  = B  - VERTEX
 *   angle     = arccos( dot(A, B) / (|A| * |B|) )
 */

/**
 * Compute the angle (degrees) at the VERTEX point,
 * formed by the rays VERTEX→A and VERTEX→B.
 *
 * @param {Object} a      - landmark {x, y, z}
 * @param {Object} vertex - landmark {x, y, z}
 * @param {Object} b      - landmark {x, y, z}
 * @param {boolean} use3D - include z axis (less stable, better for twists)
 * @returns {number} angle in degrees [0, 180]
 */
export function angleBetween(a, vertex, b, use3D = false) {
  const ax = a.x - vertex.x
  const ay = a.y - vertex.y
  const az = use3D ? (a.z - vertex.z) : 0

  const bx = b.x - vertex.x
  const by = b.y - vertex.y
  const bz = use3D ? (b.z - vertex.z) : 0

  const dot = ax * bx + ay * by + az * bz
  const magA = Math.sqrt(ax * ax + ay * ay + az * az)
  const magB = Math.sqrt(bx * bx + by * by + bz * bz)

  if (magA < 1e-6 || magB < 1e-6) return 0

  // Clamp to [-1, 1] to guard against floating-point drift past the domain of acos
  const cosAngle = Math.max(-1, Math.min(1, dot / (magA * magB)))
  return (Math.acos(cosAngle) * 180) / Math.PI
}

/**
 * Extract three landmarks from a pose result by index
 * and compute the angle at the middle (vertex) landmark.
 *
 * @param {Array}   landmarks  - array of {x,y,z,visibility} from MediaPipe
 * @param {number}  idxA       - index of point A
 * @param {number}  idxVertex  - index of the vertex (angle measured here)
 * @param {number}  idxB       - index of point B
 * @param {number}  minVis     - minimum visibility threshold (skip if below)
 * @returns {number|null} angle in degrees, or null if landmarks not visible
 */
export function jointAngle(landmarks, idxA, idxVertex, idxB, minVis = 0.5) {
  const a = landmarks[idxA]
  const v = landmarks[idxVertex]
  const b = landmarks[idxB]

  if (!a || !v || !b) return null

  // Skip measurement if any landmark isn't reliably detected
  if (
    a.visibility < minVis ||
    v.visibility < minVis ||
    b.visibility < minVis
  ) {
    return null
  }

  return angleBetween(a, v, b)
}

/**
 * Compute joint angle from a calibration step definition.
 *
 * @param {Array}  landmarks  - MediaPipe pose landmarks array
 * @param {Object} step       - a CALIBRATION_STEPS entry with .landmarks = [idxA, idxVertex, idxB]
 * @returns {number|null}
 */
export function jointAngleForStep(landmarks, step) {
  const [idxA, idxVertex, idxB] = step.landmarks
  return jointAngle(landmarks, idxA, idxVertex, idxB)
}

export function areStepLandmarksVisible(landmarks, step, minVis = 0.5) {
  const [idxA, idxVertex, idxB] = step.landmarks
  return [idxA, idxVertex, idxB].every((index) => {
    const lm = landmarks[index]
    return !!lm && lm.visibility >= minVis
  })
}

/**
 * Smooth an angle reading using exponential moving average.
 * Reduces jitter from single-frame noise.
 *
 * @param {number} prev    - previous smoothed value
 * @param {number} current - new raw reading
 * @param {number} alpha   - smoothing factor [0,1]; higher = more responsive
 * @returns {number}
 */
export function smoothAngle(prev, current, alpha = 0.3) {
  if (prev === null) return current
  return alpha * current + (1 - alpha) * prev
}
