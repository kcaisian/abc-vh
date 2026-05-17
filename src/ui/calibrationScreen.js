/**
 * calibrationScreen.js
 *
 * Full calibration UI. Mounts into a container element.
 * No framework — vanilla DOM + requestAnimationFrame.
 *
 * Layout:
 *  ┌───────────────────────────────────┐
 *  │  Step progress bar (top)          │
 *  │  Video + canvas overlay (center)  │
 *  │  Instruction card (bottom)        │
 *  │  Skip / action buttons            │
 *  └───────────────────────────────────┘
 */

import { PoseTracker } from '../mediapipe/poseTracker.js'
import { startCamera, stopCamera, drawMirroredVideo, drawSkeleton, drawAngleArc } from '../mediapipe/camera.js'
import { CalibrationFlow } from '../calibration/CalibrationFlow.js'
import { BODY_PARTS } from '../calibration/calibrationSteps.js'

const CSS = `
  .cal-screen {
    display: grid;
    grid-template-columns: 1fr minmax(320px, 360px);
    grid-template-rows: auto 1fr;
    height: 100vh;
    background: var(--surface);
    overflow: hidden;
  }
  .cal-screen.complete {
    grid-template-columns: 1fr;
  }
  .cal-header {
    padding: 16px 20px 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    grid-column: 1 / -1;
    background: var(--surface);
    // todo: add box shadow or border to separate from video & sidebar
  }
  .cal-progress-row {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
  }
  .cal-progress-row h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 500;
    color: var(--text-muted);
    letter-spacing: 0.04em;
    white-space: nowrap;
  }
  .progress-track {
    flex: 1;
    min-width: 0;
    height: 6px;
    background: var(--surface2);
    border-radius: 99px;
    overflow: hidden;
  }
 .cal-home-link {
    font-family: var(--serif);
    font-weight: 600;
    font-size: 21px;
    letter-spacing: -0.5px;
    color: var(--accent);
    text-decoration: none;
  }
  .cal-home-link:hover {
    opacity: 0.8;
  }
  .progress-track {
    height: 6px;
    background: var(--surface2);
    border-radius: 99px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 99px;
    transition: width 0.3s ease;
  }
  .cal-video-wrap {
    position: relative;
    width: 100%;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    background: #000;
    min-height: 0;
    margin: auto;
    align-self: start;
  }
  .cal-video-wrap video {
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: contain;
    transform: scaleX(-1); /* mirror for natural feel */
  }
  .cal-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  /* Phase overlay */
  .phase-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }
  .countdown-badge {
    font-size: 5rem;
    font-weight: 700;
    color: var(--warn);
    text-shadow: 2px 2px rgba(157, 126, 43, 0.75);
    transition: transform 0.15s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 0 12px;
    align-self: flex-start;
    margin-top: 24px;
  }
  .countdown-badge.waiting {
    font-size: 2.5rem;
    font-weight: 600;
    line-height: 1.4;
    color: var(--warn);
    text-shadow: 2px 2px rgba(157, 126, 43, 0.75);
    align-self: flex-start;
    margin-top: 24px;
  }
  .hold-ring-wrap {
    position: absolute;
    top: 16px;
    right: 16px;
  }

  /* Instruction card */
  .cal-card {
    background: var(--surface);
    border-left: 1px solid var(--surface2);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    grid-row: 2;
    grid-column: 2;
    height: 100%;
    overflow-y: auto;
    min-height: 0;
  }
  .cal-screen.complete .cal-card {
    grid-column: 1 / -1;
    border-left: none;
    border-top: 1px solid var(--surface2);
  }
  .cal-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .cal-card-footer {
    display: flex;
    flex-direction: row;
    gap: 12px;
    width: 100%;
    align-items: center;
  }
  .cal-step-label {
    font-size: 1.5rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--accent);
  }
  .cal-instruction {
    font-size: clamp(1rem, 1.8vw, 1.6rem);
    line-height: 1.5;
    color: var(--text);
  }
  .cal-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    flex: 1;
  }
  .cal-card-footer .btn-ghost {
    flex: 1;
    width: auto;
  }
  .cal-angle-display {
    flex-shrink: 0;
    min-width: 120px;
    padding: 18px 22px;
    border-radius: var(--radius);
    color: var(--accent2);
    font-size: 2.75rem;
    font-family: var(--font-mono);
    font-weight: 700;
    text-align: right;
  }
  .btn-ghost {
    background: transparent;
    color: var(--muted);
    border: 1.5px solid var(--muted);
    padding: 10px 20px;
    cursor: pointer;
    border-radius: var(--radius);
    font-family: var(--font);
    font-size: 1rem;
    transition: opacity 0.15s, transform 0.1s, border-color 0.15s, color 0.15s;
  }
  .btn-ghost:hover {
  opacity: 0.88;
  border-color: var(--accent);
  color: var(--accent);
}
  .btn-ghost:active {
    transform: scale(0.97);
  }
  /* Result flash */
  .result-flash {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0,201,167,0.12);
    gap: 8px;
    animation: flashIn 0.3s ease;
  }
  .result-flash .rom-val {
    font-size: 3.5rem;
    font-weight: 700;
    color: var(--accent);
  }
  .result-flash .rom-label {
    color: var(--text-muted);
    font-size: 0.9rem;
  }
  @keyframes flashIn { from { opacity:0; transform: scale(0.9); } to { opacity:1; transform: scale(1); } }

  /* Done screen */
  .done-screen {
    padding: 32px 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: auto;
  }
  .done-screen h2 { font-size: 1.6rem; color: var(--accent); }
  .joint-result {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: var(--surface);
    border-radius: var(--radius);
  }
  .joint-result .name { color: var(--text-muted); font-size: 0.9rem; }
  .joint-result .val  { font-family: var(--font-mono); font-weight: 700; color: var(--accent); }
  .joint-result .skipped { color: var(--danger); font-size: 0.85rem; }
`

