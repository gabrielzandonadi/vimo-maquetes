// Análise de insolação por unidade: para cada instante do dia verifica se o sol atinge as varandas
// (fachada voltada para o sol + raio livre até o sol, considerando o próprio edifício, vizinhos e relevo).
import * as THREE from 'three';
import { sunPosition, sunVector, localToDate, sunTimes } from './sun.js';

const STEP_MIN = 10;

export class SunAnalyzer {
  constructor({ lat, lon, occluders, heightAt, group }) {
    this.lat = lat; this.lon = lon;
    this.occluders = occluders;
    this.heightAt = heightAt;
    this.group = group;
    this.ray = new THREE.Raycaster();
    this.ray.far = 1500;
    this.ray.firstHitOnly = true; // usado pelo three-mesh-bvh (raycast acelerado)
    this.source = 'osm';
    this.cache = new Map();
    this._q = new THREE.Quaternion();
  }

  // troca a geometria de obstrução (ex.: OSM → Google 3D Tiles) e invalida os resultados
  setOccluders(list, source) {
    this.occluders = list;
    this.source = source;
    for (const k of [...this.cache.keys()]) if (!k.startsWith('steps:')) this.cache.delete(k);
  }

  daySteps(isoDay) {
    const key = 'steps:' + isoDay;
    if (this.cache.has(key)) return this.cache.get(key);
    const t = sunTimes(isoDay, this.lat, this.lon);
    const steps = [];
    for (let m = Math.floor(t.sunrise * 60 / STEP_MIN) * STEP_MIN; m <= t.sunset * 60; m += STEP_MIN) {
      const h = m / 60;
      const p = sunPosition(localToDate(isoDay, h), this.lat, this.lon);
      if (p.elevation <= 0.3) continue;
      const v = sunVector(p.azimuth, p.elevation);
      steps.push({ h, az: p.azimuth, el: p.elevation, dir: new THREE.Vector3(v.x, v.y, v.z) });
    }
    const res = { steps, times: t };
    this.cache.set(key, res);
    return res;
  }

  terrainBlocks(p, dir) {
    if (dir.y > 0.45) return false; // acima de ~27° nenhum morro do entorno bloqueia
    for (let d = 15; d < 1300; d += 8) {
      const x = p.x + dir.x * d, y = p.y + dir.y * d, z = p.z + dir.z * d;
      if (y > 200) return false;
      if (this.heightAt(x, z) > y) return true;
    }
    return false;
  }

  occluded(p, dir) {
    this.ray.set(p, dir);
    for (const o of this.occluders) {
      if (this.ray.intersectObject(o, false).length) return true;
    }
    return this.terrainBlocks(p, dir);
  }

  analyzeUnit(mesh, isoDay) {
    if (this.bake && !this.baking) { const r = this.bakedUnit(mesh, isoDay); if (r) return r; }
    const key = mesh.uuid + ':' + isoDay;
    if (this.cache.has(key)) return this.cache.get(key);
    const { steps, times } = this.daySteps(isoDay);
    this.group.updateMatrixWorld(true);
    this.group.getWorldQuaternion(this._q);
    const samples = mesh.userData.samples.map(s => ({
      side: s.side,
      p: this.group.localToWorld(new THREE.Vector3(...s.p)),
      n: new THREE.Vector3(...s.n).applyQuaternion(this._q),
    }));
    const sides = [...new Set(samples.map(s => s.side))];
    const perStep = steps.map(st => {
      let lit = 0; const litSides = new Set();
      for (const s of samples) {
        if (s.n.dot(st.dir) < 0.04) continue;
        if (this.occluded(s.p, st.dir)) continue;
        lit++; litSides.add(s.side);
      }
      return { frac: lit / samples.length, sides: [...litSides] };
    });
    const res = summarize(steps, times, sides, perStep);
    this.cache.set(key, res);
    return res;
  }

  // ---------- insolação pré-calculada ----------
  // O cálculo com a geometria real do Google (centenas de milhares de triângulos) é feito uma vez,
  // offline, e publicado num JSON pequeno. No navegador do visitante só lemos o resultado:
  // nada de levantamento de tiles nem BVH na abertura.
  useBake(bake) {
    this.bake = bake; this.source = 'google';
    this.bakeDays = bake.days.map(d => [d, doy(d)]);
    for (const k of [...this.cache.keys()]) if (!k.startsWith('steps:')) this.cache.delete(k);
  }
  bakedUnit(mesh, isoDay) {
    const B = this.bake, u = B && B.units[mesh.userData.unit.name];
    if (!u) return null;
    const key = mesh.uuid + ':' + isoDay;
    if (this.cache.has(key)) return this.cache.get(key);
    const t = doy(isoDay.slice(5));
    let best = this.bakeDays[0], bd = 999;
    for (const d of this.bakeDays) { const dd = Math.min(Math.abs(d[1] - t), 365 - Math.abs(d[1] - t)); if (dd < bd) { bd = dd; best = d; } }
    const [start, hex] = u.d[best[0]];
    const { steps, times } = this.daySteps(isoDay);
    const perStep = steps.map(st => {
      const i = Math.round((Math.round(st.h * 60) - start) / B.step);
      const b = i >= 0 && i * 2 < hex.length ? parseInt(hex.substr(i * 2, 2), 16) : 0;
      return { frac: (b >> 4) / 15, sides: u.sides.filter((_, k) => b & (1 << k)) };
    });
    const res = summarize(steps, times, u.sides, perStep);
    this.cache.set(key, res);
    return res;
  }
  // gera o registro pré-calculado de uma unidade num dia (usado pela página em modo ?bake)
  encodeUnitDay(mesh, isoDay) {
    const r = this.analyzeUnit(mesh, isoDay);
    const sides = [...new Set(mesh.userData.samples.map(s => s.side))];
    const tl = r.timeline;
    if (!tl.length) return { sides, rec: [0, ''] };
    const start = Math.round(tl[0].h * 60);
    let hex = '';
    for (const t of tl) {
      let b = Math.round(t.frac * 15) << 4;
      t.sides.forEach(sd => { b |= 1 << sides.indexOf(sd); });
      hex += b.toString(16).padStart(2, '0');
    }
    hex = hex.replace(/(00)+$/, '');
    return { sides, rec: [start, hex] };
  }
}

const doy = mmdd => { const [m, d] = mmdd.split('-').map(Number); return Math.round((Date.UTC(2026, m - 1, d) - Date.UTC(2026, 0, 1)) / 864e5); };

function summarize(steps, times, sides, perStep) {
    const timeline = [];         // por passo: fração das amostras ensolaradas
    const sideMinutes = Object.fromEntries(sides.map(s => [s, 0]));
    const sideRanges = Object.fromEntries(sides.map(s => [s, []]));
    let morning = 0, afternoon = 0;
    steps.forEach((st, i) => {
      const { frac, sides: litList } = perStep[i];
      const litSides = new Set(litList);
      timeline.push({ h: st.h, frac, sides: litList });
      if (litSides.size) {
        if (st.h < times.noon) morning += STEP_MIN; else afternoon += STEP_MIN;
      }
      for (const sd of litSides) {
        sideMinutes[sd] += STEP_MIN;
        const r = sideRanges[sd], last = r[r.length - 1];
        if (last && Math.abs(last[1] - st.h) <= STEP_MIN / 60 + 1e-6) last[1] = st.h + STEP_MIN / 60;
        else r.push([st.h, st.h + STEP_MIN / 60]);
      }
    });
    return { timeline, morning, afternoon, total: morning + afternoon, sideMinutes, sideRanges, times };
}
