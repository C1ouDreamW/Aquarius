
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

// Clean Database Name
const DB_NAME = "GrandTreeDB_v17_Clean";
const EXPORTED_DATA = null;

let CONFIG = {
  colors: { bg: 0x000000, champagneGold: 0xffd966, deepGreen: 0x03180a, accentRed: 0x990000 },
  particles: { count: 1500, dustCount: 2500, treeHeight: 24, treeRadius: 8 },
  snow: { count: 1500, range: 70, speed: 3.5, sizeBase: 0.12, sizeVar: 0.1 },
  camera: { z: 50 },
  interaction: { rotationSpeed: 1.4, grabRadius: 0.25 }
};

const STATE = { mode: 'TREE', focusTarget: null, focusType: 0, hand: { detected: false, x: 0, y: 0 }, rotation: { x: 0, y: 0 }, uiVisible: false, cameraVisible: true };
let manualRotateState = { x: 0, y: 0 };
const FONT_STYLES = { 'style1': { font: "'Ma Shan Zheng', cursive", spacing: "4px", shadow: "2px 2px 8px rgba(180,50,50,0.8)", transform: "none" }, 'style2': { font: "'Cinzel', serif", spacing: "6px", shadow: "0 0 20px rgba(255,215,0,0.5)", transform: "none" }, 'style3': { font: "'Great Vibes', cursive", spacing: "1px", shadow: "0 0 15px rgba(255,200,255,0.7)", transform: "none" }, 'style4': { font: "'Monoton', cursive", spacing: "1px", shadow: "0 0 10px #fff", transform: "none" }, 'style5': { font: "'Abril Fatface', cursive", spacing: "0px", shadow: "0 5px 15px rgba(0,0,0,0.8)", transform: "none" } };

let db;
function initDB() { if (EXPORTED_DATA) return Promise.resolve(null); return new Promise(r => { const q = indexedDB.open(DB_NAME, 1); q.onupgradeneeded = e => { const d = e.target.result; if (!d.objectStoreNames.contains('photos')) d.createObjectStore('photos', { keyPath: "id" }); if (!d.objectStoreNames.contains('music')) d.createObjectStore('music', { keyPath: "id" }) }; q.onsuccess = e => { db = e.target.result; r(db) }; q.onerror = () => r(null) }); }
function savePhotoToDB(b) { if (!db) return null; const t = db.transaction('photos', "readwrite"); const i = Date.now() + Math.random().toString(); t.objectStore('photos').add({ id: i, data: b }); return i; }
function loadPhotosFromDB() { if (EXPORTED_DATA) return Promise.resolve(EXPORTED_DATA.photos || []); if (!db) return Promise.resolve([]); return new Promise(r => { db.transaction('photos', "readonly").objectStore('photos').getAll().onsuccess = e => r(e.target.result) }); }
function deletePhotoFromDB(i) { if (db) db.transaction('photos', "readwrite").objectStore('photos').delete(i); }
function clearPhotosDB() { if (db) db.transaction('photos', "readwrite").objectStore('photos').clear(); }
function saveMusicToDB(b) { if (!db) return; const t = db.transaction('music', "readwrite"); t.objectStore('music').put({ id: 'bgm', data: b }); }
function loadMusicFromDB() { if (EXPORTED_DATA && EXPORTED_DATA.music) return Promise.resolve(dataURLtoBlob(EXPORTED_DATA.music)); if (!db) return Promise.resolve(null); return new Promise(r => { db.transaction('music', "readonly").objectStore('music').get('bgm').onsuccess = e => r(e.target.result ? e.target.result.data : null) }); }
function dataURLtoBlob(dataurl) { var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1], bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n); while (n--) { u8arr[n] = bstr.charCodeAt(n); } return new Blob([u8arr], { type: mime }); }

let scene, camera, renderer, composer, mainGroup, particleSystem = [], photoMeshGroup = new THREE.Group(), snowInstancedMesh, snowDummy = new THREE.Object3D(), snowData = [], clock = new THREE.Clock(), handLandmarker, videoElement, caneTexture, bgmAudio = new Audio(); bgmAudio.loop = true; let isMusicPlaying = false;
let textGroup; // 用来装文字和周围粒子的容器
let textSprite; // 文字本体
let envMaterials = [];
async function init() {
  if (EXPORTED_DATA) {
    document.body.classList.add('exported-mode');
    CONFIG = EXPORTED_DATA.config;
    setTimeout(() => applyTextConfig(EXPORTED_DATA.text.fontKey, EXPORTED_DATA.text.line1, EXPORTED_DATA.text.line2, EXPORTED_DATA.text.size, EXPORTED_DATA.text.color), 100);
  }

  initThree(); setupEnvironment(); setupLights(); createTextures(); createParticles(); createDust(); createSnow();
  // createDefaultPhotos();
  createCenterText();
  setupPostProcessing(); setupEvents(); animate();

  const loader = document.getElementById('loader');
  if (loader) { loader.style.opacity = 0; setTimeout(() => loader.remove(), 500); }

  try {
    await initDB();
    if (!EXPORTED_DATA) loadTextConfig();

    const ps = await loadPhotosFromDB();
    if (ps?.length > 0) { photoMeshGroup.clear(); particleSystem = particleSystem.filter(p => p.type !== 'PHOTO'); ps.forEach(i => createPhotoTexture(i.data, i.id)); }

    const ms = await loadMusicFromDB();
    if (ms) { bgmAudio.src = URL.createObjectURL(ms); if (EXPORTED_DATA) { document.body.addEventListener('click', () => { if (!isMusicPlaying) toggleMusicPlay(); }, { once: true }); } updatePlayBtnUI(false); }
  } catch (e) { console.warn(e); }

  initMediaPipe();
  initDraggableTitle();

  setMode('TREE');
}

