/**
 * romCapture.js
 *
 * During each calibration step we stream angle readings from the live camera.
 * This module tracks the MAXIMUM angle seen within the hold window,
 * applies outlier rejection, and returns the best reading.
 *
 * Why not just take the peak value?
 * A single-frame spike can come from landmark detection noise. We instead
 * look for the highest *sustained* angle — the 90th percentile of readings
 * collected during the hold window.
 */

export class ROMCapture {
  constructor() {
    this.readings = []       // all angle samples collected this step
    this.startTime = null
    this.isCapturing = false
  }

  /** Begin a new capture window */
  start() {
    this.readings = []
    this.startTime = performance.now()
    this.isCapturing = true
  }

  /**
   * Feed a new angle reading.
   * Call this every animation frame while isCapturing === true.
   *
   * @param {number|null} angle - degrees, or null if landmark invisible
   */
  feed(angle) {
    if (!this.isCapturing || angle === null) return
    this.readings.push(angle)
  }

  /**
   * Stop capture and return the result.
   *
   * @returns {{ maxROM: number, confidence: number, sampleCount: number }}
   *   maxROM     - the robust maximum (90th percentile)
   *   confidence - 0–1 score based on sample count and consistency
   *   sampleCount
   */
  stop() {
    this.isCapturing = false

    if (this.readings.length === 0) {
      return { maxROM: 0, confidence: 0, sampleCount: 0 }
    }

    const sorted = [...this.readings].sort((a, b) => a - b)
    const p90Index = Math.floor(sorted.length * 0.9)
    const maxROM = sorted[p90Index]

    // Confidence: penalise if we have very few samples or high variance
    const mean = sorted.reduce((s, v) => s + v, 0) / sorted.length
    const variance = sorted.reduce((s, v) => s + (v - mean) ** 2, 0) / sorted.length
    const stdDev = Math.sqrt(variance)
    const cvPenalty = Math.min(1, stdDev / 20) // normalise: 20° stdDev = fully penalised
    const countBonus = Math.min(1, this.readings.length / 30) // 30 samples ≈ 1s at 30fps
    const confidence = countBonus * (1 - cvPenalty * 0.5)

    return {
      maxROM: Math.round(maxROM * 10) / 10, // round to 1dp
      confidence: Math.round(confidence * 100) / 100,
      sampleCount: this.readings.length,
    }
  }

  /** Elapsed ms since capture started */
  get elapsed() {
    if (!this.startTime) return 0
    return performance.now() - this.startTime
  }

  /** 0–1 progress through the hold window */
  progress(holdMs) {
    return Math.min(1, this.elapsed / holdMs)
  }
}
