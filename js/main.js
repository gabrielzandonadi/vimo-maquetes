import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

import { SITE, PROPERTY } from './data.js';
import { TERRAIN } from './terrain.js';
import { buildApogeo, ORIENT, floorY } from './building.js';
import { buildContext, SEA_LEVEL } from './context.js';
import { sunPosition, sunVector, localToDate, sunTimes, fmtHour, compassName, TZ_OFFSET_H } from './sun.js';
import { SunAnalyzer } from './analysis.js';
import { CONFIG } from './config.js';
import { facadeTextures } from './facade.js';
import { PROJECT } from './projects/apogeo.js';
import { InteriorTour } from './interior.js';

// ======================================================================
// Utilidades
// ======================================================================
const $ = id => document.getElementById(id);
const LAT = SITE.origin.lat, LON = SITE.origin.lon;
const KX = 111320 * Math.cos(LAT * Math.PI / 180), KZ = 110574;
const toLatLon = (x, z) => ({ lat: LAT - z / KZ, lng: LON + x / KX });
const fromLatLon = (lat, lng) => ({ x: (lng - LON) * KX, z: -(lat - LAT) * KZ });
const bearingVec = b => new THREE.Vector3(Math.sin(b * Math.PI / 180), 0, -Math.cos(b * Math.PI / 180));
const bearingOf = v => (Math.atan2(v.x, -v.z) * 180 / Math.PI + 360) % 360;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const areaNum = s => parseFloat(String(s).replace(/[^\d,]/g, '').replace(',', '.')) || 0;
const priceNum = s => parseFloat(String(s).replace(/[^\d,]/g, '').replace(',', '.')) || 0;
const brl = n => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const brlShort = n => 'R$ ' + (n / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' mi';
const isAvail = u => /dispon/i.test(u.status);
const floorOf = name => Math.floor(parseInt(name, 10) / 100);
const fmtDur = min => { const h = Math.floor(min / 60), m = Math.round(min % 60); return h ? `${h}h${m ? String(m).padStart(2, '0') : ''}` : `${m}min`; };
const fmtDate = iso => iso.split('-').reverse().join('/');
const IMG = n => `assets/img/${n}.jpg`;
const WA_NUMBER = '+5527998485769';
const waLink = msg => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
const PLAN_BY_AREA = PROJECT.planImages;
const PLAN_SIMILAR = PROJECT.planSimilar;

function todayBRT() {
  const d = new Date(Date.now() + TZ_OFFSET_H * 3600e3);
  return d.toISOString().slice(0, 10);
}

const state = {
  date: todayBRT(),
  hour: 9.5,
  colorMode: 'real',
  nav: 'orbit',
  selected: null,
  hovered: null,
  pickSV: false,
  playing: false,
  sun: null,
  results: new Map(),
  analysisToken: 0,
};

// ======================================================================
// Renderer, cena, câmera
// ======================================================================
const stage = $('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 1.0;
stage.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
Object.assign(labelRenderer.domElement.style, { position: 'absolute', top: '0', left: '0', pointerEvents: 'none' });
stage.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 0.3, 30000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI / 2 - 0.03;
controls.minDistance = 8;
controls.maxDistance = 1400;
controls.screenSpacePanning = false;

// ======================================================================
// Entorno + edifício
// ======================================================================
const world = buildContext(SITE, TERRAIN, renderer);
scene.add(world.group);

const apogeo = buildApogeo(PROPERTY.units);
const [ux, uz] = SITE.ux;
apogeo.group.rotation.y = Math.atan2(-uz, ux);
apogeo.group.position.set(SITE.front[0], 0, SITE.front[1]);
scene.add(apogeo.group);
apogeo.group.updateMatrixWorld(true);
const L2W = (x, y, z) => apogeo.group.localToWorld(new THREE.Vector3(x, y, z));
const LOT_CENTER = L2W(-42, 0, 0);
const TOWER_C = L2W(-66, 0, 5);
const unitMeshes = apogeo.unitMeshes;
const unitByName = new Map(unitMeshes.map(m => [m.userData.unit.name, m]));

// ======================================================================
// Céu, sol, lua, estrelas, ambiente
// ======================================================================
const sky = new Sky();
sky.scale.setScalar(20000);
scene.add(sky);
const skyU = sky.material.uniforms;
skyU.turbidity.value = 5.5; skyU.rayleigh.value = 1.4; skyU.mieCoefficient.value = 0.004; skyU.mieDirectionalG.value = 0.86;

const pmrem = new THREE.PMREMGenerator(renderer);
const envScene = new THREE.Scene();
const envSky = new Sky(); envSky.scale.setScalar(1000); envScene.add(envSky);
let envRT = null, lastEnvSun = null, lastEnvTime = 0;
function updateEnv(dir, force) {
  const now = performance.now();
  if (!force && lastEnvSun && lastEnvSun.angleTo(dir) < 0.015) return;
  if (!force && now - lastEnvTime < 220) return;
  for (const k of ['turbidity', 'rayleigh', 'mieCoefficient', 'mieDirectionalG']) envSky.material.uniforms[k].value = skyU[k].value;
  envSky.material.uniforms.sunPosition.value.copy(dir);
  const old = envRT;
  envRT = pmrem.fromScene(envScene);
  scene.environment = envRT.texture;
  old?.dispose();
  lastEnvSun = dir.clone(); lastEnvTime = now;
}

const sunLight = new THREE.DirectionalLight(0xffffff, 3);
sunLight.castShadow = true;
function setShadowQuality(hq) {
  const s = hq ? 4096 : 2048;
  sunLight.shadow.mapSize.set(s, s);
  sunLight.shadow.map?.dispose(); sunLight.shadow.map = null;
}
setShadowQuality(true);
Object.assign(sunLight.shadow.camera, { left: -300, right: 300, top: 300, bottom: -300, near: 10, far: 2600 });
sunLight.shadow.camera.updateProjectionMatrix();
sunLight.shadow.bias = -0.0004;
sunLight.shadow.normalBias = 0.35;
scene.add(sunLight, sunLight.target);
const hemi = new THREE.HemisphereLight(0xcfe3ff, 0x8a7a63, 0.6);
scene.add(hemi);
const moon = new THREE.DirectionalLight(0x9db4ff, 0);
moon.position.set(-400, 600, 300);
scene.add(moon);

// estrelas
const starGeo = new THREE.BufferGeometry();
{
  const p = [];
  for (let i = 0; i < 2200; i++) {
    const u = Math.random(), v = Math.random() * 0.95 + 0.05;
    const th = u * Math.PI * 2, ph = Math.acos(v);
    p.push(Math.sin(ph) * Math.cos(th) * 9000, Math.cos(ph) * 9000, Math.sin(ph) * Math.sin(th) * 9000);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
}
const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false });
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

// pós-processamento (bloom só à noite)
// render em HDR com MSAA 4x + oclusão de ambiente (GTAO) + bloom noturno
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(256, 256, { type: THREE.HalfFloatType, samples: 4 }));
composer.addPass(new RenderPass(scene, camera));
const gtao = new GTAOPass(scene, camera, 256, 256);
gtao.output = GTAOPass.OUTPUT.Default;
gtao.blendIntensity = 0.85;
gtao.updateGtaoMaterial({ radius: 3.5, distanceExponent: 1.6, thickness: 2.5, scale: 1.2, samples: 16 });
gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
composer.addPass(gtao);
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0, 0.55, 0.82);
composer.addPass(bloom);
composer.addPass(new OutputPass());
// correção de cor de foto de arquitetura: contraste, saturação, leve calor e vinheta suave
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, contrast: { value: 1.07 }, saturation: { value: 1.1 }, warmth: { value: 0.025 }, vignette: { value: 0.18 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float contrast, saturation, warmth, vignette; varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      vec3 col = (c.rgb - 0.5) * contrast + 0.5;
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(l), col, saturation);
      col += vec3(warmth, warmth * 0.4, -warmth);
      vec2 d = vUv - 0.5; col *= 1.0 - vignette * dot(d, d) * 2.2;
      gl_FragColor = vec4(clamp(col, 0.0, 1.0), c.a);
    }`,
});
composer.addPass(grade);

// névoa atmosférica (perspectiva aérea) – cor acompanha o céu
scene.fog = new THREE.FogExp2(0xcfdbe6, 0.00042);

// ======================================================================
// Trajetória solar, anel de orientação, rótulos
// ======================================================================
const PATH_R = 240;
const sunPathGroup = new THREE.Group(); sunPathGroup.visible = false; scene.add(sunPathGroup); // trajetória do sol: desligada por padrão
const seasonGroup = new THREE.Group(); seasonGroup.visible = false; scene.add(seasonGroup);
const labelsGroup = new THREE.Group(); labelsGroup.visible = false; scene.add(labelsGroup); // nomes das ruas: desligados por padrão
const sunMarker = new THREE.Mesh(new THREE.SphereGeometry(7, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffd36b }));
sunMarker.add(new THREE.Mesh(new THREE.SphereGeometry(12, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffc04d, transparent: true, opacity: 0.25, depthWrite: false })));
sunPathGroup.add(sunMarker);
let sunPathDyn = null;

function label(text, cls = 'lbl') {
  const el = document.createElement('div');
  el.className = cls; el.textContent = text;
  return new CSS2DObject(el);
}

function arcPoints(iso) {
  const pts = [];
  for (let m = 0; m <= 1440; m += 5) {
    const p = sunPosition(localToDate(iso, m / 60), LAT, LON);
    if (p.elevation < -1) continue;
    const v = sunVector(p.azimuth, p.elevation);
    pts.push(new THREE.Vector3(v.x, v.y, v.z).multiplyScalar(PATH_R).add(LOT_CENTER));
  }
  return pts;
}

function buildSunPath() {
  if (sunPathDyn) { sunPathGroup.remove(sunPathDyn); sunPathDyn.traverse(o => { o.geometry?.dispose(); if (o.element) o.element.remove(); }); }
  sunPathDyn = new THREE.Group();
  const pts = arcPoints(state.date);
  if (pts.length > 1) {
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xffc04d, transparent: true, opacity: 0.9 }));
    sunPathDyn.add(line);
  }
  for (let h = 0; h < 24; h++) {
    const p = sunPosition(localToDate(state.date, h), LAT, LON);
    if (p.elevation < 0.5) continue;
    const v = sunVector(p.azimuth, p.elevation);
    const pos = new THREE.Vector3(v.x, v.y, v.z).multiplyScalar(PATH_R).add(LOT_CENTER);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(2, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffc04d }));
    dot.position.copy(pos); sunPathDyn.add(dot);
    const l = label(h + 'h', 'lbl hour'); l.position.copy(pos).add(new THREE.Vector3(0, 7, 0)); sunPathDyn.add(l);
  }
  sunPathGroup.add(sunPathDyn);
}

function buildSeasonPaths() {
  const year = state.date.slice(0, 4);
  [[`${year}-12-21`, 0xff8a3d, 'Solstício de verão (21/12)'], [`${year}-06-21`, 0x6fa8ff, 'Solstício de inverno (21/06)']].forEach(([iso, color, text]) => {
    const pts = arcPoints(iso);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color, dashSize: 6, gapSize: 4, transparent: true, opacity: 0.8 }));
    line.computeLineDistances();
    seasonGroup.add(line);
    let top = pts[0]; pts.forEach(p => { if (p.y > top.y) top = p; });
    const l = label(text); l.position.copy(top).add(new THREE.Vector3(0, 10, 0)); seasonGroup.add(l);
  });
}

// anel de orientação no chão
{
  const ring = new THREE.Mesh(new THREE.RingGeometry(PATH_R - 0.8, PATH_R + 0.8, 160), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.copy(LOT_CENTER).setY(0.6);
  sunPathGroup.add(ring);
  [['N', 0], ['L', 90], ['S', 180], ['O', 270]].forEach(([t, b]) => {
    const l = label(t, 'lbl big'); l.position.copy(LOT_CENTER).addScaledVector(bearingVec(b), PATH_R + 12).setY(3);
    sunPathGroup.add(l);
  });
}

// rótulos do entorno
function nearestOnRoad(name, seed) {
  let best = null, bd = Infinity;
  for (const r of SITE.roads) {
    if (r.n !== name) continue;
    for (const p of r.p) { const d = Math.hypot(p[0] - seed[0], p[1] - seed[1]); if (d < bd) { bd = d; best = p; } }
  }
  return best;
}
{
  const place = (text, x, z, y = 4, cls = 'lbl') => { const l = label(text, cls); l.position.set(x, world.heightAt(x, z) + y, z); labelsGroup.add(l); };
  const gv = nearestOnRoad('Avenida Antônio Gil Veloso', [10, 70]); if (gv) place('Av. Antônio Gil Veloso', gv[0], gv[1]);
  const lb = nearestOnRoad('Rua Lúcio Bacelar', [-100, 40]); if (lb) place('Rua Lúcio Bacelar', lb[0], lb[1]);
  const gr = nearestOnRoad('Rua Gastão Roubach', [-60, -40]); if (gr) place('Rua Gastão Roubach', gr[0], gr[1]);
  place('Oceano Atlântico', 260, 120, 2, 'lbl big');
  place('Praia da Costa', 50, 160, 3, 'lbl big');
  // ponto mais alto do relevo → morro
  let mi = 0; TERRAIN.h.forEach((h, i) => { if (h > TERRAIN.h[mi]) mi = i; });
  const n = TERRAIN.n, step = TERRAIN.size / (n - 1);
  const mx = -TERRAIN.size / 2 + (mi % n) * step, mz = -TERRAIN.size / 2 + Math.floor(mi / n) * step;
  place(`Morro do Moreno · ${Math.round(TERRAIN.h[mi] - SEA_LEVEL)} m`, mx, mz, 12, 'lbl big');
  const ap = label('Apogeo Residences', 'lbl apogeo'); ap.position.copy(TOWER_C).setY(apogeo.height + 8); labelsGroup.add(ap);
}

// etiquetas de preço das unidades disponíveis (clicáveis), na varanda principal de cada unidade
const pinsGroup = new THREE.Group(); scene.add(pinsGroup);
function buildPins() {
  const q = new THREE.Quaternion(); apogeo.group.getWorldQuaternion(q);
  for (const m of unitMeshes) {
    const u = m.userData.unit; if (!isAvail(u)) continue;
    const side = m.userData.view.side;
    const n = side === '+x' ? new THREE.Vector3(1, 0, 0) : side === '-z' ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 0, 1);
    n.applyQuaternion(q);
    const eye = apogeo.group.localToWorld(new THREE.Vector3(...m.userData.view.eye));
    const el = document.createElement('button');
    el.className = 'pin';
    el.innerHTML = `<b>${u.name}</b><span>${brlShort(priceNum(u.price))}</span>${hasRealTour(u.name) ? '<i title="Tour 3D disponível">3D</i>' : ''}`;
    el.addEventListener('pointerdown', e => e.stopPropagation());
    el.addEventListener('click', e => { e.stopPropagation(); selectUnit(m, true); });
    const o = new CSS2DObject(el);
    // logo acima do teto da unidade, para não cobrir o destaque amarelo
    const b = m.userData.box;
    o.position.copy(eye).addScaledVector(n, 2.5).add(new THREE.Vector3(0, b.h - 1.6 + 3.4, 0));
    o.userData.unit = m;
    pinsGroup.add(o);
  }
}

// marcador do Street View na maquete
const svMarker = new THREE.Group();
{
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 6, 12), new THREE.MeshBasicMaterial({ color: 0xffb400 }));
  pin.position.y = 3; svMarker.add(pin);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(6, 16, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffb400, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
  cone.rotation.x = -Math.PI / 2; cone.position.set(0, 2, -8); svMarker.add(cone);
  const l = label('Street View', 'lbl hour'); l.position.y = 8; svMarker.add(l);
  svMarker.visible = false;
  scene.add(svMarker);
}
function placeSvMarker(lat, lng, heading) {
  const p = fromLatLon(lat, lng);
  svMarker.position.set(p.x, world.heightAt(p.x, p.z) + 0.2, p.z);
  svMarker.rotation.y = -heading * Math.PI / 180;
  svMarker.visible = true;
}

// ======================================================================
// Sol: atualização da iluminação
// ======================================================================
const tmpDir = new THREE.Vector3();
function updateSun() {
  const p = sunPosition(localToDate(state.date, state.hour), LAT, LON);
  state.sun = p;
  const v = sunVector(p.azimuth, p.elevation);
  tmpDir.set(v.x, v.y, v.z);
  const el = p.elevation;
  const day = smooth(-6, 4, el);
  const night = 1 - smooth(-5, 2, el);
  const warm = 1 - smooth(2, 28, el);

  skyU.sunPosition.value.copy(tmpDir);
  skyU.rayleigh.value = lerp(2.0, 3.0, warm * day);
  skyU.turbidity.value = lerp(3.5, 8, warm);

  sunLight.intensity = 3.6 * smooth(-0.8, 7, el);
  scene.environmentIntensity = (0.1 + 0.32 * day) * (state.tour ? 0.6 : 1);
  sunLight.color.setRGB(1, 0.96 - 0.32 * warm, 0.9 - 0.55 * warm);
  const SC = state.shadowCenter || LOT_CENTER;
  sunLight.position.copy(SC).addScaledVector(tmpDir, 1200);
  sunLight.target.position.copy(SC);
  sunLight.castShadow = el > -0.8;

  hemi.intensity = 0.1 + 0.32 * day;
  hemi.color.setRGB(lerp(0.16, 0.8, day), lerp(0.2, 0.88, day), lerp(0.38, 1, day));
  hemi.groundColor.setRGB(lerp(0.08, 0.55, day), lerp(0.07, 0.48, day), lerp(0.08, 0.4, day));
  moon.intensity = 0.45 * night;
  starMat.opacity = night * 0.9;
  renderer.toneMappingExposure = lerp(1.6, 1.0, day) * (state.tour ? lerp(1.25, 1.08, day) : 1); // adaptação do olho em ambiente interno
  scene.fog.color.setRGB(lerp(0.05, 0.8 + 0.12 * warm, day), lerp(0.07, 0.85 - 0.02 * warm, day), lerp(0.12, 0.9 - 0.15 * warm, day));
  scene.fog.density = lerp(0.0003, 0.00042, day);
  // no tour, um bloom sutil de dia faz as janelas "estourarem" como numa foto de interiores
  bloom.strength = state.tour ? 0.22 + 0.45 * night : 0.6 * night;
  bloom.threshold = state.tour ? 0.92 : 0.82;
  bloom.enabled = night > 0.02 || !!state.tour;
  if (state.tour) state.tour.invalidateProbe(); // a luz mudou: recaptura o reflexo do ambiente

  world.water.material.uniforms.sunDirection.value.copy(tmpDir).normalize();
  world.water.material.uniforms.sunColor.value.setRGB(lerp(0.1, 1, day), lerp(0.1, 0.92 - 0.3 * warm, day), lerp(0.15, 0.85 - 0.5 * warm, day));
  world.water.material.uniforms.waterColor.value.setRGB(lerp(0.01, 0.05, day), lerp(0.04, 0.3, day), lerp(0.08, 0.38, day));

  // luzes da noite
  if (world.windows) { world.windows.visible = night > 0.03; world.windows.userData.material.emissiveIntensity = 1.6 * night; }
  world.bulbMat.emissiveIntensity = 4 * night;
  Object.values(tours).forEach(t => { t.setNight(night); t.setDay(smooth(-2, 10, el), warm); });
  state.night = night;

  sunMarker.position.copy(tmpDir).multiplyScalar(PATH_R).add(LOT_CENTER);
  sunMarker.visible = el > -1;

  updateEnv(tmpDir.clone(), false);
  applyUnitColors();
  updateSunHud();
  if (state.selected) drawTimeline();
}

function updateSunHud() {
  const p = state.sun, t = sunTimes(state.date, LAT, LON);
  $('clock').textContent = fmtHour(state.hour);
  $('miniDate').textContent = fmtDate(state.date);
  $('miniInfo').textContent = $('sunbar').classList.contains('open') ? '' : '· ajustar hora e data';
  const DIR = { N: 'norte', NNE: 'norte', NE: 'nordeste', ENE: 'leste', L: 'leste', ESE: 'leste', SE: 'sudeste', SSE: 'sul', S: 'sul', SSO: 'sul', SO: 'sudoeste', OSO: 'oeste', O: 'oeste', ONO: 'oeste', NO: 'noroeste', NNO: 'norte' };
  $('suninfo').innerHTML = p.elevation > -0.8
    ? `<span>Sol vindo do <b>${DIR[compassName(p.azimuth)]}</b>${p.elevation > 55 ? ', bem alto' : p.elevation < 15 ? ', baixo no horizonte' : ''}</span><span>Nasce <b>${fmtHour(t.sunrise)}</b> · Se põe <b>${fmtHour(t.sunset)}</b></span>`
    : `<span><b>Noite</b></span><span>Nasce <b>${fmtHour(t.sunrise)}</b> · Se põe <b>${fmtHour(t.sunset)}</b></span>`;
  const a = t.sunrise / 24 * 100, b = t.sunset / 24 * 100, n = t.noon / 24 * 100;
  $('daybands').style.background = `linear-gradient(90deg, #1b2440 0%, #1b2440 ${a - 2}%, #ff9b5a ${a}%, #ffd36b ${a + 4}%, #fff2c2 ${n}%, #ffd36b ${b - 4}%, #ff7a4d ${b}%, #1b2440 ${b + 2}%, #1b2440 100%)`;
}