function initDraggableTitle() { const t = document.getElementById('title-container'); let d = false, o = { x: 0, y: 0 }; t.onmousedown = e => { d = true; const r = t.getBoundingClientRect(); o.x = e.clientX - r.left; o.y = e.clientY - r.top; t.style.transform = 'none'; t.style.left = r.left + 'px'; t.style.top = r.top + 'px' }; window.onmousemove = e => { if (d) { t.style.left = (e.clientX - o.x) + 'px'; t.style.top = (e.clientY - o.y) + 'px' } }; window.onmouseup = () => d = false; }
window.toggleUI = () => { STATE.uiVisible = !STATE.uiVisible; document.getElementById('left-sidebar').classList.toggle('panel-hidden', !STATE.uiVisible); document.querySelector('.bottom-left-panel').classList.toggle('panel-hidden', !STATE.uiVisible); };
window.toggleCameraDisplay = () => { STATE.cameraVisible = !STATE.cameraVisible; document.getElementById('webcam-wrapper').classList.toggle('camera-hidden', !STATE.cameraVisible); };
window.toggleFullScreen = () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); };
function loadTextConfig() {
  const s = JSON.parse(localStorage.getItem('v16_text_config'));
  if (s) {
    document.getElementById('input-line1').value = s.line1 || "";
    document.getElementById('input-line2').value = s.line2 || "";
    document.getElementById('font-select').value = s.fontKey || "style1";
    document.getElementById('slider-fontsize').value = s.size || 100;
    document.getElementById('color-picker').value = s.color || "#fceea7";
    applyTextConfig(s.fontKey, s.line1, s.line2, s.size, s.color);
  }
  else {
    document.getElementById('input-line1').value = "Merry";
    document.getElementById('input-line2').value = "Christmas";
    applyTextConfig("style1", "Merry", "Christmas", 100, "#fceea7");
  }
}
window.updateTextConfig = () => { const k = document.getElementById('font-select').value, l1 = document.getElementById('input-line1').value, l2 = document.getElementById('input-line2').value, s = document.getElementById('slider-fontsize').value, c = document.getElementById('color-picker').value; localStorage.setItem('v16_text_config', JSON.stringify({ fontKey: k, line1: l1, line2: l2, size: s, color: c })); applyTextConfig(k, l1, l2, s, c); };
function applyTextConfig(k, l1, l2, s, c) { const st = FONT_STYLES[k] || FONT_STYLES['style1']; const t1 = document.getElementById('display-line1'), t2 = document.getElementById('display-line2'), ct = document.getElementById('title-container'); ct.style.fontFamily = st.font; t1.innerText = l1; t2.innerText = l2; t1.style.letterSpacing = st.spacing; t2.style.letterSpacing = st.spacing; t1.style.textShadow = st.shadow; t2.style.textShadow = st.shadow; t1.style.textTransform = st.transform; t2.style.textTransform = st.transform; t1.style.color = c; t2.style.color = c; t1.style.fontSize = (0.48 * s) + "px"; t2.style.fontSize = (0.48 * s) + "px"; }

window.toggleMusicPlay = () => { if (!bgmAudio.src) return alert("请先上传音乐"); if (isMusicPlaying) { bgmAudio.pause(); isMusicPlaying = false; } else { bgmAudio.play(); isMusicPlaying = true; } updatePlayBtnUI(isMusicPlaying); };
window.replayMusic = () => { if (!bgmAudio.src) return; bgmAudio.currentTime = 0; bgmAudio.play(); isMusicPlaying = true; updatePlayBtnUI(true); };
window.updateVolume = (v) => { bgmAudio.volume = v / 100; };
function updatePlayBtnUI(p) { document.getElementById('play-btn').innerText = p ? "⏸" : "⏯"; }

window.updateRotationSpeed = (v) => { CONFIG.interaction.rotationSpeed = parseFloat(v); };

