/* ============================================================
   EDIT THIS FILE before the presentation.
   ============================================================ */
window.DECK_CONFIG = {
  presenter: 'Alexander Olivier von Stauffenberg',
  course: 'The United Nations and Conflict Management · Prof. Laura Herța',
  date: '28 October 2026',
  targetMinutes: 20,

  // Live voting (Mentimeter or Slido). One presentation holds every question; the class
  // joins once at the start and stays joined. Leave joinUrl empty to use the built-in
  // hands-up counter (keys 1–4 add a vote to option A–D, 0 resets).
  poll: {
    service: 'Mentimeter',            // shown on screen: 'Mentimeter' or 'Slido'
    joinUrl: '',                      // e.g. 'https://www.menti.com/al1b2c3d4e5f'
    code: ''                          // e.g. '1234 5678' (menti.com) or '#Tigray' (slido)
  },

  // Public link to the explorable map (explore.html published as a web page).
  explorerUrl: 'https://claude.ai/artifact/QYqmsLEesxFWwNjmUAYty7',

  // News clips: drop .mp4 files into the video/ folder with these names.
  // A missing file is skipped silently and the animated map shows instead.
  // start = second to start from, mute = false plays the clip's sound (press M).
  videos: {
    cold:     { file: 'video/01-cold-open.mp4',  start: 0, mute: true },
    tigray:   { file: 'video/02-tigray.mp4',     start: 0, mute: true },
    pretoria: { file: 'video/03-pretoria.mp4',   start: 0, mute: true },
    war2026:  { file: 'video/04-war-2026.mp4',   start: 0, mute: true },
    rewind:   { file: 'video/05-archive.mp4',    start: 0, mute: true },
    war2020:  { file: 'video/06-war-2020.mp4',   start: 0, mute: true },
    closing:  { file: 'video/07-closing.mp4',    start: 0, mute: true }
  }
};
