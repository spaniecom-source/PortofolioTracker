#!/usr/bin/env node
/*  Frame-exact renderer: headless Chromium draws each frame via SE.render(t),
    PNG frames are piped straight into ffmpeg.

    node render/render.mjs                      → out/smartedge-reel.mp4
    node render/render.mjs --stills 0.5,1.8,4   → out/stills/*.png only
    node render/render.mjs --from 6 --to 9      → partial render (seconds)
    Options: --out <file> --crf <n> --scale <0.5 for a fast draft>
*/
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { spawn, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]] : acc), [])
);

// Playwright: local install first, then the global one.
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'))); }

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  try {
    const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!p.startsWith(ROOT)) throw new Error('outside root');
    const body = await readFile(p.endsWith('/') ? p + 'index.html' : p);
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const port = server.address().port;

const launchOpts = {};
if (process.env.CHROMIUM_PATH) launchOpts.executablePath = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(launchOpts);
const scale = args.scale ? parseFloat(args.scale) : 1;
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: scale });
page.on('pageerror', (e) => console.error('page error:', e.message));
await page.goto(`http://localhost:${port}/index.html?render`);
await page.waitForFunction(() => window.__reelReady === true, null, { timeout: 30000 });
const cfg = await page.evaluate(() => ({ fps: SE.config.fps, duration: SE.config.duration, speed: SE.config.speed || 1, cues: SE.config.audioCues }));
const clip = { x: 0, y: 0, width: 1080, height: 1920 };

async function frameAt(t) {
  await page.evaluate((tt) => SE.render(tt), t);
  return page.screenshot({ type: 'png', clip, animations: 'disabled', caret: 'hide' });
}

await mkdir(path.join(ROOT, 'out'), { recursive: true });

if (args.stills) {
  await mkdir(path.join(ROOT, 'out/stills'), { recursive: true });
  for (const s of String(args.stills).split(',')) {
    const t = parseFloat(s);
    await writeFile(path.join(ROOT, `out/stills/t${t.toFixed(2).padStart(5, '0')}.png`), await frameAt(t));
    console.log('still', t);
  }
} else {
  const from = Math.round((parseFloat(args.from ?? 0)) * cfg.fps);
  const to = Math.round((parseFloat(args.to ?? cfg.duration)) * cfg.fps);
  const out = path.resolve(ROOT, args.out || 'out/smartedge-reel.mp4');
  const ff = spawn('ffmpeg', [
    '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(cfg.fps), '-i', '-',
    '-vf', 'scale=1080:1920:flags=lanczos',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(args.crf || 15), '-tune', 'animation',
    '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.2', '-r', String(cfg.fps),
    '-g', String(cfg.fps), '-bf', '2', '-movflags', '+faststart', out,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = from; f < to; f++) {
    const buf = await frameAt(f / cfg.fps);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % 30 === 0) process.stdout.write(`\rframe ${f}/${to} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end();
  await new Promise((r, j) => ff.on('close', (c) => (c === 0 ? r() : j(new Error('ffmpeg exited ' + c)))));
  await writeFile(path.join(ROOT, 'out/audio-cues.json'), JSON.stringify({ fps: cfg.fps, duration: cfg.duration, cues: cfg.cues.map((c) => { const t = +(c.t / cfg.speed).toFixed(2); return { ...c, t, dur: c.dur ? +(c.dur / cfg.speed).toFixed(2) : undefined, frame: Math.round(t * cfg.fps) }; }) }, null, 2));
  console.log(`\nwrote ${path.relative(ROOT, out)}`);
}

await browser.close();
server.close();
