/*  SCENE 1 — THE HOOK (0–2.6s)
    Phone rings, headline lands, call goes unanswered → MISSED CALL.
    Runs on the story clock (ctx.S) so Scene 3 can rewind it. */
SE.scene({
  id: 'hook',
  build(layer, ctx) {
    const c = ctx.cfg.copy.hook;
    this.head = SE.el('div', 'hook-head display', layer);
    this.lines = c.headline.map((line) => {
      const l = SE.el('div', 'line', this.head);
      return SE.words(l, line, c.accentWords);
    });
    this.words = this.lines.flat();

    this.slam = SE.el('div', 'hook-slam', layer);
    this.slamRule = SE.el('div', 'slam-rule', this.slam);
    this.slamText = SE.el('div', 'slam-text display', this.slam);
    this.slamChars = [...c.missed].map((ch) => SE.el('span', '', this.slamText, ch === ' ' ? '&nbsp;' : ch));
    this.slamMeta = SE.el('div', 'slam-meta mono', this.slam, c.missedMeta);
  },
  update(ctx) {
    const E = SE.ease, p = SE.p;
    const [a] = ctx.cfg.scenes.hook;
    const t = ctx.S - a;
    const T = ctx.T;
    const freezeEnd = ctx.cfg.rewind.freezeUntil;
    // After the rewind freeze, Scene 3 takes the stage: fade our text out.
    const handoff = 1 - p(T, freezeEnd, freezeEnd + 0.18, E.inOutCubic);
    const inScene = t < 3.2 ? 1 : 0;

    // Headline: words rise out of their masks immediately.
    SE.revealWords(this.words, t, 0.02, 0.045, 0.6);
    const headOut = p(t, 1.38, 1.62, E.inOutCubic);
    SE.set(this.head, { o: (1 - headOut) * handoff * inScene, y: -headOut * 60 - p(t, 0, 2, E.outCubic) * 10 - (1 - handoff) * 50, blur: headOut * 10 + (1 - handoff) * 8 });

    // Phone
    const ph = ctx.phone.s;
    if (t < 3.2) {
      const intro = p(t, -0.1, 1.6, E.outCubic);
      const push = p(t, 2.0, 2.6, E.inOutQuart);
      ph.o = 1 - p(t, 2.2, 2.55, E.inOutCubic);
      ph.x = 540;
      ph.y = SE.lerp(1085, 1060, intro) - push * 60;
      ph.s = SE.lerp(0.76, 0.8, intro) + push * 1.6;
      ph.ry = SE.lerp(-16, -5, intro) * (1 - push);
      ph.rx = SE.lerp(8, 3, intro) * (1 - push);
      ph.rz = SE.lerp(-2, 0, intro);
      ph.blur = push * 14;
      ph.ring = t < 1.42 ? 1 : 0;
      ph.buzz = t < 1.42 ? 1 : 0;
      ph.missed = p(t, 1.45, 1.75, E.outCubic);
      ph.dim = p(t, 1.5, 1.8, E.outCubic) * 0.3 * (1 - push);
      ph.glare = 0.35;
    }

    // MISSED CALL slam — a hard cut, not a glitch: characters drop in fast.
    const slamIn = p(t, 1.5, 1.9, E.outExpo);
    const slamOut = p(t, 2.05, 2.4, E.inOutCubic);
    this.slamChars.forEach((ch, i) => {
      const k = p(t, 1.5 + i * 0.018, 1.5 + i * 0.018 + 0.34, E.outExpo);
      SE.set(ch, { y: (1 - k) * -80, o: k, blur: (1 - k) * 10 });
    });
    SE.css(this.slamRule, { transform: `scaleX(${p(t, 1.48, 1.85, E.outExpo).toFixed(4)})` });
    SE.set(this.slamMeta, { o: p(t, 1.7, 1.95, E.outCubic), y: (1 - p(t, 1.7, 1.95, E.outCubic)) * 14 });
    SE.set(this.slam, { o: (slamIn > 0 ? 1 : 0) * (1 - slamOut) * inScene, s: 1 + slamOut * 0.08, blur: slamOut * 8, y: -slamOut * 30 });

    // Controlled impact: one small decaying camera kick at the miss.
    const kick = t > 1.5 && t < 2.2 ? Math.exp(-(t - 1.5) * 9) * Math.sin((t - 1.5) * 55) : 0;
    ctx.world_.y += kick * 7;
    ctx.world_.s *= 1 + p(t, 0, 2, E.outCubic) * 0.015;

    // Light: warm while ringing, cools toward the alert tint on the miss.
    if (t < 3.2) {
      ctx.bg.s.y = 1000;
      ctx.bg.s.o = 0.55 * (1 - p(t, 1.45, 1.9)) + 0.18;
      ctx.bg.s.alert = p(t, 1.45, 1.9) * (1 - p(t, 2.2, 2.6));
    }
  },
});