// ======================================================================
// Cores das unidades
// ======================================================================
const FT = facadeTextures();
const C_REAL = new THREE.Color(0xffffff), C_AVAIL = new THREE.Color(0xf6c15a), C_SOLD = new THREE.Color(0x9aa3b5);
const C_LIT = new THREE.Color(0xffc477), C_GOLD = new THREE.Color(0x3d6fd1), C_BLACK = new THREE.Color(0);
const C_HOVER_FREE = new THREE.Color(0xf6c15a), C_HOVER_SOLD = new THREE.Color(0x9aa3b5);
const RAMP = [[0, '#2f3f78'], [2, '#5b5aa8'], [4, '#b0679e'], [6, '#f0874f'], [8, '#ffc04d'], [10, '#fff1a8']];
const rampColor = h => {
  for (let i = 1; i < RAMP.length; i++) if (h <= RAMP[i][0]) {
    const t = (h - RAMP[i - 1][0]) / (RAMP[i][0] - RAMP[i - 1][0]);
    return new THREE.Color(RAMP[i - 1][1]).lerp(new THREE.Color(RAMP[i][1]), t);
  }
  return new THREE.Color(RAMP[RAMP.length - 1][1]);
};

function applyUnitColors() {
  const night = state.night || 0;
  for (const m of unitMeshes) {
    const u = m.userData.unit, mat = m.material;
    let col = C_REAL, emi = C_BLACK, ei = 0, op = 1, metal = 0.05;
    if (state.colorMode === 'real') {
      if (m.userData.lit) { emi = C_LIT; ei = 0.7 * night; }
    } else if (state.colorMode === 'disp') {
      metal = 0.1;
      if (isAvail(u)) { col = C_AVAIL; emi = C_AVAIL; ei = 0.3 + 0.4 * night; op = 0.98; }
      else { col = C_SOLD; op = 0.5; }
    } else if (state.colorMode === 'sol') {
      metal = 0.1;
      const r = state.results.get(m.uuid);
      if (r) { col = rampColor(r.total / 60); emi = col; ei = 0.35 + 0.3 * night; op = 0.97; }
      else { col = C_SOLD; op = 0.6; }
    }
    mat.color.copy(col); mat.emissive.copy(emi); mat.emissiveIntensity = ei; mat.opacity = op; mat.metalness = metal; mat.roughness = 1;
    // Realista: só as janelas acendem à noite; Disponibilidade: a unidade inteira acende
    mat.emissiveMap = state.colorMode === 'real' ? FT.emissiveMap : FT.white;
    m.userData.baseEmissive = mat.emissive.clone(); m.userData.baseEI = ei;
  }
  renderLegend();
}

