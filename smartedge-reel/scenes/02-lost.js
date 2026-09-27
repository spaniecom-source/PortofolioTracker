/*  SCENE 2 — THE LOST BOOKING (2.2–6.0s)
    Revenue visualisation: €247 potential booking drops to €0 LOST,
    with the wider cost listed underneath. Runs on the story clock. */
SE.scene({
  id: 'lost',
  build(layer, ctx) {
    const c = ctx.cfg.copy.lost;
    this.c = c;
    this.eyebrow = SE.el('div', 'lost-eyebrow mono', layer, `<i class="dot"></i>${c.eyebrow}`);
    this.numWrap = SE.el('div', 'lost-num mono', layer);
    this.cur = SE.el('span', 'cur', this.numWrap, c.currency);
    this.num = SE.el('span', 'val', this.numWrap, String(c.value));
    this.labels = SE.el('div', 'lost-labels display', layer);
    this.lblA = SE.el('div', 'lbl', this.labels, c.label);
    this.lblB = SE.el('div', 'lbl lost', this.labels, c.lostLabel);

    // Chart: booking value over the evening, drawn to one scale (€0–€300).
    const W = 888, H = 300;
    this.chart = { W, H, max: 300 };
    const y = (v) => H - (v / 300) * H;
    this.y = y;
    const pts = [[0, 40], [110, 62], [210, 58], [320, 96], [420, 120], [520, 150], [610, 176], [700, 205], [790, 232], [888, 247]];
    this.pts = pts;
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${y(p[1]).toFixed(1)}`).join(' ');
    const grid = [0, 100, 200, 300].map((v) =>
      `<line x1="0" x2="${W}" y1="${y(v)}" y2="${y(v)}" class="g"/><text x="0" y="${y(v) - 10}" class="gt">€${v}</text>`).join('');
    const svg = SE.el('div', 'lost-chart', layer, `
      <svg viewBox="-2 -30 ${W + 4} ${H + 34}" width="${W + 4}" height="${H + 34}">
        <defs>
          <linearGradient id="lostFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stop-color="var(--orange)" stop-opacity=".28"/>
            <stop offset="1" stop-color="var(--orange)" stop-opacity="0"/>
          </linearGradient>
          <clipPath id="lostClip"><rect id="lostClipRect" x="-2" y="-30" width="0" height="${H + 40}"/></clipPath>
        </defs>
        <g class="grid">${grid}</g>
        <g clip-path="url(#lostClip)">
          <path class="area" d="${d} L${W},${H} L0,${H} Z" fill="url(#lostFill)"/>
          <path class="line" d="${d}" fill="none"/>
        </g>
        <line class="drop" x1="${W}" x2="${W}" y1="${y(247)}" y2="${y(247)}"/>
        <circle class="end-halo" cx="${W}" cy="${y(247)}" r="22"/>
        <circle class="end" cx="${W}" cy="${y(247)}" r="9"/>
      </svg>`);
    this.svg = svg;
    this.clip = svg.querySelector('#lostClipRect');
    this.line = svg.querySelector('.line');
    this.area = svg.querySelector('.area');
    this.drop = svg.querySelector('.drop');
    this.end = svg.querySelector('.end');
    this.halo = svg.querySelector('.end-halo');
    this.grid = svg.querySelector('.grid');

    this.statsWrap = SE.el('div', 'lost-stats', layer);
    this.stats = c.stats.map((s) => {
      const row = SE.el('div', 'stat', this.statsWrap);
      SE.el('span', 'stat-n mono', row, s.n);
      SE.el('span', 'stat-l display', row, s.label);
      return row;
    });
  },
  update(ctx) {
    const E = SE.ease, p = SE.p, c = this.c;
    const [a] = ctx.cfg.scenes.lost;
    const t = ctx.S - a;
    const handoff = 1 - p(ctx.T, ctx.cfg.rewind.end - 0.35, ctx.cfg.rewind.end, E.inOutCubic);

    const enter = p(t, 0.0, 0.7, E.outExpo);
    const vis = enter * handoff;
    SE.set(this.layer, { o: vis > 0 ? 1 : 0 });

    // Eyebrow & big number rise out of the phone push.
    SE.set(this.eyebrow, { o: p(t, 0.15, 0.55, E.outCubic) * handoff, y: (1 - p(t, 0.15, 0.6, E.outCubic)) * 20 });

    // The drop: value counts down with an accelerating ease.
    const drop = p(t, 1.5, 2.05, E.inCubic);
    const settle = p(t, 2.05, 2.5, E.outCubic);
    const v = Math.round(c.value * (1 - drop));
    SE.text(this.num, String(v));
    const speed = drop > 0 && drop < 1 ? 1 : 0;
    SE.set(this.numWrap, {
      o: enter * handoff,
      s: SE.lerp(1.12, 1, enter),
      y: (1 - enter) * 40 + drop * 36 - settle * 36 + speed * 6,
      blur: (1 - enter) * 14 + speed * 2.5,
    });
    SE.css(this.numWrap, { '--mix': drop.toFixed(3) });

    // Labels crossfade: POTENTIAL BOOKING → LOST
    const lblIn = p(t, 0.3, 0.8, E.outExpo);
    SE.set(this.lblA, { o: lblIn * (1 - p(t, 1.6, 1.9)) * handoff, y: (1 - lblIn) * 30 + p(t, 1.6, 1.95, E.inCubic) * 30 });
    const lostIn = p(t, 1.95, 2.35, E.outExpo);
    SE.set(this.lblB, { o: lostIn * handoff, y: (1 - lostIn) * -30 });

    // Chart draws in, then the endpoint falls to €0.
    const draw = p(t, 0.2, 1.3, E.inOutCubic);
    SE.css(this.clip, { width: String((draw * (this.chart.W + 30)).toFixed(1)) });
    SE.css(this.grid, { opacity: (p(t, 0.1, 0.6) * 0.9).toFixed(3) });
    const endY = SE.lerp(this.y(247), this.y(0), drop);
    this.end.setAttribute('cy', endY.toFixed(1));
    this.halo.setAttribute('cy', endY.toFixed(1));
    this.drop.setAttribute('y2', endY.toFixed(1));
    SE.css(this.end, { opacity: p(t, 1.1, 1.3).toFixed(3) });
    SE.css(this.halo, { opacity: (p(t, 1.1, 1.3) * (0.5 + 0.35 * Math.sin(ctx.T * 6)) * (1 - drop)).toFixed(3) });
    SE.css(this.svg, { '--mix': drop.toFixed(3) });
    SE.set(this.svg, { o: p(t, 0.05, 0.5, E.outCubic) * handoff * (1 - p(t, 2.6, 3.2) * 0.45), y: (1 - p(t, 0.05, 0.7, E.outCubic)) * 30 });

    // Supporting losses — one row at a time.
    this.stats.forEach((row, i) => {
      const k = p(t, 2.05 + i * 0.24, 2.05 + i * 0.24 + 0.55, E.outExpo);
      SE.set(row, { o: k * handoff, y: (1 - k) * 36 });
      SE.css(row, { '--rule': k.toFixed(3) });
    });

    // Rewind makes the view feel sucked back into the phone.
    if (t > -0.2 && t < 4) {
      ctx.bg.s.y = SE.lerp(1000, 700, enter);
      ctx.bg.s.o = SE.lerp(ctx.bg.s.o, 0.4 - drop * 0.25, enter);
      ctx.bg.s.alert = Math.max(ctx.bg.s.alert, drop * 0.9 * handoff);
    }
  },
});
