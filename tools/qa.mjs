// QA automatizado das maquetes: percorre a página como um usuário e lista problemas.
// uso: node qa.mjs <url> <desktop|mobile> <pasta-prints>
import puppeteer from 'puppeteer-core';
const [url, mode = 'desktop', out = '.'] = process.argv.slice(2);
const MOBILE = mode === 'mobile';
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--use-angle=metal', '--enable-gpu'] });
const page = await browser.newPage();
if (MOBILE) { await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'); }
else await page.setViewport({ width: 1440, height: 900 });
const issues = [], ok = [], errors = [], failed = [];
page.on('pageerror', e => errors.push('pageerror: ' + String(e).slice(0, 220)));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 220)); });
page.on('requestfailed', r => failed.push(r.url().slice(0, 160) + ' ' + (r.failure()?.errorText || '')));
page.on('response', r => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url().slice(0, 160)); });
const check = (cond, msg) => (cond ? ok : issues).push(msg);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const shot = async name => page.screenshot({ path: `${out}/${mode}-${name}.jpg`, quality: 72 });
const ev = (fn, ...a) => page.evaluate(fn, ...a);

await page.goto(url, { waitUntil: 'domcontentloaded' });
// 1. abertura
await page.waitForFunction(() => document.getElementById('splash')?.classList.contains('done'), { timeout: 45000 }).then(() => ok.push('abertura concluída'), () => issues.push('tela de abertura não terminou em 45 s'));
await sleep(1500);
await shot('01-abertura');
const info = await ev(() => ({
  title: document.title, brand: document.querySelector('.brand-name')?.textContent,
  units: apogeo.unitMeshes.length, avail: document.querySelectorAll('#availList .avail-row').length,
  tiles: document.getElementById('tilesStatus').textContent, sun: document.getElementById('sunSource').textContent,
  overflowX: document.documentElement.scrollWidth > innerWidth + 1, q: __perf.quality,
}));
check(info.tiles.includes('ativo'), 'entorno fotorrealista ativo: ' + info.tiles);
check(/pré-calculada/.test(info.sun), 'insolação pré-calculada: ' + info.sun);
check(!info.overflowX, 'sem rolagem horizontal na página');
ok.push(`título "${info.title}", ${info.units} unidades, ${info.avail} disponíveis na lista, qualidade ${info.q}`);
// textos que não deveriam aparecer
const bodyText = await ev(() => document.body.innerText);
const isHomero = url.includes('homero');
if (isHomero) for (const w of ['Apogeo', 'suítes', 'Lúcio Bacelar', 'praia suspensa', 'Javé']) check(!bodyText.includes(w), `texto do outro empreendimento ausente: "${w}"`);

