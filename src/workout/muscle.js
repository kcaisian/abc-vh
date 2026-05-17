/**
 * src/workout/muscle.js
 *
 * Handles Screen 1 (body part selector) and Screen 2 (exercise picker).
 * Screen 3 (tracker) removed — "Start Exercise" navigates to main.html.
 */

// ── BODY PARTS DATA ───────────────────────────────────────────────────────────
const BODY_PARTS = [
  { id:"wrist",    icon:"💪", name:"Wrist & Forearm", desc:"Flexibility, strength and rotation",                 tag:"upper limb" },
  { id:"elbow",    icon:"🦾", name:"Elbow",           desc:"Bends, extensions, resistance",                      tag:"upper limb" },
  { id:"shoulder", icon:"🙆", name:"Shoulder",        desc:"Very common after strokes & sports injuries",        tag:"upper limb" },
  { id:"neck",     icon:"🧘", name:"Neck",            desc:"Chin tucks, rotations, stretches",                   tag:"posture"    },
  { id:"hips",     icon:"🚶", name:"Hips",            desc:"Clamshells, bridges, hip flexor stretches",          tag:"lower limb" },
  { id:"knee",     icon:"🦵", name:"Knee",            desc:"Common after ACL injuries or surgeries",             tag:"lower limb" },
  { id:"legs",     icon:"🏃", name:"Legs (General)",  desc:"Sit-to-stands, lunges, walking practice",            tag:"lower limb" },
  { id:"full",     icon:"🌟", name:"Full Body",       desc:"Chair exercises, Tai Chi, range-of-motion routines", tag:"functional" },
]

// ── EXERCISE DATA ─────────────────────────────────────────────────────────────
const EXERCISES_BY_PART = {
  shoulder: [
    { id:"arm_raise",     name:"Assisted Arm Raises", icon:"🙆", tag:"reps",    target:10, holdTarget:null, type:"rep",
      desc:"Raise both arms out to the sides until shoulder height. Great for shoulder abduction range of motion.",
      steps:["Stand or sit facing the camera","Keep elbows slightly soft (not locked)","Raise arms out to sides","Lower slowly back down","Repeat smoothly"] },
    { id:"chest_stretch", name:"Chest Stretch Hold",  icon:"🤸", tag:"hold·5s", target:5,  holdTarget:5,    type:"hold",
      desc:"Open arms wide at shoulder height and hold the stretch. Relieves tightness in the chest and shoulders.",
      steps:["Face the camera","Raise arms out to sides at shoulder height","Keep elbows soft","Hold the open position for 5 seconds","Relax and repeat"] },
    { id:"arm_circles",   name:"Arm Circles",         icon:"🔄", tag:"reps",    target:12, holdTarget:null, type:"rep",
      desc:"Circular arm movements to warm up the shoulder joint and increase mobility.",
      steps:["Extend arms out to the sides","Make small circles forward for 6 reps","Then large circles backward for 6 reps","Keep shoulders relaxed and down"] },
  ],
  elbow: [
    { id:"bicep_curl", name:"Bicep Curls", icon:"💪", tag:"reps", target:12, holdTarget:null, type:"rep",
      desc:"Bend elbows to bring hands toward shoulders. Classic elbow flexion exercise for arm strength.",
      steps:["Stand or sit facing the camera","Arms relaxed at sides","Curl both forearms up toward shoulders","Lower slowly back down","Repeat with controlled motion"] },
    { id:"pushup", name:"Push-Ups", icon:"🤸", tag:"reps", target:10, holdTarget:null, type:"rep",
      desc:"Standard push-up for elbow, chest, and shoulder strength. Go sideways to camera for best tracking.",
      steps:["Turn sideways to the camera","Start in plank or wall push-up position","Lower chest toward floor (elbows bend)","Push back up to start","Repeat"] },
  ],

  wrist: [
    { id:"wrist_flex", name:"Wrist Flexion Stretch", icon:"🤚", tag:"hold·5s", target:6,  holdTarget:5,    type:"hold",
      desc:"Stretch the wrist by bending it gently downward. Relieves tension from typing or gripping.",
      steps:["Extend one arm in front of you","Use the other hand to gently push fingers down","Hold the stretch for 5 seconds","Switch sides","Repeat"] },
    { id:"wrist_curl", name:"Wrist Curls",           icon:"🔄", tag:"reps",    target:15, holdTarget:null, type:"rep",
      desc:"Curl and uncurl the wrist to strengthen forearm flexors. Can be done with or without light weight.",
      steps:["Rest forearm on a surface, palm up","Let hand hang off the edge","Curl wrist upward (flex)","Lower slowly back down","Repeat"] },
  ],

  knee: [
    { id:"squat",      name:"Sit-to-Stand", icon:"🪑", tag:"reps", target:10, holdTarget:null, type:"rep",
      desc:"Rise from a seated position to standing and lower back down. The most functional knee rehab exercise.",
      steps:["Stand facing the camera or sideways","Hinge at hips and bend knees to lower","Stop when thighs are near parallel","Push through heels to stand","Repeat with control"] },
    { id:"knee_raise", name:"Knee Raises",  icon:"🦵", tag:"reps", target:10, holdTarget:null, type:"rep",
      desc:"Lift one knee toward the hip while standing. Builds hip flexor strength and knee control.",
      steps:["Stand facing the camera","Hold something stable if needed","Lift one knee up toward hip height","Lower slowly back to floor","Alternate sides"] },
  ],
  
  legs: [
    { id:"squat2",      name:"Assisted Squat", icon:"🏋️", tag:"reps", target:10, holdTarget:null, type:"rep",
      desc:"Lower into a squat with support as needed. Builds leg strength for functional movement.",
      steps:["Stand facing or sideways to camera","Hold something stable if needed","Bend knees and lower hips","Stand back up with control","Repeat"] },
    { id:"knee_raise2", name:"Leg Raises",     icon:"🦵", tag:"reps", target:12, holdTarget:null, type:"rep",
      desc:"Alternate knee lifts to build hip flexor and leg strength.",
      steps:["Stand facing the camera","Lift alternate knees to hip height","Keep a steady rhythm","Hold something for balance if needed"] },
  ],
}
for (const p of BODY_PARTS) { if (!EXERCISES_BY_PART[p.id]) EXERCISES_BY_PART[p.id] = [] }

