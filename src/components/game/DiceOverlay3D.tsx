// 3D Dice Roll Overlay — WebView-based BG3-style d20
// Three.js runs inside a WebView, communicates via postMessage
// Die result is pre-determined server-side — animation lands on correct face

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme/colors';
import { fonts, spacing } from '@/theme/typography';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAccessibility } from '@/providers/AccessibilityProvider';
import type { DiceRollResult } from '@/types/game';

const { width: SCREEN_W } = Dimensions.get('window');

interface DiceOverlay3DProps {
  roll: DiceRollResult;
  onComplete: () => void;
}

// ─── Inline HTML for the 3D dice scene ─────────────────────
// Stripped down from the preview — no phone frame, no controls
// Receives roll data via postMessage, sends back events

function buildDiceHTML(roll: DiceRollResult): string {
  const resultCls = roll.isCritical ? 'crit' : roll.isFumble ? 'fumble' : roll.success ? 'success' : 'fail';
  const typeLabel = roll.type === 'attack_roll' ? 'ATTACK ROLL' : roll.type === 'skill_check' ? 'SKILL CHECK' : roll.type === 'saving_throw' ? 'SAVING THROW' : 'DAMAGE ROLL';
  const dcLabel = roll.type === 'attack_roll' ? 'AC' : 'DC';
  const verdictText = roll.isCritical ? 'CRITICAL SUCCESS' : roll.isFumble ? 'CRITICAL FAIL' : roll.success ? 'SUCCESS' : 'FAILED';
  const rollLabel = roll.label.replace(/\b\w/g, (c: string) => c.toUpperCase());
  const modSign = roll.modifier >= 0 ? '+' : '';

  return `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:transparent;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;overflow:hidden;font-family:serif;-webkit-user-select:none;user-select:none}
.canvas-wrap{width:220px;height:220px;margin-bottom:16px}
canvas{width:100%;height:100%;display:block}
.result-card{background:#1a1612;border:1px solid #3d3425;border-radius:12px;padding:18px 24px;text-align:center;min-width:220px;opacity:0;transform:translateY(20px);transition:opacity .3s ease,transform .3s ease,border-color .3s ease}
.result-card.visible{opacity:1;transform:translateY(0)}
.result-card.success{border-color:#4a8c3c}
.result-card.fail{border-color:#c0392b}
.result-card.crit{border-color:#b48c3c;border-width:2px;box-shadow:0 0 24px rgba(180,140,60,.4)}
.result-card.fumble{border-color:#8b0000;border-width:2px;box-shadow:0 0 24px rgba(139,0,0,.3)}
.roll-type{font-size:9px;color:#b48c3c;letter-spacing:3px;margin-bottom:2px;text-transform:uppercase;font-weight:400}
.roller-name{font-size:14px;font-weight:700;color:#e8dcc8;letter-spacing:1px;margin-bottom:2px}
.roll-target{font-size:12px;color:#a89880;font-style:italic;margin-bottom:8px}
.number-row{display:flex;align-items:baseline;justify-content:center;gap:8px}
.total-number{font-size:48px;font-weight:700;letter-spacing:1px}
.total-number.success{color:#4a8c3c}.total-number.fail{color:#c0392b}.total-number.crit{color:#b48c3c}.total-number.fumble{color:#8b0000}
.dc-text{font-size:14px;color:#6b5d4d}
.breakdown{font-size:12px;color:#6b5d4d;margin-top:2px}
.verdict{font-size:14px;font-weight:700;letter-spacing:2px;margin-top:8px}
.verdict.success{color:#4a8c3c}.verdict.fail{color:#c0392b}.verdict.crit{color:#b48c3c}.verdict.fumble{color:#8b0000}
.tap-hint{font-size:11px;color:#4a4035;margin-top:24px}
.screen-flash{position:fixed;inset:0;background:#fff;pointer-events:none;opacity:0;z-index:20}
.screen-flash.fire{animation:flash .35s ease-out forwards}
@keyframes flash{0%{opacity:0}20%{opacity:.4}100%{opacity:0}}
.burst-container{position:absolute;top:38%;left:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:15}
.burst-particle{position:absolute;width:6px;height:6px;border-radius:50%;background:#b48c3c;opacity:0}
.burst-particle.fire{animation:burstOut .6s ease-out forwards}
@keyframes burstOut{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--bx),var(--by)) scale(.3)}}
</style>
</head><body>
<div class="screen-flash" id="screenFlash"></div>
<div class="canvas-wrap"><canvas id="c" width="440" height="440"></canvas></div>
<div class="burst-container" id="burstContainer"></div>
<div class="result-card" id="card" data-type="${resultCls}">
  <div class="roll-type">${typeLabel}</div>
  <div class="roller-name">${roll.roller.toUpperCase()}</div>
  <div class="roll-target">${rollLabel}</div>
  <div class="number-row">
    <span class="total-number ${resultCls}">${roll.total}</span>
    ${roll.dc != null ? `<span class="dc-text">vs ${dcLabel} ${roll.dc}</span>` : ''}
  </div>
  <div class="breakdown">d20(${roll.roll}) ${modSign}${roll.modifier}</div>
  <div class="verdict ${resultCls}">${verdictText}</div>
</div>
<div class="tap-hint" id="tapHint">Tap to skip</div>

<script type="importmap">{"imports":{"three":"https://unpkg.com/three@0.172.0/build/three.module.js"}}</script>
<script type="module">
import*as THREE from'three';

const canvas=document.getElementById('c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(220,220);
renderer.setClearColor(0x000000,0);
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.2;

const scene=new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff,0.5));
const kl=new THREE.DirectionalLight(0xffe4b5,1.8);kl.position.set(3,5,4);scene.add(kl);
const fl=new THREE.DirectionalLight(0x8899bb,0.5);fl.position.set(-3,2,-2);scene.add(fl);
const rl=new THREE.DirectionalLight(0xffd700,0.4);rl.position.set(0,-2,-5);scene.add(rl);

const camera=new THREE.PerspectiveCamera(40,1,0.1,100);
camera.position.set(0,2.5,5.5);camera.lookAt(0,0,0);

function createFaceTex(num){
  const s=256,c=document.createElement('canvas');c.width=s;c.height=s;
  const x=c.getContext('2d');
  const g=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s*.7);
  g.addColorStop(0,'#1e1812');g.addColorStop(.5,'#161210');g.addColorStop(1,'#0e0b08');
  x.fillStyle=g;x.fillRect(0,0,s,s);
  for(let i=0;i<800;i++){const px=Math.random()*s,py=Math.random()*s,b=Math.random()*30+10;
    x.fillStyle='rgba('+(b+10)+','+(b+5)+','+b+','+(Math.random()*.15)+')';
    x.fillRect(px,py,Math.random()*3+1,Math.random()*3+1)}
  x.strokeStyle='rgba(40,30,20,0.3)';x.lineWidth=1;
  for(let v=0;v<3;v++){x.beginPath();x.moveTo(Math.random()*s,Math.random()*s);
    x.bezierCurveTo(Math.random()*s,Math.random()*s,Math.random()*s,Math.random()*s,Math.random()*s,Math.random()*s);x.stroke()}
  x.save();x.translate(s/2,s*2/3);
  x.shadowColor='rgba(200,168,78,0.6)';x.shadowBlur=12;x.fillStyle='#c8a84e';
  x.font='bold 90px serif';x.textAlign='center';x.textBaseline='middle';
  x.fillText(String(num),0,0);x.shadowBlur=0;x.fillStyle='#dfc068';x.fillText(String(num),0,0);
  x.strokeStyle='rgba(255,230,150,0.3)';x.lineWidth=1;x.strokeText(String(num),0,-1);x.restore();
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}

const geo=new THREE.IcosahedronGeometry(1.4,0).toNonIndexed();
const uvs=new Float32Array(20*3*2);
for(let f=0;f<20;f++){const i=f*6;uvs[i]=.5;uvs[i+1]=1;uvs[i+2]=0;uvs[i+3]=0;uvs[i+4]=1;uvs[i+5]=0}
geo.setAttribute('uv',new THREE.BufferAttribute(uvs,2));
geo.clearGroups();for(let f=0;f<20;f++)geo.addGroup(f*3,3,f);

const mats=[];for(let f=0;f<20;f++)mats.push(new THREE.MeshStandardMaterial({map:createFaceTex(f+1),metalness:.5,roughness:.35,flatShading:true}));

const die=new THREE.Mesh(geo,mats);scene.add(die);
const eg=new THREE.EdgesGeometry(geo);die.add(new THREE.LineSegments(eg,new THREE.LineBasicMaterial({color:0xb48c3c})));

const pos=geo.getAttribute('position');
const camDir=camera.position.clone().normalize();
const LQUATS=[];
for(let f=0;f<20;f++){const i=f*3;
  const a=new THREE.Vector3(pos.getX(i),pos.getY(i),pos.getZ(i));
  const b=new THREE.Vector3(pos.getX(i+1),pos.getY(i+1),pos.getZ(i+1));
  const c=new THREE.Vector3(pos.getX(i+2),pos.getY(i+2),pos.getZ(i+2));
  const n=new THREE.Vector3().crossVectors(b.clone().sub(a),c.clone().sub(a)).normalize();
  LQUATS.push(new THREE.Quaternion().setFromUnitVectors(n,camDir));
}

const DURATION=2400;
const targetFace=${roll.roll - 1};
let animState='rolling',startTime=performance.now(),settled=false;

die.quaternion.set(Math.random()-.5,Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize();
const startQ=die.quaternion.clone();
const tgtQ=LQUATS[targetFace].clone();
const spins=2+Math.floor(Math.random()*3);
const axis=new THREE.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize();
const spinQ=new THREE.Quaternion().setFromAxisAngle(axis,Math.PI*2*spins);
const farQ=spinQ.clone().multiply(startQ);

function animate(now){
  requestAnimationFrame(animate);
  if(animState==='rolling'){
    const raw=Math.min((now-startTime)/DURATION,1);
    const t=1-Math.pow(1-raw,4);
    die.quaternion.slerpQuaternions(farQ,tgtQ,t);
    const bd=Math.max(0,1-raw*1.5);
    die.position.y=Math.abs(Math.sin(raw*Math.PI*4))*bd*.8;
    if(raw>=1){
      animState='settled';settled=true;
      die.quaternion.copy(tgtQ);die.position.y=0;
      showResult();
    }
  }
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);

function showResult(){
  const card=document.getElementById('card');
  card.classList.add('visible');
  document.getElementById('tapHint').textContent='Tap to continue';
  const type=card.dataset.type;
  card.className='result-card visible '+type;
  window.ReactNativeWebView.postMessage(JSON.stringify({type:'settled'}));
  if(type==='crit'){
    const flash=document.getElementById('screenFlash');
    flash.classList.remove('fire');void flash.offsetWidth;flash.classList.add('fire');
    const bc=document.getElementById('burstContainer');bc.innerHTML='';
    for(let i=0;i<24;i++){const angle=(i/24)*Math.PI*2,dist=60+Math.random()*40;
      const p=document.createElement('div');p.className='burst-particle';
      p.style.setProperty('--bx',Math.cos(angle)*dist+'px');
      p.style.setProperty('--by',Math.sin(angle)*dist+'px');
      p.style.width=(3+Math.random()*4)+'px';p.style.height=p.style.width;
      bc.appendChild(p);requestAnimationFrame(()=>p.classList.add('fire'))}
  }
}

document.body.addEventListener('click',()=>{
  if(settled)window.ReactNativeWebView.postMessage(JSON.stringify({type:'complete'}));
  else{animState='settled';settled=true;die.quaternion.copy(tgtQ);die.position.y=0;showResult()}
});
</script></body></html>`;
}

// ─── Component ─────────────────────────────────────────────

export function DiceOverlay3D({ roll, onComplete }: DiceOverlay3DProps) {
  const [settled, setSettled] = useState(false);
  const hapticsEnabled = useSettingsStore((s) => s.accessibility.hapticFeedback);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    overlayOpacity.value = withTiming(1, { duration: 200 });
  }, []);

  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'settled') {
        setSettled(true);
        if (hapticsEnabled) {
          if (roll.isCritical) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 250);
          } else if (roll.success) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }
      } else if (data.type === 'complete') {
        onComplete();
      }
    } catch {}
  }, [roll, hapticsEnabled, onComplete]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const html = buildDiceHTML(roll);

  return (
    <Animated.View style={[styles.overlay, overlayStyle]}>
      <WebView
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        backgroundColor="transparent"
        onMessage={handleMessage}
        javaScriptEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    zIndex: 100,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
