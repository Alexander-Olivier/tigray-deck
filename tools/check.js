/* Dev-only layout check (not loaded by the deck). In the browser console:
     s=document.createElement('script'); s.src='tools/check.js'; document.body.appendChild(s);
     then __run() or __run([3,12]) and read window.__res when window.__done is true.
   It walks every step and lists text that leaves the screen or overlaps the narrator line,
   the disclaimer, the HUD, the cycle counter, the table, or a speech bubble. */
window.__check = function () {
  const st = document.getElementById('stage').getBoundingClientRect();
  const sl = document.querySelector('.slide.active');
  const vis = el => { if (!el) return false; if (el.classList.contains('step') && !el.classList.contains('shown')) return false; const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2; };
  const R = el => el.getBoundingClientRect();
  const ov = (a, b, pad = 2) => !(a.right <= b.left + pad || b.right <= a.left + pad || a.bottom <= b.top + pad || b.bottom <= a.top + pad);
  const out = [];
  const flow = Array.from(sl.children).filter(c => c.tagName !== 'SCRIPT' && c.tagName !== 'ASIDE' && getComputedStyle(c).position !== 'absolute');
  const blocks = [];
  flow.forEach(c => {
    if (c.classList.contains('step') && !c.classList.contains('shown')) return;
    const inner = c.querySelectorAll('.step');
    if (inner.length) { inner.forEach(i => { if (i.classList.contains('shown')) blocks.push(i); }); if (!c.classList.contains('timeline') && !c.classList.contains('trap') && !c.classList.contains('conds') && !c.classList.contains('ulist') && !c.classList.contains('dossier') && !c.classList.contains('trap2') && c.tagName !== 'TABLE') blocks.push(c); }
    else blocks.push(c);
  });
  const others = [];
  sl.querySelectorAll(':scope > .vo, :scope > .disclaimer, :scope > .panel, :scope > .ttl').forEach(e => { if (vis(e)) others.push(e); });
  const hud = document.getElementById('hud'); if (!hud.classList.contains('hidden')) others.push(hud);
  const cyc = document.querySelector('.cycle.in'); if (cyc) others.push(cyc);
  const tab = document.querySelector('.table.in'); if (tab) others.push(tab);
  const name = e => (e.id ? '#' + e.id : '.' + (e.className.baseVal ?? e.className).toString().split(' ')[0]) + (e.textContent ? '«' + e.textContent.trim().slice(0, 18) + '»' : '');
  blocks.forEach(b => {
    if (!vis(b)) return; const r = R(b);
    if (r.bottom > st.bottom - 4 || r.top < st.top) out.push('OUT ' + name(b));
    others.forEach(o => { if (ov(r, R(o))) out.push(name(b) + ' x ' + name(o)); });
  });
  for (let i = 0; i < others.length; i++) for (let j = i + 1; j < others.length; j++) if (ov(R(others[i]), R(others[j]))) out.push(name(others[i]) + ' x ' + name(others[j]));
  document.querySelectorAll('.bubble.in').forEach(bb => { const r = R(bb); if (r.width < 5) return; blocks.concat(others).forEach(b => { if (vis(b) && ov(r, R(b), 6)) out.push('bubble«' + bb.textContent.slice(0, 16) + '» x ' + name(b)); }); if (r.top < st.top || r.bottom > st.bottom || r.left < st.left || r.right > st.right) out.push('bubble off-stage «' + bb.textContent.slice(0, 16) + '»'); });
  Array.from(sl.children).forEach(c => { if (c.style.zoom && +c.style.zoom < 1) out.push('ZOOM ' + c.style.zoom + ' ' + (c.className || c.tagName)); });
  document.querySelectorAll('img').forEach(i => { if (i.complete && i.naturalWidth === 0) out.push('IMG missing ' + i.src); });
  return out;
};
window.__run = async function (only) {
  const res = {}; const ids = DeckAPI.slides(); window.__done = false; window.__steps = 0;
  for (let s = 1; s <= ids.length; s++) {
    if (only && !only.includes(s)) continue;
    DeckAPI.jump(s, 0); await new Promise(r => setTimeout(r, 1500));
    const sl = document.querySelector('.slide.active');
    const steps = Math.max(0, ...Array.from(sl.querySelectorAll('.step')).map((el, k) => el.dataset.s ? +el.dataset.s : k + 1));
    const sc = sl.querySelector('script.scene'); const m = sc ? JSON.parse(sc.textContent).length - 1 : 0;
    const total = Math.max(steps, m);
    for (let k = 0; k <= total; k++) {
      if (k > 0) { DeckAPI.jump(s, k); await new Promise(r => setTimeout(r, 1350)); }
      window.__steps++;
      const o = __check(); if (o.length) res[s + ':' + sl.id + ':' + k] = o;
    }
  }
  window.__res = res; window.__done = true; return res;
};
