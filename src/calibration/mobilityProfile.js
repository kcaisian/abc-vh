/**
 * mobilityProfile.js
 *
 * Builds and persists the user's personal mobility profile.
 *
 * Profile shape:
 * {
 *   version: 1,
 *   createdAt: ISO string,
 *   updatedAt: ISO string,
 *   joints: {
 *     shoulder_right: { maxROM: 142.3, confidence: 0.91, unit: 'deg' },
 *     shoulder_left:  { maxROM: 138.0, confidence: 0.88, unit: 'deg' },
 *     elbow_right:    { ... },
 *     ...
 *   },
 *   meta: {
 *     completedSteps: ['shoulder_raise_right', ...],
 *     skippedSteps:   ['hip_flex_right', ...],
 *   }
 * }
 */

const STORAGE_KEY = 'af_mobility_profile'
const PROFILE_VERSION = 1

/**
 * Create a blank profile shell.
 */
export function createEmptyProfile() {
  return {
    version: PROFILE_VERSION,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    joints: {},
    meta: {
      completedSteps: [],
      skippedSteps: [],
    },
  }
}

/**
 * Record a single joint's result into a profile.
 *
 * @param {Object} profile    - existing profile (mutated in place)
 * @param {string} stepId     - e.g. 'shoulder_raise_right'
 * @param {string} jointKey   - e.g. 'shoulder_right'
 * @param {Object} romResult  - { maxROM, confidence, sampleCount }
 * @param {boolean} skipped
 */
export function recordJoint(profile, stepId, jointKey, romResult, skipped = false) {
  if (skipped) {
    profile.meta.skippedSteps.push(stepId)
    // Store a fallback ROM of 0 so the workout layer always has a value
    profile.joints[jointKey] = { maxROM: 0, confidence: 0, unit: 'deg', skipped: true }
  } else {
    profile.joints[jointKey] = {
      maxROM: romResult.maxROM,
      confidence: romResult.confidence,
      unit: 'deg',
      skipped: false,
    }
    profile.meta.completedSteps.push(stepId)
  }
  profile.updatedAt = new Date().toISOString()
}

/**
 * Persist the profile to localStorage.
 */
export function saveProfile(profile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    return true
  } catch (e) {
    console.error('[mobilityProfile] Failed to save:', e)
    return false
  }
}

/**
 * Load the profile from localStorage.
 * Returns null if none exists.
 */
export function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const profile = JSON.parse(raw)
    if (profile.version !== PROFILE_VERSION) {
      console.warn('[mobilityProfile] Version mismatch — clearing old profile')
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return profile
  } catch (e) {
    console.error('[mobilityProfile] Failed to load:', e)
    return null
  }
}

/**
 * Clear the stored profile (e.g. for re-calibration).
 */
export function clearProfile() {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Given a joint key and a target percentage, return the target angle.
 * Used by the workout layer to set rep thresholds.
 *
 * e.g. getTargetAngle(profile, 'elbow_right', 0.75)
 *   → 75% of the user's max elbow ROM
 *
 * @param {Object} profile
 * @param {string} jointKey
 * @param {number} pct        - fraction [0,1]
 * @returns {number|null}
 */
export function getTargetAngle(profile, jointKey, pct = 0.75) {
  const joint = profile?.joints?.[jointKey]
  if (!joint || joint.skipped || joint.maxROM === 0) return null
  return joint.maxROM * pct
}

/**
 * Check whether the profile is complete enough to start a workout.
 * Requires at least shoulders or arms calibrated.
 */
export function isProfileUsable(profile) {
  if (!profile) return false
  const completed = profile.meta.completedSteps
  const hasUpper = completed.some(id =>
    id.startsWith('shoulder') || id.startsWith('elbow')
  )
  return hasUpper
}
