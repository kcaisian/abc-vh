/**
 * src/workout/main.js
 *
 * All JavaScript extracted from main.html.
 * Handles: pose detection, ghost system, rep/hold logic, skeleton drawing.
 */

import { PoseLandmarker, FilesetResolver }
  from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";

// ── GHOST POSE SKELETON CONNECTIONS ──────────────────────────────────────────
// 12-point simplified skeleton:
// [0]=L-shoulder [1]=R-shoulder [2]=L-elbow [3]=R-elbow [4]=L-wrist [5]=R-wrist
// [6]=L-hip [7]=R-hip [8]=L-knee [9]=R-knee [10]=L-ankle [11]=R-ankle
const GC = [[0,1],[0,2],[1,3],[2,4],[3,5],[0,6],[1,7],[6,7],[6,8],[8,10],[7,9],[9,11]];

const GP = {
  arm_raise:{
    down:[
      {x:-.5,y:0},{x:.5,y:0},
      {x:-.52,y:.85},{x:.52,y:.85},
      {x:-.52,y:1.7},{x:.52,y:1.7},
      {x:-.38,y:1.55},{x:.38,y:1.55},
      {x:-.38,y:2.85},{x:.38,y:2.85},
      {x:-.38,y:4.1},{x:.38,y:4.1},
    ],
    up:[
      {x:-.5,y:0},{x:.5,y:0},
      {x:-1.15,y:0},{x:1.15,y:0},
      {x:-1.75,y:0},{x:1.75,y:0},
      {x:-.38,y:1.55},{x:.38,y:1.55},
      {x:-.38,y:2.85},{x:.38,y:2.85},
      {x:-.38,y:4.1},{x:.38,y:4.1},
    ],
  },
  bicep_curl:{
    down:[
      {x:-.5,y:0},{x:.5,y:0},
      {x:-.52,y:.85},{x:.52,y:.85},
      {x:-.52,y:1.7},{x:.52,y:1.7},
      {x:-.38,y:1.55},{x:.38,y:1.55},
      {x:-.38,y:2.85},{x:.38,y:2.85},
      {x:-.38,y:4.1},{x:.38,y:4.1},
    ],
    up:[
      {x:-.5,y:0},{x:.5,y:0},
      {x:-.6,y:.65},{x:.6,y:.65},
      {x:-.55,y:-.55},{x:.55,y:-.55},
      {x:-.38,y:1.55},{x:.38,y:1.55},
      {x:-.38,y:2.85},{x:.38,y:2.85},
      {x:-.38,y:4.1},{x:.38,y:4.1},
    ],
  },
  pushup:{
    up:[
      {x:-.5,y:0},{x:.5,y:0},
      {x:-.5,y:-.9},{x:.5,y:-.9},
      {x:-.5,y:-1.8},{x:.5,y:-1.8},
      {x:-.4,y:1.05},{x:.4,y:1.05},
      {x:-.35,y:2.45},{x:.35,y:2.45},
      {x:-.3,y:3.7},{x:.3,y:3.7},
    ],
    down:[
      {x:-.5,y:0},{x:.5,y:0},
      {x:-.7,y:-.55},{x:.7,y:-.55},
      {x:-.5,y:-1.3},{x:.5,y:-1.3},
      {x:-.4,y:1.05},{x:.4,y:1.05},
      {x:-.35,y:2.45},{x:.35,y:2.45},
      {x:-.3,y:3.7},{x:.3,y:3.7},
    ],
  },
  shoulder_press:{
    down:[
      {x:-.5,y:0},{x:.5,y:0},
      {x:-.75,y:0},{x:.75,y:0},
      {x:-.75,y:-.95},{x:.75,y:-.95},
      {x:-.38,y:1.55},{x:.38,y:1.55},
      {x:-.38,y:2.85},{x:.38,y:2.85},
      {x:-.38,y:4.1},{x:.38,y:4.1},
    ],
    up:[
      {x:-.5,y:0},{x:.5,y:0},
      {x:-.52,y:-.95},{x:.52,y:-.95},
      {x:-.48,y:-2.0},{x:.48,y:-2.0},
      {x:-.38,y:1.55},{x:.38,y:1.55},
      {x:-.38,y:2.85},{x:.38,y:2.85},
      {x:-.38,y:4.1},{x:.38,y:4.1},
    ],
  },
  chest_stretch:{
    rest:[
      {x:-.5,y:0},{x:.5,y:0},
      {x:-.52,y:.85},{x:.52,y:.85},
      {x:-.52,y:1.7},{x:.52,y:1.7},
      {x:-.38,y:1.55},{x:.38,y:1.55},
      {x:-.38,y:2.85},{x:.38,y:2.85},
      {x:-.38,y:4.1},{x:.38,y:4.1},
    ],
    hold:[
      {x:-.5,y:0},{x:.5,y:0},
      {x:-1.15,y:.1},{x:1.15,y:.1},
      {x:-1.7,y:.3},{x:1.7,y:.3},
      {x:-.38,y:1.55},{x:.38,y:1.55},
      {x:-.38,y:2.85},{x:.38,y:2.85},
      {x:-.38,y:4.1},{x:.38,y:4.1},
    ],
  },
  t_pose:{
    rest:[
      {x:-.5,y:0},{x:.5,y:0},
      {x:-.52,y:.85},{x:.52,y:.85},
      {x:-.52,y:1.7},{x:.52,y:1.7},
      {x:-.38,y:1.55},{x:.38,y:1.55},
      {x:-.38,y:2.85},{x:.38,y:2.85},
      {x:-.38,y:4.1},{x:.38,y:4.1},
    ],
    hold:[
      {x:-.5,y:0},{x:.5,y:0},
      {x:-1.2,y:0},{x:1.2,y:0},
      {x:-1.95,y:0},{x:1.95,y:0},
      {x:-.38,y:1.55},{x:.38,y:1.55},
      {x:-.38,y:2.85},{x:.38,y:2.85},
      {x:-.38,y:4.1},{x:.38,y:4.1},
    ],
  },
};

