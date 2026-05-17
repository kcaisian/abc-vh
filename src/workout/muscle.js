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
  back: [
    { id:"cat_cow", name:"Cat-Cow Stretch", icon:"🐄", tag:"reps", target:10, holdTarget:null, type:"rep",
      desc:"Alternately arch and round the spine. A foundational mobility exercise for back recovery.",
      steps:["Turn sideways to the camera","Get on hands and knees (or sit forward)","Arch back downward (cow)","Round back upward (cat)","Move slowly and breathe"] },
  ],
  knee: [
    { id:"squat",      name:"Sit-to-Stand", icon:"🪑", tag:"reps", target:10, holdTarget:null, type:"rep",
      desc:"Rise from a seated position to standing and lower back down. The most functional knee rehab exercise.",
      steps:["Stand facing the camera or sideways","Hinge at hips and bend knees to lower","Stop when thighs are near parallel","Push through heels to stand","Repeat with control"] },
    { id:"knee_raise", name:"Knee Raises",  icon:"🦵", tag:"reps", target:10, holdTarget:null, type:"rep",
      desc:"Lift one knee toward the hip while standing. Builds hip flexor strength and knee control.",
      steps:["Stand facing the camera","Hold something stable if needed","Lift one knee up toward hip height","Lower slowly back to floor","Alternate sides"] },
  ],
  foot: [
    { id:"toe_curls", name:"Toe Curls", icon:"🦶", tag:"reps", target:15, holdTarget:null, type:"rep",
      desc:"Curl and release toes to strengthen intrinsic foot muscles.",
      steps:["Sit in a chair facing camera","Place feet flat on the floor","Curl all toes downward (grip)","Release and spread toes wide","Repeat slowly"] },
  ],
  legs: [
    { id:"squat2",      name:"Assisted Squat", icon:"🏋️", tag:"reps", target:10, holdTarget:null, type:"rep",
      desc:"Lower into a squat with support as needed. Builds leg strength for functional movement.",
      steps:["Stand facing or sideways to camera","Hold something stable if needed","Bend knees and lower hips","Stand back up with control","Repeat"] },
    { id:"knee_raise2", name:"Leg Raises",     icon:"🦵", tag:"reps", target:12, holdTarget:null, type:"rep",
      desc:"Alternate knee lifts to build hip flexor and leg strength.",
      steps:["Stand facing the camera","Lift alternate knees to hip height","Keep a steady rhythm","Hold something for balance if needed"] },
  ],
  balance: [
    { id:"t_pose_bal", name:"T-Pose Balance Hold", icon:"✈️", tag:"hold·5s", target:5, holdTarget:5, type:"hold",
      desc:"Hold arms out and maintain balance. Challenges proprioception and postural control.",
      steps:["Stand facing the camera","Raise both arms straight out to sides","Optionally lift one foot slightly","Hold for 5 seconds","Rest and repeat"] },
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
  if (!selectedPart) return
  buildExerciseList()
  showScreen('screen-exercises')
}

window.goBack = function(screen) {
  if (screen === 1) showScreen('screen-body')
}

// ── SCREEN 2: EXERCISE LIST ───────────────────────────────────────────────────
function buildExerciseList() {
  const part = BODY_PARTS.find(p => p.id === selectedPart)
  document.getElementById('exListTitle').textContent = part.icon + ' ' + part.name
  document.getElementById('exListSub').textContent = 'Select one to see details & start'

  const scroll = document.getElementById('exListScroll')
  scroll.innerHTML = ''
  const exList = EXERCISES_BY_PART[selectedPart]

  if (!exList || !exList.length) {
    scroll.innerHTML = `<div style="color:var(--muted);font-size:12px;padding:16px;line-height:1.7">
      Camera tracking isn't available for <strong>${part.name}</strong> yet.<br><br>
      Try <strong>Shoulder</strong>, <strong>Knee</strong>, <strong>Elbow</strong> or <strong>Legs</strong>.
    </div>`
    return
  }

  for (const ex of exList) {
    const item = document.createElement('div')
    item.className = 'ex-item'
    item.dataset.id = ex.id
    item.innerHTML = `
      <div class="ex-icon">${ex.icon}</div>
      <div class="ex-info">
        <div class="ex-name">${ex.name}</div>
        <div class="ex-meta">${ex.tag} · ${ex.target} ${ex.type === 'hold' ? 'holds' : 'reps'}</div>
      </div>
      <span class="ex-badge">${ex.tag}</span>
      <div class="ex-check"></div>`
    item.onclick = () => selectExercise(ex, item)
    scroll.appendChild(item)
  }
}

function selectExercise(ex, item) {
  selectedExercise = ex
  document.querySelectorAll('.ex-item').forEach(i => i.classList.remove('selected'))
  item.classList.add('selected')
  item.querySelector('.ex-check').textContent = '✓'

  document.getElementById('exDetailPlaceholder').style.display = 'none'
  document.getElementById('exDetailCard').classList.add('show')
  document.getElementById('exDetailName').textContent = ex.icon + ' ' + ex.name
  document.getElementById('exDetailDesc').textContent = ex.desc
  document.getElementById('exDetailMeta').innerHTML =
    `<div class="meta-chip">Type: <span>${ex.type === 'hold' ? 'Hold' : 'Reps'}</span></div>` +
    `<div class="meta-chip">Target: <span>${ex.target} ${ex.type === 'hold' ? 'holds' : 'reps'}</span></div>` +
    (ex.holdTarget ? `<div class="meta-chip">Hold: <span>${ex.holdTarget}s</span></div>` : '')
  document.getElementById('exDetailSteps').innerHTML =
    ex.steps.map((s, i) => `<div class="how-to-step"><div class="step-num">${i + 1}</div><div class="step-text">${s}</div></div>`).join('')
}
