/**
 * CalibrationFlow.js
 *
 * Orchestrates the full calibration session.
 * This is a plain JS class (no framework dependency) so it can be used
 * with any UI layer — drop it behind React, Vue, or vanilla JS.
 *
 * Usage:
 *   const flow = new CalibrationFlow({ steps, onUpdate, onComplete })
 *   flow.start()
 *   // every animation frame:
 *   flow.feedFrame(poseLandmarks)
 *   // user requests skip:
 *   flow.skipStep()
 *
 * The onUpdate callback fires every frame with the current UI state.
 * The onComplete callback fires when all steps are done, with the profile.
 */

import { CALIBRATION_STEPS, CORE_STEPS } from './calibrationSteps.js'
import { areStepLandmarksVisible, jointAngleForStep, smoothAngle } from './jointAngles.js'
import { ROMCapture } from './romCapture.js'
import {
  createEmptyProfile,
  recordJoint,
  saveProfile,
} from './mobilityProfile.js'

// How long to count down before capture starts (give user time to get into position)
const COUNTDOWN_MS = 10000
// How long the actual hold / capture window lasts
const HOLD_MS = 4000
// Rest pause between steps
const REST_MS = 4500

export class CalibrationFlow {
  /**
   * @param {Object}   opts
   * @param {Array}    [opts.steps]       - override default step list
   * @param {Function} opts.onUpdate      - called every frame with UIState
   * @param {Function} opts.onComplete    - called with final profile when done
   * @param {boolean}  [opts.coreOnly]    - only run non-optional steps
   */
  constructor({ steps, onUpdate, onComplete, coreOnly = false }) {
    this.steps = steps ?? (coreOnly ? CORE_STEPS : CALIBRATION_STEPS)
    this.onUpdate = onUpdate
    this.onComplete = onComplete

    this._stepIndex = 0
    this._phase = 'idle'      // idle | countdown | hold | rest | done
    this._phaseStart = null
    this._smoothedAngle = null
    this._capture = new ROMCapture()
    this._profile = createEmptyProfile()
    this._currentStepResult = null
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Start the calibration from the first step. */
  start() {
    this._stepIndex = 0
    this._enterCountdown()
  }

  /**
   * Feed a frame of pose landmarks.
   * Call this inside your requestAnimationFrame loop.
   *
   * @param {Array|null} landmarks - MediaPipe pose landmarks array, or null if no pose detected
   */
  feedFrame(landmarks) {
    if (this._phase === 'idle' || this._phase === 'done') return

    const step = this._currentStep
    const now = performance.now()
    const elapsed = now - this._phaseStart

    // Compute current joint angle (smoothed)
    let rawAngle = null
    this._landmarksReady = landmarks ? areStepLandmarksVisible(landmarks, step) : false
    if (landmarks) {
      rawAngle = jointAngleForStep(landmarks, step)
    }
    this._smoothedAngle = smoothAngle(this._smoothedAngle, rawAngle, 0.3)

    // Phase transitions
    if (this._phase === 'countdown') {
      if (!landmarks || !areStepLandmarksVisible(landmarks, step)) {
        this._emitUpdate()
        return
      }

      if (elapsed >= COUNTDOWN_MS) {
        this._enterHold()
        return
      }
    }

    if (this._phase === 'hold') {
      this._capture.feed(this._smoothedAngle)

      if (elapsed >= HOLD_MS) {
        this._currentStepResult = this._capture.stop()
        this._recordCurrentStep(false)
        this._enterRest()
        return
      }
    }

    if (this._phase === 'rest') {
      if (elapsed >= REST_MS) {
        this._advance()
        return
      }
    }

    this._emitUpdate()
  }

  /** User taps "Skip this movement" */
  skipStep() {
    if (this._phase === 'countdown' || this._phase === 'hold') {
      if (this._capture.isCapturing) this._capture.stop()
      this._recordCurrentStep(true)
      this._enterRest()
      return
    }

    if (this._phase === 'rest') {
      this._advance()
      return
    }
  }

  /** Restart from the beginning */
  restart() {
    this._stepIndex = 0
    this._profile = createEmptyProfile()
    this._smoothedAngle = null
    this._currentStepResult = null
    this._enterCountdown()
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  get _currentStep() {
    return this.steps[this._stepIndex]
  }

  _enterCountdown() {
    this._phase = 'countdown'
    this._phaseStart = performance.now()
    this._smoothedAngle = null
    this._emitUpdate()
  }

  _enterHold() {
    this._phase = 'hold'
    this._phaseStart = performance.now()
    this._capture.start()
    this._emitUpdate()
  }

  _enterRest() {
    this._phase = 'rest'
    this._phaseStart = performance.now()
    this._emitUpdate()
  }

  _recordCurrentStep(skipped) {
    const step = this._currentStep
    recordJoint(
      this._profile,
      step.id,
      step.joint,
      this._currentStepResult ?? { maxROM: 0, confidence: 0, sampleCount: 0 },
      skipped
    )
  }

  _advance() {
    this._stepIndex++
    this._smoothedAngle = null
    this._currentStepResult = null

    if (this._stepIndex >= this.steps.length) {
      this._phase = 'done'
      saveProfile(this._profile)
      this.onComplete?.(this._profile)
      this._emitUpdate()
    } else {
      this._enterCountdown()
    }
  }

  /** Build the UI state object and fire the callback */
  _emitUpdate() {
    const step = this._currentStep
    const now = performance.now()
    const elapsed = now - this._phaseStart

    /** @type {CalibrationUIState} */
    const state = {
      phase: this._phase,
      stepIndex: this._stepIndex,
      totalSteps: this.steps.length,
      step: step ?? null,

      // Live angle reading for the overlay arc
      currentAngle: this._smoothedAngle,

      // Progress within the current phase [0,1]
      phaseProgress: this._phase === 'countdown'
        ? Math.min(1, elapsed / COUNTDOWN_MS)
        : this._phase === 'hold'
          ? this._capture.progress(HOLD_MS)
          : this._phase === 'rest'
            ? Math.min(1, elapsed / REST_MS)
            : 0,

      // Countdown seconds remaining
      countdownSeconds: this._phase === 'countdown'
        ? Math.ceil((COUNTDOWN_MS - elapsed) / 1000)
        : null,

      // Result from the most recently completed step
      lastResult: this._currentStepResult,
      landmarksReady: Boolean(this._landmarksReady),

      // Partial profile so far (for progress display)
      profile: this._profile,
    }

    this.onUpdate?.(state)
  }
}

/**
 * @typedef {Object} CalibrationUIState
 * @property {'idle'|'countdown'|'hold'|'rest'|'done'} phase
 * @property {number}       stepIndex
 * @property {number}       totalSteps
 * @property {Object|null}  step          - current step definition
 * @property {number|null}  currentAngle  - smoothed live angle in degrees
 * @property {number}       phaseProgress - 0–1 progress within current phase
 * @property {number|null}  countdownSeconds
 * @property {Object|null}  lastResult    - { maxROM, confidence, sampleCount }
 * @property {Object}       profile       - partial mobility profile so far
 */