const LM_GROUPS = {
  LShoulderElbow: ["L shoulder & elbow",  [11, 13]],
  RShoulderElbow: ["R shoulder & elbow",  [12, 14]],
  LElbowWrist:    ["L elbow & wrist",     [13, 15]],
  RElbowWrist:    ["R elbow & wrist",     [14, 16]],
  LHipKnee:       ["L hip & knee",        [23, 25]],
  RHipKnee:       ["R hip & knee",        [24, 26]],
  LKneeAnkle:     ["L knee & ankle",      [25, 27]],
  RKneeAnkle:     ["R knee & ankle",      [26, 28]],
  LShoulder:      ["L shoulder",          [11]],
  RShoulder:      ["R shoulder",          [12]],
  LHip:           ["L hip",              [23]],
  RHip:           ["R hip",              [24]],
};

const EXERCISES = {
  pushup:{
    name:"Push-Up", type:"rep", target:10, joints:["LElbow","RElbow"],
    romTop:160, romBottom:70, romTargetPct:78, poses:GP.pushup,
    requiredGroups:["LShoulderElbow","RShoulderElbow","LElbowWrist","RElbowWrist","LHip","RHip"],
    frameHint:"Show full upper body — shoulders, elbows, wrists & hips",
    phaseLabels:{ up:"Go down", down:"Push up" },
    check(a){ const v=avgElbow(a); if(v===null)return{phase:null}; if(v>145)return{phase:"up"}; if(v<90)return{phase:"down"}; return{phase:"mid"}; },
    romValue(a){ return avgElbow(a); }
  },
  bicep_curl:{
    name:"Bicep Curls", type:"rep", target:12, joints:["LElbow","RElbow"],
    romTop:165, romBottom:50, romTargetPct:75, poses:GP.bicep_curl,
    requiredGroups:["LShoulderElbow","RShoulderElbow","LElbowWrist","RElbowWrist"],
    frameHint:"Show full arms — shoulders to wrists",
    phaseLabels:{ up:"Lower arms", down:"Curl up" },
    check(a){ const v=avgElbow(a); if(v===null)return{phase:null}; if(v>140)return{phase:"down"}; if(v<70)return{phase:"up"}; return{phase:"mid"}; },
    romValue(a){ return avgElbow(a); }
  },
  arm_raise:{
    name:"Arm Raises", type:"rep", target:10, joints:["LShoulder","RShoulder"],
    romTop:10, romBottom:90, romTargetPct:75, poses:GP.arm_raise,
    requiredGroups:["LShoulderElbow","RShoulderElbow","LElbowWrist","RElbowWrist","LHip","RHip"],
    frameHint:"Show full body — head to hips, arms fully extended",
    phaseLabels:{ up:"Lower arms", down:"Raise arms" },
    check(a){ const v=avgShoulder(a); if(v===null)return{phase:null}; if(v<35)return{phase:"down"}; if(v>70)return{phase:"up"}; return{phase:"mid"}; },
    romValue(a){ return avgShoulder(a); }
  },
  shoulder_press:{
    name:"Shoulder Press", type:"rep", target:10, joints:["LElbow","RElbow"],
    romTop:160, romBottom:85, romTargetPct:80, poses:GP.shoulder_press,
    requiredGroups:["LShoulderElbow","RShoulderElbow","LElbowWrist","RElbowWrist"],
    frameHint:"Show full arms — shoulders to wrists, overhead included",
    phaseLabels:{ up:"Lower hands", down:"Press up" },
    check(a){ const v=avgElbow(a); if(v===null)return{phase:null}; if(v<100)return{phase:"up"}; if(v>140)return{phase:"down"}; return{phase:"mid"}; },
    romValue(a){ return avgElbow(a); }
  },
  chest_stretch:{
    name:"Chest Stretch", type:"hold", target:5, holdTarget:5,
    joints:["LShoulder","RShoulder"],
    romTop:20, romBottom:90, romTargetPct:70, poses:GP.chest_stretch,
    requiredGroups:["LShoulderElbow","RShoulderElbow","LElbowWrist","RElbowWrist"],
    frameHint:"Show full arms outstretched — shoulders to wrists",
    phaseLabels:{ hold:"Hold the stretch", rest:"Open arms wider" },
    check(a){ const v=avgShoulder(a); if(v===null)return{phase:null}; if(v>70)return{phase:"hold"}; return{phase:"rest"}; },
    romValue(a){ return avgShoulder(a); }
  },
  t_pose:{
    name:"T-Pose Hold", type:"hold", target:3, holdTarget:5,
    joints:["LShoulder","RShoulder"],
    romTop:20, romBottom:90, romTargetPct:80, poses:GP.t_pose,
    requiredGroups:["LShoulderElbow","RShoulderElbow","LElbowWrist","RElbowWrist","LHip","RHip"],
    frameHint:"Show full upper body — shoulders, elbows, wrists & hips",
    phaseLabels:{ hold:"Hold the T-Pose", rest:"Raise arms to shoulder height" },
    check(a){ const v=avgShoulder(a); if(v===null)return{phase:null}; if(v>75)return{phase:"hold"}; return{phase:"rest"}; },
    romValue(a){ return avgShoulder(a); }
  },
};

