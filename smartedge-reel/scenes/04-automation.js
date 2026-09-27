/*  SCENE 4 — THE AUTOMATION (9.0–15.2s)
    The phone recedes; the SmartEdge agent dashboard runs the booking
    pipeline one step at a time. */
SE.scene({
  id: 'automation',
  build(layer, ctx) {
    const c = ctx.cfg.copy.dashboard;
    this.c = c;
    this.orb1 = SE.el('div', 'glass-orb o1', layer);
    this.orb2 = SE.el('div', 'glass-orb o2', layer);
    const panel = (this.panel = SE.el('div', 'dash', layer));
    const head = SE.el('div', 'dash-head', panel);
    const brand = SE.el('div', 'dash-brand', head);
    const m = SE.el('img', 'dash-mark', brand); m.src = ctx.cfg.assets.mark;
    SE.el('div', 'dash-names', brand, `<div class="dash-prod display">${c.product}</div><div class="dash-agent">${c.agent}</div>`);
    this.live = SE.el('div', 'dash-live mono', head, `<i class="dot"></i>${c.live}`);
    this.liveDot = this.live.querySelector('.dot');

    const sub = SE.el('div', 'dash-sub mono', panel);
    SE.el('span', '', sub, c.session);
    this.clock = SE.el('span', 'dash-clock', sub, '00:00.0');

    const list = (this.list = SE.el('div', 'steps', panel));
    this.rail = SE.el('div', 'rail', list, '<b></b>');
    this.railFill = this.rail.firstChild;
    this.packet = SE.el('div', 'packet', list);
    this.steps = c.steps.map((s, i) => {
      const row = SE.el('div', 'step', list);
      const node = SE.el('div', 'node', row);
      const num = SE.el('span', 'node-n mono', node, String(i + 1).padStart(2, '0'));
      const spin = SE.el('span', 'node-spin', node);
      const chk = SE.el('span', 'node-chk', node, SE.checkSvg());
      const body = SE.el('div', 'step-body', row);
      SE.el('div', 'step-title display', body, s.title);
      const meta = SE.el('div', 'step-meta mono', body);
      SE.el('div', 'step-meta-ghost mono', body, s.meta);
      const tag = SE.el('div', 'step-tag mono', row, `<span class="run">RUNNING</span><span class="ok">DONE</span>`);
      return { row, node, num, spin, chk, chkPath: chk.querySelector('path'), meta, text: s.meta, tag,
        run: tag.querySelector('.run'), ok: tag.querySelector('.ok') };
    });

    const kpis = SE.el('div', 'kpis', panel);
    const ka = SE.el('div', 'kpi', kpis, `<div class="kpi-l mono">${c.kpiA.label}</div><div class="kpi-v display">${c.kpiA.value}</div>`);
    const kb = SE.el('div', 'kpi hero', kpis, `<div class="kpi-l mono">${c.kpiB.label}</div><div class="kpi-v display">€<span>0</span></div>`);
    this.kpiA = ka; this.kpiB = kb;
    this.kpiBVal = kb.querySelector('.kpi-v span');
  },
  update(ctx) {
    const E = SE.ease, p = SE.p, T = ctx.T;
    const [a, b] = ctx.cfg.scenes.automation;
    const t = T - a;
    if (T > a + 1) ctx.phone.s.o = 0; // phone has left for good
    if (t < -0.1 || T > b + 0.1) { SE.set(this.layer, { o: 0 }); return; }
    SE.set(this.layer, { o: 1 });

    // Phone recedes into depth as the panel rises.
    const ph = ctx.phone.s;
    const out = p(t, 0.0, 0.6, E.inOutCubic);
    if (t > -0.1) {
      ph.s *= 1 - out * 0.35;
      ph.y -= out * 160;
      ph.o *= 1 - p(t, 0.05, 0.4, E.inOutCubic);
      ph.blur += out * 12;
      ph.dim = Math.max(ph.dim, out * 0.6);
    }

    const rise = p(t, 0.1, 0.9, E.outExpo);
    const exit = p(T, b - 0.55, b - 0.05, E.inOutCubic);
    SE.set(this.panel, {
      o: p(t, 0.1, 0.45) * (1 - exit),
      y: (1 - rise) * 220 - p(t, 0.5, 6.0, E.inOutCubic) * 24 - exit * 40,
      rx: SE.lerp(18, 0, p(t, 0.1, 1.5, E.outCubic)),
      s: SE.lerp(0.94, 1, rise) * (1 - exit * 0.06),
      blur: (1 - rise) * 10 + exit * 10,
    });

    // Slow-drifting light behind the glass.
    const orbO = p(t, 0.1, 0.9) * (1 - exit);
    SE.set(this.orb1, { x: 560 + Math.sin(t * 0.7) * 140, y: 520 + Math.cos(t * 0.5) * 160 + (1 - rise) * 200, o: orbO * 0.9 });
    SE.set(this.orb2, { x: 40 + Math.cos(t * 0.6) * 120, y: 980 + Math.sin(t * 0.45) * 180 + (1 - rise) * 200, o: orbO * 0.8 });
    SE.css(this.liveDot, { opacity: (0.5 + 0.5 * Math.sin(T * 6)).toFixed(2) });
    SE.text(this.clock, SE.fmtTime(Math.max(0, t - 0.5)).slice(0, 7));

    // Steps: each one runs (spinner, packet travels in) then resolves.
    const S0 = 0.8, STEP = 0.95, RUN = 0.55;
    const n = this.steps.length;
    let railK = 0;
    this.steps.forEach((s, i) => {
      const st = S0 + i * STEP;
      const reveal = p(t, 0.45 + i * 0.07, 0.95 + i * 0.07, E.outExpo);
      const active = p(t, st, st + 0.18, E.outCubic);
      const done = p(t, st + RUN, st + RUN + 0.3, E.outExpo);
      const running = active * (1 - done);
      SE.set(s.row, { o: reveal * (0.34 + 0.66 * Math.max(active, done)), y: (1 - reveal) * 30 });
      SE.css(s.row, { '--act': running.toFixed(3), '--done': done.toFixed(3) });
      SE.set(s.num, { o: 1 - done, s: 1 - done * 0.5 });
      SE.set(s.spin, { o: running, rz: (t - st) * 420 });
      SE.set(s.chk, { o: done > 0 ? 1 : 0, s: 0.6 + 0.4 * E.outBack(done) });
      SE.css(s.chkPath, { strokeDasharray: '1', strokeDashoffset: (1 - p(t, st + RUN, st + RUN + 0.35, E.outCubic)).toFixed(3) });
      SE.text(s.meta, SE.typed(s.text, p(t, st + 0.1, st + RUN + 0.2)));
      SE.set(s.tag, { o: Math.max(active, done), s: 0.9 + 0.1 * Math.max(active, done) });
      SE.set(s.run, { o: running });
      SE.set(s.ok, { o: done });
      if (t >= st) railK = i + p(t, st, st + RUN, E.inOutCubic);
    });
    // Rail runs node-centre to node-centre; packet rides its tip.
    const railFrac = SE.clamp(railK / (n - 1));
    SE.css(this.railFill, { transform: `scaleY(${railFrac.toFixed(4)})` });
    const lastDone = t > S0 + (n - 1) * STEP + RUN;
    const moving = t > S0 && !lastDone;
    SE.css(this.packet, { top: `calc(var(--rail-top) + ${railFrac.toFixed(4)} * var(--rail-h))` });
    SE.set(this.packet, { o: moving ? 1 : 0, s: 1 + 0.15 * Math.sin(T * 10) });

    // KPIs
    const ka = p(t, S0 + RUN, S0 + RUN + 0.4, E.outCubic);
    SE.set(this.kpiA, { o: 0.35 + 0.65 * ka });
    const bookDone = S0 + 3 * STEP + RUN;
    const kb = p(t, bookDone, bookDone + 0.7, E.outCubic);
    SE.text(this.kpiBVal, String(Math.round(this.c.kpiB.value * kb)));
    SE.set(this.kpiB, { o: 0.35 + 0.65 * p(t, bookDone, bookDone + 0.2) });
    SE.css(this.kpiB, { '--glow': (kb * (1 - p(t, bookDone + 0.8, bookDone + 2))).toFixed(3) });

    ctx.bg.s.y = SE.lerp(1150, 900, rise);
    ctx.bg.s.o = SE.lerp(ctx.bg.s.o, 0.42, rise);
    ctx.bg.s.o2 = rise * 0.25 * (1 - exit);
    ctx.bg.s.y2 = 1650;
  },
});
