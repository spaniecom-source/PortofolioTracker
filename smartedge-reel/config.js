/*  SmartEdge AI — "Missed Call" Reel
    ------------------------------------------------------------------
    Everything you are likely to change lives in this file:
    copy, brand colours, fonts, asset paths and scene timing.
    All times are in seconds on the master timeline.
*/
window.SE = window.SE || {};

SE.config = {
  width: 1080,
  height: 1920,
  fps: 30,
  // Playback speed. Scene timings below are written at 1.0; 0.8 plays
  // everything 25% slower. Output length = duration (real seconds).
  speed: 0.8,
  // Design-time ranges that keep their own speed. The rewind and freeze stay
  // at full speed so the snap-back keeps its punch.
  speedOverrides: [{ from: 6.0, to: 7.25, speed: 1.0 }],
  duration: 24.0,

  // Brand palette (SmartEdge AI Brand Guide). Applied as CSS variables.
  colors: {
    paper: '#15110D',    // primary background
    ink: '#F5F1ED',      // primary text
    orange: '#FF5A36',   // hero accent — use sparingly
    green: '#145C4B',    // secondary action
    surface: '#1F1B15',  // cards, panels
    success: '#B7E6B7',  // positive states
    alert: '#FEC3BD',    // warning / loss states
  },

  fonts: {
    display: "'Bricolage Grotesque', 'Helvetica Neue', Arial, sans-serif",
    body: "'Manrope', 'Helvetica Neue', Arial, sans-serif",
    mono: "'JetBrains Mono', 'SFMono-Regular', Menlo, monospace",
  },

  // Swap these files to rebrand. Both are transparent PNGs.
  assets: {
    mark: 'assets/brand/mark.png',
    wordmark: 'assets/brand/wordmark.png',
  },

  // Scene windows on the master timeline [start, end].
  scenes: {
    hook:       [0.0, 2.6],
    lost:       [2.2, 6.0],
    rewind:     [6.0, 9.4],
    automation: [9.2, 15.2],
    result:     [14.65, 19.0],
  },

  // Scene 3 rewinds scenes 1–2. Between `start` and `end` the story clock
  // runs backwards from `from` to `to`, then stays frozen on `to`.
  rewind: { start: 6.0, end: 6.95, from: 6.0, to: 1.0, freezeUntil: 7.25 },

  copy: {
    hook: {
      headline: ['WHAT HAPPENS', 'WHEN YOUR HOTEL', 'MISSES A CALL?'],
      accentWords: ['MISSES', 'A', 'CALL?'],
      missed: 'MISSED CALL',
      missedMeta: '21:47 · NO ANSWER',
    },
    phone: {
      clock: '21:47',
      line: 'FRONT DESK · LINE 1',
      caller: 'Potential Guest',
      callerSub: 'Mobile · +34 612 •• •• 18',
      missedTitle: 'Missed call',
      missedSub: '21:47 · Rang 6 times',
    },
    lost: {
      eyebrow: 'BOOKING VALUE · TONIGHT, 21:47',
      value: 247,
      currency: '€',
      label: 'POTENTIAL BOOKING',
      lostLabel: 'LOST',
      stats: [
        { n: '3', label: 'MISSED CALLS' },
        { n: '7', label: 'MISSED INQUIRIES' },
        { n: '12', label: 'UNANSWERED FOLLOW-UPS' },
      ],
    },
    ai: {
      title: 'AI RECEPTIONIST',
      answering: 'ANSWERING',
      sheetTitle: 'AI Receptionist',
      liveLabel: 'LIVE',
      handledBy: 'Handled by SmartEdge AI',
      guestLabel: 'Guest',
      aiLabel: 'AI Receptionist',
      guest: 'Hi, do you have a room available this weekend?',
      reply: 'Absolutely. Let me check availability for you.',
    },
    dashboard: {
      product: 'SmartEdge AI',
      agent: 'Front Desk Agent',
      live: 'LIVE',
      session: 'SESSION SE-24817',
      steps: [
        { title: 'CALL RECEIVED', meta: 'Inbound · answered in 0.8s' },
        { title: 'GUEST QUALIFIED', meta: '2 adults · Sat 14 – Sun 15 Nov' },
        { title: 'AVAILABILITY CHECKED', meta: 'Deluxe King · 4 of 12 free' },
        { title: 'BOOKING CONFIRMED', meta: '€247 · Ref SE-4821' },
        { title: 'CRM UPDATED', meta: 'Guest profile synced · follow-up set' },
      ],
      kpiA: { label: 'RESPONSE TIME', value: '0.8s' },
      kpiB: { label: 'REVENUE CAPTURED', value: 247 },
    },
    result: {
      title: 'RESERVATION CONFIRMED',
      rows: [
        ['ROOM', 'Deluxe King'],
        ['DATES', 'Sat 14 – Sun 15 Nov'],
        ['GUESTS', '2 adults'],
        ['REF', 'SE-4821'],
        ['TOTAL', '€247'],
      ],
      footnote: 'Confirmation sent by SMS and email',
      headline: ['NEVER MISS A', 'BOOKING AGAIN.'],
      cta: 'TRY OUR VOICE AGENT',
      url: 'aismartedge.com',
      tagline: 'AI AUTOMATION FOR MODERN HOTELS',
    },
  },

  // Sound-design cue sheet (seconds). Exported next to the video by the
  // renderer so an editor can drop SFX on exact frames.
  audioCues: [
    { t: 0.00, cue: 'Phone ring (soft, filtered)', dur: 1.45 },
    { t: 1.45, cue: 'Ring cuts — low sub thud / missed-call tone' },
    { t: 2.25, cue: 'Air whoosh into data view' },
    { t: 3.70, cue: 'Descending tick sweep as €247 drops to €0' },
    { t: 4.40, cue: 'Soft UI tick ×3 (stats)', dur: 0.8 },
    { t: 6.00, cue: 'Tape-style rewind swell', dur: 0.95 },
    { t: 6.95, cue: 'Hard stop / freeze' },
    { t: 7.25, cue: 'Phone ring again', dur: 0.55 },
    { t: 7.87, cue: 'Call connect chime' },
    { t: 7.97, cue: 'Chat bubble pop — guest message' },
    { t: 8.59, cue: 'Chat bubble pop — AI reply' },
    { t: 9.20, cue: 'Transition whoosh into dashboard' },
    { t: 10.00, cue: 'UI click — step 1' },
    { t: 10.95, cue: 'UI click — step 2' },
    { t: 11.90, cue: 'UI click — step 3' },
    { t: 12.85, cue: 'UI click — step 4 + coin/value tick' },
    { t: 13.80, cue: 'UI click — step 5' },
    { t: 15.10, cue: 'Booking confirmation chime (badge check)' },
    { t: 16.40, cue: 'Cinematic build (low pad swell)', dur: 1.2 },
    { t: 16.95, cue: 'Subtle final impact on headline' },
    { t: 17.45, cue: 'Soft UI click as the CTA lands' },
  ],
};