function renderLegend() {
  const lg = $('legend');
  if (state.colorMode === 'disp') {
    const n = PROPERTY.units.filter(isAvail).length;
    lg.innerHTML = `<span><i style="background:var(--gold)"></i>Disponível (${n})</span><span><i style="background:#9aa3b5"></i>Vendida (${PROPERTY.units.length - n})</span><span class="muted">Clique numa unidade para detalhes</span>`;
  } else if (state.colorMode === 'sol') {
    const done = state.results.size;
    const grad = RAMP.map(([h, c]) => `${c} ${h * 10}%`).join(',');
    lg.innerHTML = done < unitMeshes.length
      ? `<span>Calculando insolação… ${done}/${unitMeshes.length}</span>`
      : `<span>Horas de sol direto nas varandas em ${fmtDate(state.date)}${analyzer.source === 'google' ? ' · prédios reais' : ''}</span><span>0h<span class="ramp" style="background:linear-gradient(90deg,${grad})"></span>10h+</span>`;
  } else lg.innerHTML = '';
}

// ======================================================================
// Análise solar
// ======================================================================
const occluders = [];
apogeo.group.traverse(o => { if (o.isMesh && o.userData.occluder) occluders.push(o); });
const ownOccluders = [...occluders]; // só o próprio edifício (e paisagismo do lote)
world.neighbors.children.forEach(o => occluders.push(o));
const osmOccluders = [...occluders];
const analyzer = new SunAnalyzer({ lat: LAT, lon: LON, occluders, heightAt: world.heightAt, group: apogeo.group });

function runAnalysisAll() {
  const token = ++state.analysisToken;
  state.results.clear();
  const queue = [...unitMeshes];
  if (state.selected) { queue.splice(queue.indexOf(state.selected), 1); queue.unshift(state.selected); }
  const work = () => {
    if (token !== state.analysisToken) return;
    const t0 = performance.now();
    while (queue.length && performance.now() - t0 < 24) {
      const m = queue.shift();
      state.results.set(m.uuid, analyzer.analyzeUnit(m, state.date));
      updateChipSun(m);
      if (m === state.selected) renderUnitPanel();
    }
    if (state.colorMode === 'sol') applyUnitColors();
    if (queue.length) setTimeout(work, 0);
  };
  setTimeout(work, 30);
}

// ======================================================================
// Painel de disponibilidade
// ======================================================================
function renderAvailability() {
  const units = PROPERTY.units;
  const av = units.filter(isAvail).sort((a, b) => priceNum(a.price) - priceNum(b.price));
  $('availLead').innerHTML = `<b>${av.length} de ${units.length}</b> unidades disponíveis · a partir de <b>${brlShort(priceNum(av[0].price))}</b>`;
  $('extractDate').textContent = '15/10/2026';
  $('availList').innerHTML = av.map(u => {
    const f = floorOf(u.name), m = unitByName.get(u.name);
    const dup = m?.userData.floors.length > 1 ? ' · duplex' : '';
    const tour = hasRealTour(u.name) ? '<span class="tour-badge">Tour 3D</span>' : '';
    return `<button class="avail-row" data-u="${u.name}"><span class="avail-num">${u.name}</span><span class="avail-meta">${f}º andar${dup}<br>${Math.round(areaNum(u.area))} m² · ${u.bedrooms} suítes</span><span class="avail-price">${brlShort(priceNum(u.price))}${tour}</span></button>`;
  }).join('');
  const notes = { 15: 'Superior do duplex 1401', 8: 'Lazer · praia suspensa', 0: 'Térreo · lobbies' };
  let html = '';
  for (let f = 15; f >= 0; f--) {
    const us = units.filter(u => floorOf(u.name) === f);
    html += `<div class="stack-row"><span class="stack-n">${f === 0 ? 'T' : f + 'º'}</span><div class="stack-cells">`;
    if (!us.length) html += `<span class="cell note">${notes[f] || ''}</span>`;
    for (const u of us) {
      const a = isAvail(u);
      html += `<button class="cell ${a ? 'avail' : ''}" data-u="${u.name}" title="Unidade ${u.name} · ${u.area}${a ? ' · ' + brlShort(priceNum(u.price)) : ' · vendida'}">${u.name}</button>`;
    }
    html += '</div></div>';
  }
  $('floors').innerHTML = html;
  document.querySelectorAll('#availList .avail-row, #floors .cell[data-u]').forEach(b => b.addEventListener('click', () => selectUnit(unitByName.get(b.dataset.u), true)));
}
// comparador: todas as disponíveis lado a lado (preço, área, sol hoje / inverno / verão, tour)
function openCompare() {
  const av = PROPERTY.units.filter(isAvail).sort((a, b) => priceNum(a.price) - priceNum(b.price)).map(u => unitByName.get(u.name));
  const y = state.date.slice(0, 4);
  const cols = av.map(m => {
    const u = m.userData.unit, area = areaNum(u.area), price = priceNum(u.price);
    const r = state.results.get(m.uuid) || analyzer.analyzeUnit(m, state.date);
    const w = analyzer.analyzeUnit(m, `${y}-06-21`), su = analyzer.analyzeUnit(m, `${y}-12-21`);
    return { m, u, area, price, ppm: price / area, r, w, su, v: sunVerdict(r) };
  });
  const best = (k, dir) => { const vals = cols.map(c => k(c)); const t = dir > 0 ? Math.max(...vals) : Math.min(...vals); return c => k(c) === t; };
  const bPrice = best(c => c.price, -1), bPpm = best(c => c.ppm, -1), bArea = best(c => c.area, 1), bSun = best(c => c.r.total, 1), bWin = best(c => c.w.total, 1);
  const cell = (c, txt, isBest) => `<td class="${isBest(c) ? 'best' : ''}">${txt}</td>`;
  const row = (label, fn) => `<tr><th>${label}</th>${cols.map(fn).join('')}</tr>`;
  $('compareLead').textContent = `${cols.length} unidades · sol calculado para ${fmtDate(state.date)}, 21/06 (inverno) e 21/12 (verão). Em destaque, o melhor de cada linha.`;
  $('compareTable').innerHTML = `
    <thead><tr><th></th>${cols.map(c => `<th class="unit">${c.u.name}<span>${c.m.userData.floors.map(f => f + 'º').join('/')} andar</span></th>`).join('')}</tr></thead>
    <tbody>
      ${row('Preço', c => cell(c, brlShort(c.price), bPrice))}
      ${row('R$/m²', c => cell(c, brl(c.ppm), bPpm))}
      ${row('Área privativa', c => cell(c, Math.round(c.area) + ' m²', bArea))}
      ${row('Suítes', c => `<td>${c.u.bedrooms}</td>`)}
      ${row('Tipo', c => `<td>${c.m.userData.floors.length > 1 ? 'Duplex' : (c.m.userData.tower ? 'Torre' : 'Base')}</td>`)}
      ${row('Sol', c => `<td>${c.v.icon} ${c.v.label}</td>`)}
      ${row('Sol hoje', c => cell(c, fmtDur(c.r.total), bSun))}
      ${row('Sol no inverno', c => cell(c, fmtDur(c.w.total), bWin))}
      ${row('Sol no verão', c => `<td>${fmtDur(c.su.total)}</td>`)}
      ${row('Tour 3D', c => `<td>${hasRealTour(c.u.name) ? `<button class="btn small" data-tour="${c.u.name}">Entrar</button>` : (INTERIORS[c.u.name] ? `<button class="btn small ghost" data-tour="${c.u.name}">Ilustrativo</button>` : '—')}</td>`)}
      ${row('', c => `<td><button class="btn small ghost" data-see="${c.u.name}">Ver no prédio</button></td>`)}
    </tbody>`;
  $('compareTable').querySelectorAll('[data-tour]').forEach(b => b.onclick = () => { closeCompare(); enterTour(unitByName.get(b.dataset.tour)); });
  $('compareTable').querySelectorAll('[data-see]').forEach(b => b.onclick = () => { closeCompare(); selectUnit(unitByName.get(b.dataset.see), true); });
  $('compare').classList.remove('hidden');
}
function closeCompare() { $('compare').classList.add('hidden'); }

