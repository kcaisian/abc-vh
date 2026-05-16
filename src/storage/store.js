/**
 * store.js
 *
 * Typed localStorage helpers used across the app.
 * All keys are namespaced under 'af_' to avoid collisions.
 */

export const KEYS = {
  MOBILITY_PROFILE:  'af_mobility_profile',
  SESSION_HISTORY:   'af_session_history',
  PROGRESS_LOG:      'af_progress_log',
  ACHIEVEMENTS:      'af_achievements',
  SETTINGS:          'af_settings',
}

export function get(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function set(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch { return false }
}

export function remove(key) {
  localStorage.removeItem(key)
}

export function clearAll() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k))
}
