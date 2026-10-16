// Entorno: relevo (SRTM), textura do solo pintada a partir do OSM, prédios vizinhos extrudados e mar.
import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';

export const SEA_LEVEL = -3.9; // nível do mar relativo ao térreo do Apogeo

export function makeHeightSampler(TERRAIN) {
  const { n, size, h } = TERRAIN, half = size / 2, step = size / (n - 1);
  return (x, z) => {
    const fx = Math.min(n - 1.001, Math.max(0, (x + half) / step));
    const fz = Math.min(n - 1.001, Math.max(0, (z + half) / step));
    const i = Math.floor(fx), j = Math.floor(fz), tx = fx - i, tz = fz - j;
    const a = h[j * n + i], b = h[j * n + i + 1], c = h[(j + 1) * n + i], d = h[(j + 1) * n + i + 1];
    return a * (1 - tx) * (1 - tz) + b * tx * (1 - tz) + c * (1 - tx) * tz + d * tx * tz;
  };
}

function pointInPoly(x, z, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c;
  }
  return c;
}

export function buildContext(SITE, TERRAIN, renderer) {
  const group = new THREE.Group();
  const B = SITE.box;
  const heightAt0 = makeHeightSampler(TERRAIN);
  const landPoly = [...SITE.coast, [-B, -B], [-B, B]];
  const isLand = (x, z) => pointInPoly(x, z, landPoly) || SITE.islands.some(p => pointInPoly(x, z, p));
  // o lote do Apogeo é aplainado em 0 (o SRTM tem ruído de ±2 m em área urbana)
  const heightAt = (x, z) => {
    let h = heightAt0(x, z);
    const d = Math.hypot(x + 45, z + 9);
    if (d < 140) h = h * Math.min(1, Math.max(0, (d - 70) / 70));
    if (!isLand(x, z)) h = Math.min(h, SEA_LEVEL - 2.5);
    return h;
  };

  // ---------- textura do solo ----------
  const TEX = 2048, cv = document.createElement('canvas');
  cv.width = cv.height = TEX;
  const ctx = cv.getContext('2d');
  const s = TEX / (2 * B);
  const P = ([x, z]) => [(x + B) * s, (z + B) * s];
  const path = (pts, close = true) => {
    ctx.beginPath(); pts.forEach((p, i) => { const [a, b] = P(p); i ? ctx.lineTo(a, b) : ctx.moveTo(a, b); });
    if (close) ctx.closePath();
  };
  // fundo do mar
  ctx.fillStyle = '#b9a984'; ctx.fillRect(0, 0, TEX, TEX);
  // terra: tonalidade por altura (morros com mata atlântica)
  const small = document.createElement('canvas'); small.width = small.height = 256;
  const sctx = small.getContext('2d'), img = sctx.createImageData(256, 256);
  for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) {
    const x = -B + (i + 0.5) / 256 * 2 * B, z = -B + (j + 0.5) / 256 * 2 * B, hh = heightAt0(x, z);
    const t = Math.min(1, Math.max(0, (hh - 6) / 30));
    const k = (j * 256 + i) * 4;
    img.data[k] = 205 * (1 - t) + 78 * t; img.data[k + 1] = 198 * (1 - t) + 108 * t; img.data[k + 2] = 182 * (1 - t) + 62 * t; img.data[k + 3] = 255;
  }
  sctx.putImageData(img, 0, 0);
  ctx.save(); path(landPoly); SITE.islands.forEach(p => { path(p); }); ctx.clip();
  ctx.drawImage(small, 0, 0, TEX, TEX);
  ctx.restore();
  ctx.fillStyle = '#7d9a5e'; SITE.green.forEach(p => { path(p); ctx.fill(); });
  ctx.fillStyle = '#ead9b0'; SITE.beach.forEach(p => { path(p); ctx.fill(); });
  ctx.fillStyle = '#5fa7b8'; SITE.pools.forEach(p => { path(p); ctx.fill(); });
  // ruas: calçada + asfalto
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const order = ['footway', 'path', 'track', 'pedestrian', 'service', 'residential', 'tertiary', 'cycleway'];
  const sorted = [...SITE.roads].sort((a, b) => order.indexOf(a.t) - order.indexOf(b.t));
  for (const r of sorted) {
    if (['footway', 'path', 'track', 'pedestrian'].includes(r.t)) {
      ctx.strokeStyle = '#d8cfbd'; ctx.lineWidth = r.w * s; path(r.p, false); ctx.stroke(); continue;
    }
    if (r.t === 'cycleway') { ctx.strokeStyle = '#a5544a'; ctx.lineWidth = r.w * s; path(r.p, false); ctx.stroke(); continue; }
    ctx.strokeStyle = '#c9c2b4'; ctx.lineWidth = (r.w + 4) * s; path(r.p, false); ctx.stroke();
  }
  for (const r of sorted) {
    if (['footway', 'path', 'track', 'pedestrian', 'cycleway'].includes(r.t)) continue;
    ctx.strokeStyle = '#4b4d50'; ctx.lineWidth = r.w * s; path(r.p, false); ctx.stroke();
  }
  ctx.setLineDash([3 * s, 4 * s]); ctx.strokeStyle = 'rgba(240,240,230,.7)'; ctx.lineWidth = 0.18 * s;
  for (const r of sorted) if (r.t === 'tertiary') { path(r.p, false); ctx.stroke(); }
  ctx.setLineDash([]);
  // calçadão de pedra portuguesa na orla
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

  // ---------- malha do relevo ----------
  const SEG = 260;
  const geo = new THREE.PlaneGeometry(2 * B, 2 * B, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, heightAt(pos.getX(i), pos.getZ(i)));
  geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
  ground.receiveShadow = true; ground.castShadow = true;
  ground.userData.occluder = false; // relevo tratado por marcha no mapa de altura (mais rápido)
  ground.name = 'ground';
  group.add(ground);

  // continente além do recorte (evita "mar" no horizonte oeste)
  const outer = new THREE.Mesh(new THREE.PlaneGeometry(6000, 9000), new THREE.MeshStandardMaterial({ color: 0xb9b19f, roughness: 1 }));
  outer.rotation.x = -Math.PI / 2; outer.position.set(-B - 3000 + 2, -0.6, 0);
  outer.receiveShadow = true; outer.userData.occluder = false;
  group.add(outer);

  // ---------- prédios vizinhos ----------
  // fachada procedural: módulo de 3,2 m × 3,1 m (janela + parede + friso de laje), repetido em metros
  const facadeTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#ece8e1'; g.fillRect(0, 0, 128, 128);
    const grad = g.createLinearGradient(0, 30, 0, 100);
    grad.addColorStop(0, '#7f95a6'); grad.addColorStop(1, '#4f6474');
    g.fillStyle = grad; g.fillRect(14, 30, 100, 66);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(14, 30, 100, 6);
    g.fillStyle = '#d9d3c9'; g.fillRect(0, 112, 128, 16);
    g.fillStyle = '#c9c2b6'; g.fillRect(62, 30, 4, 66);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / 3.2, 1 / 3.1); t.anisotropy = 8;
    return t;
  })();
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xcfcac2, roughness: 0.95 });
  const nbMat = [roofMat, new THREE.MeshStandardMaterial({ map: facadeTex, roughness: 0.75, metalness: 0.05 })];
  const nbMatEst = [roofMat, new THREE.MeshStandardMaterial({ map: facadeTex, color: 0xe4e8ef, roughness: 0.75, metalness: 0.05 })];
  const houseMat = [new THREE.MeshStandardMaterial({ color: 0xb5674e, roughness: 0.9 }), new THREE.MeshStandardMaterial({ color: 0xefe7da, roughness: 0.9 })];
  const winMat = new THREE.MeshStandardMaterial({ color: 0x0, emissive: 0xffc979, emissiveIntensity: 0, roughness: 1 });
  const neighbors = new THREE.Group(); neighbors.name = 'vizinhos';
  const winGeoms = [];
  for (const b of SITE.buildings) {
    if (b.p.length < 3) continue;
    const shape = new THREE.Shape(b.p.map(([x, z]) => new THREE.Vector2(x, z)));
    let base = Infinity;
    b.p.forEach(([x, z]) => { base = Math.min(base, heightAt(x, z)); });
    const g = new THREE.ExtrudeGeometry(shape, { depth: b.h + 1, bevelEnabled: false });
    g.rotateX(Math.PI / 2); g.translate(0, base + b.h, 0);
    const m = new THREE.Mesh(g, b.h <= 8 ? houseMat : (b.est ? nbMatEst : nbMat));
    m.castShadow = m.receiveShadow = true;
    m.userData = { occluder: true, neighbor: b };
    neighbors.add(m);
    // faixas de janelas (acesas à noite) em prédios altos
    if (b.h > 12) {
      for (let i = 0; i < b.p.length; i++) {
        const a = b.p[i], c = b.p[(i + 1) % b.p.length], L = Math.hypot(c[0] - a[0], c[1] - a[1]);
        if (L < 6) continue;
        const nx = -(c[1] - a[1]) / L, nz = (c[0] - a[0]) / L;
        for (let y = base + 4; y < base + b.h - 2; y += 3.1) {
          if (Math.random() < 0.45) continue;
          const w = L * (0.3 + Math.random() * 0.5);
          const pg = new THREE.PlaneGeometry(w, 1.3);
          const ang = Math.atan2(c[0] - a[0], c[1] - a[1]) - Math.PI / 2;
          pg.rotateY(ang);
          const t = 0.2 + Math.random() * 0.6;
          pg.translate(a[0] + (c[0] - a[0]) * t, y, a[1] + (c[1] - a[1]) * t);
          winGeoms.push({ g: pg, n: [nx, nz] });
        }
      }
    }
  }
  group.add(neighbors);
  // janelas: duas faces (sentido da normal pode estar invertido conforme o polígono do OSM)
  let windows = null;
  if (winGeoms.length) {
    windows = new THREE.Group();
    const wm = winMat.clone(); wm.side = THREE.DoubleSide; wm.polygonOffset = true; wm.polygonOffsetFactor = -2;
    winGeoms.forEach(({ g, n }) => { g.translate(n[0] * -0.08, 0, n[1] * -0.08); });
    const merged = mergeAll(winGeoms.map(w => w.g));
    const mesh = new THREE.Mesh(merged, wm);
    mesh.userData.occluder = false;
    windows.add(mesh);
    windows.userData.material = wm;
    windows.visible = false;
    group.add(windows);
  }

  // ---------- mar ----------
  const waterNormals = new THREE.TextureLoader().load('assets/waternormals.jpg', t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; });
  const water = new Water(new THREE.PlaneGeometry(6000, 6000), {
    textureWidth: 512, textureHeight: 512, waterNormals,
    sunDirection: new THREE.Vector3(0, 1, 0), sunColor: 0xffffff, waterColor: 0x0d4f63, distortionScale: 2.2, fog: false,
  });
  water.rotation.x = -Math.PI / 2;
  water.position.y = SEA_LEVEL;
  water.material.uniforms.size.value = 6;
  water.userData.occluder = false;
  group.add(water);

  // ---------- coqueiros no calçadão da orla (instanciados) ----------
  const palmSpots = [];
  for (const r of SITE.roads) {
    if (r.n !== 'Avenida Antônio Gil Veloso' || r.t !== 'cycleway') continue;
    for (let i = 1; i < r.p.length; i++) {
      const a = r.p[i - 1], c = r.p[i], L = Math.hypot(c[0] - a[0], c[1] - a[1]);
      let nx = -(c[1] - a[1]) / L, nz = (c[0] - a[0]) / L;
      if (nx < 0) { nx = -nx; nz = -nz; } // lado do mar (leste)
      for (let t = 0; t < L; t += 13) {
        const x = a[0] + (c[0] - a[0]) * t / L + nx * 5, z = a[1] + (c[1] - a[1]) * t / L + nz * 5;
        if (Math.hypot(x, z) < 520 && isLand(x, z)) palmSpots.push([x, z]);
      }
    }
  }
  const palms = makePalmInstances(palmSpots, heightAt);
  if (palms) group.add(palms);

  // ---------- postes de iluminação ao longo da orla e ruas principais ----------
  const lampPositions = [];
  for (const r of SITE.roads) {
    if (!['tertiary', 'residential'].includes(r.t)) continue;
    let acc = 0;
    for (let i = 1; i < r.p.length; i++) {
      const a = r.p[i - 1], c = r.p[i], L = Math.hypot(c[0] - a[0], c[1] - a[1]);
      const nx = -(c[1] - a[1]) / L, nz = (c[0] - a[0]) / L;
      for (let t = (25 - acc); t < L; t += 25) {
        const x = a[0] + (c[0] - a[0]) * t / L + nx * (r.w / 2 + 1), z = a[1] + (c[1] - a[1]) * t / L + nz * (r.w / 2 + 1);
        if (Math.abs(x) < B - 20 && Math.abs(z) < B - 20) lampPositions.push([x, heightAt(x, z), z]);
      }
      acc = (acc + L) % 25;
    }
  }
  const poleGeo = new THREE.CylinderGeometry(0.07, 0.1, 7, 5); poleGeo.translate(0, 3.5, 0);
  const bulbGeo = new THREE.SphereGeometry(0.28, 8, 6); bulbGeo.translate(0, 7, 0);
  const poles = new THREE.InstancedMesh(poleGeo, new THREE.MeshStandardMaterial({ color: 0x55585c }), lampPositions.length);
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffd9a0, emissiveIntensity: 0 });
  const bulbs = new THREE.InstancedMesh(bulbGeo, bulbMat, lampPositions.length);
  const mtx = new THREE.Matrix4();
  lampPositions.forEach((p, i) => { mtx.makeTranslation(p[0], p[1], p[2]); poles.setMatrixAt(i, mtx); bulbs.setMatrixAt(i, mtx); });
  poles.castShadow = true;
  group.add(poles, bulbs);

  return { group, ground, outer, neighbors, water, windows, palms, poles, bulbs, bulbMat, heightAt, isLand, groundTexture: tex };
}