function avgElbow(a)  { if(!a.LElbow&&!a.RElbow)return null; return Math.round(((a.LElbow||0)+(a.RElbow||0))/(a.LElbow&&a.RElbow?2:1)); }
function avgShoulder(a){ if(!a.LShoulder&&!a.RShoulder)return null; return Math.round(((a.LShoulder||0)+(a.RShoulder||0))/(a.LShoulder&&a.RShoulder?2:1)); }
function avgKnee(a)   { if(!a.LKnee&&!a.RKnee)return null; return Math.round(((a.LKnee||0)+(a.RKnee||0))/(a.LKnee&&a.RKnee?2:1)); }

const VIS_THRESHOLD = 0.45;

function checkRequiredParts(lm, requiredGroups) {
  const missing = [];
  for (const groupKey of requiredGroups) {
    const [label, indices] = LM_GROUPS[groupKey];
    const allVisible = indices.every(i => lm[i] && lm[i].visibility >= VIS_THRESHOLD);
    if (!allVisible) missing.push(label);
  }
  return { ok: missing.length === 0, missing };
}

// ── STATE ──
let poseLandmarker=null, running=false, currentEx="pushup";
let repCount=0, repPhase="up", holdStart=null, sessionLog=[], bodyDetected=false;
let partsOk=true;
let ghostTargetPhase="up", ghostMatchScore=0, ghostTransitioning=false;
let lastGhostJoints=null, ghostMorphT=0, ghostMorphFrom=null, ghostMorphTo=null;
let ghostVisible=true;

