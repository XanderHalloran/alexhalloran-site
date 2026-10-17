/* ---------------------------------------------------------------------------
   alexhalloran.traqqit.com /v2: the page's own code.

   The signature move: scroll is the query cursor. Each act carries data-q. A
   rAF loop reads the --sc-p the engine publishes on the act element (an inline
   style, so reading it costs no layout) and types that query into the
   persistent prompt one character at a time, in step with the scroll. Finishing
   the type runs it against the real bio.json and draws the rows into the act's
   pane; scrolling back up un-types it and clears the pane.

   The engine is never edited. Everything here belongs to this page.
--------------------------------------------------------------------------- */
(function () {
  'use strict';

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rail = document.getElementById('rail');
  var input = document.getElementById('rail-in');
  var stat = document.getElementById('stat');
  var logEl = document.getElementById('log');
  var triesEl = document.getElementById('tries');
  var idleEl = document.getElementById('console-idle');
  var stateEl = document.getElementById('console-state');
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var DB = null;
  var mine = false;   /* the visitor has taken the keyboard; stop typing at them */
  var log = [];       /* a real record of what this page has run */

  var acts = [].slice.call(document.querySelectorAll('[data-q]')).map(function (el) {
    var at = (el.getAttribute('data-q-at') || '0.04 0.42').split(/\s+/);
    return {
      el: el,
      q: el.getAttribute('data-q'),
      out: el.querySelector('[data-out]'),
      mode: el.getAttribute('data-q-render') || 'grid',
      ground: el.hasAttribute('data-q-ground'),
      from: parseFloat(at[0]),
      to: parseFloat(at[1]),
      typed: -1,
      ran: false
    };
  });

  var HELP = [
    'Read only. Capitals do not matter, quotes are optional.',
    '',
    '  .tables                      what is in here',
    '  .schema projects             the columns of one table',
    '  select * from roles          a whole table',
    '  describe alex                one sentence',
    '',
    '  select * from skills where category = domain',
    '  select * from sources where kind contains claims',
    '  select org, years from roles order by sort_key limit 3',
    '',
    'Tables: ' + BioDB.TABLES.join(', ') + '.'
  ].join('\n');

  /* ---- rendering. BioDB returns a shape; the DOM is written here. ---- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function cell(td, v) {
    var s = v == null ? '' : String(v);
    if (/^(https?:|mailto:)/.test(s)) {
      var a = el('a', null, s.replace(/^https?:\/\//, '').replace(/^mailto:/, ''));
      a.href = s;
      a.rel = 'noopener';
      td.appendChild(a);
      return;
    }
    if (s.length > 64) { td.textContent = s.slice(0, 63) + '…'; td.title = s; return; }
    if (/^\d+$/.test(s)) td.className = 'num';
    td.textContent = s;
  }

  function grid(res, into) {
    into.textContent = '';
    if (res.kind === 'clear') return;
    if (res.kind === 'error') { into.appendChild(el('p', 'msg msg--err', res.text)); return; }
    if (res.kind === 'help') { into.appendChild(el('p', 'msg', HELP)); return; }
    if (res.kind === 'text') { into.appendChild(el('p', 'msg', res.text)); return; }
    if (!res.rows.length) { into.appendChild(el('p', 'msg', 'no rows matched.')); return; }
    var wrap = el('div', 'grid'), t = document.createElement('table');
    var tr = t.createTHead().insertRow();
    res.cols.forEach(function (c) { tr.appendChild(el('th', null, c)); });
    var tb = t.createTBody();
    res.rows.forEach(function (r) {
      var row = tb.insertRow();
      res.cols.forEach(function (c) { cell(row.insertCell(), r[c]); });
    });
    wrap.appendChild(t);
    into.appendChild(wrap);
    into.appendChild(el('p', 'rowcount', '(' + res.rows.length + (res.rows.length === 1 ? ' row)' : ' rows)')));
  }

  /* the record act draws its rows as rail columns, between the lead block and
     the end note that are already in the markup */
  function railRows(res, into) {
    clearRail(into);
    if (res.kind !== 'rows') return;
    var end = into.querySelector('.roles__end');
    res.rows.forEach(function (r) {
      var card = el('article', 'role');
      card.appendChild(el('p', 'role__yr', r.years || 'current'));
      card.appendChild(el('h3', 'role__org', r.org));
      card.appendChild(el('p', 'role__ttl', r.title));
      into.insertBefore(card, end);
    });
  }

  function clearRail(into) {
    [].slice.call(into.querySelectorAll('.role')).forEach(function (n) { n.remove(); });
  }

  function draw(act) {
    var res = BioDB.run(DB, act.q);
    if (act.mode === 'rail') railRows(res, act.out); else grid(res, act.out);
    note(act.q, res);
  }

  function clear(act) {
    if (act.mode === 'rail') clearRail(act.out); else act.out.textContent = '';
  }

  /* the console log is a real record of what ran, not a decoration */
  function note(q, res) {
    if (log.indexOf(q) >= 0) return;
    log.push(q);
    var n = res && res.kind === 'rows' ? res.rows.length : 0;
    var li = document.createElement('li');
    li.appendChild(el('i', null, ('0' + log.length).slice(-2)));
    li.appendChild(el('b', null, q));
    li.appendChild(el('span', null, n ? n + (n === 1 ? ' row' : ' rows') : ''));
    logEl.appendChild(li);
  }

  function setPrompt(text) {
    if (mine || input.value === text) return;
    input.value = text;
  }

  /* ---- the loop. Reads only inline style, so it costs no layout. ---- */
  function progress(a) {
    var v = parseFloat(a.el.style.getPropertyValue('--sc-p'));
    return v === v ? v : 0;      /* NaN compares false against itself */
  }

  /* Two acts can be part-way through at once: a flow act's progress runs across
     its whole visible life, so neighbours overlap. Exactly one act may write the
     prompt per frame or they fight over it and it flickers between two queries.
     The first act still mid-type wins; otherwise the furthest-along finished one
     holds its query on screen. */
  function frame() {
    var typing = null, held = null;
    for (var i = 0; i < acts.length; i++) {
      var a = acts[i];
      if (a.ground) continue;
      var p = progress(a);
      var t = (p - a.from) / (a.to - a.from);
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      var n = Math.round(t * a.q.length);
      a.typed = n;
      if (n > 0 && n < a.q.length && !typing) typing = a;
      if (n === a.q.length && p < 1) held = a;
      if (n === a.q.length && !a.ran) { a.ran = true; draw(a); }
      else if (n < a.q.length && a.ran) { a.ran = false; clear(a); }
    }
    if (typing) setPrompt(typing.q.slice(0, typing.typed));
    else if (held) setPrompt(held.q);
    requestAnimationFrame(frame);
  }

  /* reduced motion: no character typing. Each act draws on entry and the prompt
     shows the whole query, so the meaning survives without the effect. */
  function staticMode() {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        for (var i = 0; i < acts.length; i++) {
          if (acts[i].el === e.target && !acts[i].ran) {
            acts[i].ran = true;
            setPrompt(acts[i].q);
            draw(acts[i]);
          }
        }
      });
    }, { rootMargin: '-10% 0px' });
    acts.forEach(function (a) { if (!a.ground) io.observe(a.el); });
  }

  /* ---- the handover: the prompt unlocks at the peak and stays unlocked ---- */
  var TRIES = [
    'select * from skills where category = domain',
    'select * from posts',
    'select school, degree from education',
    'describe alex',
    'help'
  ];
  TRIES.forEach(function (q) {
    var b = el('button', 'try', q);
    b.type = 'button';
    b.addEventListener('click', function () { input.value = q; submit(q); });
    triesEl.appendChild(b);
  });

  var opened = false;
  function openConsole() {
    if (opened) return;
    opened = true;
    document.body.classList.add('is-open');
    triesEl.hidden = false;
    idleEl.hidden = true;
    stateEl.textContent = 'open. the prompt takes your queries now.';
    input.placeholder = 'type a query, or pick one';
  }
  new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) openConsole(); });
  }, { rootMargin: '-35% 0px -35% 0px' }).observe(document.getElementById('console'));

  function takeOver() {
    if (mine) return;
    mine = true;
    openConsole();
  }
  input.addEventListener('focus', takeOver);
  input.addEventListener('keydown', takeOver);

  function submit(q) {
    takeOver();
    var into = document.querySelector('#console .pane__body');
    var box = into.querySelector('.own');
    if (!box) { box = el('div', 'own'); into.appendChild(box); }
    var res = BioDB.run(DB, q);
    if (res.kind === 'clear') { box.remove(); return; }
    grid(res, box);
    box.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }
  rail.addEventListener('submit', function (e) { e.preventDefault(); submit(input.value); });

  /* ---- the tab strip reports where you are. It is the navigation. ---- */
  var tabs = [].slice.call(document.querySelectorAll('.bar__tabs a'));
  var panes = tabs.map(function (t) { return document.querySelector(t.getAttribute('href')); });
  var spy = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var i = panes.indexOf(e.target);
      tabs.forEach(function (t, k) { t.setAttribute('aria-current', String(k === i)); });
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  panes.forEach(function (p) { if (p) spy.observe(p); });

  /* ---- boot ---- */
  fetch('../assets/data/bio.json')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      DB = d;
      var rows = BioDB.TABLES.reduce(function (n, t) { return n + (d[t] ? d[t].length : 0); }, 0);
      stat.textContent = BioDB.TABLES.length + " tables · " + rows + " rows";
      acts.forEach(function (a) {
        if (a.ground) { a.ran = true; setPrompt(a.q); draw(a); }
      });
      if (reduce) staticMode(); else requestAnimationFrame(frame);
    })
    .catch(function () {
      [].slice.call(document.querySelectorAll('[data-out]')).forEach(function (n) {
        n.appendChild(el('p', 'msg msg--err', 'could not load assets/data/bio.json'));
      });
    });

  ScrollCraft.mount(document.body);
})();