function updateChipSun() { /* barras de sol removidas do painel (informação fica na ficha da unidade) */ }

// ======================================================================
// Painel da unidade
// ======================================================================
function selectUnit(m, fly) {
  if (state.selected === m) { if (fly) flyToUnit(m); return; }
  state.selected = m;
  document.querySelectorAll('.avail-row.sel, .cell.sel').forEach(e => e.classList.remove('sel'));
  if (m) {
    document.querySelectorAll(`[data-u="${m.userData.unit.name}"]`).forEach(e => e.classList.add('sel'));
    $('unitPanel').classList.remove('hidden');
    if (innerWidth < 900) $('availPanel').classList.add('collapsed');
    document.body.classList.add('has-unit');
    if (!state.results.has(m.uuid)) state.results.set(m.uuid, analyzer.analyzeUnit(m, state.date));
    renderUnitPanel();
    if (fly) flyToUnit(m);
  } else {
    $('unitPanel').classList.add('hidden');
    document.body.classList.remove('has-unit');
  }
  applyUnitColors();
}

function unitTypeLabel(m) {
  const u = m.userData.unit, f = m.userData.floors;
  if (u.name === '101' || u.name === '102') return 'Duplex garden (1º/2º)';
  if (f.length > 1) return `Duplex (${f[0]}º/${f[1]}º)`;
  if (m.userData.tower) return 'Torre · andar inteiro';
  return 'Embasamento';
}

function sunNarrative(r) {
  const parts = [];
  for (const [side, ranges] of Object.entries(r.sideRanges)) {
    if (!ranges.length) continue;
    const txt = ranges.map(([a, b]) => `${fmtHour(a)}–${fmtHour(b)}`).join(', ');
    parts.push(`<b>${ORIENT[side].short}</b>: ${txt}`);
  }
  if (!parts.length) return 'Sem sol direto nas varandas nesta data (sombreada por edifício, vizinhos ou relevo).';
  return parts.join('<br>');
}

// leitura simples do sol: tipo (manhã / tarde / dia todo), janela de horário e por onde entra
const SIDE_PLAIN = { '+x': 'pela varanda de frente para o mar', '-z': 'pela lateral norte', '+z': 'pela lateral sul', '-x': 'pelos fundos' };
function sunVerdict(r) {
  if (!r || r.total < 30) return { key: 'pouco', label: 'Pouco sol direto', icon: '⛅' };
  if (r.morning >= 0.68 * r.total) return { key: 'manha', label: 'Sol da manhã', icon: '🌅' };
  if (r.afternoon >= 0.68 * r.total) return { key: 'tarde', label: 'Sol da tarde', icon: '🌇' };
  return { key: 'dia', label: 'Sol manhã e tarde', icon: '☀️' };
}
function sunWindow(r) {
  const lit = r.timeline.filter(t => t.sides.length);
  if (!lit.length) return null;
  return [lit[0].h, lit[lit.length - 1].h + 10 / 60];
}
function sunSentence(r) {
  const w = sunWindow(r);
  if (!w) return 'Nesta data a unidade fica à sombra dos prédios vizinhos ou do próprio edifício.';
  const sides = Object.entries(r.sideMinutes).filter(([, mn]) => mn >= 30).sort((a, b) => b[1] - a[1]).map(([s]) => SIDE_PLAIN[s]);
  const by = sides.length > 1 ? sides.slice(0, -1).join(', ') + ' e ' + sides[sides.length - 1] : sides[0];
  return `Bate sol das <b>${fmtHour(w[0])}</b> às <b>${fmtHour(w[1])}</b>${by ? `, entrando ${by}` : ''}.`;
}
function seasonSun(m) {
  const y = state.date.slice(0, 4);
  return [['Inverno', `${y}-06-21`], ['Verão', `${y}-12-21`]].map(([n, d]) => {
    const r = analyzer.analyzeUnit(m, d);
    return { n, r, v: sunVerdict(r) };
  });
}

