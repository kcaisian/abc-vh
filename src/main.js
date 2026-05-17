/**
 * main.js
 *
 * App shell / router.
 * For the hackathon, we keep this minimal: a simple hash-based router.
 * Screens: #home | #calibrate | #workout | #progress
 */

import { mountCalibrationScreen } from './ui/calibrationScreen.js'

const app = document.getElementById('app')

function render() {
  const route = location.hash || '#home'
  app.innerHTML = ''

  if (route === '#calibrate') {
    mountCalibrationScreen(app)
  } else {
    // Home screen placeholder
    app.innerHTML = `
      <div style="
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        height:100vh;gap:24px;padding:24px;text-align:center;
        background-image:url('/src/assets/logo_bg.png');
        background-size:auto 100%;
        background-position:center;
        background-repeat:no-repeat;
        background-color:#2d1f16;
      ">
        <div style="display:flex;align-items:center;gap:12px;">
          <img src="/src/assets/logo.png" style="height:48px;width:auto;" alt="logo" />
          <h1 style="font-size:2.5rem;font-weight:700;color:var(--accent)">ABC</h1>
        </div>
        <p style="color:var(--text-muted);max-width:400px;line-height:1.6">
          Fitness that meets you where you are.<br>
          We measure <em>your</em> range of motion — then build workouts around it.
        </p>
        <a href="#calibrate">
          <button class="btn-primary" style="font-size:1.1rem;padding:16px 40px;">
            Start calibration →
          </button>
        </a>
      </div>
    `
  }
}

window.addEventListener('hashchange', render)
render()