// ── DOM refs ──
const video=document.getElementById("video");
const canvas=document.getElementById("canvas"), ctx=canvas.getContext("2d");
const ghostCanvas=document.getElementById("ghostCanvas"), gctx=ghostCanvas.getContext("2d");
const repCountEl=document.getElementById("repCount"), progressFill=document.getElementById("progressFill");
const ghostToggleButton=document.getElementById("ghostToggleButton");
const statModeLabel=document.getElementById("statModeLabel"), statSub=document.getElementById("statSub");
const detectionBadge=document.getElementById("detectionBadge"), stepPrompt=document.getElementById("stepPrompt");
const holdRingContainer=document.getElementById("holdRingContainer"), holdArc=document.getElementById("holdArc"), holdTimerEl=document.getElementById("holdTimer");
const logEntries=document.getElementById("logEntries");
const romFill=document.getElementById("romFill"), romTargetLine=document.getElementById("romTargetLine");
const romPct=document.getElementById("romPct"), romPctLabel=document.getElementById("romPctLabel");
const partsWarning=document.getElementById("partsWarning");
const poseMatchBar=document.getElementById("poseMatchBar"), poseMatchFill=document.getElementById("poseMatchFill");
const poseMatchPct=document.getElementById("poseMatchPct"), poseMatchLabel=document.getElementById("poseMatchLabel");
const phaseFlash=document.getElementById("phaseFlash"), ghostLabel=document.getElementById("ghostLabel");
const ARC_LEN=213.6;

// ── ANGLE MATH ──
function angle3(a,b,c){
  if(!a||!b||!c)return null;
  const ab=[a.x-b.x,a.y-b.y],cb=[c.x-b.x,c.y-b.y];
  const dot=ab[0]*cb[0]+ab[1]*cb[1];
  const mag=Math.sqrt((ab[0]**2+ab[1]**2))*Math.sqrt((cb[0]**2+cb[1]**2));
  if(!mag)return null;
  return Math.round(Math.acos(Math.max(-1,Math.min(1,dot/mag)))*180/Math.PI);
}

function getAngles(lm){
  const vis=l=>l&&l.visibility>0.45;
  const L={s:lm[11],e:lm[13],w:lm[15],h:lm[23],k:lm[25],a:lm[27]};
  const R={s:lm[12],e:lm[14],w:lm[16],h:lm[24],k:lm[26],a:lm[28]};
  return{
    LElbow:    vis(L.s)&&vis(L.e)&&vis(L.w)?angle3(L.s,L.e,L.w):null,
    RElbow:    vis(R.s)&&vis(R.e)&&vis(R.w)?angle3(R.s,R.e,R.w):null,
    LShoulder: vis(L.h)&&vis(L.s)&&vis(L.e)?angle3(L.h,L.s,L.e):null,
    RShoulder: vis(R.h)&&vis(R.s)&&vis(R.e)?angle3(R.h,R.s,R.e):null,
    LKnee:     vis(L.h)&&vis(L.k)&&vis(L.a)?angle3(L.h,L.k,L.a):null,
    RKnee:     vis(R.h)&&vis(R.k)&&vis(R.a)?angle3(R.h,R.k,R.a):null,
  };
}

// ── GHOST POSE SYSTEM ──────────────────────────────────────────────────────
function getTargetPoseKey(ex) {
  const poses = ex.poses;
  if (!poses) return null;
  if (ex.type === "rep") { return repPhase === "up" ? (poses.down ? "down" : "up") : (poses.up ? "up" : "down"); }
  return poses.hold ? "hold" : "rest";
}

