/**
 * poseTracker.js
 *
 * Wraps MediaPipe Tasks Vision PoseLandmarker.
 * Handles initialisation, per-frame detection, and cleanup.
 *
 * The newer @mediapipe/tasks-vision package (not the legacy CDN version)
 * runs the model in a Web Worker via WASM — no GPU required.
 */

import {
  PoseLandmarker,
  FilesetResolver,
} from '@mediapipe/tasks-vision'

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

export class PoseTracker {
  constructor() {
    this._landmarker = null
    this._lastVideoTime = -1
  }

  /**
   * Initialise the PoseLandmarker.
   * Call once before the animation loop.
   */
  async init() {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
    )

    this._landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: 'GPU', // falls back to CPU automatically
      },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })

    console.log('[PoseTracker] ready')
  }

  /**
   * Run detection on the current video frame.
   * Returns an array of landmarks (or empty array if no pose).
   *
   * @param {HTMLVideoElement} videoEl
   * @returns {Array} landmarks array [{x,y,z,visibility}] or []
   */
  detect(videoEl) {
    if (!this._landmarker) return []
    if (videoEl.currentTime === this._lastVideoTime) return this._lastResult ?? []

    this._lastVideoTime = videoEl.currentTime

    const result = this._landmarker.detectForVideo(videoEl, performance.now())
    this._lastResult = result.landmarks[0] ?? []
    return this._lastResult
  }

  /** Release the WASM resources */
  close() {
    this._landmarker?.close()
    this._landmarker = null
  }
}
