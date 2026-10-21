// QA da abertura com vídeo do homero.html (Chrome headless): vídeo toca, botão bloqueado até o fim do carregamento,
// clique entra na maquete, sem erros de JS; desktop e celular.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
// Uso: NM=<node_modules com puppeteer-core e three> CHROME=<chrome> node tools/intro-video/qa_splash.mjs
const HERE = path.dirname(fileURLToPath(import.meta.url));
const NM = process.env.NM || path.join(HERE, 'node_modules');
const puppeteer = (await import(path.join(NM, 'puppeteer-core/lib/esm/puppeteer/puppeteer-core.js'))).default;
const REPO = path.resolve(HERE, '../..'), OUT = path.join(HERE, 'out', 'qa');
fs.mkdirSync(OUT, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.glb': 'model/gltf-binary' };
const server = http.createServer((req, res) => {
  let p = path.join(REPO, decodeURIComponent(req.url.split('?')[0]));
  // o Chromium de teste não decodifica H.264 (codec proprietário): serve a mesma peça em VP9 só para o QA
  if (p.endsWith('homero-16x9.mp4') && fs.existsSync(path.join(HERE, 'out/qa_h.webm'))) p = path.join(HERE, 'out/qa_h.webm');
  if (p.endsWith('homero-9x16.mp4') && fs.existsSync(path.join(HERE, 'out/qa_v.webm'))) p = path.join(HERE, 'out/qa_v.webm');
  if (!(p.startsWith(REPO) || p.endsWith('.webm')) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  const st = fs.statSync(p), type = p.endsWith('.webm') ? 'video/webm' : MIME[path.extname(p)] || 'application/octet-stream', range = req.headers.range;
  if (range) { const [a, b] = range.replace('bytes=', '').split('-'); const s = +a, e = b ? +b : st.size - 1; res.writeHead(206, { 'content-type': type, 'content-range': `bytes ${s}-${e}/${st.size}`, 'accept-ranges': 'bytes', 'content-length': e - s + 1 }); return fs.createReadStream(p, { start: s, end: e }).pipe(res); }
  res.writeHead(200, { 'content-type': type, 'content-length': st.size, 'accept-ranges': 'bytes' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true, protocolTimeout: 600000, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', '--no-sandbox'] });
const res = []; const check = (n, ok, x = '') => { res.push(ok); console.log(`${ok ? '✓' : '✗'} ${n}${x ? ' · ' + x : ''}`); };
async function run(w, h, mobile, tag) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
  await page.setRequestInterception(true);
  page.on('request', req => {
    const u = req.url(), m = /^https:\/\/cdn\.jsdelivr\.net\/npm\/(three|3d-tiles-renderer|three-mesh-bvh)@[^/]+\/(.*)$/.exec(u);
    if (m) { const f = path.join(NM, m[1], m[2].split('?')[0]); return fs.existsSync(f) ? req.respond({ status: 200, contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: fs.readFileSync(f) }) : req.respond({ status: 404, body: '' }); }
    return u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:') ? req.continue() : req.abort();
  });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED|net::|Failed to fetch/.test(m.text())) errors.push(m.text()); });
  await page.goto(`${base}/homero.html?q=leve`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#splash.has-video', { timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2500));
  const s0 = await page.evaluate(() => { const v = document.getElementById('splashVideo'), b = document.getElementById('splashEnter'); return { mode: document.getElementById('splash').className, src: v.currentSrc, playing: !v.paused, t: v.currentTime, disabled: b.disabled, txt: b.textContent.trim(), visible: !document.getElementById('splash').classList.contains('done') }; });
  check(`[${tag}] vídeo carregado e tocando`, !!s0.src && s0.playing, `${s0.src.split('/').pop()} · ${s0.t.toFixed(1)} s · ${s0.mode}`);
  check(`[${tag}] botão bloqueado durante o carregamento`, s0.disabled || /Entrar/.test(s0.txt), s0.txt);
  await page.screenshot({ path: `${OUT}/${tag}_carregando.png` });
  await page.waitForFunction(() => !document.getElementById('splashEnter').disabled, { timeout: 240000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 1500));
  const s1 = await page.evaluate(() => ({ disabled: document.getElementById('splashEnter').disabled, txt: document.getElementById('splashEnter').textContent.trim(), still: !document.getElementById('splash').classList.contains('done'), playing: !document.getElementById('splashVideo').paused, over: document.documentElement.scrollWidth > innerWidth }));
  check(`[${tag}] botão liberado ao fim do carregamento`, !s1.disabled, s1.txt);
  check(`[${tag}] não entra sozinho (abertura continua na tela)`, s1.still);
  check(`[${tag}] vídeo continua tocando`, s1.playing);
  check(`[${tag}] sem rolagem horizontal`, !s1.over);
  await page.screenshot({ path: `${OUT}/${tag}_pronto.png` });
  await page.click('#splashEnter');
  await new Promise(r => setTimeout(r, 1500));
  const s2 = await page.evaluate(() => ({ done: document.getElementById('splash').classList.contains('done'), paused: document.getElementById('splashVideo').paused }));
  check(`[${tag}] clique entra na maquete`, s2.done && s2.paused);
  await page.screenshot({ path: `${OUT}/${tag}_maquete.png` });
  check(`[${tag}] sem erros de JavaScript`, errors.length === 0, errors.slice(0, 3).join(' | '));
  await page.close();
}
await run(1440, 900, false, 'desktop');
await run(390, 844, true, 'celular');
// ?intro=0 mantém o comportamento antigo (entra sozinho)
{
  const page = await browser.newPage(); await page.setViewport({ width: 1280, height: 800 });
  await page.setRequestInterception(true);
  page.on('request', req => { const u = req.url(), m = /^https:\/\/cdn\.jsdelivr\.net\/npm\/(three|3d-tiles-renderer|three-mesh-bvh)@[^/]+\/(.*)$/.exec(u); if (m) { const f = path.join(NM, m[1], m[2].split('?')[0]); return fs.existsSync(f) ? req.respond({ status: 200, contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: fs.readFileSync(f) }) : req.respond({ status: 404, body: '' }); } return u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:') ? req.continue() : req.abort(); });
  await page.goto(`${base}/homero.html?q=leve&intro=0`, { waitUntil: 'domcontentloaded' });
  const ok = await page.waitForFunction(() => document.getElementById('splash').classList.contains('done'), { timeout: 240000 }).then(() => true).catch(() => false);
  check('?intro=0 entra sozinho como antes', ok); await page.close();
}
await browser.close(); server.close();
console.log(res.every(Boolean) ? 'todos os testes passaram' : 'HÁ FALHAS');