// window.setMode = function (mode) {
//   STATE.mode = mode;
//   STATE.focusTarget = null;
//   const hint = document.getElementById('gesture-hint');
//   if (mode === 'TREE') hint.innerText = "状态: 聚合 (圣诞树)";
//   else if (mode === 'SCATTER') hint.innerText = "状态: 散开 (星云)";
//   else if (mode === 'FOCUS') hint.innerText = "状态: 抓取照片";
// }

window.setMode = function (mode) {
  STATE.mode = mode;
  STATE.focusTarget = null;

  const hint = document.getElementById('gesture-hint');
  // === 新增：获取文字元素 ===
  const centerMsg = document.getElementById('center-message');

  if (mode === 'TREE') {
    hint.innerText = "";
    // 聚合时，隐藏中心文字
    if (centerMsg) centerMsg.classList.remove('active');
  }
  else if (mode === 'SCATTER') {
    hint.innerText = "";
    // 散开时，显示中心文字
    if (centerMsg) centerMsg.classList.add('active');
  }
  else if (mode === 'FOCUS') {
    hint.innerText = "";
    // 抓取照片时，也可以选择显示或隐藏，这里建议保持显示，避免闪烁
    if (centerMsg) centerMsg.classList.add('active');
  }
}

window.triggerPhotoGrab = () => {
  let cp = null, md = Infinity;
  STATE.focusType = Math.floor(Math.random() * 4);
  particleSystem.filter(p => p.type === 'PHOTO').forEach(p => {
    p.mesh.updateMatrixWorld();
    const pos = new THREE.Vector3();
    p.mesh.getWorldPosition(pos);
    const sp = pos.project(camera);
    const d = Math.hypot(sp.x, sp.y);
    if (sp.z < 1 && d < CONFIG.interaction.grabRadius) {
      if (d < md) { md = d; cp = p.mesh; }
    }
  });

  if (cp) {
    setMode('FOCUS');
    STATE.focusTarget = cp;
  } else {
    setMode('SCATTER');
  }
};

window.startRotate = (d) => { if (d === 'up') manualRotateState.x = -1; if (d === 'down') manualRotateState.x = 1; if (d === 'left') manualRotateState.y = -1; if (d === 'right') manualRotateState.y = 1; };
window.stopRotate = () => { manualRotateState = { x: 0, y: 0 }; };
window.resetRotation = () => { STATE.rotation = { x: 0, y: 0 }; if (STATE.mode !== 'TREE') setMode('TREE'); };

window.setupEvents = function () {
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  });

  document.getElementById('file-input').addEventListener('change', (e) => {
    const files = e.target.files; if (!files.length) return;
    Array.from(files).forEach(f => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target.result;
        const id = savePhotoToDB(base64);
        createPhotoTexture(base64, id);
      }
      reader.readAsDataURL(f);
    });
  });
  document.getElementById('music-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      saveMusicToDB(file);
      bgmAudio.src = URL.createObjectURL(file);
      bgmAudio.play().then(() => { isMusicPlaying = true; updatePlayBtnUI(true); }).catch(console.error);
    }
  });

  // 添加点击事件处理，实现点击圣诞树切换模式
  const canvasContainer = document.getElementById('canvas-container');
  canvasContainer.addEventListener('click', () => {
    if (STATE.mode === 'TREE') {
      setMode('SCATTER');
    } else if (STATE.mode === 'SCATTER') {
      setMode('TREE');
    }
  });

}