function computePoseMatchScore(lm, targetJoints) {
  if (!lm || !targetJoints) return 0;
  function ghostAngle(a, b, c) {
    const ab=[targetJoints[a].x-targetJoints[b].x,targetJoints[a].y-targetJoints[b].y];
    const cb=[targetJoints[c].x-targetJoints[b].x,targetJoints[c].y-targetJoints[b].y];
    const dot=ab[0]*cb[0]+ab[1]*cb[1];
    const mag=Math.sqrt(ab[0]**2+ab[1]**2)*Math.sqrt(cb[0]**2+cb[1]**2);
    if(!mag)return null;
    return Math.acos(Math.max(-1,Math.min(1,dot/mag)))*180/Math.PI;
  }
  const angles=getAngles(lm), pairs=[];
  const gLE=ghostAngle(0,2,4); if(gLE!==null&&angles.LElbow!==null)pairs.push([gLE,angles.LElbow,60]);
  const gRE=ghostAngle(1,3,5); if(gRE!==null&&angles.RElbow!==null)pairs.push([gRE,angles.RElbow,60]);
  const gLS=ghostAngle(6,0,2); if(gLS!==null&&angles.LShoulder!==null)pairs.push([gLS,angles.LShoulder,50]);
  const gRS=ghostAngle(7,1,3); if(gRS!==null&&angles.RShoulder!==null)pairs.push([gRS,angles.RShoulder,50]);
  const gLK=ghostAngle(6,8,10);if(gLK!==null&&angles.LKnee!==null)pairs.push([gLK,angles.LKnee,50]);
  const gRK=ghostAngle(7,9,11);if(gRK!==null&&angles.RKnee!==null)pairs.push([gRK,angles.RKnee,50]);
  if(pairs.length===0)return 0;
  return pairs.reduce((s,[t,a,tol])=>s+Math.max(0,1-Math.abs(t-a)/tol),0)/pairs.length;
}

function lerpJoints(from,to,t){
  if(!from||!to)return to||from;
  return from.map((pt,i)=>({x:pt.x+(to[i].x-pt.x)*t,y:pt.y+(to[i].y-pt.y)*t}));
}

function drawGhostPose(lm) {
  const W=ghostCanvas.width, H=ghostCanvas.height;
  gctx.clearRect(0,0,W,H);
  if(!ghostVisible){poseMatchBar.classList.remove("visible");ghostLabel.classList.remove("visible");return;}
  const ex=EXERCISES[currentEx];
  if(!ex.poses)return;
  const poseKey=getTargetPoseKey(ex);
  if(!poseKey)return;
  const targetJoints=ex.poses[poseKey];
  if(!targetJoints)return;
  if(ghostMorphTo!==targetJoints){
    ghostMorphFrom=ghostMorphTo?lerpJoints(ghostMorphFrom,ghostMorphTo,ghostMorphT):targetJoints;
    ghostMorphTo=targetJoints; ghostMorphT=0;
  }
  ghostMorphT=Math.min(1,ghostMorphT+0.06);
  const joints=lerpJoints(ghostMorphFrom||targetJoints,targetJoints,ghostMorphT);
  const scale=W*0.08, ankleY=H*0.91, cy=ankleY-4.1*scale, cx=W*0.5;
  const S=pt=>({x:cx+pt.x*scale,y:cy+pt.y*scale});
  const matchScore=lm?computePoseMatchScore(lm,joints):0;
  ghostMatchScore=matchScore;
  const r=Math.round(255-matchScore*100), g=Math.round(145+matchScore*110), b=Math.round(60-matchScore*20);
  const alpha=0.75+matchScore*0.2;
  const color=`rgba(${r},${g},${b},${alpha})`;
  gctx.save(); gctx.setLineDash([7,5]); gctx.lineCap="round"; gctx.lineWidth=5; gctx.strokeStyle=color;
  for(const[a,b2]of GC){const pA=S(joints[a]),pB=S(joints[b2]);gctx.beginPath();gctx.moveTo(pA.x,pA.y);gctx.lineTo(pB.x,pB.y);gctx.stroke();}
  gctx.setLineDash([]); gctx.fillStyle=color; gctx.strokeStyle=color; gctx.lineWidth=1.5;
  for(let i=0;i<joints.length;i++){const p=S(joints[i]);gctx.beginPath();gctx.arc(p.x,p.y,i<2?6:5,0,Math.PI*2);gctx.fill();gctx.stroke();}
  const smx=(S(joints[0]).x+S(joints[1]).x)/2, smy=(S(joints[0]).y+S(joints[1]).y)/2;
  const hc={x:smx,y:smy-scale*0.55};
  gctx.beginPath();gctx.arc(hc.x,hc.y,scale*0.18,0,Math.PI*2);
  gctx.fillStyle=`rgba(${r},${g},${b},0.18)`;gctx.fill();
  gctx.strokeStyle=color;gctx.lineWidth=2;gctx.setLineDash([5,4]);gctx.stroke();gctx.setLineDash([]);
  if(matchScore>0.75){const pulse=0.5+0.5*Math.sin(Date.now()*0.008);gctx.beginPath();gctx.arc(hc.x,hc.y,scale*0.18+8+pulse*6,0,Math.PI*2);gctx.strokeStyle=`rgba(110,231,160,${0.4+pulse*0.3})`;gctx.lineWidth=2;gctx.stroke();}
  gctx.restore();
  updatePoseMatchUI(matchScore,poseKey,ex);
}

