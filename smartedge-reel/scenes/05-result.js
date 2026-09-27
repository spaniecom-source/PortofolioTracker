/*  SCENE 5 — THE RESULT (14.9–19.0s)
    Booking confirmation, then the SmartEdge mark and end line. */
SE.scene({
  id: 'result',
  build(layer, ctx) {
    const c = ctx.cfg.copy.result;
    this.c = c;
    // Confirmation card
    this.orb1 = SE.el('div', 'glass-orb o1', layer);
    this.orb2 = SE.el('div', 'glass-orb o2', layer);
    const card = (this.card = SE.el('div', 'confirm', layer));
    const top = SE.el('div', 'confirm-top', card);
    this.badge = SE.el('div', 'confirm-badge', top, SE.checkSvg());
    this.badgePath = this.badge.querySelector('path');
    this.badgeRing = SE.el('div', 'confirm-ring', this.badge);
    this.title = SE.el('div', 'confirm-title display', top, c.title);
    const rows = SE.el('div', 'confirm-rows', card);
    this.rows = c.rows.map(([k, v]) =>
      SE.el('div', 'crow' + (k === 'TOTAL' ? ' total' : ''), rows, `<span class="mono">${k}</span><span>${v}</span>`));
    this.foot = SE.el('div', 'confirm-foot mono', card, `<i class="dot"></i>${c.footnote}`);

    // End card
    const end = (this.end = SE.el('div', 'endcard', layer));
    this.glow = SE.el('div', 'end-glow', end);
    this.particles = SE.el('div', 'particles', end);
    const r = SE.rng(42);
    this.dots = Array.from({ length: 34 }, () => {
      const d = SE.el('i', '', this.particles);
      const size = 2 + r() * 3.5;
      SE.css(d, { width: size + 'px', height: size + 'px' });
      return { d, ang: r() * Math.PI * 2, rad: 170 + r() * 360, spd: 0.04 + r() * 0.1, rise: 14 + r() * 40, ph: r() * 6.28, a: 0.15 + r() * 0.35 };
    });
    this.mark = SE.el('img', 'end-mark', end);
    this.mark.src = ctx.cfg.assets.mark;
    const hl = SE.el('div', 'end-head display', end);
    this.hlWords = c.headline.map((line) => SE.words(SE.el('div', 'line', hl), line, [])).flat();
    this.cta = SE.el('div', 'end-cta display', end, `<span>${c.cta}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
    this.ctaSheen = SE.el('i', 'cta-sheen', this.cta);
    this.url = SE.el('div', 'end-url mono', end, c.url);
    this.tag = SE.el('div', 'end-tag mono', end, c.tagline);
  },
  update(ctx) {
    const E = SE.ease, p = SE.p, T = ctx.T;
    const [a] = ctx.cfg.scenes.result;
    const t = T - a;
    if (t < -0.05) { SE.set(this.layer, { o: 0 }); return; }
    SE.set(this.layer, { o: 1 });

    // ---- Confirmation card (0.2 → 1.9) ----
    const cin = p(t, 0.2, 0.95, E.outExpo);
    const cout = p(t, 1.7, 2.05, E.inOutCubic);
    SE.set(this.card, { o: p(t, 0.2, 0.5) * (1 - cout), s: SE.lerp(0.92, 1, cin) * (1 - cout * 0.12), y: (1 - cin) * 60 - cout * 20, blur: (1 - cin) * 10 + cout * 12 });
    const orbO = p(t, 0, 0.6) * (1 - cout);
    SE.set(this.orb1, { x: 520 + Math.sin(t * 0.8) * 120, y: 420 + Math.cos(t * 0.6) * 100, o: orbO * 0.85 });
    SE.set(this.orb2, { x: 120 + Math.cos(t * 0.7) * 100, y: 1000 + Math.sin(t * 0.5) * 120, o: orbO * 0.8 });
    SE.css(this.badgePath, { strokeDasharray: '1', strokeDashoffset: (1 - p(t, 0.45, 0.85, E.outCubic)).toFixed(3) });
    const pulse = p(t, 0.75, 1.5, E.outCubic);
    SE.set(this.badgeRing, { s: 1 + pulse * 0.7, o: (1 - pulse) * (pulse > 0 ? 0.8 : 0) });
    SE.set(this.badge, { s: 0.6 + 0.4 * E.outBack(p(t, 0.3, 0.75)) });
    SE.set(this.title, { o: p(t, 0.45, 0.8), y: (1 - p(t, 0.45, 0.9, E.outExpo)) * 20 });
    this.rows.forEach((r, i) => {
      const k = p(t, 0.6 + i * 0.07, 1.05 + i * 0.07, E.outExpo);
      SE.set(r, { o: k, y: (1 - k) * 18 });
    });
    SE.set(this.foot, { o: p(t, 1.0, 1.3) });

    // ---- End card (1.9 → 4.1) ----
    const m = p(t, 1.98, 3.0, E.outExpo);
    const idle = Math.max(0, t - 1.98);
    SE.set(this.mark, { o: p(t, 1.98, 2.4), s: SE.lerp(0.55, 1, m) + idle * 0.012, rz: SE.lerp(-28, 0, m) + idle * 1.5, blur: (1 - m) * 18 });
    SE.set(this.glow, { o: p(t, 1.9, 2.8) * (0.75 + 0.1 * Math.sin(T * 1.8)), s: SE.lerp(0.6, 1, m) });
    SE.revealWords(this.hlWords, t, 2.25, 0.07, 0.7);
    // CTA button lands, then a single light sweep across it.
    const w = p(t, 2.75, 3.3, E.outExpo);
    SE.set(this.cta, { o: w, y: (1 - w) * 24, s: SE.lerp(0.92, 1, w) });
    SE.css(this.ctaSheen, { transform: `translateX(${SE.lerp(-140, 620, p(t, 3.2, 3.9, E.inOutCubic)).toFixed(1)}px) skewX(-20deg)` });
    const u = p(t, 2.95, 3.4, E.outCubic);
    SE.set(this.url, { o: u, y: (1 - u) * 14 });
    const tg = p(t, 3.1, 3.55, E.outCubic);
    SE.set(this.tag, { o: tg, y: (1 - tg) * 12 });
    SE.css(this.tag, { letterSpacing: SE.lerp(0.36, 0.22, tg).toFixed(3) + 'em' });

    const pv = p(t, 2.2, 3.2);
    this.dots.forEach((q) => {
      const ang = q.ang + idle * q.spd;
      const x = Math.cos(ang) * q.rad;
      const y = Math.sin(ang) * q.rad * 0.8 - idle * q.rise;
      SE.set(q.d, { x, y, o: pv * q.a * (0.6 + 0.4 * Math.sin(T * 2 + q.ph)) });
    });

    ctx.bg.s.y = SE.lerp(ctx.bg.s.y, 700, p(t, 1.8, 2.6, E.inOutCubic));
    ctx.bg.s.o = SE.lerp(0.4, 0.6, p(t, 1.9, 3));
    ctx.bg.s.o2 = 0;
    ctx.world_.s *= 1 + p(t, 1.85, 4.2, E.outCubic) * 0.025;
  },
});
