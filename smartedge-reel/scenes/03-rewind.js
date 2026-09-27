/*  SCENE 3 — REWIND (6.0–9.4s)
    Scenes 1–2 play backwards (driven by the story clock in engine/core.js),
    freeze on the ringing phone, then the AI receptionist answers. */
SE.scene({
  id: 'rewind',
  build(layer, ctx) {
    const c = ctx.cfg.copy.ai;
    this.scrub = SE.el('div', 'rw-scrub', layer);
    this.rwLabel = SE.el('div', 'rw-label mono', this.scrub,
      `<svg viewBox="0 0 24 12" aria-hidden="true"><path d="M11 0v12L2 6zM22 0v12L13 6z" fill="currentColor"/></svg><span>REWIND</span>`);
    this.rwTime = SE.el('div', 'rw-time mono', this.scrub, '00:06.00');
    const track = SE.el('div', 'rw-track', this.scrub);
    this.rwFill = SE.el('div', 'rw-fill', track);
    this.rwHead = SE.el('div', 'rw-head', track);
    this.ticks = SE.el('div', 'rw-ticks', track);
    for (let i = 0; i <= 12; i++) SE.el('i', '', this.ticks);

    this.freeze = SE.el('div', 'rw-freeze', layer, '<i></i><i></i><i></i><i></i>');

    this.head = SE.el('div', 'ai-head', layer);
    const title = SE.el('div', 'ai-title display', this.head);
    this.titleWords = SE.words(title, c.title, ['AI']);
    this.ans = SE.el('div', 'ai-ans mono', this.head, `<i class="dot"></i><span>${c.answering}</span><span class="dots"><i>.</i><i>.</i><i>.</i></span>`);
    this.ansDots = [...this.ans.querySelectorAll('.dots i')];
    this.ansDot = this.ans.querySelector('.dot');
  },
  update(ctx) {
    const E = SE.ease, p = SE.p, T = ctx.T;
    const R = ctx.cfg.rewind;
    const [a, b] = ctx.cfg.scenes.rewind;
    const t = T - a; // local, real time

    // ---- Rewind treatment (6.0 → 6.95) ----
    const rw = p(T, R.start, R.start + 0.15) * (1 - p(T, R.end, R.end + 0.12));
    const speed = T > R.start && T < R.end ? Math.sin(Math.PI * (T - R.start) / (R.end - R.start)) : 0;
    ctx.world_.blur += speed * 2.2;
    ctx.world_.s *= 1 - speed * 0.035;
    ctx.world_.sat *= 1 - speed * 0.35;
    const scrubVis = p(T, R.start, R.start + 0.2, E.outCubic) * (1 - p(T, R.freezeUntil, R.freezeUntil + 0.25));
    SE.set(this.scrub, { o: scrubVis, y: (1 - p(T, R.start, R.start + 0.3, E.outCubic)) * 30 });
    const frac = SE.clamp(ctx.S / R.from);
    SE.css(this.rwFill, { transform: `scaleX(${frac.toFixed(4)})` });
    SE.css(this.rwHead, { left: (frac * 100).toFixed(3) + '%' });
    SE.text(this.rwTime, SE.fmtTime(ctx.S));
    SE.set(this.rwLabel, { o: T < R.end ? 1 : 0.35 });

    // ---- Freeze (6.95 → 7.25): hold frame + viewfinder corners ----
    const fr = p(T, R.end - 0.02, R.end + 0.1, E.outExpo) * (1 - p(T, R.freezeUntil + 0.05, R.freezeUntil + 0.35, E.inOutCubic));
    SE.set(this.freeze, { o: fr, s: SE.lerp(1.06, 1, p(T, R.end, R.end + 0.2, E.outExpo)) });
    // punch-in on the freeze
    ctx.world_.s *= 1 + p(T, R.end, R.end + 0.12, E.outExpo) * 0.02 * (1 - p(T, R.freezeUntil, R.freezeUntil + 0.6, E.inOutCubic));

    if (T < R.end) { SE.set(this.head, { o: 0 }); return; }

    // ---- AI answers (7.25 → 9.4) ----
    const u = T - R.freezeUntil; // 0 at un-freeze
    const ph = ctx.phone.s;
    const settle = p(u, 0, 0.8, E.inOutCubic);
    ph.o = 1;
    ph.ry = SE.lerp(-5, 0, settle);
    ph.rx = SE.lerp(3, 0, settle);
    ph.rz = 0;
    ph.s = SE.lerp(0.8, 0.84, settle);
    ph.y = SE.lerp(1060, 1100, settle);
    ph.dim = 0; ph.missed = 0; ph.blur = 0;
    const ringing = u >= 0 && u < 0.62;
    ph.ring = u < 0.62 ? 1 : 0;
    ph.buzz = ringing ? 1 : 0;
    ph.ai = p(u, 0.12, 0.5, E.outExpo);
    ph.answer = p(u, 0.3, 0.6, E.inOutCubic);
    ph.connected = p(u, 0.62, 0.9, E.outCubic);
    ph.callSecs = 1 + Math.max(0, u - 0.62);
    ph.chat1 = p(u, 0.72, 1.15);
    ph.typing = p(u, 1.17, 1.22);
    ph.chat2 = p(u, 1.34, 1.78);
    const guestTalk = u > 0.72 && u < 1.15 ? 1 : 0;
    const aiTalk = u > 1.34 && u < 1.78 ? 1 : 0;
    ph.speak = Math.max(guestTalk * 0.55, aiTalk);

    // Exit toward the dashboard is handled by Scene 4 (it overrides phone).

    // Stage headline — mirrors the phone so it reads silently.
    const headIn = u >= 0 ? 1 : 0;
    SE.revealWords(this.titleWords, u, 0.16, 0.06, 0.6);
    const ansK = p(u, 0.3, 0.65, E.outCubic);
    const connected = p(u, 0.62, 0.8);
    const headOut = p(T, b - 0.5, b - 0.1, E.inOutCubic);
    SE.set(this.head, { o: headIn * (1 - headOut), y: -headOut * 40, blur: headOut * 6 });
    SE.set(this.ans, { o: ansK, y: (1 - ansK) * 16 });
    this.ansDots.forEach((d, i) => SE.css(d, { opacity: connected > 0 ? '1' : (0.25 + 0.75 * (Math.sin(T * 8 - i * 0.9) > 0 ? 1 : 0)).toFixed(2) }));
    SE.css(this.ans, { '--live': connected.toFixed(3) });
    SE.css(this.ansDot, { opacity: (0.55 + 0.45 * Math.sin(T * 7)).toFixed(2) });

    ctx.bg.s.y = 1150;
    ctx.bg.s.o = 0.2 + 0.45 * settle;
    ctx.bg.s.alert = 0;
  },
});
