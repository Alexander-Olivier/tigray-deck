/* Slide engine (v2): keyboard/clicker navigation, staged reveals, animated map scenes,
   polls with QR, presenter window with notes and timer. Each slide may carry a
   <script type="application/json" class="scene"> array: one state per step, each merged onto the previous. */
(function () {
  const CFG = window.DECK_CONFIG;
  const stage = document.getElementById('stage');
  const slides = Array.from(document.querySelectorAll('.slide'));
  const hudCount = document.getElementById('count');
  const hudTime = document.getElementById('clock');
  const progress = document.querySelector('#progress i');
  let cur = 0, stepIdx = 0, timerStart = null, elapsedBefore = 0, presenter = null;

  /* ---------- the stage always fills the whole screen (100dvh × 100vw, no bars) ----------
     Content is designed in units of a 1080-tall screen; the stage's logical width follows
     the screen's shape, so a 16:10 laptop, a 4:3 projector or an ultra-wide all fill edge to edge. */
  let stageW = 1920, stageH = 1080;
  function fit() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const s = Math.min(vh / 1080, vw / 1600);
    stageW = vw / s; stageH = vh / s;
    stage.style.width = stageW + 'px'; stage.style.height = stageH + 'px';
    stage.style.setProperty('--sw', stageW + 'px');
    stage.style.transform = `scale(${s})`;
    stage.classList.toggle('portrait', stageH > stageW * .8);
    if (window.Scene && mapReady) Scene.resize(stageW, stageH);
  }
  let mapReady = false;
  window.addEventListener('resize', () => { fit(); fitAll(); }); fit();

  /* ---------- text never overflows: on a short or narrow screen the slide's text block is zoomed down
     until it fits between the top margin (cycle counter) and the bottom (narrator line, disclaimer, HUD) ---------- */
  function fitSlide(sl) {
    if (!sl) return;
    const kids = Array.from(sl.children).filter(c => c.tagName !== 'SCRIPT' && c.tagName !== 'ASIDE' && getComputedStyle(c).position !== 'absolute');
    if (!kids.length) return;
    kids.forEach(k => { k.style.zoom = ''; });
    sl.style.paddingTop = ''; sl.style.paddingBottom = '';
    const cs = getComputedStyle(sl);
    let padT = parseFloat(cs.paddingTop), padB = parseFloat(cs.paddingBottom);
    if (sl.querySelector('.disclaimer')) padB = Math.max(padB, 150);
    const vo = sl.querySelector('.vo'); if (vo) padB = Math.max(padB, 112 + vo.offsetHeight + 26);
    if (sl.dataset.cycle !== undefined) padT = Math.max(padT, 132);
    sl.style.paddingTop = padT + 'px'; sl.style.paddingBottom = padB + 'px';
    // gaps between blocks do not shrink with zoom, so scale only the blocks; measure again and refine
    const nSlots = kids.filter(k => k.dataset.u).length;
    const gaps = (parseFloat(cs.rowGap) || 0) * (kids.length - 1 - Math.max(0, nSlots - 1));
    // slots (data-u) take turns in one place: count only the tallest of them
    const hOf = k => { const ks = getComputedStyle(k); return k.getBoundingClientRect().height / scaleOf() + (parseFloat(ks.marginTop) + parseFloat(ks.marginBottom)) * (+k.style.zoom || 1); };
    const blocks = () => {
      let t = 0, slot = 0;
      kids.forEach(k => {
        const inner = Array.from(k.querySelectorAll('[data-u]'));
        if (inner.length) {   // a block whose children take turns (Abbink's trap): measure it with each one showing
          const was = inner.map(e => e.classList.contains('gone'));
          inner.forEach(e => e.classList.add('gone'));
          let best = hOf(k);
          inner.forEach(e => { e.classList.remove('gone'); best = Math.max(best, hOf(k)); e.classList.add('gone'); });
          inner.forEach((e, i) => e.classList.toggle('gone', was[i]));
          t += best; return;
        }
        if (!k.dataset.u) { t += hOf(k); return; }
        const g = k.classList.contains('gone'); k.classList.remove('gone');
        slot = Math.max(slot, hOf(k)); if (g) k.classList.add('gone');
      });
      return t + slot;
    };
    const avail = sl.clientHeight - padT - padB - gaps;
    let f = 1;
    for (let pass = 0; pass < 3; pass++) {
      const h = blocks();
      if (h <= avail + 1) break;
      // a safety net only: slides are written to fit at full size; anything below .9 is a layout bug to fix
      f = Math.max(.9, f * avail / h);
      if (pass === 0) console.warn('fitSlide: text zoomed on', sl.id, (avail / h).toFixed(2));
      kids.forEach(k => { k.style.zoom = f.toFixed(3); });
    }
  }
  function scaleOf() { return stage.getBoundingClientRect().height / stageH || 1; }
  function fitAll() { document.querySelectorAll('.slide').forEach(fitSlide); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);

  /* ---------- fill config-driven text ---------- */
  document.querySelectorAll('[data-cfg]').forEach(el => {
    const v = el.dataset.cfg.split('.').reduce((o, k) => o && o[k], CFG);
    if (v) el.textContent = v;
  });

  /* ---------- map scene ---------- */
  Scene.init({ svg: document.getElementById('geo'), ink: document.getElementById('ink'), layer: document.getElementById('layer'), width: stageW, height: stageH });
  mapReady = true;
  const scenes = new Map();
  slides.forEach(sl => {
    const tag = sl.querySelector('script.scene'); if (!tag) return;
    let arr; try { arr = JSON.parse(tag.textContent); } catch (e) { console.error('scene JSON error in', sl.id, e); return; }
    const out = []; let prev = {};
    arr.forEach(st => { const m = st.reset ? Object.assign({}, st) : Object.assign({}, prev, st); delete m.reset; out.push(m); prev = m; });
    scenes.set(sl, out);
  });
  function mapState(slide, i) {
    const sc = scenes.get(slide); if (!sc) return null;
    return sc[Math.max(0, Math.min(i, sc.length - 1))];
  }

  /* ---------- steps ---------- */
  // a .step appears at keypress k+1 (its order), or at data-s="n" when it must wait for the map
  const stepAt = (el, k) => el.dataset.s ? +el.dataset.s : k + 1;
  function stepCount(slide) {
    const n = Math.max(0, ...Array.from(slide.querySelectorAll('.step')).map(stepAt));
    const sc = scenes.get(slide); const m = sc ? sc.length - 1 : 0;
    return Math.max(n, m);
  }
  function applySteps(slide, i) {
    // data-u="n": a slot that is visible only until keypress n, then gives its place to the next one
    slide.querySelectorAll('.step').forEach((el, k) => {
      const on = i >= stepAt(el, k) && (!el.dataset.u || i < +el.dataset.u);
      el.classList.toggle('shown', on);
      if (el.dataset.u) el.classList.toggle('gone', !on);
    });
    const ms = mapState(slide, i); if (ms) Scene.go(ms);
    if (slide.classList.contains('quiz-slide') || slide.dataset.reveal) {
      const rv = slide.dataset.revealAt ? +slide.dataset.revealAt : stepCount(slide);
      slide.querySelectorAll('.opt[data-correct]').forEach(o => o.classList.toggle('correct', i >= rv));
    }
  }

  /* ---------- go ---------- */
  function go(n, fromEnd) {
    n = Math.max(0, Math.min(slides.length - 1, n));
    const prev = slides[cur]; const next = slides[n];
    const tr = next.dataset.transition, rewind = (tr === 'rewind' || tr === 'ffwd') && n > cur;
    const doIt = () => {
      prev.classList.remove('active'); next.classList.add('active');
      fitSlide(next);
      animateIn(next);
      cur = n; stepIdx = fromEnd ? stepCount(next) : 0;
      applySteps(next, stepIdx);
      hudCount.textContent = String(n + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
      progress.style.width = ((n) / (slides.length - 1) * 100) + '%';
      document.getElementById('hud').classList.toggle('hidden', next.dataset.hud === 'off');
      try { localStorage.setItem('tigray-v2-slide', n); } catch (e) {}
      history.replaceState(null, '', '#' + (n + 1));
      updatePresenter();
      if (timerStart === null && n > 0) startTimer();
    };
    if (rewind) {
      const r = document.getElementById('rewind'); r.classList.remove('on'); r.classList.toggle('ffwd', tr === 'ffwd');
      r.querySelector('span').textContent = next.dataset.transitionText || (tr === 'ffwd' ? '▶▶' : '◀◀');
      void r.offsetWidth; r.classList.add('on');
      setTimeout(doIt, 700);
    } else doIt();
  }
  function nextStep() {
    const s = slides[cur];
    if (stepIdx < stepCount(s)) { stepIdx++; applySteps(s, stepIdx); updatePresenter(); }
    else go(cur + 1);
  }
  function prevStep() {
    const s = slides[cur];
    if (stepIdx > 0) { stepIdx--; applySteps(s, stepIdx); updatePresenter(); }
    else go(cur - 1, true);
  }

  /* ---------- polls ---------- */
  function renderQR(el) {
    const url = CFG.poll.joinUrl;
    if (!url) {
      el.classList.add('missing');
      el.innerHTML = 'Live voting not set up yet.<br>Add the Mentimeter / Slido link in <b>js/config.js</b>.<br><br>Fallback: show of hands,<br>keys 1–4 count votes.';
      return;
    }
    const qr = qrcode(0, 'M'); qr.addData(url); qr.make();
    el.innerHTML = qr.createSvgTag({ cellSize: 8, margin: 0, scalable: true }) +
      `<div class="code">${CFG.poll.service} · <b>${CFG.poll.code || ''}</b>${url.replace(/^https?:\/\/(www\.)?/, '')}</div>`;
  }
  document.querySelectorAll('.qr[data-poll]').forEach(renderQR);
  document.querySelectorAll('.qr[data-explorer]').forEach(el => {
    if (!CFG.explorerUrl) { el.classList.add('missing'); el.innerHTML = 'Explorable map link goes here<br>(explorerUrl in js/config.js)'; return; }
    const qr = qrcode(0, 'M'); qr.addData(CFG.explorerUrl); qr.make();
    el.innerHTML = qr.createSvgTag({ cellSize: 8, margin: 0, scalable: true }) + `<div class="code">${CFG.explorerUrl.replace(/^https?:\/\//, '')}</div>`;
  });
  function tally(slide, k) {
    const opts = Array.from(slide.querySelectorAll('.opts .opt')); if (!opts.length) return;
    if (k === 0) opts.forEach(o => o.dataset.n = 0);
    else if (opts[k - 1]) opts[k - 1].dataset.n = (+opts[k - 1].dataset.n || 0) + 1;
    const total = opts.reduce((s, o) => s + (+o.dataset.n || 0), 0) || 1;
    opts.forEach(o => {
      const n = +o.dataset.n || 0;
      o.querySelector('.bar').style.width = (n / total * 100) + '%';
      o.querySelector('.n').textContent = n ? Math.round(n / total * 100) + '%' : '';
    });
  }

  /* ---------- timer ---------- */
  function startTimer() { timerStart = performance.now(); }
  function elapsed() { return elapsedBefore + (timerStart ? performance.now() - timerStart : 0); }
  function fmt(ms) { const s = Math.floor(ms / 1000); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
  setInterval(() => { hudTime.textContent = fmt(elapsed()); updatePresenterClock(); }, 500);

  /* ---------- presenter window (opens with P) ---------- */
  function openPresenter() {
    presenter = window.open('', 'tigray-presenter', 'width=1000,height=760');
    if (!presenter) return;
    presenter.document.title = 'Presenter — Tigray';
    presenter.document.body.innerHTML = `
      <style>
        body{margin:0;background:#15110e;color:#ecdfc6;font:18px/1.5 "Archivo",Helvetica,Arial,sans-serif;padding:28px 34px}
        .top{display:flex;justify-content:space-between;align-items:baseline;font-family:"IBM Plex Mono",monospace;color:#a99a82;letter-spacing:.08em;text-transform:uppercase;font-size:14px}
        #clk{font-size:56px;color:#e0972f;letter-spacing:.02em}
        #pace{font-size:16px} h1{font:800 44px/1 "Big Shoulders Display",Arial Narrow,sans-serif;text-transform:uppercase;margin:16px 0 4px}
        #step{font-family:monospace;color:#a99a82} #notes{font-size:24px;line-height:1.5;white-space:pre-wrap;margin-top:18px;max-width:900px}
        #nx{margin-top:24px;padding-top:14px;border-top:1px solid #3a2f25;color:#a99a82;font-family:monospace}
        .late{color:#c4472f!important}
      </style>
      <div class="top"><div><span id="clk">00:00</span> <span id="pace"></span></div><div id="pos"></div></div>
      <h1 id="ttl"></h1><div id="step"></div><div id="notes"></div><div id="nx"></div>`;
    presenter.addEventListener('keydown', onKey);
    updatePresenter();
  }
  function updatePresenter() {
    if (!presenter || presenter.closed) return;
    const s = slides[cur], d = presenter.document;
    d.getElementById('ttl').textContent = s.dataset.title || s.id;
    d.getElementById('pos').textContent = `${cur + 1} / ${slides.length}`;
    d.getElementById('step').textContent = stepCount(s) ? `step ${stepIdx} / ${stepCount(s)}` : '';
    const notes = s.querySelector('aside.notes');
    d.getElementById('notes').textContent = notes ? notes.textContent.trim().replace(/\n\s+/g, '\n') : '';
    const nx = slides[cur + 1];
    d.getElementById('nx').textContent = nx ? 'NEXT → ' + (nx.dataset.title || nx.id) : 'END';
    updatePresenterClock();
  }
  function updatePresenterClock() {
    if (!presenter || presenter.closed) return;
    const d = presenter.document, s = slides[cur];
    d.getElementById('clk').textContent = fmt(elapsed());
    const target = +s.dataset.at || 0; // minute mark this slide should start at
    const late = elapsed() / 60000 - target;
    const p = d.getElementById('pace');
    p.textContent = target ? `plan ${target.toFixed(1)} min · ${late >= 0 ? '+' : ''}${late.toFixed(1)}` : '';
    p.classList.toggle('late', late > 1);
  }

  /* ---------- entrance animations (like PowerPoint's "on slide start") ---------- */
  function animateIn(slide) {
    const parts = slide.querySelectorAll(':scope > :not(aside):not(.step):not(script):not(.free-keep), :scope > .poll > div > :not(.step):not(.opts), :scope > .poll > .qr, :scope > .paper > *, :scope > .cards > .card:not(.step), :scope > .facts > .fact, .opts > .opt, .timeline, .score, .ttl > *:not(.step)');
    let i = 0;
    parts.forEach(el => {
      if (el.classList.contains('step')) return;
      el.classList.remove('enter'); void el.offsetWidth;
      el.style.setProperty('--d', (i++ * 90) + 'ms');
      el.classList.add('enter');
    });
  }

  /* ---------- mouse wheel, trackpad and swipe move between slides ---------- */
  let wheelLock = 0;
  window.addEventListener('wheel', e => {
    if (document.getElementById('overview').classList.contains('on')) return;
    e.preventDefault();
    const now = Date.now(); if (now < wheelLock || Math.abs(e.deltaY) < 18) return;
    wheelLock = now + 750;
    e.deltaY > 0 ? nextStep() : prevStep();
  }, { passive: false });
  let touch = null;
  window.addEventListener('touchstart', e => { touch = [e.touches[0].clientX, e.touches[0].clientY]; }, { passive: true });
  window.addEventListener('touchend', e => {
    if (!touch) return;
    const dx = e.changedTouches[0].clientX - touch[0], dy = e.changedTouches[0].clientY - touch[1];
    touch = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 50) return;
    (Math.abs(dx) > Math.abs(dy) ? dx < 0 : dy < 0) ? nextStep() : prevStep();
  });

  /* ---------- overview: all slides as a grid, like PowerPoint's slide sorter (O) ---------- */
  const ov = document.getElementById('overview');
  slides.forEach((sl, i) => {
    const b = document.createElement('button'); b.type = 'button';
    const act = sl.querySelector('.eyebrow .act, .eyebrow span');
    b.innerHTML = `<span class="n">${String(i + 1).padStart(2, '0')}</span><span class="t"></span><span class="a"></span>`;
    b.querySelector('.t').textContent = sl.dataset.title || sl.id;
    b.querySelector('.a').textContent = act ? act.textContent : '';
    b.addEventListener('click', () => { toggleOverview(false); go(i); });
    ov.querySelector('.grid').appendChild(b);
  });
  function toggleOverview(on) {
    on = on ?? !ov.classList.contains('on');
    ov.classList.toggle('on', on);
    ov.querySelectorAll('.grid button').forEach((b, i) => b.classList.toggle('cur', i === cur));
  }

  /* ---------- keys ---------- */
  function onKey(e) {
    const k = e.key;
    if (ov.classList.contains('on') && !['o', 'O', 'Escape'].includes(k)) return;
    if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(k)) { e.preventDefault(); nextStep(); }
    else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); prevStep(); }
    else if (k === 'ArrowDown') go(cur + 1);
    else if (k === 'ArrowUp') go(cur - 1);
    else if (k === 'Home') go(0);
    else if (k === 'End') go(slides.length - 1);
    else if (k === 'p' || k === 'P' || k === 'n' || k === 'N') openPresenter();
    else if (k === 'f' || k === 'F') { (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {}); }
    else if (k === 'b' || k === 'B') { stage.style.opacity = stage.style.opacity === '0' ? '1' : '0'; }
    else if (k === 't' || k === 'T') { if (timerStart) { elapsedBefore = elapsed(); timerStart = null; } else startTimer(); }
    else if (k === 'r' || k === 'R') { elapsedBefore = 0; timerStart = null; hudTime.textContent = '00:00'; }
    else if (k === 'h' || k === 'H' || k === '?') { const h = document.getElementById('help'); h.hidden = !h.hidden; }
    else if (/^[0-4]$/.test(k)) tally(slides[cur], +k);
    else if (k === 'o' || k === 'O' || k === 'Escape') { toggleOverview(k === 'Escape' ? false : undefined); }
    else if (k === 'g' || k === 'G') { const n = parseInt(prompt('Go to slide') || '', 10); if (n) go(n - 1); }
  }
  document.addEventListener('keydown', onKey);
  stage.addEventListener('click', e => { if (e.target.closest('a, button, .opt')) return; nextStep(); });
  document.querySelectorAll('.opts .opt').forEach((o, i) => o.addEventListener('click', () => {
    const slide = o.closest('.slide'); const idx = Array.from(slide.querySelectorAll('.opts .opt')).indexOf(o) + 1; tally(slide, idx);
  }));

  /* ---------- start ---------- */
  let startAt = 0;
  const h = parseInt(location.hash.slice(1), 10);
  if (h) startAt = h - 1; else { try { startAt = +(localStorage.getItem('tigray-v2-slide') || 0); } catch (e) {} }
  slides[0].classList.add('active');
  if (startAt) go(startAt); else go(0);
  // for rehearsal and testing: DeckAPI.show(slideNumber, step)
  window.DeckAPI = { show(n, k) { go(n - 1); let i = 0; const t = setInterval(() => { if (i++ >= (k || 0)) return clearInterval(t); nextStep(); }, 1300); }, jump(n, k) { go(n - 1); setTimeout(() => { stepIdx = k; applySteps(slides[cur], k); updatePresenter(); }, 800); }, slides: () => slides.map(s => s.id) };
})();
