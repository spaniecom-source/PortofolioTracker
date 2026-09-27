/*  Preview player. In render mode (?render or #render) it only exposes
    SE.render(T) and window.__reelReady for the frame capturer. */
(async function () {
  const cfg = SE.config;
  const render = /render/.test(location.search + location.hash);
  if (render) document.body.classList.add('render');
  const stage = document.getElementById('stage');
  const vp = document.getElementById('viewport');
  const frames = Math.round(cfg.duration * cfg.fps);

  await SE.init(stage);
  window.__reelReady = true;
  if (render) {
    vp.style.width = cfg.width + 'px';
    vp.style.height = cfg.height + 'px';
    return;
  }

  const playBtn = document.getElementById('play');
  const scrub = document.getElementById('scrub');
  const tc = document.getElementById('tc');
  const chips = document.getElementById('chips');
  scrub.max = String(frames - 1);

  function fit() {
    const availH = window.innerHeight - 150;
    const availW = Math.min(window.innerWidth - 32, 620);
    const s = Math.max(0.12, Math.min(availH / cfg.height, availW / cfg.width));
    vp.style.width = cfg.width * s + 'px';
    vp.style.height = cfg.height * s + 'px';
    stage.style.transform = `scale(${s})`;
  }
  window.addEventListener('resize', fit);
  fit();

  const names = { hook: 'Hook', lost: 'Lost booking', rewind: 'Rewind', automation: 'Automation', result: 'Result' };
  const chipEls = Object.entries(cfg.scenes).map(([id, [a, b]]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const k = cfg.speed || 1;
    btn.textContent = `${names[id] || id} ${(a / k).toFixed(1)}s`;
    btn.addEventListener('click', () => { seek(a / k); });
    chips.appendChild(btn);
    return { btn, a: a / k, b: b / k };
  });

  let T = 0, playing = false, last = 0;
  function show(t) {
    T = Math.max(0, Math.min(cfg.duration - 1 / cfg.fps, t));
    SE.render(T);
    const f = Math.round(T * cfg.fps);
    scrub.value = String(f);
    tc.textContent = `${SE.fmtTime(T)} · F${String(f).padStart(3, '0')}`;
    chipEls.forEach((c) => c.btn.classList.toggle('on', T >= c.a && T < c.b));
  }
  function seek(t) { show(t); }
  function loop(now) {
    if (!playing) return;
    const dt = (now - last) / 1000;
    last = now;
    let t = T + dt;
    if (t >= cfg.duration) t = 0;
    show(t);
    requestAnimationFrame(loop);
  }
  function setPlaying(v) {
    playing = v;
    playBtn.textContent = v ? 'Pause' : 'Play';
    if (v) { last = performance.now(); requestAnimationFrame(loop); }
  }
  playBtn.addEventListener('click', () => setPlaying(!playing));
  scrub.addEventListener('input', () => { setPlaying(false); show(+scrub.value / cfg.fps); });
  window.addEventListener('keydown', (e) => {
    if (e.target === scrub && e.key.startsWith('Arrow')) return;
    if (e.code === 'Space') { e.preventDefault(); setPlaying(!playing); }
    if (e.key === 'ArrowRight') { setPlaying(false); show(T + (e.shiftKey ? 1 : 1 / cfg.fps)); }
    if (e.key === 'ArrowLeft') { setPlaying(false); show(T - (e.shiftKey ? 1 : 1 / cfg.fps)); }
  });

  show(0);
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) setPlaying(true);
})();