// 2. ficha de cada disponível + tour
const availNames = await ev(() => [...document.querySelectorAll('#availList .avail-row')].map(b => b.dataset.u));
for (const [i, name] of availNames.entries()) {
  await ev(n => document.querySelector(`#availList .avail-row[data-u="${n}"]`).click(), name);
  await sleep(700);
  const card = await ev(() => ({
    open: !document.getElementById('unitPanel').classList.contains('hidden'),
    title: document.querySelector('#unitBody h2, #unitBody .unit-title')?.textContent || document.getElementById('unitBody').innerText.split('\n')[0],
    price: /R\$\s?[\d.]+/.test(document.getElementById('unitBody').innerText),
    sun: /sol/i.test(document.getElementById('unitBody').innerText),
    tourBtn: [...document.querySelectorAll('#unitBody button')].some(b => /Entrar/.test(b.textContent)),
    planImg: [...document.querySelectorAll('#unitBody img')].map(im => im.complete && im.naturalWidth > 0),
  }));
  check(card.open && card.price && card.sun, `ficha ${name}: abre, preço e sol (${card.title?.trim()})`);
  check(card.tourBtn, `ficha ${name}: botão "Entrar no apartamento"`);
  if (i === 0) await shot('02-ficha');
  if (card.tourBtn) {
    await ev(() => [...document.querySelectorAll('#unitBody button')].find(b => /Entrar/.test(b.textContent)).click());
    await sleep(4500);
    const t = await ev(() => ({ active: !!apogeo.state.tour, rooms: document.querySelectorAll('#tourRooms button').length, room: document.getElementById('tourRoom').textContent, map: document.getElementById('tourPlanImg').naturalWidth }));
    check(t.active && t.rooms >= 5 && t.map > 0, `tour ${name}: ${t.rooms} ambientes, começa em "${t.room}", minimapa ${t.map ? 'ok' : 'sem imagem'}`);
    if (i === 0) {
      // navega por 3 ambientes e testa a barra de luz
      for (const k of [1, 3, 6]) { await ev(k => document.querySelectorAll('#tourRooms button')[k]?.click(), k); await sleep(1300); }
      await ev(() => { document.getElementById('tourLightToggle').click(); document.querySelector('#tourLight [data-h="20"]').click(); });
      await sleep(1200);
      await shot('03-tour-noite');
      const lt = await ev(() => ({ open: document.getElementById('tourLight').classList.contains('open'), label: document.getElementById('tourLightCur').textContent }));
      check(!lt.open && /Noite/.test(lt.label), `barra de luz recolhe e mostra "${lt.label}"`);
    }
    await ev(() => document.getElementById('tourExit').click());
    await sleep(900);
    const back = await ev(() => ({ tour: !!apogeo.state.tour, hidden: document.getElementById('tour').classList.contains('hidden') }));
    check(!back.tour && back.hidden, `tour ${name}: sair volta para a maquete`);
  }
}
// 3. lazer
const hasLazer = await ev(() => !!document.querySelector('.amenity-open'));
if (isHomero) {
  check(hasLazer, 'botão "Tour 3D · área de lazer" no painel');
  if (hasLazer) {
    await ev(() => document.querySelector('.amenity-open').click());
    await sleep(5000);
    const t = await ev(() => ({ active: !!apogeo.state.tour, rooms: document.querySelectorAll('#tourRooms button').length, exit: document.getElementById('tourExit').textContent, unit: document.getElementById('tourUnit').textContent }));
    check(t.active && t.rooms >= 8, `tour do lazer: ${t.rooms} ambientes · "${t.exit}"`);
    await shot('04-lazer');
    await ev(() => document.getElementById('tourExit').click()); await sleep(800);
  }
}
// 4. disponibilidade, pinos e comparador
await ev(() => document.querySelector('#unitClose')?.click());
await ev(() => document.querySelector('#colorMode [data-m=disp]').click()); await sleep(1200);
const pins = await ev(() => [...document.querySelectorAll('.pin')].map(p => p.innerText.trim()));
check(pins.length === availNames.length && pins.every(p => /^\d+$/.test(p)), `etiquetas no modo Disponibilidade: ${pins.length} (só número: ${pins.every(p => /^\d+$/.test(p))})`);
await shot('05-disponibilidade');
await ev(() => document.querySelector('#colorMode [data-m=real]').click());
await ev(() => document.getElementById('compareOpen').click()); await sleep(800);
const cmp = await ev(() => ({ open: !document.getElementById('compare').classList.contains('hidden'), cols: document.querySelectorAll('#compareTable thead th.unit').length }));
check(cmp.open && cmp.cols === availNames.length, `comparador: ${cmp.cols} colunas`);
await shot('06-comparador');
await ev(() => document.getElementById('compareClose').click()); await sleep(400);
// 5. camadas, vistas e barra do sol
await ev(() => document.getElementById('layersBtn').click()); await sleep(400);
const layers = await ev(() => ({ presets: [...document.querySelectorAll('#presets button')].map(b => b.textContent), sv: document.getElementById('svLink').href, toggles: [...document.querySelectorAll('.toggles input')].map(i => i.id + ':' + i.checked + (i.disabled ? ':desab' : '')) }));
check(/google\.com\/maps/.test(layers.sv), 'link do Street View válido');
check(!layers.toggles.some(t => t.endsWith(':desab')), 'camadas habilitadas: ' + layers.toggles.join(' '));
await shot('07-camadas');
for (const p of layers.presets) { await ev(t => [...document.querySelectorAll('#presets button')].find(b => b.textContent === t)?.click(), p); await sleep(1600); await ev(() => document.getElementById('layersBtn').click()); await sleep(300); }
ok.push('vistas: ' + layers.presets.join(', '));
for (const id of ['tPath', 'tSeasons', 'tLabels', 'tNeighbors', 'tHQ']) { await ev(id => { const c = document.getElementById(id); c.click(); c.click(); }, id); }
await ev(() => document.getElementById('layersBtn').click());
await ev(() => document.getElementById('sunExpand').click()); await sleep(500);
await ev(() => { const s = document.querySelector('#seasons [data-d="06-21"]'); s?.click(); const t = document.getElementById('time'); t.value = 15; t.dispatchEvent(new Event('input', { bubbles: true })); });
await sleep(800);
await shot('08-sol');
await ev(() => document.getElementById('sunExpand').click());
// 6. abas Mapa e Sobre
await ev(() => document.querySelector('.tab[data-tab=mapa]').click()); await sleep(2500);
const map = await ev(() => ({ src: document.getElementById('mapFrame').src, card: document.getElementById('mapCard').innerText.slice(0, 80) }));
check(/google/.test(map.src), 'aba Mapa carrega o mapa: ' + map.card.replace(/\n/g, ' · '));
await shot('09-mapa');
await ev(() => document.querySelector('.tab[data-tab=sobre]').click()); await sleep(1200);
await ev(async () => { for (const im of document.querySelectorAll('#view-sobre img')) { im.loading = 'eager'; } window.scrollTo(0, 0); });
await ev(async () => { const v = document.getElementById('view-sobre'); for (let y = 0; y < v.scrollHeight; y += 500) { v.scrollTop = y; await new Promise(r => setTimeout(r, 120)); } });
await sleep(2500);
const imgs = await ev(() => [...document.querySelectorAll('#view-sobre img')].map(im => ({ src: im.getAttribute('src'), ok: im.complete && im.naturalWidth > 0 })));
const broken = imgs.filter(i => !i.ok);
check(!broken.length, `aba Sobre: ${imgs.length} imagens, ${broken.length} quebradas ${broken.map(b => b.src).join(' ')}`);
await ev(() => document.getElementById('view-sobre').scrollTop = 0);
await shot('10-sobre');
await ev(() => document.querySelector('#gallery img')?.click()); await sleep(800);
const lb = await ev(() => ({ open: !document.getElementById('lightbox').classList.contains('hidden'), img: document.getElementById('lbImg').naturalWidth }));
await ev(() => document.getElementById('lbNext').click()); await sleep(600);
check(lb.open && lb.img > 0, 'galeria abre a imagem ampliada');
await ev(() => document.getElementById('lbClose').click());
await ev(() => document.querySelector('.tab[data-tab=maquete]').click()); await sleep(800);
// 7. links diretos
for (const h of [availNames[0], isHomero ? 'lazer' : null].filter(Boolean)) {
  await ev(h => { location.hash = h; }, h); await sleep(4500);
  const st = await ev(() => ({ sel: apogeo.state.selected?.userData.unit.name, tour: !!apogeo.state.tour }));
  check(st.sel === h || st.tour, `link direto #${h}`);
  if (st.tour) { await ev(() => document.getElementById('tourExit').click()); await sleep(600); }
}
await shot('11-final');
// erros
const errs = [...new Set(errors)], fails = [...new Set(failed)].filter(f => !/google-analytics|gstatic\.com\/draco/.test(f) && !/tile\.googleapis.*ERR_ABORTED/.test(f));
check(!errs.length, `console sem erros (${errs.length})`);
check(!fails.length, `sem requisições com falha (${fails.length})`);
console.log(JSON.stringify({ url, mode, ok: ok.length, issues, errors: errs.slice(0, 12), failed: fails.slice(0, 12) }, null, 1));
await browser.close();