function updatePoseMatchUI(score,poseKey,ex){
  if(!ghostVisible){poseMatchBar.classList.remove("visible");return;}
  poseMatchBar.classList.add("visible");
  const pct=Math.round(score*100);
  poseMatchFill.style.width=pct+"%"; poseMatchPct.textContent=pct+"%";
  if(score>=0.85){poseMatchFill.className="pose-match-fill matched";poseMatchLabel.textContent="✓ "+(ex.phaseLabels?.(poseKey)||"Hold");}
  else if(score>=0.5){poseMatchFill.className="pose-match-fill close";poseMatchLabel.textContent="Getting close…";}
  else{poseMatchFill.className="pose-match-fill";poseMatchLabel.textContent="Match the silhouette";}
  ghostLabel.classList.toggle("visible",running&&ghostVisible);
}

function triggerPhaseFlash(){phaseFlash.classList.add("flash");setTimeout(()=>phaseFlash.classList.remove("flash"),120);}

// ── LIVE SKELETON ──
const SKEL=[[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28]];
const SKEL_POINTS=new Set(SKEL.flat());

function drawSkeleton(lm,missingIndices){
  const W=canvas.width,H=canvas.height,missingSet=new Set(missingIndices||[]);
  ctx.setLineDash([]);
  for(const[a,b]of SKEL){
    const lA=lm[a],lB=lm[b];if(!lA||!lB||lA.visibility<0.3||lB.visibility<0.3)continue;
    ctx.strokeStyle=(missingSet.has(a)||missingSet.has(b))?"rgba(145,90,58,0.7)":"rgba(201,167,123,0.6)";
    ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(lA.x*W,lA.y*H);ctx.lineTo(lB.x*W,lB.y*H);ctx.stroke();
  }
  const JI={LElbow:13,RElbow:14,LShoulder:11,RShoulder:12,LKnee:25,RKnee:26};
  const ex=EXERCISES[currentEx]||{};
  const targetIdx=new Set((ex.joints||[]).map(j=>JI[j]).filter(Boolean));
  for(const i of SKEL_POINTS){
    const l=lm[i];if(!l||l.visibility<0.4)continue;
    ctx.beginPath();ctx.arc(l.x*W,l.y*H,7,0,Math.PI*2);
    ctx.fillStyle=missingSet.has(i)?"rgba(145,90,58,0.9)":targetIdx.has(i)?"rgba(201,167,123,0.95)":"rgba(216,186,148,0.9)";
    ctx.fill();
  }
}

// ── ROM BAR ──
function updateROM(angles){
  const ex=EXERCISES[currentEx],val=ex.romValue(angles);
  if(val===null){romPct.textContent="—";romFill.style.height="0%";return;}
  const range=Math.abs(ex.romBottom-ex.romTop);
  let pct=ex.romBottom<ex.romTop?Math.round(((ex.romTop-val)/range)*100):Math.round(((val-ex.romTop)/range)*100);
  pct=Math.max(0,Math.min(100,pct));
  romFill.style.height=pct+"%"; romPct.textContent=pct+"%";
  romFill.className="rom-bar-fill"+(pct>=ex.romTargetPct?" deep":pct>=ex.romTargetPct*0.5?" partial":"");
  romTargetLine.style.bottom=ex.romTargetPct+"%";
}

function setPrompt(text,style){
  if(!text){stepPrompt.classList.remove("show","good","warn");return;}
  stepPrompt.textContent=text; stepPrompt.classList.add("show");
  stepPrompt.classList.toggle("good",style==="good");
  stepPrompt.classList.toggle("warn",style==="warn");
}

function setPartsWarning(missing){
  if(!missing||missing.length===0){partsWarning.classList.remove("show");partsWarning.textContent="";return;}
  partsWarning.textContent=`⚠ Move into frame: ${missing.slice(0,3).join(", ")}`;
  partsWarning.classList.add("show");
}