function initThree() { const c = document.getElementById('canvas-container'); scene = new THREE.Scene(); scene.background = new THREE.Color(CONFIG.colors.bg); scene.fog = new THREE.FogExp2(CONFIG.colors.bg, 0.01); camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 1000); camera.position.set(0, 2, CONFIG.camera.z); renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" }); renderer.setSize(window.innerWidth, window.innerHeight); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.toneMapping = THREE.ReinhardToneMapping; renderer.toneMappingExposure = 2.2; c.appendChild(renderer.domElement); mainGroup = new THREE.Group(); scene.add(mainGroup); }
function setupEnvironment() { const p = new THREE.PMREMGenerator(renderer); scene.environment = p.fromScene(new RoomEnvironment(), 0.04).texture; }
function setupLights() { scene.add(new THREE.AmbientLight(0xffffff, 0.6)); const i = new THREE.PointLight(0xffaa00, 2, 20); i.position.set(0, 5, 0); mainGroup.add(i); const s1 = new THREE.SpotLight(0xffcc66, 1200); s1.position.set(30, 40, 40); s1.angle = 0.5; s1.penumbra = 0.5; scene.add(s1); const s2 = new THREE.SpotLight(0x6688ff, 600); s2.position.set(-30, 20, -30); scene.add(s2); const f = new THREE.DirectionalLight(0xffeebb, 0.8); f.position.set(0, 0, 50); scene.add(f); }
function setupPostProcessing() { const r = new RenderPass(scene, camera); const b = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85); b.threshold = 0.7; b.strength = 0.45; b.radius = 0.4; composer = new EffectComposer(renderer); composer.addPass(r); composer.addPass(b); }
function createTextures() { const c = document.createElement('canvas'); c.width = 128; c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#ffffff'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#880000'; x.beginPath(); for (let i = -128; i < 256; i += 32) { x.moveTo(i, 0); x.lineTo(i + 32, 128); x.lineTo(i + 16, 128); x.lineTo(i - 16, 0); } x.fill(); caneTexture = new THREE.CanvasTexture(c); caneTexture.wrapS = caneTexture.wrapT = THREE.RepeatWrapping; caneTexture.repeat.set(3, 3); }

window.updateSnowSettings = () => { CONFIG.snow.sizeBase = parseFloat(document.getElementById('slider-snow-size').value); CONFIG.snow.count = parseInt(document.getElementById('slider-snow-count').value); createSnow(); };
window.updateSnowSpeed = (v) => { CONFIG.snow.speed = parseFloat(v); };
function createSnow() {
  if (snowInstancedMesh) { scene.remove(snowInstancedMesh); snowInstancedMesh.geometry.dispose(); snowInstancedMesh.material.dispose(); snowInstancedMesh = null; snowData = []; }
  if (CONFIG.snow.count <= 0) return;
  const g = new THREE.IcosahedronGeometry(CONFIG.snow.sizeBase, 0);
  const m = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.15, transmission: 0.9, thickness: 0.5, envMapIntensity: 1.5, clearcoat: 1, clearcoatRoughness: 0.1, ior: 1.33 });
  snowInstancedMesh = new THREE.InstancedMesh(g, m, CONFIG.snow.count); snowInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  for (let i = 0; i < CONFIG.snow.count; i++) {
    snowDummy.position.set((Math.random() - 0.5) * CONFIG.snow.range, Math.random() * CONFIG.snow.range, (Math.random() - 0.5) * CONFIG.snow.range);
    snowDummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    const s = 0.5 + Math.random() * CONFIG.snow.sizeVar; snowDummy.scale.set(s, s, s); snowDummy.updateMatrix();
    snowInstancedMesh.setMatrixAt(i, snowDummy.matrix);
    snowData.push({ vy: (Math.random() * 0.5 + 0.8), rx: (Math.random() - 0.5) * 2, ry: (Math.random() - 0.5) * 2, rz: (Math.random() - 0.5) * 2 });
  } scene.add(snowInstancedMesh);
}

class Particle {
  constructor(m, t, d = false) { this.mesh = m; this.type = t; this.isDust = d; this.posTree = new THREE.Vector3(); this.posScatter = new THREE.Vector3(); this.baseScale = m.scale.x; this.photoId = null; const s = (t === 'PHOTO') ? 0.3 : 2.0; this.spinSpeed = new THREE.Vector3((Math.random() - 0.5) * s, (Math.random() - 0.5) * s, (Math.random() - 0.5) * s); this.calcPos(); }
  calcPos() { const h = CONFIG.particles.treeHeight; let t = Math.pow(Math.random(), 0.8); const y = (t * h) - (h / 2); let rm = Math.max(0.5, CONFIG.particles.treeRadius * (1.0 - t)); const a = t * 50 * Math.PI + Math.random() * Math.PI; const r = rm * (0.8 + Math.random() * 0.4); this.posTree.set(Math.cos(a) * r, y, Math.sin(a) * r); let rs = this.isDust ? (12 + Math.random() * 20) : (8 + Math.random() * 12); const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1); this.posScatter.set(rs * Math.sin(ph) * Math.cos(th), rs * Math.sin(ph) * Math.sin(th), rs * Math.cos(ph)); }
  update(dt, mode, ft) {
    let tg = this.posTree; if (mode === 'SCATTER') tg = this.posScatter; else if (mode === 'FOCUS') { if (this.mesh === ft) { let off = new THREE.Vector3(0, 1, 38); if (STATE.focusType === 1) off.set(-4, 2, 35); else if (STATE.focusType === 2) off.set(3, 0, 32); else if (STATE.focusType === 3) off.set(0, -2.5, 30); const im = new THREE.Matrix4().copy(mainGroup.matrixWorld).invert(); tg = off.applyMatrix4(im); } else tg = this.posScatter; }
    const ls = (mode === 'FOCUS' && this.mesh === ft) ? 8.0 : 4.0; this.mesh.position.lerp(tg, ls * dt);
    if (mode === 'SCATTER') { this.mesh.rotation.x += this.spinSpeed.x * dt; this.mesh.rotation.y += this.spinSpeed.y * dt; this.mesh.rotation.z += this.spinSpeed.z * dt; } else if (mode === 'TREE') { this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, 0, dt); this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, 0, dt); this.mesh.rotation.y += 0.5 * dt; }
    if (mode === 'FOCUS' && this.mesh === ft) { this.mesh.lookAt(camera.position); if (STATE.focusType === 1) this.mesh.rotateZ(0.38); if (STATE.focusType === 2) this.mesh.rotateZ(-0.15); if (STATE.focusType === 3) this.mesh.rotateX(-0.4); }
    let s = this.baseScale; if (this.isDust) { s = this.baseScale * (0.8 + 0.4 * Math.sin(clock.elapsedTime * 4 + this.mesh.id)); if (mode === 'TREE') s = 0; } else if (mode === 'SCATTER' && this.type === 'PHOTO') s = this.baseScale * 2.5; else if (mode === 'FOCUS') { if (this.mesh === ft) { if (STATE.focusType === 2) s = 3.5; else if (STATE.focusType === 3) s = 4.8; else s = 3.0; } else s = this.baseScale * 0.8; } this.mesh.scale.lerp(new THREE.Vector3(s, s, s), 6 * dt);
  }
}

