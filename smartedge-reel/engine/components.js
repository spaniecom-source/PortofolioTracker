/*  Shared visual components: background light, film grain, icons, phone. */
(function () {
  const SE = window.SE;

  // Material Symbols paths (Apache 2.0), 24×24 viewBox.
  SE.icons = {
    call: 'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z',
    callEnd: 'M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z',
    missed: 'M6.5 5.5L12 11l7-7-1-1-6 6-4.5-4.5H11V3H5v6h1.5V5.5zm17.21 11.17C20.66 13.78 16.54 12 12 12 7.46 12 3.34 13.78.29 16.67c-.18.18-.29.43-.29.71s.11.53.29.71l2.48 2.48c.18.18.43.29.71.29.27 0 .52-.11.7-.28.79-.74 1.69-1.36 2.66-1.85.33-.16.56-.5.56-.9v-3.1c1.45-.48 3-.73 4.6-.73 1.6 0 3.15.25 4.6.72v3.1c0 .39.23.74.56.9.98.49 1.87 1.12 2.67 1.85.18.18.43.28.7.28.28 0 .53-.11.71-.29l2.48-2.48c.18-.18.29-.43.29-.71s-.12-.52-.3-.7z',
    person: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  };
  SE.svgIcon = (name, cls = '') =>
    `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="${SE.icons[name]}"/></svg>`;
  SE.checkSvg = (cls = '') =>
    `<svg class="check ${cls}" viewBox="0 0 48 48" aria-hidden="true"><path d="M13 25.5l7.2 7.2L35.5 16" fill="none" stroke="currentColor" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/></svg>`;

  // ---------- Background: near-black paper + one controlled warm light ----------
  SE.Background = (parent) => {
    const root = SE.el('div', 'bg', parent);
    const light = SE.el('div', 'bg-light', root);
    const light2 = SE.el('div', 'bg-light bg-light-2', root);
    SE.el('div', 'bg-vignette', root);
    const api = {
      s: null,
      reset() { api.s = { x: 540, y: 1000, r: 1, o: 0.55, x2: 540, y2: 1500, o2: 0, alert: 0 }; },
      apply() {
        const s = api.s;
        SE.set(light, { x: s.x - 700, y: s.y - 700, s: s.r, o: s.o });
        SE.set(light2, { x: s.x2 - 700, y: s.y2 - 700, o: s.o2 });
        SE.css(root, { '--alert-mix': s.alert.toFixed(3) });
      },
    };
    return api;
  };

  // ---------- Film grain: static seeded noise, very low opacity ----------
  SE.Grain = (parent) => {
    const c = SE.el('canvas', 'grain', parent);
    c.width = 540; c.height = 960;
    const g = c.getContext('2d');
    const img = g.createImageData(c.width, c.height);
    const r = SE.rng(1337);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = (r() * 255) | 0;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  };

  // ---------- Phone ----------
  // One phone instance is shared by scenes 1 and 3. Scenes write to
  // phone.s every frame; phone.apply() turns that state into styles.
  SE.Phone = (parent, ctx) => {
    const c = ctx.cfg.copy.phone;
    const ai = ctx.cfg.copy.ai;
    const W = 600, H = 1236;
    const stage = SE.el('div', 'phone-stage', parent);
    const phone = SE.el('div', 'phone', stage);
    const shadow = SE.el('div', 'phone-shadow', phone);
    SE.el('div', 'phone-frame', phone);
    const screen = SE.el('div', 'phone-screen', phone);
    const screenTint = SE.el('div', 'screen-tint', screen);
    SE.el('div', 'status', screen, `<span class="clock">${c.clock}</span><span class="sys"><i class="sig"><b></b><b></b><b></b><b></b></i><i class="bat"><b></b></i></span>`);
    SE.el('div', 'island', screen);

    // Incoming call view
    const inc = SE.el('div', 'v-incoming', screen);
    const incHead = SE.el('div', 'inc-head', inc);
    SE.el('div', 'inc-line', incHead, c.line);
    SE.el('div', 'inc-name', incHead, c.caller);
    SE.el('div', 'inc-sub', incHead, c.callerSub);
    const avWrap = SE.el('div', 'avatar-wrap', inc);
    const rings = [0, 1, 2].map(() => SE.el('div', 'ring', avWrap));
    const avatar = SE.el('div', 'avatar', avWrap, SE.svgIcon('person'));
    const btns = SE.el('div', 'call-btns', inc);
    const decl = SE.el('div', 'cbtn decline', btns, `<span class="cb">${SE.svgIcon('callEnd')}</span><span class="cl">Decline</span>`);
    const acc = SE.el('div', 'cbtn accept', btns, `<span class="cb">${SE.svgIcon('call')}</span><span class="cl">Accept</span>`);
    const accCircle = acc.querySelector('.cb');

    // AI answering sheet
    const sheet = SE.el('div', 'ai-sheet', inc);
    const sheetMark = SE.el('img', 'sheet-mark', sheet);
    sheetMark.src = ctx.cfg.assets.mark;
    const sheetTxt = SE.el('div', 'sheet-txt', sheet);
    SE.el('div', 'sheet-title', sheetTxt, ai.sheetTitle);
    const sheetAns = SE.el('div', 'sheet-ans', sheetTxt, `Answering<span class="dots"><i>.</i><i>.</i><i>.</i></span>`);
    const sheetDots = [...sheetAns.querySelectorAll('.dots i')];
    const sheetBar = SE.el('div', 'sheet-bar', sheet, '<b></b>');
    const sheetBarFill = sheetBar.firstChild;

    // Missed view
    const mis = SE.el('div', 'v-missed', screen);
    const misIcon = SE.el('div', 'mis-icon', mis, SE.svgIcon('missed'));
    SE.el('div', 'mis-title', mis, c.missedTitle);
    SE.el('div', 'mis-name', mis, c.caller);
    SE.el('div', 'mis-sub', mis, c.missedSub);

    // Connected (AI) view
    const con = SE.el('div', 'v-connected', screen);
    const conHead = SE.el('div', 'con-head', con);
    const conLive = SE.el('div', 'con-live', conHead, `<i class="dot"></i><span class="lbl">${ai.liveLabel}</span><span class="tmr">00:01</span>`);
    const conTimer = conLive.querySelector('.tmr');
    SE.el('div', 'con-name', conHead, c.caller);
    const conBy = SE.el('div', 'con-by', conHead);
    const conByMark = SE.el('img', '', conBy); conByMark.src = ctx.cfg.assets.mark;
    SE.el('span', '', conBy, ai.handledBy);
    const wave = SE.el('div', 'wave', con);
    const bars = Array.from({ length: 36 }, () => SE.el('i', '', wave));
    const chat = SE.el('div', 'chat', con);
    const b1 = SE.el('div', 'bubble guest', chat);
    SE.el('div', 'b-label', b1, ai.guestLabel);
    const b1t = SE.el('div', 'b-text', b1);
    const b1ghost = SE.el('div', 'b-text ghost', b1, ai.guest);
    const b2 = SE.el('div', 'bubble ai', chat);
    const b2l = SE.el('div', 'b-label', b2);
    const b2m = SE.el('img', '', b2l); b2m.src = ctx.cfg.assets.mark;
    SE.el('span', '', b2l, ai.aiLabel);
    const b2t = SE.el('div', 'b-text', b2);
    SE.el('div', 'b-text ghost', b2, ai.reply);
    const typing = SE.el('div', 'typing', b2, '<i></i><i></i><i></i>');
    const typingDots = [...typing.children];
    const endBtn = SE.el('div', 'con-end', con, SE.svgIcon('callEnd'));

    const glare = SE.el('div', 'phone-glare', phone);

    const api = {
      s: null,
      reset() {
        api.s = {
          o: 0, x: 540, y: 1040, s: 0.8, rx: 0, ry: 0, rz: 0, blur: 0, dim: 0,
          ring: 0, buzz: 0, missed: 0, ai: 0, answer: 0, connected: 0,
          chat1: 0, chat2: 0, typing: 0, speak: 0, callSecs: 1, glare: 0.3,
        };
      },
      apply() {
        const s = api.s, T = ctx.T, t = ctx.S;
        // Vibration buzz: short bursts, fully deterministic.
        const burst = s.buzz * (Math.sin(t * Math.PI * 2 * 1.6) > 0.1 ? 1 : 0);
        const jx = burst * Math.sin(t * 190) * 2.4;
        const jr = burst * Math.sin(t * 150) * 0.35;
        SE.set(phone, {
          x: s.x - W / 2 + jx, y: s.y - H / 2, s: s.s,
          rx: s.rx, ry: s.ry, rz: s.rz + jr, o: s.o, blur: s.blur,
          bright: 1 - s.dim * 0.55, sat: 1 - s.dim * 0.4,
        });
        SE.css(glare, { opacity: s.glare.toFixed(3), backgroundPosition: `${(40 + s.ry * 3).toFixed(1)}% ${(30 - s.rx * 3).toFixed(1)}%` });
        SE.css(shadow, { opacity: (0.9 * (1 - s.blur / 20)).toFixed(3) });

        // Incoming
        const incO = (1 - s.missed) * (1 - s.connected);
        SE.set(inc, { o: incO, s: 1 - s.missed * 0.06, blur: s.missed * 10 + s.connected * 6 });
        rings.forEach((r, i) => {
          const ph = ((t * 1.25 + i / 3) % 1 + 1) % 1;
          SE.set(r, { s: 1 + ph * 1.1, o: s.ring * (1 - ph) * 0.55 });
        });
        SE.set(avatar, { s: 1 + s.ring * 0.03 * Math.sin(t * 12) });
        SE.set(accCircle, { s: 1 + s.ring * (1 - s.ai) * 0.06 * (0.5 + 0.5 * Math.sin(t * 9)) - s.answer * 0.12 });
        SE.set(decl, { o: 1 - s.ai });
        SE.set(acc, { o: 1 - s.ai * 0.0, x: -s.ai * 0 });
        SE.set(btns, { o: 1 - s.ai, y: s.ai * 40 });
        SE.set(sheet, { y: (1 - s.ai) * 520, o: s.ai > 0 ? 1 : 0 });
        SE.set(sheetMark, { rz: t * 40, s: 1 + 0.04 * Math.sin(T * 6) });
        sheetDots.forEach((d, i) => SE.css(d, { opacity: (0.25 + 0.75 * (Math.sin(T * 8 - i * 0.9) > 0 ? 1 : 0)).toFixed(2) }));
        SE.css(sheetBarFill, { transform: `scaleX(${SE.clamp(s.answer).toFixed(3)})` });

        // Missed
        SE.set(mis, { o: s.missed, s: 1.06 - s.missed * 0.06, blur: (1 - s.missed) * 8 });
        SE.set(misIcon, { s: 0.7 + 0.3 * SE.ease.outBack(SE.clamp(s.missed)) });
        SE.css(screenTint, { opacity: (s.missed * 0.7).toFixed(3) });

        // Connected
        SE.set(con, { o: s.connected, s: 1.04 - 0.04 * s.connected, blur: (1 - s.connected) * 8 });
        SE.text(conTimer, '00:' + String(Math.max(1, Math.floor(s.callSecs))).padStart(2, '0'));
        const liveDot = conLive.firstChild;
        SE.css(liveDot, { opacity: (0.5 + 0.5 * Math.sin(T * 7)).toFixed(2) });
        bars.forEach((b, i) => {
          const a = Math.abs(Math.sin(i * 1.7 + T * 9) * Math.sin(i * 0.37 + T * 5.3));
          const env = Math.sin((i / (bars.length - 1)) * Math.PI);
          const h = 0.08 + s.speak * env * (0.2 + 0.8 * a);
          SE.css(b, { transform: `scaleY(${h.toFixed(3)})` });
        });
        const k1 = SE.clamp(s.chat1);
        SE.set(b1, { o: SE.clamp(k1 * 6), y: (1 - SE.ease.outCubic(SE.clamp(k1 * 3))) * 30 });
        SE.text(b1t, SE.typed(ai.guest, SE.clamp((k1 - 0.05) / 0.95)));
        const k2 = SE.clamp(s.chat2);
        const ty = SE.clamp(s.typing);
        SE.set(b2, { o: Math.max(SE.clamp(ty * 6), SE.clamp(k2 * 6)), y: (1 - SE.ease.outCubic(SE.clamp(Math.max(ty, k2) * 3))) * 30 });
        SE.text(b2t, SE.typed(ai.reply, k2));
        SE.set(typing, { o: ty > 0 && k2 <= 0 ? 1 : 0 });
        typingDots.forEach((d, i) => SE.set(d, { y: -6 * Math.max(0, Math.sin(T * 10 - i * 0.8)) }));
        SE.set(endBtn, { o: s.connected });
      },
    };
    api.reset();
    return api;
  };
})();