function renderUnitPanel() {
  const m = state.selected; if (!m) return;
  const u = m.userData.unit, a = isAvail(u), area = areaNum(u.area), price = priceNum(u.price);
  const r = state.results.get(m.uuid);
  const plan = PLAN_BY_AREA[u.area] || PLAN_SIMILAR[u.area];
  const fl = m.userData.floors.map(f => f + 'º').join('/');
  const v = sunVerdict(r);
  const seasons = r ? seasonSun(m) : [];
  const hasTour = hasRealTour(u.name), illus = !!INTERIORS[u.name]?.illustrative;
  $('unitBody').innerHTML = `
    <div class="unit-head"><h2>Unidade ${u.name}</h2><span class="badge ${a ? 'avail' : 'sold'}">${a ? 'Disponível' : 'Vendida'}</span></div>
    ${a ? `<div class="price">${brl(price)}</div><div class="muted" style="font-size:12px">${brl(price / area)}/m² privativo</div>` : `<div class="muted">Unidade já comercializada</div>`}
    <div class="specs">
      <div><span>Andar</span>${fl}</div>
      <div><span>Área</span>${Math.round(area)} m²</div>
      <div><span>Suítes</span>${u.bedrooms}</div>
      <div><span>Tipo</span>${m.userData.floors.length > 1 ? 'Duplex' : (m.userData.tower ? 'Torre' : 'Base')}</div>
    </div>
    ${!hasTour && a && !plan ? `<div class="tour-soon"><b>Planta e tour 3D sob consulta</b><span>A incorporadora ainda não publicou a planta desta unidade. O tour interno com a planta oficial entra assim que ela for divulgada.</span>${illus ? `<button class="btn ghost small" id="btnIllus">Ver ambientação ilustrativa</button>` : ''}</div>` : ''}
    ${hasTour ? `<button class="btn tour-btn wide" id="btnTour"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 21V9l8-6 8 6v12h-6v-7h-4v7z" fill="currentColor"/></svg>Entrar no apartamento</button>` : ''}
    <section class="sunbox ${v.key}">
      <div class="sun-verdict"><span class="sun-ico-big" aria-hidden="true">${v.icon}</span><div><b>${v.label}</b><span>${r ? sunSentence(r) : 'Calculando…'}</span></div></div>
      ${r ? `
      <canvas class="timeline" id="timeline"></canvas>
      <div class="sun-seasons">
        <div><span>Hoje · ${fmtDate(state.date).slice(0, 5)}</span><b>${fmtDur(r.total)}</b></div>
        ${seasons.map(s => `<div><span>${s.n}</span><b>${fmtDur(s.r.total)}</b><em>${s.v.label}</em></div>`).join('')}
      </div>` : ''}
    </section>
    <div class="actions">
      <button class="btn ghost" id="btnSunPlay">☀ Ver o sol passar</button>
      <button class="btn ghost" id="btnView">Ver a vista da varanda</button>
    </div>
    ${plan ? `<details class="more" open><summary>Planta da unidade</summary><img class="plan-thumb" src="${IMG(plan)}" alt="Planta" data-lb="${plan}">${PLAN_SIMILAR[u.area] ? '<p class="note">Planta da tipologia similar de 224,51 m².</p>' : ''}</details>` : ''}`;
  $('btnView').onclick = () => enterUnitView(m);
  $('btnSunPlay').onclick = () => playSunOn(m);
  if ($('btnTour')) $('btnTour').onclick = () => enterTour(m);
  if ($('btnIllus')) $('btnIllus').onclick = () => enterTour(m);
  $('unitBody').querySelector('.plan-thumb')?.addEventListener('click', e => openLightbox([e.target.dataset.lb], 0, ['Planta · unidade ' + u.name]));
  if (r) drawTimeline();
}

// uma única faixa do dia: quando o sol bate na unidade (manhã em dourado, tarde em laranja) e o horário atual
function drawTimeline() {
  const cv = $('timeline'), m = state.selected; if (!cv || !m) return;
  const r = state.results.get(m.uuid); if (!r) return;
  const dpr = devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
  if (!W) return;
  cv.width = W * dpr; cv.height = H * dpr;
  const c = cv.getContext('2d'); c.scale(dpr, dpr);
  const h0 = 5, h1 = 19.5, X = h => (h - h0) / (h1 - h0) * W, y0 = 14, bh = 14;
  c.font = '10.5px system-ui, sans-serif'; c.textBaseline = 'alphabetic';
  // noite / dia
  c.fillStyle = '#e9ecf3'; c.beginPath(); c.roundRect(0, y0, W, bh, 7); c.fill();
  c.fillStyle = '#f6f2e8'; c.beginPath(); c.roundRect(X(r.times.sunrise), y0, X(r.times.sunset) - X(r.times.sunrise), bh, 7); c.fill();
  // sol direto
  const step = 10 / 60;
  c.save(); c.beginPath(); c.roundRect(0, y0, W, bh, 7); c.clip();
  for (const t of r.timeline) {
    if (!t.sides.length) continue;
    c.fillStyle = t.h < r.times.noon ? '#f6c15a' : '#e8964a';
    c.fillRect(X(t.h), y0, X(t.h + step) - X(t.h) + 0.6, bh);
  }
  c.restore();
  // legendas manhã / tarde
  c.fillStyle = '#6b7280';
  c.fillText('manhã', 2, 10);
  const tw = c.measureText('tarde').width; c.fillText('tarde', W - tw - 2, 10);
  for (const hh of [6, 9, 12, 15, 18]) { const tx = c.measureText(hh + 'h').width; c.fillText(hh + 'h', X(hh) - tx / 2, y0 + bh + 13); }
  // agora
  const xn = X(Math.min(h1, Math.max(h0, state.hour)));
  c.fillStyle = '#192a56'; c.fillRect(xn - 1, y0 - 4, 2, bh + 8);
}

// ======================================================================
// Câmera: presets, voo, vista da unidade, caminhada
// ======================================================================
let camAnim = null;
function animateCamera(pos, target, dur = 1.4) {
  camAnim = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos, t1: target, start: performance.now(), dur: dur * 1000 };
}
function setOrbitLimits(unitView) {
  controls.minDistance = unitView ? 0.05 : 8;
  controls.maxDistance = unitView ? 2 : 1400;
  controls.enablePan = !unitView;
  controls.enableZoom = !unitView;
  controls.rotateSpeed = unitView ? -0.35 : 1;
}
function preset(name) {
  exitWalk(); setOrbitLimits(false); hideHint();
  const C = LOT_CENTER.clone();
  const T = C.clone().setY(24);
  if (name === 'geral') animateCamera(C.clone().addScaledVector(bearingVec(38), 175).setY(70), T);
  if (name === 'praia') { const p = C.clone().addScaledVector(bearingVec(101), 125); p.y = world.heightAt(p.x, p.z) + 1.7; animateCamera(p, C.clone().setY(30)); }
  if (name === 'fundos') { const p = C.clone().addScaledVector(bearingVec(281), 60).addScaledVector(bearingVec(191), 25); p.y = 1.7 + Math.max(0, world.heightAt(p.x, p.z)); animateCamera(p, C.clone().setY(28)); }
  if (name === 'aerea') animateCamera(C.clone().add(new THREE.Vector3(0, 380, 0.5)), C.clone());
}
function flyToUnit(m) {
  exitWalk(); setOrbitLimits(false); hideHint();
  const c = m.localToWorld(m.userData.center.clone());
  const side = m.userData.view.side;
  const n = side === '+x' ? new THREE.Vector3(1, 0, 0) : side === '-z' ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 0, 1);
  const q = new THREE.Quaternion(); apogeo.group.getWorldQuaternion(q); n.applyQuaternion(q);
  const pos = c.clone().addScaledVector(n, 105).add(new THREE.Vector3(0, 30, 0)).addScaledVector(new THREE.Vector3(-n.z, 0, n.x), 40);
  animateCamera(pos, c);
}
function enterUnitView(m) {
  exitWalk();
  const eye = apogeo.group.localToWorld(new THREE.Vector3(...m.userData.view.eye));
  const side = m.userData.view.side;
  const n = side === '+x' ? new THREE.Vector3(1, 0, 0) : side === '-z' ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 0, 1);
  const q = new THREE.Quaternion(); apogeo.group.getWorldQuaternion(q); n.applyQuaternion(q);
  setOrbitLimits(true);
  animateCamera(eye, eye.clone().addScaledVector(n, 0.6), 1.6);
  showHint(`Vista da varanda ${ORIENT[side].short} da unidade ${m.userData.unit.name} · arraste para olhar ao redor · Esc para sair`);
}

let hintEl = null;
function showHint(t) { hideHint(); hintEl = document.createElement('div'); hintEl.className = 'walk-hint'; hintEl.textContent = t; $('view-maquete').appendChild(hintEl); }
function hideHint() { hintEl?.remove(); hintEl = null; }

// caminhada em primeira pessoa
const walk = { yaw: 0, pitch: 0, keys: new Set(), drag: null };
function enterWalk(pos, bearing) {
  state.nav = 'walk'; camAnim = null;
  controls.enabled = false;
  camera.position.set(pos.x, world.heightAt(pos.x, pos.z) + 1.7, pos.z);
  walk.yaw = -bearing * Math.PI / 180; walk.pitch = 0.18;
  showHint('Caminhar: W A S D / setas para andar · Shift corre · arraste para olhar · Esc para sair');
}
function exitWalk() {
  if (state.nav !== 'walk') return;
  state.nav = 'orbit'; controls.enabled = true;
  const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
  controls.target.copy(camera.position).addScaledVector(dir, 40);
  hideHint();
}
function updateWalk(dt) {
  const f = new THREE.Vector3(-Math.sin(walk.yaw), 0, -Math.cos(walk.yaw));
  const r = new THREE.Vector3(-f.z, 0, f.x);
  const sp = (walk.keys.has('ShiftLeft') || walk.keys.has('ShiftRight') ? 18 : 6) * dt;
  const mv = new THREE.Vector3();
  if (walk.keys.has('KeyW') || walk.keys.has('ArrowUp')) mv.add(f);
  if (walk.keys.has('KeyS') || walk.keys.has('ArrowDown')) mv.sub(f);
  if (walk.keys.has('KeyD') || walk.keys.has('ArrowRight')) mv.add(r);
  if (walk.keys.has('KeyA') || walk.keys.has('ArrowLeft')) mv.sub(r);
  if (mv.lengthSq()) camera.position.addScaledVector(mv.normalize(), sp);
  const gy = world.heightAt(camera.position.x, camera.position.z);
  camera.position.y = lerp(camera.position.y, Math.max(gy, SEA_LEVEL + 0.5) + 1.7, 0.3);
  const look = new THREE.Vector3(-Math.sin(walk.yaw) * Math.cos(walk.pitch), Math.sin(walk.pitch), -Math.cos(walk.yaw) * Math.cos(walk.pitch));
  camera.lookAt(camera.position.clone().add(look));
}

// ======================================================================
// Interação: hover, clique, teclado
// ======================================================================
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let pointerDown = null;
function setNDC(e) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
}
function pickUnit() {
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects([...unitMeshes, ...occluders.filter(o => !o.userData.unit && !o.userData.neighbor)], false);
  const h = hits.find(x => x.object.userData.unit || x.distance > 0);
  return h && h.object.userData.unit ? h.object : null;
}
// ======================================================================
// Tour interno (estilo Street View) das unidades com planta traçada
// ======================================================================
// catálogo de interiores: unidade → planta traçada (dados puros; o motor é o mesmo para todos)
const INTERIORS = PROJECT.interiors;
// tour com planta oficial (as ambientações ilustrativas não contam como planta)
const hasRealTour = name => !!INTERIORS[name] && !INTERIORS[name].illustrative;
const tours = {};
let tourSaved = null;
function tourFor(name) {
  const plan = INTERIORS[name]; if (!plan) return null;
  if (!tours[name]) {
    const m = unitByName.get(name);
    tours[name] = new InteriorTour({
      plan, parent: apogeo.group, level: plan.baseY ?? floorY(m.userData.floors[0]), camera, renderer, dom: renderer.domElement,
      ui: { onNode: n => {
        const t = tours[name], multi = t && t.levels.length > 1;
        $('tourRoom').textContent = (multi ? t.levels[n.lv].short + ' · ' : '') + n.name;
        document.querySelectorAll('#tourRooms button').forEach(b => b.classList.toggle('on', +b.dataset.i === plan.nodes.indexOf(n)));
        drawTourMap();
      } },
    });
  }
  return tours[name];
}
function enterTour(m) {
  const name = m.userData.unit.name, tour = tourFor(name);
  if (!tour) return;
  exitWalk(); camAnim = null; hideHint();
  $('loading').classList.remove('done'); $('loading').querySelector('p').textContent = 'Montando o apartamento…';
  setTimeout(() => {
    tour.build();
    // esconde as partes do prédio que atravessam o apartamento (o interior traz as próprias lajes, paredes e vidros)
    const hidden = [];
    const box = new THREE.Box3();
    apogeo.group.updateMatrixWorld(true);
    tour.group.visible = true;
    const ibox = new THREE.Box3().setFromObject(tour.group).expandByScalar(0.3);
    tour.group.visible = false;
    apogeo.group.children.forEach(o => {
      if (o === tour.group || !o.visible || o.name.startsWith('interior-')) return;
      box.setFromObject(o);
      if (box.intersectsBox(ibox)) { o.visible = false; hidden.push(o); }
    });
    tourSaved = {
      hidden, pos: camera.position.clone(), target: controls.target.clone(), fov: camera.fov, near: camera.near,
      labels: labelsGroup.visible, path: sunPathGroup.visible, seasons: seasonGroup.visible, sv: svMarker.visible,
    };
    tourSaved.pins = pinsGroup.visible;
    labelsGroup.visible = sunPathGroup.visible = seasonGroup.visible = svMarker.visible = pinsGroup.visible = false;
    state.tour = tour; state.tourUnit = m;
    controls.enabled = false;
    camera.near = 0.05; camera.updateProjectionMatrix();
    // sombra do sol focada no apartamento: ~1 cm por texel
    const c = new THREE.Vector3(); new THREE.Box3().setFromObject(tour.group).getCenter(c);
    state.shadowCenter = c;
    Object.assign(sunLight.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20 });
    sunLight.shadow.camera.updateProjectionMatrix();
    gtao.updateGtaoMaterial({ radius: 0.9, distanceExponent: 1.3, thickness: 0.8, scale: 1.25 }); gtao.blendIntensity = 1.0;
    document.body.classList.add('in-tour');
    $('tour').classList.remove('hidden');
    $('tourUnit').textContent = `Unidade ${name} · ${m.userData.unit.area} · ${isAvail(m.userData.unit) ? brlShort(priceNum(m.userData.unit.price)) : 'vendida'}`;
    const rs = state.results.get(m.uuid) || analyzer.analyzeUnit(m, state.date), vs = sunVerdict(rs), ws = sunWindow(rs);
    $('tourSun').textContent = `${vs.icon} ${vs.label}${ws ? ` · ${fmtHour(ws[0])}–${fmtHour(ws[1])}` : ''}`;
    const multi = tour.levels.length > 1;
    $('tourRooms').innerHTML = tour.plan.nodes.filter(n => !n.link).map(n => `<button data-i="${tour.plan.nodes.indexOf(n)}">${multi ? tour.levels[n.lv].short + ' · ' : ''}${n.name}</button>`).join('');
    $('tourRooms').querySelectorAll('button').forEach(b => b.addEventListener('click', () => tour.goTo(tour.plan.nodes[+b.dataset.i])));
    $('tourBanner').classList.toggle('hidden', !tour.plan.illustrative);
    if (tour.plan.image) $('tourPlanImg').src = IMG(tour.plan.image);
    tour.enter();
    updateSun();
    // compila os shaders do interior (luzes de janela, pendentes) antes de revelar a cena
    const reveal = () => $('loading').classList.add('done');
    (renderer.compileAsync ? renderer.compileAsync(scene, camera) : Promise.resolve()).then(reveal, reveal);
  }, 30);
}
function exitTour() {
  const tour = state.tour; if (!tour) return;
  tour.exit();
  tourSaved.hidden.forEach(o => { o.visible = true; });
  pinsGroup.visible = tourSaved.pins;
  labelsGroup.visible = tourSaved.labels; sunPathGroup.visible = tourSaved.path; seasonGroup.visible = tourSaved.seasons; svMarker.visible = tourSaved.sv;
  camera.near = tourSaved.near; camera.fov = tourSaved.fov; camera.updateProjectionMatrix();
  camera.position.copy(tourSaved.pos); controls.target.copy(tourSaved.target);
  controls.enabled = true;
  state.tour = null; state.shadowCenter = null;
  Object.assign(sunLight.shadow.camera, { left: -300, right: 300, top: 300, bottom: -300 });
  sunLight.shadow.camera.updateProjectionMatrix();
  gtao.updateGtaoMaterial({ radius: 3.5, distanceExponent: 1.6, thickness: 2.5, scale: 1.2 }); gtao.blendIntensity = 0.85;
  document.body.classList.remove('in-tour');
  $('tour').classList.add('hidden');
  updateSun();
}

// minimapa com a planta oficial (do pavimento atual), pontos e cone de visão
function drawTourMap() {
  const tour = state.tour, cv = $('tourMap'); if (!tour || !cv) return;
  const img = $('tourPlanImg');
  if (tour.plan.image && (!img.complete || !img.naturalWidth)) { img.onload = drawTourMap; return; }
  const W = cv.clientWidth, H = cv.clientHeight, dpr = devicePixelRatio || 1;
  if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const mv = tour.mapFor(tour.node?.lv || 0), v = { x0: mv[0], y0: mv[1], x1: mv[2], y1: mv[3] };
  const k = Math.min(W / (v.x1 - v.x0), H / (v.y1 - v.y0));
  const ox = (W - (v.x1 - v.x0) * k) / 2, oy = (H - (v.y1 - v.y0) * k) / 2;
  const M = (x, y) => [ox + (x - v.x0) * k, oy + (y - v.y0) * k];
  c.clearRect(0, 0, W, H);
  if (tour.plan.image) { c.globalAlpha = 0.95; c.drawImage(img, v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0, ox, oy, (v.x1 - v.x0) * k, (v.y1 - v.y0) * k); c.globalAlpha = 1; }
  else {
    // ambientação ilustrativa: desenha um esquema (pisos e paredes) em vez da planta oficial
    const L = tour.levels[tour.node?.lv || 0];
    const poly = p => { c.beginPath(); p.forEach(([x, y], i) => { const [a, b] = M(x, y); i ? c.lineTo(a, b) : c.moveTo(a, b); }); c.closePath(); };
    c.fillStyle = '#e9edf3'; poly(L.outline); c.fill();
    const fc = { porcelain: '#f4f1ea', wood: '#e8d8c0', marble: '#eef0f2', tile: '#e4e6ea' };
    for (const f of L.floors) { c.fillStyle = fc[f.m] || '#f4f1ea'; poly(f.poly); c.fill(); }
    c.fillStyle = '#192a56';
    for (const w of L.walls) { const [a, b] = M(w[0], w[1]), [a2, b2] = M(w[2], w[3]); c.fillRect(a, b, Math.max(1.5, a2 - a), Math.max(1.5, b2 - b)); }
  }
  for (const n of tour.plan.nodes) {
    if ((n.lv || 0) !== (tour.node?.lv || 0)) continue;
    const [x, y] = M(...n.p);
    c.beginPath(); c.arc(x, y, n === tour.node ? 0 : 4, 0, 6.3); c.fillStyle = '#192a56'; c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.stroke();
  }
  if (tour.node) {
    const [x, y] = M(...tour.node.p), a = (tour.yaw - 90) * Math.PI / 180, half = (camera.fov * camera.aspect / 2) * Math.PI / 180;
    const g = c.createRadialGradient(x, y, 2, x, y, 46);
    g.addColorStop(0, 'rgba(246,193,90,.85)'); g.addColorStop(1, 'rgba(246,193,90,0)');
    c.beginPath(); c.moveTo(x, y); c.arc(x, y, 46, a - Math.min(half, 0.9), a + Math.min(half, 0.9)); c.closePath(); c.fillStyle = g; c.fill();
    c.beginPath(); c.arc(x, y, 6, 0, 6.3); c.fillStyle = '#f6c15a'; c.fill(); c.strokeStyle = '#192a56'; c.lineWidth = 2; c.stroke();
  }
  cv._map = { M, k, ox, oy, v };
}
function setHour(h) {
  state.hour = h; $('time').value = h; updateSun();
  document.querySelectorAll('#tourLight button').forEach(b => b.classList.toggle('on', Math.abs(+b.dataset.h - h) < 0.01));
}
function initTourUI() {
  $('tourExit').addEventListener('click', exitTour);
  $('tourLight').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { state.playing = false; $('play').textContent = '▶'; setHour(+b.dataset.h); }));
  $('tourMap').addEventListener('click', e => {
    const tour = state.tour, map = $('tourMap')._map; if (!tour || !map) return;
    const r = $('tourMap').getBoundingClientRect();
    const px = map.v.x0 + (e.clientX - r.left - map.ox) / map.k, py = map.v.y0 + (e.clientY - r.top - map.oy) / map.k;
    let best = null, bd = Infinity;
    for (const n of tour.plan.nodes) { if ((n.lv || 0) !== (tour.node?.lv || 0)) continue; const d = Math.hypot(n.p[0] - px, n.p[1] - py); if (d < bd) { bd = d; best = n; } }
    if (best) tour.goTo(best);
  });
  renderer.domElement.addEventListener('wheel', e => {
    if (!state.tour) return;
    e.preventDefault();
    state.tour.fov = Math.max(35, Math.min(85, state.tour.fov + e.deltaY * 0.03));
  }, { passive: false });
}
let tourDrag = null, lastMapYaw = null;

renderer.domElement.addEventListener('pointerdown', e => {
  pointerDown = { x: e.clientX, y: e.clientY };
  if (state.tour) { tourDrag = { x: e.clientX, y: e.clientY, yaw: state.tour.yaw, pitch: state.tour.pitch }; renderer.domElement.setPointerCapture(e.pointerId); return; }
  if (state.nav === 'walk') { walk.drag = { x: e.clientX, y: e.clientY, yaw: walk.yaw, pitch: walk.pitch }; renderer.domElement.setPointerCapture(e.pointerId); }
});
renderer.domElement.addEventListener('pointermove', e => {
  if (state.tour) {
    const t = state.tour;
    if (tourDrag) {
      // "agarrar e arrastar" como no Street View; sensibilidade proporcional ao zoom
      const k = t.fov / 72 * 0.18;
      t.yaw = tourDrag.yaw - (e.clientX - tourDrag.x) * k;
      t.pitch = Math.max(-1.3, Math.min(1.3, tourDrag.pitch + (e.clientY - tourDrag.y) * k * Math.PI / 180));
      renderer.domElement.style.cursor = 'grabbing';
    } else {
      setNDC(e);
      renderer.domElement.style.cursor = t.hover(ndc) ? 'pointer' : 'grab';
    }
    return;
  }
  if (state.nav === 'walk' && walk.drag) {
    walk.yaw = walk.drag.yaw + (e.clientX - walk.drag.x) * 0.004;
    walk.pitch = Math.max(-1.2, Math.min(1.2, walk.drag.pitch + (e.clientY - walk.drag.y) * 0.004));
    return;
  }
  setNDC(e);
  const m = state.pickSV ? null : pickUnit();
  if (m !== state.hovered) {
    state.hovered = m;
    renderer.domElement.style.cursor = m ? 'pointer' : '';
  }
  const tt = $('tooltip');
  if (m && !isAvail(m.userData.unit)) {
    const u = m.userData.unit, r = state.results.get(m.uuid);
    tt.innerHTML = `<b>Unidade ${u.name}</b> · ${u.area} · ${isAvail(u) ? '<span style="color:#b07d1a;font-weight:600">Disponível · ' + brlShort(priceNum(u.price)) + '</span>' : 'Vendida'}${r ? `<br><span class="muted">${sunVerdict(r).icon} ${sunVerdict(r).label}</span>` : ''}`;
    const rr = stage.getBoundingClientRect();
    tt.style.left = (e.clientX - rr.left + 14) + 'px'; tt.style.top = (e.clientY - rr.top + 14) + 'px'; tt.style.display = 'block';
  } else tt.style.display = 'none';
});
renderer.domElement.addEventListener('pointerup', e => {
  walk.drag = null;
  if (state.tour) {
    tourDrag = null;
    if (pointerDown && Math.hypot(e.clientX - pointerDown.x, e.clientY - pointerDown.y) <= 5) {
      setNDC(e);
      const n = state.tour.pick(ndc);
      if (n) state.tour.goTo(n);
    }
    return;
  }
  if (!pointerDown || Math.hypot(e.clientX - pointerDown.x, e.clientY - pointerDown.y) > 5) return;
  setNDC(e);
  if (state.pickSV) {
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObject(world.ground, false)[0];
    if (hit) {
      const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
      const ll = toLatLon(hit.point.x, hit.point.z);
      setPickSV(false);
    }
    return;
  }
  if (state.nav === 'walk') return;
  const m = pickUnit();
  if (m) selectUnit(m, false);
});
renderer.domElement.addEventListener('pointerleave', () => { $('tooltip').style.display = 'none'; state.hovered = null; renderer.domElement.style.cursor = ''; });
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (state.tour) {
    if (e.code === 'Escape') exitTour();
    if (e.code === 'ArrowLeft') state.tour.yaw -= 6;
    if (e.code === 'ArrowRight') state.tour.yaw += 6;
    if (e.code === 'ArrowUp') state.tour.pitch = Math.min(1.3, state.tour.pitch + 0.08);
    if (e.code === 'ArrowDown') state.tour.pitch = Math.max(-1.3, state.tour.pitch - 0.08);
    if (e.code.startsWith('Arrow')) e.preventDefault();
    return;
  }
  if (e.code === 'Escape') { if (state.nav === 'walk') exitWalk(); else if (controls.maxDistance < 5) preset('geral'); else if (state.pickSV) setPickSV(false); else selectUnit(null); }
  walk.keys.add(e.code);
  if (state.nav === 'walk' && e.code.startsWith('Arrow')) e.preventDefault();
});
addEventListener('keyup', e => walk.keys.delete(e.code));

function setPickSV(on) {
  state.pickSV = on;
  stage.classList.toggle('pick', on);
  if (on) showHint('Clique em qualquer ponto do chão para abrir o Street View ali, olhando na direção da câmera'); else hideHint();
}

// ======================================================================
// Controles de UI da maquete
// ======================================================================
function initUI() {
  $('date').value = state.date;
  $('time').value = state.hour;
  $('time').addEventListener('input', e => { state.hour = +e.target.value; updateSun(); });
  $('date').addEventListener('change', e => { if (e.target.value) setDate(e.target.value); });
  $('seasons').querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    const y = state.date.slice(0, 4);
    setDate(b.dataset.d === 'today' ? todayBRT() : `${y}-${b.dataset.d}`);
  }));
  $('play').addEventListener('click', () => {
    state.playing = !state.playing;
    $('play').textContent = state.playing ? '❚❚' : '▶';
    if (state.playing) { const t = sunTimes(state.date, LAT, LON); if (state.hour > t.sunset + 0.8 || state.hour < t.sunrise - 1) state.hour = t.sunrise - 0.6; }
  });
  $('colorMode').querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    state.colorMode = b.dataset.m;
    $('colorMode').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    applyUnitColors();
  }));
  $('presets').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { preset(b.dataset.p); $('layers').classList.add('hidden'); $('layersBtn').setAttribute('aria-expanded', false); }));
  $('tPath').addEventListener('change', e => { sunPathGroup.visible = e.target.checked; });
  $('tSeasons').addEventListener('change', e => { seasonGroup.visible = e.target.checked; });
  $('tNeighbors').addEventListener('change', e => { world.neighbors.visible = e.target.checked; if (world.windows) world.windows.visible = e.target.checked && state.night > 0.03; });
  $('tLabels').addEventListener('change', e => { labelsGroup.visible = e.target.checked; });
  $('tHQ').addEventListener('change', e => { setShadowQuality(e.target.checked); gtao.enabled = e.target.checked; });
  // barra do sol recolhível (fechada por padrão)
  const setSunOpen = open => {
    $('sunbar').classList.toggle('open', open);
    $('view-maquete').classList.toggle('sun-open', open);
    $('sunExpand').title = open ? 'Recolher controles de sol' : 'Mostrar controles de sol e data';
    try { localStorage.setItem('apogeo.sunOpen', open ? '1' : '0'); } catch (e) { /* ok */ }
    if (state.sun) updateSunHud();
  };
  let sunOpen = false;
  try { sunOpen = localStorage.getItem('apogeo.sunOpen') === '1'; } catch (e) { /* ok */ }
  setSunOpen(sunOpen);
  $('sunExpand').addEventListener('click', () => setSunOpen(!$('sunbar').classList.contains('open')));
  // menu de vistas e camadas
  $('layersBtn').addEventListener('click', e => {
    e.stopPropagation();
    const open = $('layers').classList.toggle('hidden') === false;
    $('layersBtn').setAttribute('aria-expanded', open);
  });
  document.addEventListener('pointerdown', e => {
    if (!$('layers').classList.contains('hidden') && !e.target.closest('#layers, #layersBtn')) { $('layers').classList.add('hidden'); $('layersBtn').setAttribute('aria-expanded', false); }
  });
  initPhotoTiles();
  $('unitClose').addEventListener('click', () => selectUnit(null));
  $('compareOpen').addEventListener('click', openCompare);
  $('compareClose').addEventListener('click', closeCompare);
  $('compare').addEventListener('click', e => { if (e.target.id === 'compare') closeCompare(); });
  $('availToggle').addEventListener('click', () => $('availPanel').classList.toggle('collapsed'));
  $('compass').addEventListener('click', () => {
    exitWalk();
    const d = camera.position.distanceTo(controls.target);
    const h = camera.position.y - controls.target.y;
    const flat = Math.sqrt(Math.max(1, d * d - h * h));
    animateCamera(controls.target.clone().add(new THREE.Vector3(0, h, flat)), controls.target.clone(), 0.9);
  });
  if (innerWidth < 900) $('availPanel').classList.add('collapsed');
}
// ---------- entorno fotorrealista (Google 3D Tiles) ----------
let photo = null;
function initPhotoTiles() {
  let key = CONFIG.googleMapsKey || '';
  try { key = key || localStorage.getItem('apogeo.gmapsKey') || ''; } catch (e) { /* ok */ }
  $('tilesKey').value = key;
  // entorno fotorrealista sempre ativo: liga sozinho ao abrir, se houver chave configurada
  if (key) setTimeout(() => enablePhotoTiles(key), 1200);
  $('tilesOn').addEventListener('click', () => {
    const k = $('tilesKey').value.trim();
    if (!k) { $('tilesStatus').textContent = 'Informe uma chave com a Map Tiles API habilitada.'; return; }
    try { localStorage.setItem('apogeo.gmapsKey', k); } catch (e) { /* ok */ }
    enablePhotoTiles(k);
  });
  $('tilesOff').addEventListener('click', disablePhotoTiles);
}
async function enablePhotoTiles(key) {
  if (photo) return;
  $('tilesStatus').textContent = 'Carregando biblioteca…';
  try {
    const { createGoogleTiles } = await import('./tiles.js');
    const front = L2W(8, 0, 0);
    photo = await createGoogleTiles({
      key, lat: LAT, lon: LON, camera, renderer, scene, calibrateAt: front,
      clip: { inverse: apogeo.group.matrixWorld.clone().invert(), min: [-84.5, -14.5], max: [0.5, 14.5] },
      onStatus: (t, err) => { $('tilesStatus').textContent = t; if (err) disablePhotoTiles(true); },
      onReady: () => useGoogleForSun(),
    });
  } catch (e) {
    console.error(e);
    $('tilesStatus').textContent = 'Falha ao carregar o entorno 3D: ' + e.message;
    return;
  }
  setContextVisible(false);
  $('tilesOn').classList.add('hidden'); $('tilesOff').classList.remove('hidden');
}
// A análise de insolação passa a usar a geometria real do Google (prédios, árvores, relevo próximo).
// O Morro do Moreno (560 m) continua vindo do relevo SRTM, que cobre uma área maior.
let googleOcc = null, sunSourceBusy = false;
async function useGoogleForSun() {
  if (!photo || sunSourceBusy) return;
  sunSourceBusy = true;
  setSunSource('loading');
  try {
    const [{ MeshBVH, acceleratedRaycast }, s] = await Promise.all([import('three-mesh-bvh'), photo.survey(LOT_CENTER)]);
    if (!photo) return;
    const t0 = performance.now();
    const geo = photo.snapshot({ center: LOT_CENTER, radius: 450 });
    s.done();
    const tris = geo.attributes.position.count / 3;
    if (tris < 2000) throw new Error('poucos triângulos carregados (' + tris + ')');
    geo.boundsTree = new MeshBVH(geo);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
    mesh.raycast = acceleratedRaycast;
    mesh.userData.tris = tris;
    googleOcc?.geometry.dispose();
    googleOcc = mesh;
    analyzer.setOccluders([...ownOccluders, mesh], 'google');
    console.info(`[insolação] geometria Google: ${tris.toLocaleString('pt-BR')} triângulos, BVH em ${Math.round(performance.now() - t0)} ms`);
    setSunSource('google');
    runAnalysisAll();
  } catch (e) {
    console.warn('[insolação] mantendo OSM:', e);
    setSunSource('osm', 'Não foi possível usar a geometria do Google na análise: ' + e.message);
  } finally {
    sunSourceBusy = false;
  }
}
function setSunSource(src, msg) {
  state.sunSource = src;
  const el = $('sunSource');
  if (el) el.textContent = msg || ({
    loading: 'Insolação: carregando prédios reais do Google…',
    google: `Insolação calculada com prédios reais do Google (${Math.round((googleOcc?.userData.tris || 0) / 1000)} mil triângulos)`,
    osm: 'Insolação calculada com prédios do OpenStreetMap (alturas estimadas)',
  })[src];
  if (state.selected) renderUnitPanel();
  renderLegend();
}
function disablePhotoTiles(keepMsg) {
  photo?.dispose(); photo = null;
  if (googleOcc) {
    googleOcc.geometry.boundsTree = null; googleOcc.geometry.dispose(); googleOcc = null;
    analyzer.setOccluders(osmOccluders, 'osm');
    setSunSource('osm');
    runAnalysisAll();
  }
  setContextVisible(true);
  $('tilesOn').classList.remove('hidden'); $('tilesOff').classList.add('hidden');
  if (keepMsg !== true) $('tilesStatus').textContent = '';
}
function setContextVisible(v) {
  // com o Google 3D Tiles ligado, o entorno simplificado (OSM/SRTM) sai de cena;
  // a análise de insolação continua usando-o como geometria de obstrução.
  for (const o of [world.ground, world.outer, world.neighbors, world.water, world.palms, world.poles, world.bulbs]) if (o) o.visible = v;
  if (world.windows) world.windows.visible = v && state.night > 0.03;
  $('tNeighbors').checked = v; $('tNeighbors').disabled = !v;
}

function initOnboarding() {
  let seen = false;
  try { seen = localStorage.getItem('apogeo.onboarded') === '1'; } catch (e) { /* ok */ }
  if (seen) return;
  const el = document.createElement('div');
  el.className = 'onboard';
  el.innerHTML = `<b>Bem-vindo ao Apogeo</b><span>Arraste para girar a maquete. Clique numa unidade (ou na lista à esquerda) para ver preço, sol e entrar no apartamento.</span><button type="button">Entendi</button>`;
  $('view-maquete').appendChild(el);
  const close = () => { el.remove(); try { localStorage.setItem('apogeo.onboarded', '1'); } catch (e) { /* ok */ } };
  el.querySelector('button').onclick = close;
  renderer.domElement.addEventListener('pointerdown', () => setTimeout(close, 2500), { once: true });
}

// voa até a unidade e anima o dia do nascer ao pôr do sol
function playSunOn(m) {
  flyToUnit(m);
  if (!$('sunbar').classList.contains('open')) $('sunExpand').click();
  const t = sunTimes(state.date, LAT, LON);
  state.hour = t.sunrise - 0.3; state.playing = true; $('play').textContent = '❚❚';
  if (innerWidth < 900) selectUnit(null);
}

function setDate(iso) {
  state.date = iso; $('date').value = iso;
  analyzer.cache.clear();
  buildSunPath(); updateSun(); runAnalysisAll();
  if (state.selected) renderUnitPanel();
}

// ======================================================================
// Abas: Street View, Mapa, Galeria, Sobre
// ======================================================================
function initTabs() {
  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => showTab(t.dataset.tab)));
}
function showTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + name));
  if (name === 'mapa' && !embed.blocked && !$('mapFrame').src) $('mapFrame').src = `https://maps.google.com/maps?q=${LAT},${LON}&t=k&z=18&hl=pt-BR&output=embed`;
  if (name === 'maquete') onResize();
}