function createParticles() {
  // 1. 定义几何体
  const sg = new THREE.SphereGeometry(0.5, 32, 32);
  const bg = new THREE.BoxGeometry(0.55, 0.55, 0.55);
  // 拐杖糖形状
  const c = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.5, 0),
    new THREE.Vector3(0, 0.3, 0),
    new THREE.Vector3(0.1, 0.5, 0),
    new THREE.Vector3(0.3, 0.4, 0)
  ]);
  const cg = new THREE.TubeGeometry(c, 16, 0.08, 8, false);

  // 2. 定义材质 (关键修改：开启 transparent 并加入 envMaterials 列表)

  // 金色材质
  const gm = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.champagneGold,
    metalness: 1,
    roughness: 0.1,
    envMapIntensity: 2,
    emissive: 0x443300,
    emissiveIntensity: 0.3,
    transparent: true // <--- 关键修改：开启透明
  });

  // 绿色材质
  const grm = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.deepGreen,
    metalness: 0.2,
    roughness: 0.8,
    emissive: 0x002200,
    emissiveIntensity: 0.2,
    transparent: true // <--- 关键修改
  });

  // 红色材质
  const rm = new THREE.MeshPhysicalMaterial({
    color: CONFIG.colors.accentRed,
    metalness: 0.3,
    roughness: 0.2,
    clearcoat: 1,
    emissive: 0x330000,
    transparent: true // <--- 关键修改
  });

  // 拐杖糖材质
  const cm = new THREE.MeshStandardMaterial({
    map: caneTexture,
    roughness: 0.4,
    transparent: true // <--- 关键修改
  });

  // === 关键步骤：将材质加入全局列表 ===
  // 这样 animate 函数里的逻辑才能控制它们变淡
  envMaterials.push(gm, grm, rm, cm);

  // 3. 生成粒子 Mesh (原有逻辑)
  for (let i = 0; i < CONFIG.particles.count; i++) {
    const r = Math.random();
    let m, t;
    if (r < 0.4) { m = new THREE.Mesh(bg, grm); t = 'BOX'; }
    else if (r < 0.7) { m = new THREE.Mesh(bg, gm); t = 'GOLD_BOX'; }
    else if (r < 0.92) { m = new THREE.Mesh(sg, gm); t = 'GOLD_SPHERE'; }
    else if (r < 0.97) { m = new THREE.Mesh(sg, rm); t = 'RED'; }
    else { m = new THREE.Mesh(cg, cm); t = 'CANE'; }

    const s = 0.4 + Math.random() * 0.5;
    m.scale.set(s, s, s);
    m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    mainGroup.add(m);
    particleSystem.push(new Particle(m, t, false));
  }

  // 4. 树顶星星 (顺便也加上透明控制，保证整体一致)
  const starMat = new THREE.MeshStandardMaterial({
    color: 0xffdd88,
    emissive: 0xffaa00,
    emissiveIntensity: 1,
    metalness: 1,
    roughness: 0,
    transparent: true // <--- 关键修改
  });
  envMaterials.push(starMat); // 加入控制列表

  const st = new THREE.Mesh(new THREE.OctahedronGeometry(1.2, 0), starMat);
  st.position.set(0, CONFIG.particles.treeHeight / 2 + 1.2, 0);
  mainGroup.add(st);

  mainGroup.add(photoMeshGroup);
}
function createDust() {
  const geo = new THREE.TetrahedronGeometry(0.08, 0);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffeebb,
    transparent: true,
    opacity: 0.8,
  });

  envMaterials.push(mat);

  for (let i = 0; i < CONFIG.particles.dustCount; i++) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.setScalar(0.5 + Math.random());
    mainGroup.add(mesh);
    particleSystem.push(new Particle(mesh, 'DUST', true));
  }
}
function createDefaultPhotos() { const c = document.createElement('canvas'); c.width = 512; c.height = 512; const x = c.getContext('2d'); x.fillStyle = '#050505'; x.fillRect(0, 0, 512, 512); x.strokeStyle = '#eebb66'; x.lineWidth = 15; x.strokeRect(20, 20, 472, 472); x.font = '500 60px Times New Roman'; x.fillStyle = '#eebb66'; x.textAlign = 'center'; x.fillText("JOYEUX", 256, 230); x.fillText("NOEL", 256, 300); createPhotoTexture(c.toDataURL(), 'default'); }
function createCenterText() {
  textGroup = new THREE.Group();

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 1024;
  canvas.height = 512;

  const line1 = "朱铭";
  const line2 = "圣诞节快乐";

  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = 15;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;

  ctx.textAlign = "center";

  // 第一行字
  ctx.font = "bold 200px 'Times New Roman', serif";
  ctx.fillStyle = "#ffeebb";
  ctx.fillText(line1, 512, 180);

  ctx.font = "italic 150px 'Times New Roman', serif";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.3)"; // 轻微的黑色描边
  ctx.lineWidth = 8;
  ctx.strokeText(line2, 512, 340);

  ctx.fillStyle = "#ffffff";
  ctx.fillText(line2, 512, 340);

  ctx.shadowColor = "rgba(255, 200, 50, 0.8)"; // 金色发光
  ctx.shadowBlur = 30;
  ctx.fillText(line2, 512, 340); // 重叠画一次产生光晕

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    // blending: THREE.AdditiveBlending
  });

  textSprite = new THREE.Sprite(mat);
  textSprite.scale.set(12, 6, 1);
  textGroup.add(textSprite);

  // 光环
  const geo = new THREE.BufferGeometry();
  const pos = [];
  const colors = [];
  const color1 = new THREE.Color(0xffd700); // 金色
  const color2 = new THREE.Color(0xffffff); // 白色点缀

  for (let i = 0; i < 120; i++) {
    const r = 6.5 + Math.random() * 4;
    const theta = Math.random() * Math.PI * 2;
    const phi = (Math.random() - 0.5) * 1.2;

    pos.push(
      r * Math.cos(theta),
      r * Math.sin(phi) * 0.6,
      r * Math.sin(theta)
    );

    // 随机混一点白色粒子
    const c = Math.random() > 0.7 ? color2 : color1;
    colors.push(c.r, c.g, c.b);
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const starMat = new THREE.PointsMaterial({
    vertexColors: true, // 启用顶点颜色
    size: 0.2,          // 稍微大一点点
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    map: getDiscTexture() // 使用圆形纹理，让粒子更圆润
  });

  const auraStars = new THREE.Points(geo, starMat);
  auraStars.name = "aura";
  textGroup.add(auraStars);

  mainGroup.add(textGroup);
}

function getDiscTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 32);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}
function createPhotoTexture(b, id) { const i = new Image(); i.src = b; i.onload = () => { const t = new THREE.Texture(i); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; addPhotoToScene(t, id, i); } }
function addPhotoToScene(t, id, imgObj) {
  const aspect = imgObj.width / imgObj.height; let w = 1.2, h = 1.2; if (aspect > 1) h = w / aspect; else w = h * aspect;
  const fg = new THREE.BoxGeometry(w + 0.2, h + 0.2, 0.05); const fm = new THREE.MeshStandardMaterial({ color: 0xc5a059, metalness: 0.6, roughness: 0.5, envMapIntensity: 0.5 }); const f = new THREE.Mesh(fg, fm); const pg = new THREE.PlaneGeometry(w, h); const pm = new THREE.MeshBasicMaterial({ map: t }); const p = new THREE.Mesh(pg, pm); p.position.z = 0.04; const g = new THREE.Group(); g.add(f); g.add(p); const s = 0.8; g.scale.set(s, s, s); photoMeshGroup.add(g); const pt = new Particle(g, 'PHOTO', false); pt.photoId = id; pt.texture = t; particleSystem.push(pt);
}
window.applyParticleSettings = () => { const ph = particleSystem.filter(p => p.type === 'PHOTO'); const tr = []; mainGroup.children.forEach(c => { if (c !== photoMeshGroup) tr.push(c) }); tr.forEach(c => mainGroup.remove(c)); particleSystem = [...ph]; CONFIG.particles.count = parseInt(document.getElementById('slider-tree').value); CONFIG.particles.dustCount = parseInt(document.getElementById('slider-dust').value); createParticles(); createDust(); createSnow(); };

