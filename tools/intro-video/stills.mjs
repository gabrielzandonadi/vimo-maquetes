import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';
const B = process.env.CHROME || undefined;   // ex.: CHROME=/caminho/do/chrome node stills.mjs HomeroH 30 300
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const [id, ...frames] = process.argv.slice(2);
const composition = await selectComposition({ serveUrl, id, browserExecutable: B });
for (const f of frames) await renderStill({ composition, serveUrl, output: `out/${id}_${f}.jpg`, frame: +f, browserExecutable: B, imageFormat: 'jpeg', jpegQuality: 70, scale: 0.5 });
console.log('ok');
