/**
 * camera.js
 *
 * Sets up the webcam feed and provides canvas drawing helpers
 * for the live skeleton overlay.
 */

/**
 * Start the webcam and attach it to a <video> element.
 *
 * @param {HTMLVideoElement} videoEl
 * @param {{ width, height }} [constraints]
 * @returns {Promise<MediaStream>}
 */
export async function startCamera(videoEl, constraints = { width: 640, height: 480 }) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: constraints.width },
      height: { ideal: constraints.height },
      facingMode: 'user',
    },
    audio: false,
  })

  videoEl.srcObject = stream
  videoEl.setAttribute('playsinline', '') // iOS Safari
  await videoEl.play()

  return stream
}

/**
 * Stop all tracks on a MediaStream.
 * @param {MediaStream} stream
 */
export function stopCamera(stream) {
  stream?.getTracks().forEach(t => t.stop())
}

/**
 * Draw the mirrored video frame onto a canvas context.
 * We mirror so the user sees a natural "mirror" view.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLVideoElement} videoEl
 */
export function drawMirroredVideo(ctx, videoEl) {
  const { width, height } = ctx.canvas
  ctx.save()
  ctx.scale(-1, 1)
  ctx.drawImage(videoEl, -width, 0, width, height)
  ctx.restore()
}

/**
 * Draw the MediaPipe pose skeleton on the canvas.
 * Landmarks are normalised [0,1] — we scale to canvas size.
 * The x-axis is mirrored to match the mirrored video.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} landmarks  - MediaPipe pose landmarks
 * @param {Object} [opts]
 */
export function drawSkeleton(ctx, landmarks, opts = {}) {
  if (!landmarks?.length) return

  const { width, height } = ctx.canvas
  const dotRadius = opts.dotRadius ?? 5
  const boneColor = opts.boneColor ?? 'rgba(255,255,255,0.6)'
  const dotColor = opts.dotColor ?? '#00e5ff'
  const highlightIndices = opts.highlightIndices ?? []

  // Mirror helper: flip x
  const lx = (lm) => (1 - lm.x) * width
  const ly = (lm) => lm.y * height

  // MediaPipe Pose connections (pairs of landmark indices)
  const CONNECTIONS = [
    [11,12],[11,13],[13,15],[12,14],[14,16],  // upper body
    [11,23],[12,24],[23,24],                  // torso
    [23,25],[25,27],[24,26],[26,28],           // legs
    [15,17],[15,19],[16,18],[16,20],           // hands
  ]

  // Draw bones
  ctx.strokeStyle = boneColor
  ctx.lineWidth = 2
  for (const [a, b] of CONNECTIONS) {
    const la = landmarks[a]
    const lb = landmarks[b]
    if (!la || !lb) continue
    if (la.visibility < 0.4 || lb.visibility < 0.4) continue
    ctx.beginPath()
    ctx.moveTo(lx(la), ly(la))
    ctx.lineTo(lx(lb), ly(lb))
    ctx.stroke()
  }

  // Draw dots
  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i]
    if (!lm || lm.visibility < 0.4) continue

    const isHighlighted = highlightIndices.includes(i)
    ctx.beginPath()
    ctx.arc(lx(lm), ly(lm), isHighlighted ? dotRadius * 1.8 : dotRadius, 0, Math.PI * 2)
    ctx.fillStyle = isHighlighted ? '#ffeb3b' : dotColor
    ctx.fill()
  }
}

/**
 * Draw an arc overlay showing the current joint angle.
 * Helps the user see what angle is being measured in real time.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} landmarks
 * @param {number} idxA
 * @param {number} idxVertex
 * @param {number} idxB
 * @param {number} angle       - computed angle in degrees
 * @param {Object} [opts]
 */
export function drawAngleArc(ctx, landmarks, idxA, idxVertex, idxB, angle, opts = {}) {
  if (!landmarks || angle === null) return

  const { width, height } = ctx.canvas
  const lx = (lm) => (1 - lm.x) * width
  const ly = (lm) => lm.y * height

  const v = landmarks[idxVertex]
  const a = landmarks[idxA]
  if (!v || !a) return

  const vx = lx(v)
  const vy = ly(v)

  // Direction of the A ray
  const ax = lx(a) - vx
  const ay = ly(a) - vy
  const startAngle = Math.atan2(ay, ax)
  const spanAngle = (angle * Math.PI) / 180

  const radius = opts.radius ?? 32
  const color = opts.color ?? '#00e5ff'

  ctx.beginPath()
  ctx.arc(vx, vy, radius, startAngle, startAngle + spanAngle)
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.stroke()

  // Angle label
  ctx.font = 'bold 14px monospace'
  ctx.fillStyle = color
  ctx.fillText(
    `${Math.round(angle)}°`,
    vx + radius * 1.3,
    vy - 6
  )
}