async function initMediaPipe() { videoElement = document.getElementById('webcam-video'); if (navigator.mediaDevices?.getUserMedia) { try { const s = await navigator.mediaDevices.getUserMedia({ video: true }); videoElement.srcObject = s; videoElement.onloadedmetadata = () => { videoElement.play(); renderWebcamPreview() }; } catch (e) { console.error(e) } } try { const v = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"); handLandmarker = await HandLandmarker.createFromOptions(v, { baseOptions: { modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`, delegate: "GPU" }, runningMode: "VIDEO", numHands: 1 }); predictWebcam(); } catch (e) { console.warn(e) } }
function renderWebcamPreview() { const c = document.getElementById('webcam-canvas'), x = c.getContext('2d', { willReadFrequently: true }); function d() { if (videoElement.readyState >= 2) x.drawImage(videoElement, 0, 0, c.width, c.height); requestAnimationFrame(d) } d() }
let lvt = -1; async function predictWebcam() { if (videoElement && videoElement.currentTime !== lvt && handLandmarker) { lvt = videoElement.currentTime; const r = handLandmarker.detectForVideo(videoElement, performance.now()); processGestures(r); document.getElementById('cam-status').classList.toggle('active', r.landmarks.length > 0); } requestAnimationFrame(predictWebcam); }
function processGestures(r) { if (r.landmarks && r.landmarks.length > 0) { STATE.hand.detected = true; const lm = r.landmarks[0]; STATE.hand.x = (lm[9].x - 0.5) * 2; STATE.hand.y = (lm[9].y - 0.5) * 2; const thumb = lm[4], index = lm[8], wrist = lm[0], middle = lm[12]; const pd = Math.hypot(thumb.x - index.x, thumb.y - index.y); const od = Math.hypot(middle.x - wrist.x, middle.y - wrist.y); if (STATE.mode === 'FOCUS') { if (pd > 0.1) setMode('SCATTER'); return; } if (pd < 0.05 && STATE.mode !== 'FOCUS') triggerPhotoGrab(); else if (od > 0.4) setMode('SCATTER'); else if (od < 0.2) setMode('TREE'); } else STATE.hand.detected = false; }

window.setupEvents = () => {
  window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); composer.setSize(window.innerWidth, window.innerHeight) });
  document.getElementById('file-input').addEventListener('change', e => { Array.from(e.target.files).forEach(f => { const r = new FileReader(); r.onload = ev => { const i = new Image(); i.src = ev.target.result; i.onload = () => { const id = savePhotoToDB(ev.target.result); createPhotoTexture(ev.target.result, id) } }; r.readAsDataURL(f) }) });
  document.getElementById('music-input').addEventListener('change', e => { const f = e.target.files[0]; if (f) { saveMusicToDB(f); bgmAudio.src = URL.createObjectURL(f); bgmAudio.play().then(() => { isMusicPlaying = true; updatePlayBtnUI(true) }).catch(console.error) } });

  // 点击事件处理 - 点击圣诞树场景时触发功能
  const canvasContainer = document.getElementById('canvas-container');
  canvasContainer.addEventListener('click', () => {
    // 根据当前模式切换状态
    if (STATE.mode === 'TREE') {
      setMode('SCATTER');
    } else {
      setMode('TREE');
    }
  });

  // 键盘交互
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    const code = e.code;
    const k = e.key.toLowerCase();

    if (k === 'h') window.toggleUI();
    if (code === 'Space') { e.preventDefault(); setMode('TREE'); }
    if (k === 'z') setMode('SCATTER');
    if (k === 'x') triggerPhotoGrab();

    if (code === 'ArrowUp') manualRotateState.x = -1;
    if (code === 'ArrowDown') manualRotateState.x = 1;
    if (code === 'ArrowLeft') manualRotateState.y = -1;
    if (code === 'ArrowRight') manualRotateState.y = 1;
  });
  window.addEventListener('keyup', (e) => {
    const code = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) manualRotateState = { x: 0, y: 0 };
  });
}
window.openDeleteManager = async () => { document.getElementById('delete-manager').classList.remove('hidden'); const g = document.getElementById('photo-grid'); g.innerHTML = ''; const ps = await loadPhotosFromDB(); if (!ps || ps.length === 0) g.innerHTML = '<div style="color:#888;">暂无照片</div>'; else ps.forEach(p => { const d = document.createElement('div'); d.className = 'photo-item'; const i = document.createElement('img'); i.className = 'photo-thumb'; i.src = p.data; const b = document.createElement('div'); b.className = 'delete-x'; b.innerText = 'X'; b.onclick = e => { e.stopPropagation(); confirmDelete(p.id, d) }; d.appendChild(i); d.appendChild(b); g.appendChild(d) }) }
window.confirmDelete = (id, el) => { deletePhotoFromDB(id); el.remove(); const p = particleSystem.find(pa => pa.photoId === id); if (p) { photoMeshGroup.remove(p.mesh); particleSystem.splice(particleSystem.indexOf(p), 1) } }
window.clearAllPhotos = () => { if (confirm("确定要清空所有照片吗？")) { clearPhotosDB(); particleSystem.filter(p => p.type === 'PHOTO').forEach(p => photoMeshGroup.remove(p.mesh)); particleSystem = particleSystem.filter(p => p.type !== 'PHOTO'); window.openDeleteManager() } }
window.closeDeleteManager = () => { document.getElementById('delete-manager').classList.add('hidden') }