// ── STATE ─────────────────────────────────────────────────────────────────────
let selectedPart = null
let selectedExercise = null

// ── SCREEN TRANSITIONS ────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'))
  document.getElementById(id).classList.add('active')
}

// ── SCREEN 1: BODY PART GRID ──────────────────────────────────────────────────
const grid = document.getElementById('partsGrid')
for (const p of BODY_PARTS) {
  const btn = document.createElement('button')
  btn.className = 'part-card'
  btn.dataset.id = p.id
  btn.innerHTML = `<div class="icon">${p.icon}</div><div class="pname">${p.name}</div><div class="pdesc">${p.desc}</div><span class="ptag">${p.tag}</span>`
  btn.onclick = () => selectPart(p.id, btn)
  grid.appendChild(btn)
}

document.querySelectorAll('#body-svg .region').forEach(r => {
  r.addEventListener('click', () => {
    const card = document.querySelector(`.part-card[data-id="${r.dataset.part}"]`)
    if (card) selectPart(r.dataset.part, card)
  })
})

function selectPart(id, btn) {
  selectedPart = id
  document.querySelectorAll('.part-card').forEach(c => c.classList.remove('selected'))
  if (btn) btn.classList.add('selected')
  document.querySelectorAll('#body-svg .region').forEach(r => r.classList.toggle('selected', r.dataset.part === id))
  document.getElementById('nextBtn').classList.add('ready')
}

window.goToExercises = function() {
  // If no part selected, do nothing (preserve existing guard)
  if (!selectedPart) return

  // Redirect to the main workout page. If you later want to pass
  // the selected part/exercise to the workout page, you can append
  // a query string or hash (e.g. `main.html?part=${selectedPart}`).
  window.location.href = 'main.html'
}