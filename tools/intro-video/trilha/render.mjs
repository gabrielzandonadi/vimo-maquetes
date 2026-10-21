import fs from 'node:fs';
import path from 'node:path';
// render offline da trilha no Chromium (Tone.Offline). Uso: NM=<node_modules com puppeteer-core> CHROME=<chrome> node render.mjs pulso elegante calmo
const puppeteer = (await import(path.join(process.env.NM || '../node_modules', 'puppeteer-core/lib/esm/puppeteer/puppeteer-core.js'))).default;
const b = await puppeteer.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true, protocolTimeout: 900000, args: ['--no-sandbox', '--allow-file-access-from-files'] });
const p = await b.newPage(); p.on('console', m => console.log('page:', m.text())); p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('file://' + process.cwd() + '/page.html');
for (const nome of process.argv.slice(2)) {
  const t = Date.now(); const r = await p.evaluate(n => window.renderizar(n), nome);
  fs.writeFileSync(`raw_${nome}.f32`, Buffer.from(r.b64, 'base64')); console.log(nome, r.sr, r.n, (Date.now() - t) / 1000 + 's');
}
await b.close();