function makePalmInstances(spots, heightAt) {
  if (!spots.length) return null;
  const trunk = new THREE.CylinderGeometry(0.14, 0.24, 1, 7); trunk.translate(0, 0.5, 0);
  const leaves = [];
  for (let i = 0; i < 9; i++) {
    const leaf = new THREE.PlaneGeometry(0.9, 3.4, 1, 4); leaf.translate(0, 1.7, 0);
    const pos = leaf.attributes.position;
    for (let k = 0; k < pos.count; k++) { const y = pos.getY(k); pos.setZ(k, -0.13 * y * y); }
    leaf.rotateX(-0.95 - (i % 3) * 0.15); leaf.rotateY(i / 9 * Math.PI * 2);
    leaves.push(leaf);
  }
  const crown = mergeAll(leaves.map(l => { l.computeVertexNormals(); return l.index ? l : l; }));
  const tMesh = new THREE.InstancedMesh(trunk, new THREE.MeshStandardMaterial({ color: 0x8b7a63, roughness: 0.95 }), spots.length);
  const cMesh = new THREE.InstancedMesh(crown, new THREE.MeshStandardMaterial({ color: 0x4d7a34, roughness: 0.8, side: THREE.DoubleSide }), spots.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3();
  spots.forEach(([x, z], i) => {
    const h = 7 + Math.random() * 4, y = heightAt(x, z);
    const tilt = new THREE.Euler((Math.random() - 0.5) * 0.12, Math.random() * 6.28, (Math.random() - 0.5) * 0.12);
    q.setFromEuler(tilt);
    m.compose(p.set(x, y, z), q, sc.set(1, h, 1)); tMesh.setMatrixAt(i, m);
    const top = new THREE.Vector3(0, h, 0).applyQuaternion(q);
    m.compose(p.set(x + top.x, y + top.y, z + top.z), q, sc.set(1, 1, 1)); cMesh.setMatrixAt(i, m);
  });
  tMesh.castShadow = cMesh.castShadow = true;
  const g = new THREE.Group(); g.add(tMesh, cMesh); g.name = 'coqueiros';
  return g;
}

function mergeAll(geoms) {
  let total = 0; geoms.forEach(g => { total += g.attributes.position.count; });
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), idx = [];
  let off = 0;
  for (const g of geoms) {
    const gi = g.index ? g.index.array : null;
    pos.set(g.attributes.position.array, off * 3); nor.set(g.attributes.normal.array, off * 3);
    if (gi) for (let i = 0; i < gi.length; i++) idx.push(gi[i] + off);
    off += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setIndex(idx);
  return out;
}
