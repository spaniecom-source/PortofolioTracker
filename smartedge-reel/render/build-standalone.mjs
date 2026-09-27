#!/usr/bin/env node
/*  Bundles the preview player into ONE self-contained HTML file
    (fonts + logo inlined as data URIs, scripts inlined).
    node render/build-standalone.mjs   → out/smartedge-reel-preview.html
    Requires python3 + Pillow to down-sample the logo PNGs to WebP. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = (p) => readFile(path.join(ROOT, p), 'utf8');
const b64 = async (p) => (await readFile(path.join(ROOT, p))).toString('base64');

function webp(src, width) {
  const py = `import sys,io,base64\nfrom PIL import Image\nim=Image.open(sys.argv[1]);w=int(sys.argv[2])\nim=im.resize((w,round(im.height*w/im.width)),Image.LANCZOS)\nb=io.BytesIO();im.save(b,'WEBP',quality=90,method=6);print(base64.b64encode(b.getvalue()).decode())`;
  return execFileSync('python3', ['-c', py, path.join(ROOT, src), String(width)]).toString().trim();
}

const html = await r('index.html');
let css = await r('styles.css');
for (const [file, name] of [['BricolageGrotesque', 'BricolageGrotesque'], ['Manrope', 'Manrope'], ['JetBrainsMono', 'JetBrainsMono']])
  css = css.replace(`url('assets/fonts/${file}.woff2')`, `url(data:font/woff2;base64,${await b64(`assets/fonts/${name}.woff2`)})`);

const playerCss = html.match(/<style>([\s\S]*?)<\/style>/)[1];
const body = html.match(/<body>([\s\S]*?)<script/)[1];
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
let js = '';
for (const s of scripts) js += `\n/* ---- ${s} ---- */\n` + (await r(s));
const mark = `data:image/webp;base64,${webp('assets/brand/mark.png', 840)}`;
const word = `data:image/webp;base64,${webp('assets/brand/wordmark.png', 1000)}`;
js = js.replace("mark: 'assets/brand/mark.png'", `mark: '${mark}'`).replace("wordmark: 'assets/brand/wordmark.png'", `wordmark: '${word}'`);

const out = `<title>SmartEdge Missed Call Reel</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>${css}\n${playerCss}</style>
${body.trim()}
<script>${js.replace(/<\/script/g, '<\\/script')}</script>
`;
await mkdir(path.join(ROOT, 'out'), { recursive: true });
await writeFile(path.join(ROOT, 'out/smartedge-reel-preview.html'), out);
console.log(`out/smartedge-reel-preview.html  ${(out.length / 1024 / 1024).toFixed(2)} MB`);
