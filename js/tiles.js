// Entorno fotorrealista: Google Photorealistic 3D Tiles via 3d-tiles-renderer (NASA-AMMOS).
// Requer uma chave Google Maps Platform com a "Map Tiles API" habilitada.
// Carregado sob demanda (import dinâmico) para não pesar quando desligado.
import * as THREE from 'three';

const D2R = Math.PI / 180;

export async function createGoogleTiles({ key, lat, lon, camera, renderer, scene, calibrateAt, clip, onStatus, onReady, quality = {} }) {
  const [{ TilesRenderer }, plugins, { DRACOLoader }] = await Promise.all([
    import('3d-tiles-renderer'),
    import('3d-tiles-renderer/plugins'),
    import('three/addons/loaders/DRACOLoader.js'),
  ]);
  const { GoogleCloudAuthPlugin, ReorientationPlugin, TileCompressionPlugin, TilesFadePlugin, GLTFExtensionsPlugin } = plugins;

  const tiles = new TilesRenderer();
  tiles.registerPlugin(new GoogleCloudAuthPlugin({ apiToken: key, autoRefreshToken: true }));
  tiles.registerPlugin(new TileCompressionPlugin());
  tiles.registerPlugin(new TilesFadePlugin());
  const draco = new DRACOLoader().setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
  tiles.registerPlugin(new GLTFExtensionsPlugin({ dracoLoader: draco }));
  // ENU com +y para cima: leste = +x, norte = -z (mesmo sistema da maquete)
  tiles.registerPlugin(new ReorientationPlugin({ lat: lat * D2R, lon: lon * D2R, height: 0, up: '+y', recenter: true }));
  // erro de tela tolerado (px): 6 na qualidade alta já é nítido; 10–16 nas máquinas fracas
  // reduz muito a quantidade de tiles baixados e desenhados
  tiles.errorTarget = quality.tilesError ?? 6;
  // ?et=N força o erro de tela (para comparar qualidade × volume); __tiles fica exposto para os testes
  const QS = new URLSearchParams(location.search);
  if (QS.has('et')) tiles.errorTarget = +QS.get('et');
  window.__tiles = tiles;
  let castShadows = quality.tilesShadow ?? true;
  let lastActivity = performance.now();
  const bump = () => { lastActivity = performance.now(); };
  tiles.addEventListener('load-model', bump);
  tiles.addEventListener('tile-visibility-change', bump);
  tiles.addEventListener('dispose-model', bump);
  tiles.setCamera(camera);
  tiles.setResolutionFromRenderer(camera, renderer);

  // texturas fotogramétricas vêm sem iluminação; convertemos para PBR para receberem a sombra do sol simulado
  tiles.addEventListener('load-model', ({ scene: s }) => {
    s.traverse(o => {
      if (!o.isMesh) return;
      const old = o.material;
      // os tiles do Google vêm sem normais: sem elas o material PBR fica preto
      if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals();
      o.material = new THREE.MeshStandardMaterial({ map: old.map, roughness: 0.95, metalness: 0 });
      if (clip) applyClip(o.material, clip);
      old.dispose();
      o.castShadow = castShadows;
      o.receiveShadow = true;
    });
  });

  const holder = new THREE.Group();
  // com up '+y' o plugin entrega leste em -x / norte em +z; giramos 180° para o sistema da maquete
  // (leste +x, norte -z). Conferido por raycast: o mar fica a leste do lote.
  holder.rotation.y = Math.PI;
  holder.add(tiles.group);
  holder.visible = false; // só aparece calibrado (antes disso o entorno simplificado segue na tela)
  scene.add(holder);

  let loaded = 0, failed = false, calibrated = false, lastOffset = null, stable = 0;
  tiles.addEventListener('load-tile-set', () => { if (!calibrated) onStatus?.('Carregando entorno 3D do Google…'); });
  tiles.addEventListener('load-model', () => { loaded++; });
  tiles.addEventListener('load-error', ({ error, url }) => {
    if (failed) return;
    if (String(url || '').includes('root.json') || /\b4\d\d\b/.test(String(error))) {
      failed = true;
      onStatus?.('Não foi possível carregar: verifique se a chave tem a Map Tiles API habilitada.', true);
    }
  });

  // Ajusta a altura: a avenida em frente ao lote deve ficar em y = 0 (térreo da maquete).
  // Só aceita medições plausíveis (os primeiros tiles são grosseiros, em escala de globo)
  // e repete até três leituras seguidas concordarem.
  const ray = new THREE.Raycaster();
  const down = new THREE.Vector3(0, -1, 0);
  function calibrate() {
    holder.updateMatrixWorld(true);
    const ys = [];
    for (const [dx, dz] of [[0, 0], [3, 4], [-3, -4], [2, -6], [-2, 6]]) {
      ray.set(new THREE.Vector3(calibrateAt.x + dx, 300, calibrateAt.z + dz), down);
      const hit = ray.intersectObject(tiles.group, true)[0];
      if (hit && Math.abs(hit.point.y) < 80) ys.push(hit.point.y);
    }
    if (ys.length < 3) return;
    ys.sort((a, b) => a - b);
    const y = ys[Math.floor(ys.length / 2)];
    const offset = holder.position.y - y;
    if (lastOffset !== null && Math.abs(offset - lastOffset) < 0.3) stable++; else stable = 0;
    lastOffset = offset;
    holder.position.y = offset;
    if (stable >= 2) {
      calibrated = true;
      holder.visible = true;
      onStatus?.('Entorno fotorrealista ativo · dados do mapa © Google');
      onReady?.();
    }
  }
  let frame = 0;

  // ---------- geometria real para a análise de insolação ----------
  // O renderer só carrega o que alguma câmera vê. Para cobrir o entorno inteiro do lote,
  // adicionamos por alguns segundos uma câmera de levantamento olhando de cima.
  async function survey(center, { height = 650, fov = 64, timeout = 25000 } = {}) {
    const cam = new THREE.PerspectiveCamera(fov, 1, 1, 5000);
    cam.position.set(center.x, height, center.z + 0.01);
    cam.lookAt(center.x, 0, center.z);
    cam.updateMatrixWorld();
    tiles.setCamera(cam);
    tiles.setResolution(cam, 1400, 1400);
    const t0 = performance.now();
    await new Promise(res => {
      let idleFrames = 0;
      const tick = () => {
        // a atualização do renderer acontece no loop principal (update()); aqui só esperamos a fila esvaziar
        if (tiles.loadProgress >= 1) idleFrames++; else idleFrames = 0;
        if (idleFrames > 20 || performance.now() - t0 > timeout) res(); else setTimeout(tick, 100);
      };
      setTimeout(tick, 400);
    });
    return { cam, done: () => tiles.deleteCamera(cam) };
  }

  // Copia em coordenadas de mundo os triângulos visíveis num raio em volta do lote,
  // descartando os que estão dentro do lote (construção atual).
  function snapshot({ center, radius = 450 }) {
    holder.updateMatrixWorld(true);
    const CH = 1 << 20, chunks = [];
    let cur = new Float32Array(CH), len = 0;
    const put = x => { if (len === CH) { chunks.push(cur); cur = new Float32Array(CH); len = 0; } cur[len++] = x; };
    const v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
    const lp = new THREE.Vector3();
    const r2 = radius * radius;
    const inLot = p => {
      if (!clip) return false;
      lp.copy(p).applyMatrix4(clip.inverse);
      return lp.x > clip.min[0] - 0.5 && lp.x < clip.max[0] + 0.5 && lp.z > clip.min[1] - 0.5 && lp.z < clip.max[1] + 0.5 && lp.y > -2;
    };
    tiles.group.traverseVisible(o => {
      if (!o.isMesh) return;
      const pos = o.geometry.attributes.position, idx = o.geometry.index;
      const n = idx ? idx.count : pos.count;
      for (let i = 0; i < n; i += 3) {
        for (let k = 0; k < 3; k++) v[k].fromBufferAttribute(pos, idx ? idx.getX(i + k) : i + k).applyMatrix4(o.matrixWorld);
        const cx = (v[0].x + v[1].x + v[2].x) / 3 - center.x, cz = (v[0].z + v[1].z + v[2].z) / 3 - center.z;
        if (cx * cx + cz * cz > r2) continue;
        if (inLot(v[0]) && inLot(v[1]) && inLot(v[2])) continue;
        for (let k = 0; k < 3; k++) { put(v[k].x); put(v[k].y); put(v[k].z); }
      }
    });
    const g = new THREE.BufferGeometry();
    const all = new Float32Array(chunks.length * CH + len);
    chunks.forEach((c, i) => all.set(c, i * CH));
    all.set(cur.subarray(0, len), chunks.length * CH);
    g.setAttribute('position', new THREE.BufferAttribute(all, 3));
    return g;
  }

  return {
    tiles, holder, survey, snapshot,
    get calibrated() { return calibrated; },
    // ainda chegando tiles (ou em transição de fade): a cena precisa continuar sendo redesenhada
    get busy() { return tiles.loadProgress < 1 || performance.now() - lastActivity < 900; },
    setQuality(q) {
      tiles.errorTarget = q.tilesError;
      castShadows = q.tilesShadow;
      tiles.group.traverse(o => { if (o.isMesh) o.castShadow = castShadows; });
      bump();
    },
    update() {
      if (!calibrated && loaded > 20 && ++frame % 30 === 0) calibrate();
      camera.updateMatrixWorld();
      tiles.setResolutionFromRenderer(camera, renderer);
      tiles.update();
    },
    dispose() {
      scene.remove(holder);
      tiles.dispose();
      draco.dispose();
    },
  };
}

// Recorta a fotogrametria dentro do lote (tapume, estande e vegetação atuais) para não atravessar a maquete.
// clip = { inverse: Matrix4 mundo → sistema do lote, min: [x, z], max: [x, z] }
function applyClip(material, clip) {
  material.onBeforeCompile = shader => {
    shader.uniforms.uLotInv = { value: clip.inverse };
    shader.uniforms.uLotMin = { value: new THREE.Vector2(...clip.min) };
    shader.uniforms.uLotMax = { value: new THREE.Vector2(...clip.max) };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nuniform mat4 uLotInv;\nuniform vec2 uLotMin;\nuniform vec2 uLotMax;')
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        vec3 lp = (uLotInv * vec4(vWPos, 1.0)).xyz;
        if (lp.x > uLotMin.x && lp.x < uLotMax.x && lp.z > uLotMin.y && lp.z < uLotMax.y && lp.y > -2.0) discard;`);
  };
  material.customProgramCacheKey = () => 'apogeo-lot-clip';
}

