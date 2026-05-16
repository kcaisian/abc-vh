/**
 * calibrationSteps.js
 *
 * Defines every guided calibration step.
 * Each step tells the user what to do, which joint to measure,
 * which three landmarks form the angle, and which direction.
 *
 * Landmark indices reference MediaPipe Pose (33 landmarks):
 * https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
 *
 * Angle = degrees at the VERTEX landmark, formed by A→VERTEX←B vectors.
 */

export const CALIBRATION_STEPS = [
  // ── Shoulder ──────────────────────────────────────────────────────────────
  {
    id: 'shoulder_raise_right',
    joint: 'shoulder_right',
    label: 'Right shoulder raise',
    instruction: 'Raise your right arm as high as you comfortably can, then hold.',
    bodyPart: 'Shoulders',
    // landmarks: [A, VERTEX, B]
    landmarks: [14, 12, 24], // right elbow → right shoulder → right hip
    holdMs: 2500,
    restMs: 1500,
    side: 'right',
  },
  {
    id: 'shoulder_raise_left',
    joint: 'shoulder_left',
    label: 'Left shoulder raise',
    instruction: 'Now raise your left arm as high as you comfortably can, then hold.',
    bodyPart: 'Shoulders',
    landmarks: [13, 11, 23], // left elbow → left shoulder → left hip
    holdMs: 2500,
    restMs: 1500,
    side: 'left',
  },

  // ── Elbow ─────────────────────────────────────────────────────────────────
  {
    id: 'elbow_flex_right',
    joint: 'elbow_right',
    label: 'Right elbow bend',
    instruction: 'Bend your right elbow as far as you can, bringing your hand toward your shoulder.',
    bodyPart: 'Arms',
    landmarks: [16, 14, 12], // right wrist → right elbow → right shoulder
    holdMs: 2500,
    restMs: 1500,
    side: 'right',
  },
  {
    id: 'elbow_flex_left',
    joint: 'elbow_left',
    label: 'Left elbow bend',
    instruction: 'Bend your left elbow as far as you can, bringing your hand toward your shoulder.',
    bodyPart: 'Arms',
    landmarks: [15, 13, 11], // left wrist → left elbow → left shoulder
    holdMs: 2500,
    restMs: 1500,
    side: 'left',
  },

  // ── Hip ───────────────────────────────────────────────────────────────────
  {
    id: 'hip_flex_right',
    joint: 'hip_right',
    label: 'Right hip lift',
    instruction: 'If you\'re able, raise your right knee toward your chest as high as comfortable.',
    bodyPart: 'Hips',
    landmarks: [26, 24, 12], // right knee → right hip → right shoulder
    holdMs: 2500,
    restMs: 1500,
    side: 'right',
    optional: true, // some users may be seated/wheelchair
  },
  {
    id: 'hip_flex_left',
    joint: 'hip_left',
    label: 'Left hip lift',
    instruction: 'Now raise your left knee toward your chest as high as comfortable.',
    bodyPart: 'Hips',
    landmarks: [25, 23, 11], // left knee → left hip → left shoulder
    holdMs: 2500,
    restMs: 1500,
    side: 'left',
    optional: true,
  },

  // ── Knee ──────────────────────────────────────────────────────────────────
  {
    id: 'knee_flex_right',
    joint: 'knee_right',
    label: 'Right knee bend',
    instruction: 'Bend your right knee as far as comfortable — you can sit or stand.',
    bodyPart: 'Legs',
    landmarks: [28, 26, 24], // right ankle → right knee → right hip
    holdMs: 2500,
    restMs: 1500,
    side: 'right',
    optional: true,
  },
  {
    id: 'knee_flex_left',
    joint: 'knee_left',
    label: 'Left knee bend',
    instruction: 'Bend your left knee as far as comfortable.',
    bodyPart: 'Legs',
    landmarks: [27, 25, 23], // left ankle → left knee → left hip
    holdMs: 2500,
    restMs: 1500,
    side: 'left',
    optional: true,
  },

  // ── Torso / Trunk twist ───────────────────────────────────────────────────
  {
    id: 'torso_twist_right',
    joint: 'torso_twist',
    label: 'Torso rotation',
    instruction: 'Keeping your hips still, twist your upper body to the right as far as comfortable.',
    bodyPart: 'Core',
    // We measure shoulder-to-hip alignment angle from a top-down perspective
    // Using: left shoulder → right shoulder vector vs left hip → right hip vector
    landmarks: [11, 12, 23], // left shoulder → right shoulder → left hip (proxy)
    holdMs: 2500,
    restMs: 1500,
    side: 'bilateral',
  },
]

/**
 * Group steps by body part for the UI progress indicator.
 */
export const BODY_PARTS = [...new Set(CALIBRATION_STEPS.map(s => s.bodyPart))]

/**
 * Core steps (non-optional) for users who want a quick calibration.
 */
export const CORE_STEPS = CALIBRATION_STEPS.filter(s => !s.optional)
