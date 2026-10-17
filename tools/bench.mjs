// Teste de abertura da maquete simulando máquinas mais fracas.
// uso: node bench.mjs <url> <perfil> [segundos]   (npm i dentro de tools/ antes)
// perfis: mac (sem limitação), notebook (CPU 4x, rede 30 Mbps), fraco (CPU 6x, GPU por software, 1366x768)
import puppeteer from 'puppeteer-core';

const [url, profile = 'notebook', secs = '45'] = process.argv.slice(2);
const P = {
  mac: { cpu: 1, net: null, gpu: 'metal', w: 1440, h: 900, dpr: 2 },
  notebook: { cpu: 4, net: { down: 30e6 / 8, up: 5e6 / 8, lat: 40 }, gpu: 'metal', w: 1366, h: 768, dpr: 1 },
  fraco: { cpu: 6, net: { down: 15e6 / 8, up: 3e6 / 8, lat: 60 }, gpu: 'swiftshader', w: 1366, h: 768, dpr: 1 },
}[profile];

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: [`--use-angle=${P.gpu}`, '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', `--window-size=${P.w},${P.h}`],
});
const page = await browser.newPage();
await page.setViewport({ width: P.w, height: P.h, deviceScaleFactor: P.dpr });
const cdp = await page.createCDPSession();
await cdp.send('Network.enable');
await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
if (P.cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: P.cpu });
if (P.net) await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: P.net.lat, downloadThroughput: P.net.down, uploadThroughput: P.net.up });
let bytes = 0, reqs = 0, google = 0;
cdp.on('Network.loadingFinished', e => { bytes += e.encodedDataLength; reqs++; });
cdp.on('Network.requestWillBeSent', e => { if (/googleapis|gstatic/.test(e.request.url)) google++; });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

const t0 = Date.now();
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
const gl = await page.evaluate(() => {
  const c = document.createElement('canvas').getContext('webgl2');
  const i = c && c.getExtension('WEBGL_debug_renderer_info');
  return i ? c.getParameter(i.UNMASKED_RENDERER_WEBGL) : 'n/d';
});
// espera o tempo pedido e mede o fps nos últimos 5 s
await new Promise(r => setTimeout(r, (+secs - 5) * 1000));
// fps real com o usuário girando a maquete: arrasta por 5 s e conta os quadros desenhados
const r0 = await page.evaluate(() => window.__perf?.renders || 0);
const t1 = Date.now();
await page.mouse.move(P.w * 0.6, P.h * 0.5); await page.mouse.down();
let k = 0;
while (Date.now() - t1 < 5000) { k++; await page.mouse.move(P.w * 0.6 + Math.sin(k / 8) * 200, P.h * 0.5 + Math.cos(k / 11) * 40); await new Promise(r => setTimeout(r, 30)); }
await page.mouse.up();
const fps = ((await page.evaluate(() => window.__perf?.renders || 0)) - r0) / ((Date.now() - t1) / 1000);
await new Promise(r => setTimeout(r, 1500));
const perf = await page.evaluate(() => window.__perf ? { marks: window.__perf.marks, longTasks: window.__perf.longTasks, longTaskMs: Math.round(window.__perf.longTaskMs), quality: window.__perf.quality, renderScale: window.__perf.renderScale, steps: window.__perf.qualitySteps } : null);
await page.screenshot({ path: `./shot-${profile}.jpg`, quality: 70 });
console.log(JSON.stringify({ profile, gl, ...perf, fps: Math.round(fps * 10) / 10, MB: Math.round(bytes / 1e5) / 10, reqs, googleReqs: google, errors: errors.slice(0, 5) }, null, 1));
await browser.close();