// ── REP / HOLD LOGIC ──
function processReps(phase){
  const ex=EXERCISES[currentEx];
  if(phase===null){setPrompt(ex.phaseLabels?.wait||"Get ready");return;}
  if(phase==="up"&&repPhase==="down"){repPhase="up";ghostMorphTo=null;triggerPhaseFlash();setPrompt(ex.phaseLabels?.up||"Go down");}
  else if(phase==="down"&&repPhase==="up"){repPhase="down";ghostMorphTo=null;triggerPhaseFlash();addRep();setPrompt("✓ Rep counted!","good");setTimeout(()=>setPrompt(ex.phaseLabels?.down||"Stand up"),900);return;}
  if(phase!=="mid")setPrompt(repPhase==="up"?(ex.phaseLabels?.up||"Go down"):(ex.phaseLabels?.down||"Stand up"));
}

function processHold(phase){
  const ex=EXERCISES[currentEx];
  if(phase==="hold"){
    if(!holdStart)holdStart=Date.now();
    const e=(Date.now()-holdStart)/1000,frac=Math.min(e/ex.holdTarget,1);
    holdArc.style.strokeDashoffset=ARC_LEN*(1-frac); holdTimerEl.textContent=Math.floor(e)+"s";
    holdRingContainer.classList.add("visible"); setPrompt(ex.phaseLabels?.hold||"Hold…");
    if(e>=ex.holdTarget){addRep();holdStart=null;}
  } else {
    holdStart=null; holdArc.style.strokeDashoffset=ARC_LEN; holdTimerEl.textContent="0s";
    holdRingContainer.classList.remove("visible");
    setPrompt(phase===null?(ex.phaseLabels?.wait||"Get ready"):(ex.phaseLabels?.rest||"Get into position"));
  }
}

function pauseHold(){if(holdStart){holdStart=null;holdArc.style.strokeDashoffset=ARC_LEN;holdTimerEl.textContent="0s";}holdRingContainer.classList.remove("visible");}

function addRep(){
  const ex=EXERCISES[currentEx]; repCount++;
  repCountEl.classList.remove("pop"); void repCountEl.offsetWidth; repCountEl.classList.add("pop");
  repCountEl.textContent=repCount;
  progressFill.style.width=Math.min(repCount/ex.target*100,100)+"%";
  const now=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"});
  sessionLog.unshift({time:now,text:`${ex.name} — ${ex.type==="hold"?"Hold":"Rep"} ${repCount}`});
  renderLog();
}

function renderLog(){
  if(!sessionLog.length){logEntries.innerHTML='<div class="log-entry" style="color:var(--muted);font-size:13px">No reps yet</div>';return;}
  logEntries.innerHTML=sessionLog.slice(0,12).map(e=>`<div class="log-entry"><span>${e.text}</span><span class="log-time">${e.time}</span></div>`).join("");
}

function updateAngleReadouts(angles){
  [["LElbow","aLElbow"],["RElbow","aRElbow"],["LShoulder","aLShoulder"],["RShoulder","aRShoulder"],["LKnee","aLKnee"],["RKnee","aRKnee"]].forEach(([k,id])=>{
    const ex=EXERCISES[currentEx],el=document.getElementById(id),v=angles[k];
    el.textContent=v!==null?v+"°":"—°";
    el.classList.remove("active","missing");
    if(ex.joints.includes(k)){if(v!==null)el.classList.add("active");else el.classList.add("missing");}
  });
}

function getMissingLandmarkIndices(lm,requiredGroups){
  const missing=new Set();
  for(const gk of requiredGroups){
    if(!LM_GROUPS[gk])continue;
    const[,indices]=LM_GROUPS[gk];
    for(const i of indices){if(!lm[i]||lm[i].visibility<VIS_THRESHOLD)missing.add(i);}
  }
  return[...missing];
}