export function mountCalibrationScreen(container) {
  // ── DOM ──────────────────────────────────────────────────────────────────
  const root = document.createElement('div')
  root.innerHTML = `
    <style>${CSS}</style>
    <div class="cal-screen">
      <div class="cal-header">
        <div class="cal-progress-row">
          <a href="#home" class="cal-home-link" title="Back to home">ABC</a>
          <h2 id="cal-step-counter">Setting up…</h2>
          <div class="progress-track">
            <div class="progress-fill" id="cal-progress" style="width:0%"></div>
          </div>
        </div>
      </div>

      <div class="cal-video-wrap" id="cal-video-wrap">
        <video id="cal-video" playsinline muted autoplay></video>
        <canvas class="cal-canvas" id="cal-canvas"></canvas>
        <div class="phase-overlay" id="cal-overlay"></div>
        <div class="hold-ring-wrap" id="cal-hold-ring"></div>
      </div>

      <div class="cal-card" id="cal-card">
        <div>
          <div class="cal-step-label" id="cal-step-label">Initialising camera…</div>
          <div class="cal-instruction" id="cal-instruction">Please allow camera access to continue.</div>
        </div>
        <div class="cal-card-footer">
          <button class="btn-ghost" id="cal-skip-btn">Skip this movement</button>
          <div class="cal-angle-display" id="cal-angle-display">—</div>
        </div>
      </div>
    </div>
  `
  container.appendChild(root)

  // ── Element refs ─────────────────────────────────────────────────────────
  const videoEl     = root.querySelector('#cal-video')
  const canvasEl    = root.querySelector('#cal-canvas')
  const videoWrap   = root.querySelector('#cal-video-wrap')
  const overlay     = root.querySelector('#cal-overlay')
  const holdRing    = root.querySelector('#cal-hold-ring')
  const progressBar = root.querySelector('#cal-progress')
  const stepCounter = root.querySelector('#cal-step-counter')
  const stepLabel   = root.querySelector('#cal-step-label')
  const instruction = root.querySelector('#cal-instruction')
  const skipBtn     = root.querySelector('#cal-skip-btn')
  const angleDisplay= root.querySelector('#cal-angle-display')
  const ctx         = canvasEl.getContext('2d')

  videoEl.addEventListener('loadedmetadata', resizeCanvas)

  // ── Resize canvas to match video ─────────────────────────────────────────
  function resizeCanvas() {
    const aspectRatio = videoEl.videoWidth && videoEl.videoHeight
      ? videoEl.videoWidth / videoEl.videoHeight
      : 4 / 3

    if (videoEl.videoWidth && videoEl.videoHeight) {
      videoWrap.style.aspectRatio = `${videoEl.videoWidth} / ${videoEl.videoHeight}`
    }

    const width = videoWrap.clientWidth
    canvasEl.width = width
    canvasEl.height = Math.round(width / aspectRatio)
  }
  window.addEventListener('resize', resizeCanvas)
  resizeCanvas()

  // ── State ─────────────────────────────────────────────────────────────────
  const tracker = new PoseTracker()
  let stream = null
  let rafId  = null
  let flow   = null
  let lastState = null

  // ── Init ──────────────────────────────────────────────────────────────────
  async function init() {
    try {
      stream = await startCamera(videoEl)
      await tracker.init()
      startFlow()
    } catch (err) {
      instruction.textContent = `Camera error: ${err.message}. Please allow camera access and reload.`
      console.error('[calibrationScreen]', err)
    }
  }

  function startFlow() {
    flow = new CalibrationFlow({
      onUpdate:   handleUpdate,
      onComplete: handleComplete,
    })

    skipBtn.style.display = 'inline-block'
    skipBtn.addEventListener('click', () => flow?.skipStep())

    flow.start()
    rafId = requestAnimationFrame(loop)
  }

  // ── Animation loop ────────────────────────────────────────────────────────
  function loop() {
    rafId = requestAnimationFrame(loop)

    resizeCanvas()
    const landmarks = tracker.detect(videoEl)

    // Draw camera + skeleton
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height)
    drawMirroredVideo(ctx, videoEl)

    if (landmarks.length && lastState?.step) {
      const step = lastState.step
      drawSkeleton(ctx, landmarks, {
        highlightIndices: step.landmarks,
      })
      drawAngleArc(
        ctx, landmarks,
        step.landmarks[0], step.landmarks[1], step.landmarks[2],
        lastState.currentAngle,
        { color: lastState.phase === 'hold' ? '#00c9a7' : '#4f8ef7' }
      )
    }

    // Feed frame to the flow state machine
    flow?.feedFrame(landmarks.length ? landmarks : null)
  }

  // ── UI update handler ─────────────────────────────────────────────────────
  function handleUpdate(state) {
    lastState = state

    const { phase, step, stepIndex, totalSteps, phaseProgress,
            countdownSeconds, currentAngle, lastResult } = state

    // Progress bar = overall step progress
    progressBar.style.width = `${((stepIndex) / totalSteps) * 100}%`
    stepCounter.textContent = `Step ${stepIndex + 1} of ${totalSteps}`

    // Angle readout
    angleDisplay.textContent = currentAngle != null
      ? `${Math.round(currentAngle)}°`
      : '—'

    // Phase-specific UI
    overlay.innerHTML = ''
    holdRing.innerHTML = ''

    if (phase === 'countdown') {
      stepLabel.textContent = step?.bodyPart?.toUpperCase() ?? ''
      instruction.textContent = step?.instruction ?? ''
      skipBtn.style.visibility = 'visible'
      skipBtn.style.display = 'inline-block'

      const badge = document.createElement('div')
      badge.className = 'countdown-badge'
      if (!state.landmarksReady) {
        badge.classList.add('waiting')
        badge.textContent = 'Waiting for user to get into position...'
      } else {
        badge.textContent = countdownSeconds
      }
      overlay.appendChild(badge)

    } else if (phase === 'hold') {
      stepLabel.textContent = `Measuring… hold still`
      instruction.textContent = step?.instruction ?? ''
      skipBtn.style.visibility = 'visible'
      skipBtn.style.display = 'inline-block'

      // SVG ring progress
      holdRing.innerHTML = buildRingSVG(phaseProgress, '#00c9a7')

    } else if (phase === 'rest') {
      if (lastResult) {
        // Flash the captured ROM value on screen
        overlay.innerHTML = `
          <div class="result-flash">
            <div class="rom-val">${Math.round(lastResult.maxROM)}°</div>
            <div class="rom-label">captured ✓</div>
          </div>
        `
      }
      stepLabel.textContent = 'Rest…'
      instruction.textContent = 'Take a breath before the next movement.'
      skipBtn.style.visibility = 'visible'
      skipBtn.style.display = 'inline-block'
    }
  }

  // ── Completion handler ────────────────────────────────────────────────────
  function handleComplete(profile) {
    cancelAnimationFrame(rafId)
    stopCamera(stream)
    tracker.close()
    window.removeEventListener('resize', resizeCanvas)

    // Render results screen
    root.innerHTML = `
      <style>${CSS}</style>
      <div class="cal-screen complete" style="grid-template-columns:1fr; grid-template-rows:1fr auto;">
        <div class="done-screen">
          <h2>Calibration complete 🎉</h2>
          <p style="color:var(--text-muted);line-height:1.5">
            Your personal mobility profile has been saved.
            Workouts will now be scaled to <em>your</em> range of motion.
          </p>
          ${buildResultsHTML(profile)}
        </div>
        <div class="cal-card">
          <div class="cal-actions">
            <a href="muscle.html">
              <button class="btn-primary">Start your first workout →</button>
            </a>
            <button class="btn-ghost" onclick="location.hash='#calibrate';location.reload()">
              Re-calibrate
            </button>
          </div>
        </div>
      </div>
    `
  }

  init()
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** SVG progress ring for the hold phase */
function buildRingSVG(progress, color) {
  const r = 28, cx = 36, cy = 36, strokeW = 4
  const circ = 2 * Math.PI * r
  const dash = circ * progress
  return `
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
        stroke="rgba(255,255,255,0.1)" stroke-width="${strokeW}"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
        stroke="${color}" stroke-width="${strokeW}"
        stroke-dasharray="${dash} ${circ}"
        stroke-linecap="round"
        transform="rotate(-90 ${cx} ${cy})"/>
    </svg>
  `
}

/** Render the captured joint results as a list */
function buildResultsHTML(profile) {
  const entries = Object.entries(profile.joints)
  if (!entries.length) return '<p style="color:var(--text-muted)">No data captured.</p>'

  return entries.map(([key, val]) => {
    const label = key.replace(/_/g, ' ')
    const right = val.skipped
      ? `<span class="skipped">skipped</span>`
      : `<span class="val">${Math.round(val.maxROM)}°</span>`
    return `
      <div class="joint-result">
        <span class="name">${label}</span>
        ${right}
      </div>
    `
  }).join('')
}
