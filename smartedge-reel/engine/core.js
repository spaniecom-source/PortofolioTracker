/*  Deterministic motion engine.
    Every frame is a pure function of the master time T (seconds):
    SE.render(T) sets every animated property from scratch, so any frame
    can be rendered in any order — which is what the video renderer does.
*/
(function () {
  const SE = (window.SE = window.SE || {});

  // ---------- math ----------
  SE.clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  SE.lerp = (a, b, t) => a + (b - a) * t;
  SE.ease = {
    linear: (t) => t,
    inQuad: (t) => t * t,
    inCubic: (t) => t * t * t,
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    outQuart: (t) => 1 - Math.pow(1 - t, 4),
    outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    inOutQuart: (t) => (t < 0.5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2),
    inOutExpo: (t) =>
      t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
    outBack: (t) => {
      const c1 = 1.1, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
  };
  /** progress of t through [a,b], eased, clamped 0..1 */
  SE.p = (t, a, b, e = SE.ease.linear) => e(SE.clamp((t - a) / (b - a)));
  /** 0→1 over [a, a+fi], 1→0 over [b-fo, b] */
  SE.win = (t, a, b, fi = 0.3, fo = 0.3, e = SE.ease.inOutCubic) =>
    Math.min(SE.p(t, a, a + fi, e), 1 - SE.p(t, b - fo, b, e));

  /** seeded PRNG (mulberry32) — deterministic particles/grain */
  SE.rng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // ---------- DOM ----------
  SE.el = (tag, cls, parent, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  };

  const cache = new WeakMap();
  /** style setter that only touches the DOM when a value changes */
  SE.css = (el, props) => {
    let c = cache.get(el);
    if (!c) cache.set(el, (c = {}));
    for (const k in props) {
      const v = props[k];
      if (c[k] === v) continue;
      c[k] = v;
      if (k[0] === '-') el.style.setProperty(k, v);
      else el.style[k] = v;
    }
  };
  SE.text = (el, s) => {
    let c = cache.get(el);
    if (!c) cache.set(el, (c = {}));
    if (c.__text !== s) { c.__text = s; el.textContent = s; }
  };

  /** Transform/opacity/filter shorthand.
      {o, x, y, z, s, sx, sy, rx, ry, rz, blur, bright, sat} */
  SE.set = (el, o) => {
    const tf = [];
    if (o.x || o.y || o.z) tf.push(`translate3d(${(o.x || 0).toFixed(2)}px,${(o.y || 0).toFixed(2)}px,${(o.z || 0).toFixed(2)}px)`);
    if (o.rx) tf.push(`rotateX(${o.rx.toFixed(3)}deg)`);
    if (o.ry) tf.push(`rotateY(${o.ry.toFixed(3)}deg)`);
    if (o.rz) tf.push(`rotateZ(${o.rz.toFixed(3)}deg)`);
    if (o.s != null && o.s !== 1) tf.push(`scale(${o.s.toFixed(4)})`);
    if (o.sx != null || o.sy != null) tf.push(`scale(${(o.sx ?? 1).toFixed(4)},${(o.sy ?? 1).toFixed(4)})`);
    const f = [];
    if (o.blur > 0.05) f.push(`blur(${o.blur.toFixed(2)}px)`);
    if (o.bright != null && Math.abs(o.bright - 1) > 0.005) f.push(`brightness(${o.bright.toFixed(3)})`);
    if (o.sat != null && Math.abs(o.sat - 1) > 0.005) f.push(`saturate(${o.sat.toFixed(3)})`);
    const op = o.o == null ? 1 : SE.clamp(o.o);
    SE.css(el, {
      transform: tf.join(' ') || 'none',
      filter: f.join(' ') || 'none',
      opacity: op.toFixed(3),
      visibility: op < 0.002 ? 'hidden' : 'visible',
    });
  };

  /** Split text into masked words for line/word reveals. */
  SE.words = (parent, text, accent = []) =>
    text.split(' ').map((w) => {
      const outer = SE.el('span', 'w', parent);
      const inner = SE.el('span', 'wi' + (accent.includes(w) ? ' accent' : ''), outer, w);
      parent.appendChild(document.createTextNode(' '));
      return inner;
    });
  /** Reveal words upward from their mask. */
  SE.revealWords = (spans, t, start, stagger = 0.05, dur = 0.55, dir = 1) => {
    spans.forEach((sp, i) => {
      const k = SE.p(t, start + i * stagger, start + i * stagger + dur, SE.ease.outExpo);
      SE.set(sp, { y: (1 - k) * 110 * dir, o: k > 0 ? 1 : 0 });
    });
  };
  /** Typewriter: returns substring of text for progress k. */
  SE.typed = (text, k) => text.slice(0, Math.round(SE.clamp(k) * text.length));

  SE.fmtTime = (s) => {
    const m = Math.floor(s / 60), r = s - m * 60;
    return `${String(m).padStart(2, '0')}:${r.toFixed(2).padStart(5, '0')}`;
  };

  // ---------- timeline ----------
  SE.scenes = [];
  SE.scene = (def) => SE.scenes.push(def);

  /** Story clock: identical to T, except it runs backwards during the rewind. */
  SE.story = (T) => {
    const r = SE.config.rewind;
    if (T < r.start) return T;
    if (T < r.end) return SE.lerp(r.from, r.to, SE.ease.inOutCubic((T - r.start) / (r.end - r.start)));
    return r.to;
  };

  SE.init = async (stage) => {
    const cfg = SE.config;
    for (const [k, v] of Object.entries(cfg.colors)) stage.style.setProperty('--' + k, v);
    stage.style.setProperty('--f-display', cfg.fonts.display);
    stage.style.setProperty('--f-body', cfg.fonts.body);
    stage.style.setProperty('--f-mono', cfg.fonts.mono);

    const ctx = (SE.ctx = { stage, cfg, T: 0, S: 0 });
    ctx.world = SE.el('div', 'world', stage);
    ctx.bg = SE.Background(ctx.world, ctx);
    ctx.phone = SE.Phone(ctx.world, ctx);
    for (const s of SE.scenes) {
      s.layer = SE.el('div', 'layer layer-' + s.id, ctx.world);
      s.build(s.layer, ctx);
    }
    ctx.grain = SE.Grain(stage);

    // Wait for fonts and images so frame 0 is final.
    const fonts = ['700 40px "Bricolage Grotesque"', '500 40px "Manrope"', '500 40px "JetBrains Mono"'];
    await Promise.all(fonts.map((f) => document.fonts.load(f)));
    await document.fonts.ready;
    await Promise.all([...stage.querySelectorAll('img')].map((i) => (i.decode ? i.decode().catch(() => {}) : null)));
    SE.render(0);
    return ctx;
  };

  SE.render = (T) => {
    const ctx = SE.ctx;
    ctx.T = T * (ctx.cfg.speed || 1); // design time
    ctx.S = SE.story(T);
    ctx.world_ = { s: 1, x: 0, y: 0, blur: 0, bright: 1, sat: 1, rz: 0 };
    ctx.bg.reset();
    ctx.phone.reset();
    for (const s of SE.scenes) s.update(ctx);
    ctx.phone.apply();
    ctx.bg.apply();
    SE.set(ctx.world, ctx.world_);
  };
})();