// ── MAIN LOOP ──
function detect(){
  if(!running)return;
  if(!poseLandmarker||video.readyState<2){requestAnimationFrame(detect);return;}
  canvas.width=video.videoWidth; canvas.height=video.videoHeight;
  ghostCanvas.width=video.videoWidth; ghostCanvas.height=video.videoHeight;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const results=poseLandmarker.detectForVideo(video,performance.now());
  if(results.landmarks&&results.landmarks.length>0){
    const lm=results.landmarks[0],angles=getAngles(lm),ex=EXERCISES[currentEx];
    const{ok,missing}=checkRequiredParts(lm,ex.requiredGroups);
    const missingLmIndices=ok?[]:getMissingLandmarkIndices(lm,ex.requiredGroups);
    partsOk=ok;
    drawSkeleton(lm,missingLmIndices); drawGhostPose(lm);
    updateAngleReadouts(angles); updateROM(angles);
    if(!bodyDetected){bodyDetected=true;detectionBadge.classList.add("detected");detectionBadge.textContent="Body detected ✓";}
    if(!ok){
      detectionBadge.classList.remove("detected");detectionBadge.classList.add("warn");
      detectionBadge.textContent="Required body parts out of frame ⚠";
      setPartsWarning(missing);setPrompt(`Step back — ${ex.frameHint}`,"warn");
      if(ex.type==="hold")pauseHold();holdRingContainer.classList.remove("visible");
    } else {
      detectionBadge.classList.add("detected");detectionBadge.classList.remove("warn");
      detectionBadge.textContent="Body detected ✓";setPartsWarning(null);
      const{phase}=ex.check(angles);
      if(ex.type==="rep"){holdRingContainer.classList.remove("visible");processReps(phase);}
      else processHold(phase);
    }
  } else {
    drawGhostPose(null);
    if(bodyDetected){bodyDetected=false;detectionBadge.classList.remove("detected","warn");detectionBadge.textContent="No body detected";}
    holdStart=null;holdRingContainer.classList.remove("visible");
    romFill.style.height="0%";romPct.textContent="—";setPartsWarning(null);
    setPrompt(EXERCISES[currentEx].phaseLabels?.wait||"Get ready");
  }
  requestAnimationFrame(detect);
}

// ── PUBLIC API (called from HTML onclick) ──
window.startCamera=async function(){
  document.getElementById("placeholder").style.display="none";
  const sp=document.getElementById("loadingSpinner");sp.style.display="flex";
  try{
    const stream=await navigator.mediaDevices.getUserMedia({video:{width:1280,height:720}});
    video.srcObject=stream;await new Promise(r=>video.onloadedmetadata=r);video.play();video.classList.add("visible");
    document.getElementById("loadingMsg").textContent="Loading pose model…";
    const vision=await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm");
    poseLandmarker=await PoseLandmarker.createFromOptions(vision,{
      baseOptions:{modelAssetPath:"https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",delegate:"GPU"},
      runningMode:"VIDEO",numPoses:1
    });
    sp.style.display="none";detectionBadge.classList.add("visible");
    document.getElementById("statusDot").classList.add("live");
    document.getElementById("statusText").textContent="live";
    running=true;ghostMorphTo=null;ghostMorphFrom=null;ghostMorphT=0;
    setPrompt(EXERCISES[currentEx].phaseLabels?.wait||"Get ready");detect();
  }catch(e){
    sp.style.display="none";document.getElementById("placeholder").style.display="flex";
    document.getElementById("placeholderMsg").textContent="Camera error: "+e.message;
  }
};

window.selectExercise=function(btn){
  document.querySelectorAll(".exercise-btn").forEach(b=>b.classList.remove("active"));btn.classList.add("active");
  currentEx=btn.dataset.ex;resetStats(false);
  const ex=EXERCISES[currentEx];
  statModeLabel.textContent=ex.type==="hold"?"Holds":"Reps";
  statSub.textContent=`of ${ex.target} target`;
  romPctLabel.textContent="depth";romTargetLine.style.bottom=ex.romTargetPct+"%";
  holdRingContainer.classList.remove("visible");repPhase="up";
  ghostMorphTo=null;ghostMorphFrom=null;ghostMorphT=0;setPartsWarning(null);
  poseMatchBar.classList.remove("visible");
  if(running)setPrompt(ex.phaseLabels?.wait||"Get ready");
};

window.toggleGhost=function(){return;};

window.resetStats=function(clearLog=true){
  repCount=0;repPhase="up";holdStart=null;
  repCountEl.textContent="0";progressFill.style.width="0%";
  if(clearLog){sessionLog=[];renderLog();}
  holdArc.style.strokeDashoffset=ARC_LEN;holdTimerEl.textContent="0s";
  holdRingContainer.classList.remove("visible");romFill.style.height="0%";romPct.textContent="—";
  ghostMorphTo=null;ghostMorphFrom=null;ghostMorphT=0;
};

// Init
statModeLabel.textContent="Reps";statSub.textContent="of 10 target";
romTargetLine.style.bottom=EXERCISES[currentEx].romTargetPct+"%";