const lotFrontWorld = (dist, lateral = 0) => ({ x: SITE.front[0] + ux * dist + SITE.vx[0] * lateral, z: SITE.front[1] + uz * dist + SITE.vx[1] * lateral });
// Street View: link direto para a calçada em frente ao empreendimento, olhando para o prédio
function svLink(ll, heading) { return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${ll.lat},${ll.lng}&heading=${heading}&pitch=0&fov=90`; }
function initSvLink() {
  const p = lotFrontWorld(10);
  $('svLink').href = svLink(toLatLon(p.x, p.z), 281);
}
// Alguns hosts (como a página publicada no claude.ai) bloqueiam iframes via CSP: o mapa vira um cartão com links.
const embed = { blocked: false };
function useEmbedFallback() {
  if (embed.blocked) return;
  embed.blocked = true;
  $('mapFrame').style.display = 'none'; $('mapFallback').classList.remove('hidden');
}
addEventListener('securitypolicyviolation', e => {
  const d = e.effectiveDirective || e.violatedDirective || '';
  if (/frame-src|child-src/.test(d)) useEmbedFallback();
  if (/connect-src|img-src/.test(d) && /googleapis|gstatic/.test(e.blockedURI || '')) {
    $('tilesStatus').textContent = 'Este host bloqueia o Google 3D Tiles. Funciona ao hospedar a página no seu site.';
  }
});

function initMapCard() {
  $('mapCard').innerHTML = `<h3 style="margin-top:0">${PROPERTY.name}</h3>
    <div>${PROPERTY.address} · ${PROPERTY.neighborhood.name}</div><div class="muted">${PROPERTY.city} / ES</div>
    <div class="actions"><a class="btn" target="_blank" rel="noreferrer" href="https://www.google.com/maps/dir/?api=1&destination=${LAT},${LON}">Como chegar</a>
    <a class="btn ghost" target="_blank" rel="noreferrer" href="https://www.google.com/maps/@${LAT},${LON},250a,35y,281h,60t/data=!3m1!1e3">Google Earth 3D ↗</a></div>`;
}

// galeria + lightbox
let lb = { list: [], i: 0, caps: [] };
function openLightbox(list, i, caps) {
  lb = { list, i, caps: caps || [] };
  $('lightbox').classList.remove('hidden'); showLb();
}
function showLb() { $('lbImg').src = IMG(lb.list[lb.i]); $('lbCap').textContent = lb.caps[lb.i] || ''; }
function initGallery() {
  const cats = PROPERTY.categories;
  const all = [], caps = [];
  const order = ['Principal', 'Fachada', 'Área Comum'];
  let html = '<h2 class="gallery-title">Galeria</h2><p class="muted">Imagens e plantas publicadas pela incorporadora (perspectivas ilustrativas).</p>';
  for (const name of order) {
    const c = cats.find(x => x.name === name); if (!c) continue;
    html += `<h3>${name === 'Área Comum' ? 'Áreas comuns e lazer' : name}</h3><div class="grid">`;
    c.images.forEach(im => { html += `<img loading="lazy" src="${IMG(im)}" data-i="${all.length}" alt="${name}">`; all.push(im); caps.push(name); });
    html += '</div>';
  }
  html += '<h3>Plantas</h3><div class="grid plans">';
  cats.filter(c => !order.includes(c.name)).forEach(c => c.images.forEach(im => { html += `<img loading="lazy" src="${IMG(im)}" data-i="${all.length}" alt="${c.name}" title="${c.name}">`; all.push(im); caps.push('Planta · ' + c.name); }));
  html += '</div>';
  $('gallery').innerHTML = html;
  $('gallery').querySelectorAll('img').forEach(img => img.addEventListener('click', () => openLightbox(all, +img.dataset.i, caps)));
  $('lbClose').onclick = () => $('lightbox').classList.add('hidden');
  $('lbPrev').onclick = () => { lb.i = (lb.i - 1 + lb.list.length) % lb.list.length; showLb(); };
  $('lbNext').onclick = () => { lb.i = (lb.i + 1) % lb.list.length; showLb(); };
  $('lightbox').addEventListener('click', e => { if (e.target.id === 'lightbox') $('lightbox').classList.add('hidden'); });
  addEventListener('keydown', e => {
    if ($('lightbox').classList.contains('hidden')) return;
    if (e.code === 'ArrowRight') $('lbNext').click(); if (e.code === 'ArrowLeft') $('lbPrev').click(); if (e.code === 'Escape') $('lbClose').click();
  });
}
function initAbout() {
  const P = PROPERTY;
  const units = P.units, av = units.filter(isAvail);
  const areas = units.map(u => areaNum(u.area));
  $('about').innerHTML = `
    <img class="hero" src="${IMG('c7_0')}" alt="Apogeo Residences">
    <div class="cols"><div>
      <h1>${P.name}</h1>
      <p class="muted">${P.address} · ${P.neighborhood.name} · ${P.city}/ES · ${P.readiness === 'Planta' ? 'Na planta' : P.readiness}</p>
      <p class="about-price">${P.priceRange}</p>
      <p>${P.about}</p>
      <h3>Diferenciais</h3><div class="tags">${P.characteristics.map(c => `<span>${c}</span>`).join('')}</div>
      <h3>O bairro · ${P.neighborhood.name}</h3><p>${P.neighborhood.about}</p>
    </div><div>
      <div class="card facts">
        <div><b>${units.length}</b><span>unidades</span></div>
        <div><b>${av.length}</b><span>disponíveis</span></div>
        <div><b>15</b><span>pavimentos</span></div>
        <div><b>${Math.round(Math.min(...areas))}–${Math.round(Math.max(...areas))}</b><span>m² privativos</span></div>
      </div>
      <div class="card"><h3 style="margin-top:0">Construtora</h3><b>${P.company.name}</b><p class="muted" style="font-size:12.5px">${P.company.about}</p></div>
      <p class="fine">Fonte: <a href="${P.source}" target="_blank" rel="noreferrer">vempravimo.com.br</a>. Maquete 3D ilustrativa, baseada nas perspectivas, plantas e tabela de unidades; entorno do OpenStreetMap/Google e relevo SRTM.</p>
    </div></div>
    <div class="gallery" id="gallery"></div>`;
}

// ======================================================================
// Loop
// ======================================================================
function onResize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  if (!w || !h) return;
  camera.aspect = w / h; camera.updateProjectionMatrix();
  renderer.setSize(w, h); composer.setSize(w, h); labelRenderer.setSize(w, h);
  bloom.resolution.set(w / 2, h / 2);
}
addEventListener('resize', onResize);

const clock = new THREE.Clock();
const camDir = new THREE.Vector3();
function frame() {
  requestAnimationFrame(frame);
  tick();
}
function tick() {
  if (!$('view-maquete').classList.contains('active')) return;
  const dt = Math.min(0.05, clock.getDelta());
  if (state.playing) {
    const t = sunTimes(state.date, LAT, LON);
    state.hour += dt * 0.55;
    if (state.hour > t.sunset + 1.2) state.hour = t.sunrise - 0.6;
    $('time').value = state.hour;
    updateSun();
  }
  if (camAnim) {
    const k = Math.min(1, (performance.now() - camAnim.start) / camAnim.dur), e = k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2;
    camera.position.lerpVectors(camAnim.p0, camAnim.p1, e);
    controls.target.lerpVectors(camAnim.t0, camAnim.t1, e);
    if (k >= 1) camAnim = null;
  }
  if (state.tour) {
    state.tour.update();
    if (lastMapYaw === null || Math.abs(lastMapYaw - state.tour.yaw) > 0.8 || state.tour.anim) { drawTourMap(); lastMapYaw = state.tour.yaw; }
  } else if (state.nav === 'walk') updateWalk(dt); else controls.update();
  photo?.update();
  // destaque pulsante da unidade selecionada / hover
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 260);
  for (const m of unitMeshes) {
    if (m === state.selected) { m.material.emissive.copy(C_GOLD); m.material.emissiveMap = FT.white; m.material.emissiveIntensity = 0.35 + 0.45 * pulse; m.userData.hoverPainted = true; }
    else if (m === state.hovered) {
      // disponível acende em amarelo (livre); vendida só clareia
      if (isAvail(m.userData.unit)) { m.material.color.copy(C_HOVER_FREE); m.material.emissive.copy(C_HOVER_FREE); m.material.emissiveMap = FT.white; m.material.emissiveIntensity = 0.8; m.material.opacity = 1; }
      else { m.material.emissive.copy(C_HOVER_SOLD); m.material.emissiveIntensity = 0.25; }
      m.userData.hoverPainted = true;
    }
    else if (m.userData.hoverPainted) { m.userData.hoverPainted = false; applyUnitColors(); }
    else if (m.userData.baseEmissive) { m.material.emissive.copy(m.userData.baseEmissive); m.material.emissiveIntensity = m.userData.baseEI; }
  }
  world.water.material.uniforms.time.value += dt * 0.6;
  // etiquetas: todas no modo Disponibilidade; no Realista, só a da unidade disponível sob o mouse
  for (const o of pinsGroup.children) o.visible = state.colorMode === 'disp' || o.userData.unit === state.hovered || o.userData.unit === state.selected;
  camera.getWorldDirection(camDir);
  $('needle').style.transform = `rotate(${-bearingOf(camDir)}deg)`;
  composer.render();
  labelRenderer.render(scene, camera);
}

// ======================================================================
// Boot
// ======================================================================
$('brandSub').textContent = `${PROPERTY.neighborhood.name} · ${PROPERTY.city}/ES · ${PROPERTY.priceRange.replace('A partir de', 'a partir de')}`;
renderAvailability();
initUI(); initTourUI(); initTabs(); initOnboarding(); initSvLink(); initMapCard(); initAbout(); initGallery();
buildSunPath(); buildSeasonPaths();
onResize();
camera.position.copy(LOT_CENTER).addScaledVector(bearingVec(125), 420).setY(260);
controls.target.copy(LOT_CENTER).setY(20);
updateSun();
updateEnv(tmpDir.clone(), true);
preset('geral');
frame();
setTimeout(() => $('loading').classList.add('done'), 400);
runAnalysisAll();
buildPins();
// link direto para uma unidade: ...#901 abre a ficha dela
function openFromHash() {
  const id = (location.hash || '').replace('#', '');
  const m = unitByName.get(id);
  if (m) { showTab('maquete'); selectUnit(m, true); }
}
setTimeout(openFromHash, 900);
addEventListener('hashchange', openFromHash);

// exposto para depuração no console
window.apogeo = { enterTour: n => enterTour(unitByName.get(String(n))), exitTour, enablePhotoTiles, tick, preset, state, sunLight, hemi, renderer, world, scene, camera, controls, unitMeshes, analyzer, setDate, selectUnit: n => selectUnit(unitByName.get(String(n)), true) };
