/* Scene engine. One Mercator map is drawn once; zooming is an affine transform of it (smooth, cheap).
   A screen-space layer on top holds everything that must stay crisp at any zoom: arrows, explosions,
   actor tokens with photos and waving flags, speech bubbles, alliance lines, labels and the year stamp.
   Every slide step hands Scene.go() a plain state object; the engine diffs it against what is on screen. */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const base = d3.geoMercator().scale(1000 / (2 * Math.PI)).translate([500, 500]).precision(.2);
  const gpath = d3.geoPath(base);
  let W = 1920, H = 1080;
  let svg, gWorld, ink, layer, dimEl, yearEl, legendEl, pastEl, cycleEl, tableEl, seaG;
  const T = { k: 1, x: 0, y: 0 };                  // current transform
  let tween = null, state = {};
  const shapes = { country: {}, region: {}, zone: {} };
  const live = { marker: new Map(), boom: new Map(), token: new Map(), bubble: new Map(), arrow: new Map(), link: new Map(), label: new Map(), flag: new Map(), poly: new Map(), pocket: new Map() };

  const C = {
    ochre: '#e0972f', oxide: '#c4472f', lichen: '#8fa48a', sand: '#ecdfc6', dim: '#a99a82', sky: '#5b92e5',
    gold: '#d9b44a', violet: '#9b7bd0', teal: '#4fb3a9', rose: '#d06b8a', land: '#2a221c', land2: '#33291f', sea: '#120f0c',
    fed: '#5fae6a', eri: '#4a8fd6', amh: '#a07cd8', tig: '#e0972f', rsf: '#c9a96a', saf: '#d24d57', hou: '#2f9a55'
  };
  const col = c => !c ? C.land : c.startsWith('flag:') ? ((window.FLAGS || {})[c.slice(5)] || {}).color || C.sand : (C[c] || c);

  /* ---------- views: named bounding boxes [[west, south], [east, north]] ---------- */
  const VIEWS = {
    world:      [[-110, -30], [140, 66]],
    oldworld:   [[-15, -12], [125, 62]],
    italy:      [[4, -4], [54, 47]],
    italyHorn:  [[9, 1], [52, 45]],
    egyptHorn:  [[26, 4], [50, 26]],
    mideast:    [[20, 0], [64, 42.5]],
    redsea:     [[29, 9], [62, 37.5]],
    redseaS:    [[30, 7.2], [48.5, 22.8]],
    sudanYemen: [[20, 7], [54, 23]],
    horn:       [[31, -2], [53, 19]],
    hornN:      [[33, 7.5], [46.5, 18.5]],
    ethiopia:   [[32.5, 3], [48.5, 15.6]],
    north:      [[36, 11.2], [41.2, 15.4]],
    tigray:     [[36.2, 12.15], [40.4, 14.95]],
    eritrea:    [[36.2, 12.2], [43.6, 18.2]],
    west:       [[35.8, 12.6], [38.6, 14.7]],
    border:     [[35.4, 11.4], [42.0, 16.6]]
  };
  function frameRect(f) {
    const m = 40;
    switch (f) {
      case 'right':  return [W * .40, 70, W * .985, H - 90];
      case 'right2': return [W * .50, 70, W * .985, H - 90];
      case 'left':   return [m, 70, W * .60, H - 90];
      case 'center': return [W * .18, 60, W * .82, H - 80];
      case 'top':    return [m, 40, W - m, H * .66];
      default:       return [m, m, W - m, H - m];
    }
  }
  function fitTransform(bbox, frame) {
    const b = typeof bbox === 'string' ? VIEWS[bbox] : bbox;
    const p0 = base([b[0][0], b[1][1]]), p1 = base([b[1][0], b[0][1]]);
    const [fx0, fy0, fx1, fy1] = frameRect(frame);
    const fw = fx1 - fx0, fh = fy1 - fy0, bw = p1[0] - p0[0], bh = p1[1] - p0[1];
    const k = Math.min(fw / bw, fh / bh);
    return { k, x: fx0 + (fw - bw * k) / 2 - p0[0] * k, y: fy0 + (fh - bh * k) / 2 - p0[1] * k };
  }
  const toView = t => [(W / 2 - t.x) / t.k, (H / 2 - t.y) / t.k, W / t.k];
  const fromView = v => { const k = W / v[2]; return { k, x: W / 2 - v[0] * k, y: H / 2 - v[1] * k }; };
  function project(ll) { const p = base(ll); return [p[0] * T.k + T.x, p[1] * T.k + T.y]; }

  /* ---------- places, people, polygons ---------- */
  const P = () => window.PLACES || {};
  function pos(at) {
    if (!at) return null;
    if (typeof at === 'string' && at[0] === '@') { const t = live.token.get(at.slice(1)); return t ? [t.x, t.y] : null; }
    if (typeof at === 'string') { const p = P()[at]; return p ? project([p.lon, p.lat]) : null; }
    if (Array.isArray(at)) return project(at);
    if (typeof at === 'object' && 'x' in at) return [at.x * W, at.y * H];
    return null;
  }

  /* ---------- svg helpers ---------- */
  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function div(cls, parent, html) {
    const d = document.createElement('div'); d.className = cls;
    if (html != null) d.innerHTML = html;
    if (parent) parent.appendChild(d);
    return d;
  }

  /* ---------- waving flag (sliced background, each slice bobs out of phase) ---------- */
  function waveFlag(key, w, h, slices) {
    const f = div('wflag'); slices = slices || 12;
    f.style.width = w + 'px'; f.style.height = h + 'px';
    const uri = window.flagDataURI && window.FLAGS && window.FLAGS[key] ? window.flagDataURI(key) : null;
    for (let i = 0; i < slices; i++) {
      const s = document.createElement('i');
      if (uri) s.style.backgroundImage = `url("${uri}")`; else s.style.background = C.dim;
      s.style.backgroundSize = `${slices * 100}% 100%`;
      s.style.backgroundPosition = `${(i / (slices - 1)) * 100}% 0`;
      s.style.animationDelay = `${-i * .11}s`;
      f.appendChild(s);
    }
    return f;
  }

  /* ---------- init ---------- */
  function init(opts) {
    svg = opts.svg; layer = opts.layer; ink = opts.ink; W = opts.width; H = opts.height;
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    ink.setAttribute('width', W); ink.setAttribute('height', H);
    const defs = el('defs', {}, svg);
    // hatch patterns: one per colour, rescaled every frame so the lines keep their screen width
    defs.innerHTML = '';
    el('rect', { x: -5000, y: -5000, width: 20000, height: 20000, fill: C.sea }, svg);
    gWorld = el('g', { id: 'gworld' }, svg);
    const gC = el('g', { class: 'g-countries' }, gWorld);
    const gR = el('g', { class: 'g-regions' }, gWorld);
    const gZ = el('g', { class: 'g-zones' }, gWorld);
    el('g', { class: 'g-polys' }, gWorld);
    el('g', { class: 'g-pockets' }, gWorld);

    const topo = window.GEO_WORLD;
    const fc = topojson.feature(topo, topo.objects.countries);
    const keep = new Set(['Antarctica']);
    fc.features.forEach(f => {
      const n = f.properties.name; if (keep.has(n)) return;
      const p = el('path', { d: gpath(f), class: 'country' }, gC);
      p.dataset.name = n; shapes.country[n] = { el: p, f };
    });
    const eth = window.GEO_ETH;
    eth.features.forEach(f => {
      // GeoJSON rings are counter-clockwise; d3 wants clockwise or it fills the globe minus the shape
      const ff = d3.geoArea(f) > 2 * Math.PI ? rewind(f) : f;
      const lvl = f.properties.level;
      const p = el('path', { d: gpath(ff), class: lvl === 'region' ? 'region' : 'zone' }, lvl === 'region' ? gR : gZ);
      p.dataset.name = f.properties.name;
      (lvl === 'region' ? shapes.region : shapes.zone)[f.properties.name] = { el: p, f: ff };
    });
    // clip paths for polygons that must stay inside a country (Sudan, Yemen…)
    ['Sudan', 'Yemen', 'Ethiopia', 'Eritrea', 'Somalia', 'Somaliland'].forEach(n => {
      const s = shapes.country[n]; if (!s) return;
      const cp = el('clipPath', { id: 'clip-' + n.replace(/\W/g, '') }, defs);
      el('path', { d: s.el.getAttribute('d') }, cp);
    });
    ['oxide', 'ochre', 'lichen', 'sand', 'sky', 'gold', 'violet', 'teal', 'rose', 'fed', 'eri', 'amh', 'tig', 'rsf', 'saf', 'hou'].forEach(c => {
      const pt = el('pattern', { id: 'hatch-' + c, patternUnits: 'userSpaceOnUse', width: 14, height: 14, patternTransform: 'rotate(45)' }, defs);
      el('rect', { width: 14, height: 14, fill: C[c], 'fill-opacity': .18 }, pt);
      el('line', { x1: 0, y1: 0, x2: 0, y2: 14, stroke: C[c], 'stroke-width': 5, 'stroke-opacity': .85 }, pt);
    });
    dimEl = div('scene-dim', layer);
    pastEl = div('past-tint', layer);
    yearEl = div('year-stamp', layer);
    legendEl = div('legend', layer);
    cycleEl = div('cycle', layer.parentNode);   // above the slides' text scrim, like the HUD
    tableEl = div('table', layer);
    seaG = el('g', { class: 'sea-glow' }, ink);
    el('path', { class: 'halo' }, seaG); el('path', { class: 'core' }, seaG);
    Object.assign(T, fitTransform('world', 'full'));
    apply();
  }
  function rewind(f) {
    const g = JSON.parse(JSON.stringify(f.geometry));
    const rev = poly => poly.map(r => r.slice().reverse());
    if (g.type === 'Polygon') g.coordinates = rev(g.coordinates);
    else if (g.type === 'MultiPolygon') g.coordinates = g.coordinates.map(rev);
    return { type: 'Feature', properties: f.properties, geometry: g };
  }

  /* ---------- per-frame: world transform + everything in screen space follows ---------- */
  function apply() {
    if (!isFinite(T.k) || !isFinite(T.x) || !isFinite(T.y)) { if (!apply.warned) { apply.warned = 1; console.warn('scene: bad transform', JSON.stringify(T), new Error().stack); } return; }
    gWorld.setAttribute('transform', `translate(${T.x},${T.y}) scale(${T.k})`);
    svg.querySelectorAll('pattern').forEach(p => p.setAttribute('patternTransform', `scale(${1 / T.k}) rotate(45)`));
    placeAll();
  }
  function placeAll() {
    live.marker.forEach((m, id) => { const p = pos(m.at); if (p) { m.x = p[0]; m.y = p[1]; m.el.style.transform = `translate(${p[0]}px,${p[1]}px)`; } });
    live.boom.forEach(b => { const p = pos(b.at); if (p) b.el.style.transform = `translate(${p[0]}px,${p[1]}px)`; });
    live.label.forEach(l => { const p = pos(l.at); if (p) l.el.style.transform = `translate(${p[0]}px,${p[1]}px)`; });
    live.flag.forEach(f => { const p = pos(f.at); if (p) f.el.style.transform = `translate(${p[0]}px,${p[1]}px)`; });
    live.token.forEach(t => { const p = pos(t.at); if (p) { t.x = p[0] + (t.dx || 0); t.y = p[1] + (t.dy || 0); t.el.style.transform = `translate(${t.x}px,${t.y}px)`; } });
    live.bubble.forEach(b => placeBubble(b));
    live.arrow.forEach(a => drawArrow(a));
    live.link.forEach(l => drawLink(l));
    drawSea();
  }

  /* the Red Sea lights up when it matters: a glowing line from Suez to Bab el-Mandeb */
  const SEA = [[32.55, 29.9], [33.6, 28.0], [35.0, 26.2], [36.6, 24.0], [38.2, 21.6], [39.6, 19.4], [40.9, 17.0], [42.1, 14.9], [43.0, 13.4], [43.4, 12.6]];
  function drawSea() {
    if (!seaG) return;
    const pts = SEA.map(project);
    const d = 'M' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L');
    seaG.querySelectorAll('path').forEach(p => p.setAttribute('d', d));
    // line width follows the zoom so it reads as water, not a road
    const w = Math.max(6, Math.min(90, Math.hypot(pts[0][0] - pts[9][0], pts[0][1] - pts[9][1]) / 22));
    seaG.style.setProperty('--seaw', w + 'px');
  }

  /* the cycle counter: five boxes that tick, the refrain of the story */
  /* the four conditions of the pattern; a scene lights any of them: on:[1,3], now:3 */
  const CYCLE_STEPS = ['Many nations', 'No sea', 'Mistrust', 'Empty chair'];
  function setCycle(c) {
    if (!c) { cycleEl.classList.remove('in'); cycleEl.dataset.key = ''; return; }
    const key = c.n + '|' + (c.title || '');
    if (cycleEl.dataset.key !== key) {
      cycleEl.dataset.key = key;
      cycleEl.innerHTML = `<div class="ch"><b>${c.n}</b><span>${c.title || ''}</span></div><div class="cs">` +
        CYCLE_STEPS.map((s, i) => `<i data-i="${i}"><em>${i + 1}</em>${s}</i>`).join('') + '</div>';
    }
    const lit = Array.isArray(c.on) ? c.on : Array.from({ length: c.on ?? 0 }, (_, i) => i + 1);
    const now = c.now ?? (Array.isArray(c.on) ? 0 : c.on);
    cycleEl.querySelectorAll('.cs i').forEach((b, i) => {
      b.classList.toggle('on', lit.includes(i + 1)); b.classList.toggle('now', now === i + 1);
      b.classList.toggle('q', !!c.unknown && !lit.includes(i + 1));
      const note = (c.notes || [])[i];
      b.title = note || '';
    });
    cycleEl.classList.add('in');
  }

  /* a negotiating table: chairs with the people who sat there, and the empty ones */
  function setTable(t) {
    if (!t) { tableEl.classList.remove('in'); tableEl.dataset.key = ''; return; }
    const key = JSON.stringify(t);
    tableEl.style.left = ((t.at || {}).x ?? .7) * W + 'px';
    tableEl.style.top = ((t.at || {}).y ?? .5) * H + 'px';
    if (tableEl.dataset.key === key) return;
    tableEl.dataset.key = key;
    const PE = window.PEOPLE || {};
    const seat = s => {
      if (s.empty) return `<div class="seat empty${s.hl ? ' hl' : ''}"><div class="chair">?</div><div class="sl">${s.label || ''}</div></div>`;
      const who = PE[s.who] || { name: s.who };
      const ph = who.photo ? `<img src="${who.photo}" alt="">` : `<span>${who.initials || who.name}</span>`;
      return `<div class="seat" style="--tc:${col(s.ring || who.ring || 'sand')}"><div class="chair">${ph}</div><div class="sl">${s.label || who.name}</div></div>`;
    };
    tableEl.innerHTML = `<div class="seats">${(t.seats || []).map(seat).join('')}</div><div class="board"><span>${t.title || ''}</span></div>`;
    tableEl.classList.remove('in'); void tableEl.offsetWidth; tableEl.classList.add('in');
  }

  /* ---------- go: tween the camera and diff every layer ---------- */
  function go(next) {
    next = next || {};
    state = next;
    const dur = next.dur ?? null;
    if (next.view) {
      const to = fitTransform(next.view, next.frame || 'full');
      const i = d3.interpolateZoom(toView(T), toView(to));
      const d = dur ?? Math.max(1.1, Math.min(3.2, i.duration / 1000 * .75));
      if (tween) tween.kill();
      const o = { t: 0 };
      tween = gsap.to(o, { t: 1, duration: d, ease: 'power2.inOut', onUpdate() { Object.assign(T, fromView(i(o.t))); apply(); }, onComplete() { Object.assign(T, to); apply(); } });
    }
    paintCountries(next); paintEthiopia(next);
    diffPolys(next.polys || []); diffPockets(next.pockets || []);
    diffMarkers(next.markers || []); diffBooms(next.booms || []); diffLabels(next.labels || []);
    diffFlags(next.flags || []); diffTokens(next.tokens || []);
    diffArrows(next.arrows || []); diffLinks(next.links || []); diffBubbles(next.bubbles || []);
    dimEl.style.opacity = next.dim ?? 0;
    legendEl.dataset.pos = next.legendPos || 'br';
    setYear(next.year); setLegend(next.legend);
    pastEl.classList.toggle('in', !!next.past);
    seaG.classList.toggle('in', !!next.sea);
    setCycle(next.cycle); setTable(next.table);
    placeAll();
  }

  function paintCountries(s) {
    const fills = s.countries || {}, focus = s.focus ? new Set(s.focus) : null, hatch = s.hatchCountries || {};
    for (const n in shapes.country) {
      const p = shapes.country[n].el;
      const c = fills[n];
      const h = hatch[n];
      p.style.fill = h ? `url(#hatch-${h})` : c ? col(c) : '';
      p.style.fillOpacity = c || h ? (s.fillOpacity ?? .62) : '';
      p.classList.toggle('faded', !!focus && !focus.has(n) && !c && !h);
      p.classList.toggle('lit', !!c || !!h);
    }
  }
  function paintEthiopia(s) {
    const showR = s.regions ? 1 : 0, showZ = s.zones ? 1 : 0;
    const rf = s.regionFill || {}, zf = s.zoneFill || {}, rh = s.regionHatch || {}, zh = s.zoneHatch || {};
    for (const n in shapes.region) {
      const p = shapes.region[n].el, c = rf[n], h = rh[n];
      p.style.opacity = showR || c || h ? 1 : 0;
      p.style.fill = h ? `url(#hatch-${h})` : c ? col(c) : 'transparent';
      p.style.fillOpacity = c || h ? (s.regionOpacity ?? .7) : 0;
    }
    for (const n in shapes.zone) {
      const p = shapes.zone[n].el, c = zf[n], h = zh[n];
      p.style.opacity = showZ || c || h ? 1 : 0;
      p.style.fill = h ? `url(#hatch-${h})` : c ? col(c) : 'transparent';
      p.style.fillOpacity = c || h ? .78 : 0;
    }
  }

  /* ---------- generic keyed diff ---------- */
  function diff(map, items, keyOf, make, update) {
    const seen = new Set();
    items.forEach((it, i) => {
      const id = keyOf(it, i); seen.add(id);
      let rec = map.get(id);
      if (!rec) { rec = make(it, id); map.set(id, rec); const r = rec; setTimeout(() => { if (!r.leaving) r.el.classList.add('in'); }, 30); }
      else if (rec.leaving) { clearTimeout(rec.leaving); rec.leaving = null; rec.el.classList.add('in'); }
      if (update) update(rec, it);
    });
    map.forEach((rec, id) => {
      if (seen.has(id) || rec.leaving) return;
      rec.el.classList.remove('in');
      rec.leaving = setTimeout(() => { rec.el.remove(); if (rec.extra) rec.extra.forEach(e => e.remove()); map.delete(id); }, 700);
    });
  }

  /* polygons in world space (control zones) */
  function diffPolys(items) {
    const g = svg.querySelector('.g-polys');
    diff(live.poly, items, it => it.id, it => {
      const def = (window.POLYS || {})[it.id] || it;
      const feat = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [def.coords.slice().reverse()] } };
      if (d3.geoArea(feat) > 2 * Math.PI) feat.geometry.coordinates = [def.coords];
      const p = el('path', { d: gpath(feat), class: 'poly' }, g);
      if (def.clip) p.setAttribute('clip-path', `url(#clip-${def.clip.replace(/\W/g, '')})`);
      return { el: p };
    }, (rec, it) => {
      const def = (window.POLYS || {})[it.id] || it;
      const h = it.hatch ?? def.hatch, c = it.fill || def.fill;
      rec.el.style.fill = h ? `url(#hatch-${typeof h === 'string' ? h : c})` : col(c);
      rec.el.style.setProperty('--fo', it.opacity ?? .62);
      rec.el.style.stroke = col(it.stroke || c);
    });
  }
  function diffPockets(items) {
    const g = svg.querySelector('.g-pockets');
    diff(live.pocket, items, it => it.id || JSON.stringify(it.at), it => {
      const p0 = typeof it.at === 'string' ? [P()[it.at].lon, P()[it.at].lat] : it.at;
      const circ = d3.geoCircle().center(p0).radius(it.r || .12)();
      const p = el('path', { d: gpath(circ), class: 'pocket' }, g);
      return { el: p };
    }, (rec, it) => { rec.el.style.fill = it.hatch ? `url(#hatch-${it.hatch})` : col(it.fill || 'oxide'); rec.el.style.stroke = col(it.fill || it.hatch || 'oxide'); });
  }

  /* markers: dot + label */
  function diffMarkers(items) {
    const pulse = new Set(state.pulse || []);
    diff(live.marker, items.map(m => typeof m === 'string' ? { at: m } : m), it => it.id || (typeof it.at === 'string' ? it.at : String(it.at)), it => {
      const pl = typeof it.at === 'string' ? P()[it.at] || {} : {};
      const m = div('marker' + (pl.capital ? ' cap' : ''), layer);
      m.innerHTML = `<i></i><span>${it.text || pl.name || ''}</span>`;
      const span = m.querySelector('span');
      const dx = it.dx ?? pl.dx, dy = it.dy ?? pl.dy;
      if (dx < 0) m.classList.add('lft');
      if (dy) span.style.marginTop = dy + 'px';
      return { el: m, at: it.at };
    }, (rec, it) => {
      rec.el.classList.toggle('pulse', pulse.has(it.at));
      rec.el.style.setProperty('--mc', col(it.color || (P()[it.at] || {}).color || 'sand'));
    });
  }

  /* explosions: CSS-animated bursts that loop while the step is on screen */
  function diffBooms(items) {
    diff(live.boom, items.map(b => typeof b === 'string' ? { at: b } : b), (it, i) => it.id || (typeof it.at === 'string' ? it.at : it.at.join(',')), it => {
      const b = div('boom', layer);
      const n = it.n || 3, size = it.size || 1;
      for (let j = 0; j < n; j++) {
        const s = div('blast', b);
        s.style.setProperty('--dl', (-Math.random() * 1.6).toFixed(2) + 's');
        s.style.setProperty('--ox', ((Math.random() - .5) * 46 * size).toFixed(0) + 'px');
        s.style.setProperty('--oy', ((Math.random() - .5) * 34 * size).toFixed(0) + 'px');
        s.style.setProperty('--sz', (size * (.7 + Math.random() * .6)).toFixed(2));
        s.innerHTML = '<b class="core"></b><b class="ring"></b>' + Array.from({ length: 8 }, (_, k) => `<b class="spark" style="--a:${k * 45 + Math.random() * 20}deg"></b>`).join('') + '<b class="smoke"></b>';
      }
      return { el: b, at: it.at };
    });
  }

  function diffLabels(items) {
    diff(live.label, items, it => it.id || it.text, it => {
      const l = div('maplabel ' + (it.cls || ''), layer, `<span>${it.text}</span>`);
      return { el: l, at: it.at };
    }, (rec, it) => { rec.at = it.at; rec.el.style.setProperty('--lc', col(it.color || 'sand')); });
  }

  /* country flags pinned on the map */
  function diffFlags(items) {
    diff(live.flag, items, it => it.id || it.key + ':' + (it.text || ''), it => {
      const f = div('mapflag' + (it.big ? ' big' : ''), layer);
      const w = it.big ? 120 : 78;
      f.appendChild(waveFlag(it.key, w, w * 2 / 3, 10));
      if (it.text !== '') div('fl', f, it.text || ((window.FLAGS || {})[it.key] || {}).name || it.key);
      return { el: f, at: it.at };
    }, (rec, it) => { rec.at = it.at; });
  }

  /* tokens: a person (photo) or a group (initials), ringed in their side's colour, with a waving flag */
  function diffTokens(items) {
    diff(live.token, items.map(t => typeof t === 'string' ? { id: t } : t), it => it.id, it => {
      const who = (window.PEOPLE || {})[it.id] || { name: it.id };
      const t = div('token' + (it.small ? ' small' : '') + (it.big ? ' big' : ''), layer);
      const ph = div('ph', t);
      if (who.photo) { const img = document.createElement('img'); img.src = who.photo; img.alt = ''; ph.appendChild(img); }
      else ph.appendChild(div('ini', null, who.initials || who.name.split(/\s+/).map(s => s[0]).join('').slice(0, 3)));
      if (who.flag) { const fw = it.big ? 74 : it.small ? 42 : 58; const fl = waveFlag(who.flag, fw, fw * 2 / 3, 8); fl.classList.add('tflag'); t.appendChild(fl); }
      const cap = div('cap', t);
      div('nm', cap, it.name || who.name);
      if (it.role !== '' && (it.role || who.role)) div('rl', cap, it.role || who.role);
      return { el: t, at: it.at, dx: it.dx || 0, dy: it.dy || 0 };
    }, (rec, it) => {
      rec.at = it.at; rec.dx = it.dx || 0; rec.dy = it.dy || 0;
      const who = (window.PEOPLE || {})[it.id] || {};
      rec.el.style.setProperty('--tc', col(it.ring || who.ring || 'sand'));
      rec.el.classList.toggle('struck', !!it.struck);
      rec.el.classList.toggle('glow', !!it.glow);
      rec.el.classList.toggle('caplft', it.cap === 'left');
      rec.el.classList.toggle('captop', it.cap === 'top');
    });
  }

  /* speech bubbles attached to tokens; text types itself in */
  function diffBubbles(items) {
    diff(live.bubble, items, it => it.id || (it.who + ':' + it.text), it => {
      const b = div('bubble ' + (it.pos || 'top') + (it.tone ? ' ' + it.tone : ''), layer);
      const q = div('q', b); const src = div('src', b, it.src || '');
      const full = it.text; let n = 0;
      const timer = setInterval(() => { n += 2; q.textContent = full.slice(0, n); if (n >= full.length) clearInterval(timer); }, 16);
      return { el: b, who: it.who, pos: it.pos || 'top', w: it.w };
    }, (rec, it) => { if (it.w) rec.el.style.width = it.w + 'px'; });
  }
  function placeBubble(b) {
    const t = live.token.get(b.who); if (!t) return;
    const r = t.el.classList.contains('big') ? 74 : t.el.classList.contains('small') ? 40 : 56;
    let x = t.x, y = t.y;
    if (b.pos === 'top') y -= r + 18; else if (b.pos === 'bottom') y += r + 48; else if (b.pos === 'left') x -= r + 18; else if (b.pos === 'right') x += r + 18;
    b.el.style.transform = `translate(${x}px,${y}px)`;
  }

  /* arrows (attack, support, movement) in screen space */
  function diffArrows(items) {
    diff(live.arrow, items, (it, i) => it.id || (JSON.stringify(it.from) + '>' + JSON.stringify(it.to)), it => {
      const g = el('g', { class: 'arrow ' + (it.kind || 'move') }, ink);
      const body = el('path', { class: 'body', pathLength: 1 }, g);
      const flow = el('path', { class: 'flow', pathLength: 1 }, g);
      const head = el('path', { class: 'head' }, g);
      let lab = null;
      if (it.label || it.flag) {
        lab = div('alabel', layer);
        if (it.flag) lab.appendChild(waveFlag(it.flag, 42, 28, 6));
        if (it.label) div('t', lab, it.label);
      }
      return { el: g, body, flow, head, lab, extra: lab ? [lab] : null, def: it };
    }, (rec, it) => {
      rec.def = it;
      const c = col(it.color || (it.flag ? 'flag:' + it.flag : it.kind === 'support' ? 'gold' : it.kind === 'attack' ? 'oxide' : 'sand'));
      rec.el.style.setProperty('--ac', c); if (rec.lab) { rec.lab.style.setProperty('--ac', c); rec.lab.classList.add('in'); }
      rec.el.style.setProperty('--aw', (it.width || (it.kind === 'support' ? 4 : 6)) + 'px');
    });
  }
  function drawArrow(a) {
    const it = a.def; let p0 = pos(it.from), p1 = pos(it.to); if (!p0 || !p1) return;
    // trim the ends when they start or finish on a token so the arrow does not cover the photo
    const trim = (p, q, at) => { if (typeof at === 'string' && at[0] === '@') { const d = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, r = 64; return [p[0] + (q[0] - p[0]) * r / d, p[1] + (q[1] - p[1]) * r / d]; } return p; };
    p0 = trim(p0, p1, it.from); p1 = trim(p1, p0, it.to);
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1], len = Math.hypot(dx, dy) || 1, bend = it.bend ?? .18;
    const cx = (p0[0] + p1[0]) / 2 - dy * bend, cy = (p0[1] + p1[1]) / 2 + dx * bend;
    const hl = Math.min(30, len * .3);
    const tx = p1[0] - cx, ty = p1[1] - cy, tl = Math.hypot(tx, ty) || 1, ux = tx / tl, uy = ty / tl;
    const e = [p1[0] - ux * hl * .6, p1[1] - uy * hl * .6];
    const d = `M${p0[0]},${p0[1]} Q${cx},${cy} ${e[0]},${e[1]}`;
    a.body.setAttribute('d', d); a.flow.setAttribute('d', d);
    const w = hl * .62;
    a.head.setAttribute('d', `M${p1[0]},${p1[1]} L${p1[0] - ux * hl - uy * w},${p1[1] - uy * hl + ux * w} L${p1[0] - ux * hl + uy * w},${p1[1] - uy * hl - ux * w}Z`);
    if (a.lab) { const t = it.labelAt ?? .5, mx = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * cx + t * t * p1[0], my = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * cy + t * t * p1[1]; a.lab.style.transform = `translate(${mx}px,${my}px)`; }
  }

  /* alliance lines between tokens */
  function diffLinks(items) {
    diff(live.link, items, it => it.id || [it.a, it.b].sort().join('~'), it => {
      const g = el('g', { class: 'link' }, ink);
      const line = el('path', { class: 'ln', pathLength: 1 }, g);
      const badge = div('lbadge', layer);
      return { el: g, line, badge, extra: [badge], def: it };
    }, (rec, it) => {
      rec.def = it;
      rec.el.setAttribute('class', 'link ' + (it.kind || 'ally'));
      rec.badge.className = 'lbadge in ' + (it.kind || 'ally');
      rec.badge.innerHTML = it.label ? `<span>${it.label}</span>` : '';
    });
  }
  function drawLink(l) {
    const a = pos('@' + l.def.a), b = pos('@' + l.def.b); if (!a || !b) return;
    const bend = l.def.bend ?? 0;
    const mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * bend, my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * bend;
    l.line.setAttribute('d', `M${a[0]},${a[1]} Q${mx},${my} ${b[0]},${b[1]}`);
    const bx = .25 * a[0] + .5 * mx + .25 * b[0], by = .25 * a[1] + .5 * my + .25 * b[1];
    l.badge.style.transform = `translate(${bx}px,${by}px)`;
  }

  /* big year stamp in the corner, counting when both values are numbers */
  let yearNow = null, yearTween = null;
  function setYear(y) {
    if (yearTween) { yearTween.kill(); yearTween = null; }
    if (y == null || y === '') { yearEl.classList.remove('in'); yearNow = null; return; }
    yearEl.classList.add('in');
    const a = parseInt(yearNow, 10), b = parseInt(y, 10);
    if (!isNaN(a) && !isNaN(b) && String(b) === String(y) && a !== b) {
      const o = { v: a };
      yearTween = gsap.to(o, { v: b, duration: Math.min(2, .25 + Math.abs(b - a) * .03), ease: 'power1.inOut', onUpdate() { yearEl.textContent = Math.round(o.v); } });
    } else yearEl.textContent = y;
    yearNow = y;
  }
  function setLegend(items) {
    if (!items || !items.length) { legendEl.classList.remove('in'); return; }
    legendEl.innerHTML = items.map(i => `<div><b style="${i.hatch ? `background:repeating-linear-gradient(45deg, ${col(i.hatch)} 0 4px, transparent 4px 8px)` : 'background:' + col(i.color)}"></b><span>${i.text}</span></div>`).join('');
    legendEl.classList.add('in');
  }

  function resize(w, h) {
    W = w; H = h; svg.setAttribute('width', W); svg.setAttribute('height', H); ink.setAttribute('width', W); ink.setAttribute('height', H);
    if (state.view) Object.assign(T, fitTransform(state.view, state.frame || 'full'));
    apply();
  }

  window.Scene = { init, go, resize, VIEWS, waveFlag, project };
})();