function animate() {
  requestAnimationFrame(animate); const dt = clock.getDelta(); const et = clock.getElapsedTime();
  if (snowInstancedMesh && STATE.mode === 'TREE') {
    snowInstancedMesh.visible = true;
    for (let i = 0; i < CONFIG.snow.count; i++) {
      snowInstancedMesh.getMatrixAt(i, snowDummy.matrix); snowDummy.matrix.decompose(snowDummy.position, snowDummy.quaternion, snowDummy.scale); const d = snowData[i];
      snowDummy.position.y -= d.vy * CONFIG.snow.speed * dt; snowDummy.position.x += Math.sin(et * 0.5 + i) * 2.5 * dt; snowDummy.position.z += Math.cos(et * 0.3 + i) * 1.5 * dt;
      snowDummy.rotation.x += d.rx * dt; snowDummy.rotation.y += d.ry * dt; snowDummy.rotation.z += d.rz * dt;
      if (snowDummy.position.y < -25) { snowDummy.position.y = 40; snowDummy.position.x = (Math.random() - 0.5) * CONFIG.snow.range; snowDummy.position.z = (Math.random() - 0.5) * CONFIG.snow.range; }
      snowDummy.updateMatrix(); snowInstancedMesh.setMatrixAt(i, snowDummy.matrix);
    } snowInstancedMesh.instanceMatrix.needsUpdate = true;
  } else if (snowInstancedMesh) snowInstancedMesh.visible = false;

  if (manualRotateState.x !== 0 || manualRotateState.y !== 0) { const s = CONFIG.interaction.rotationSpeed * 2.0; STATE.rotation.x += manualRotateState.x * s * dt; STATE.rotation.y += manualRotateState.y * s * dt; }
  else if (STATE.mode === 'SCATTER' && STATE.hand.detected) { const th = 0.3, s = CONFIG.interaction.rotationSpeed; if (STATE.hand.x > th) STATE.rotation.y -= s * dt * (STATE.hand.x - th); else if (STATE.hand.x < -th) STATE.rotation.y -= s * dt * (STATE.hand.x + th); if (STATE.hand.y < -th) STATE.rotation.x += s * dt * (-STATE.hand.y - th); else if (STATE.hand.y > th) STATE.rotation.x -= s * dt * (STATE.hand.y - th); }
  else { if (STATE.mode === 'TREE') { STATE.rotation.y += 0.3 * dt; STATE.rotation.x += (0 - STATE.rotation.x) * 2.0 * dt; } else STATE.rotation.y += 0.1 * dt; }

  mainGroup.rotation.y = STATE.rotation.y; mainGroup.rotation.x = STATE.rotation.x;
  particleSystem.forEach(p => p.update(dt, STATE.mode, STATE.focusTarget));

  const titleEl = document.getElementById('title-container');
  if (textGroup && textSprite) {
    const aura = textGroup.getObjectByName("aura");

    if (STATE.mode === 'SCATTER' || STATE.mode === 'FOCUS') {

      textSprite.material.opacity = THREE.MathUtils.lerp(textSprite.material.opacity, 1, dt * 1.5);
      if (aura) {
        aura.material.opacity = THREE.MathUtils.lerp(aura.material.opacity, 0.8, dt * 1.5);
        aura.rotation.y -= dt * 0.1; // 光环旋转
      }
      // 文字呼吸动画
      const s = 12 + Math.sin(clock.elapsedTime * 2) * 0.2;
      textSprite.scale.set(s, s * 0.5, 1);
      if (titleEl) {
        // 获取当前透明度，默认为1
        let currOp = titleEl.style.opacity === '' ? 1 : parseFloat(titleEl.style.opacity);
        titleEl.style.opacity = THREE.MathUtils.lerp(currOp, 0, dt * 3.0);
        if (currOp < 0.1) titleEl.style.pointerEvents = 'none';
      }

    }
    else {

      textSprite.material.opacity = THREE.MathUtils.lerp(textSprite.material.opacity, 0, dt * 4.0);
      if (aura) aura.material.opacity = THREE.MathUtils.lerp(aura.material.opacity, 0, dt * 4.0);
      if (titleEl) {
        let currOp = titleEl.style.opacity === '' ? 1 : parseFloat(titleEl.style.opacity);
        titleEl.style.opacity = THREE.MathUtils.lerp(currOp, 1, dt * 2.0);
        titleEl.style.pointerEvents = 'auto';
      }
    }
  }
  const targetEnvOpacity = (STATE.mode === 'SCATTER' || STATE.mode === 'FOCUS') ? 0.15 : 1.0;

  envMaterials.forEach(mat => {
    if (mat) {
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetEnvOpacity, dt * 2.0);
    }
  });
  composer.render();
}
init();