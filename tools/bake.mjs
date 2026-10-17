// Gera js/projects/<id>/sun.json: abre a maquete em ?bake=1 e espera o pré-cálculo de insolação.
// uso: node bake.mjs <url-da-pagina> <arquivo-de-saida>
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
const [url, out] = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--window-size=1440,900'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
page.on('console', m => { if (/insolação|error/i.test(m.text())) console.log('[page]', m.text().slice(0, 200)); });
page.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 300)));
await page.goto(url + (url.includes('?') ? '&' : '?') + 'bake=1', { waitUntil: 'domcontentloaded' });
const t0 = Date.now(); let last = '';
while (Date.now() - t0 < 15 * 60e3) {
  await new Promise(r => setTimeout(r, 3000));
  const st = await page.evaluate(() => ({ done: !!window.__bake, p: window.__bakeProgress || '', src: document.getElementById('sunSource')?.textContent }));
  const line = st.p + ' ' + st.src; if (line !== last) { console.log(Math.round((Date.now() - t0) / 1000) + 's', line); last = line; }
  if (st.done) break;
}
const bake = await page.evaluate(() => window.__bake);
if (!bake) { console.log('FALHOU'); process.exit(1); }
writeFileSync(out, JSON.stringify(bake));
console.log('ok', out, Object.keys(bake.units).length, 'unidades', bake.days.length, 'dias', bake.tris, 'triângulos');
await browser.close();
