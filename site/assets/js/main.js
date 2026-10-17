/* theme toggle, mobile nav, bio.db query pane. no deps, no eval. */
(function () {
  'use strict';
  var root = document.documentElement;
  /* resolve bio.json against THIS script, so the pane works from any page depth */
  var SELF = (document.currentScript && document.currentScript.src) || location.href;

  /* ---- theme: Monsoon Night is the default; "light" is the only override ---- */
  var tt = document.getElementById('theme-toggle');
  function isDark() { return root.dataset.theme !== 'light'; }
  function paintToggle() {
    if (!tt) return;
    tt.setAttribute('aria-pressed', String(!isDark()));
    tt.setAttribute('aria-label', isDark() ? 'Switch to light theme' : 'Switch to dark theme');
  }
  if (tt) tt.addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    paintToggle();
  });
  paintToggle();

  /* ---- mobile nav ---- */
  var nt = document.getElementById('nav-toggle'), nl = document.getElementById('nav-links');
  if (nt && nl) {
    nt.addEventListener('click', function () {
      var open = nl.classList.toggle('open');
      nt.setAttribute('aria-expanded', String(open));
    });
    nl.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nl.classList.remove('open'); nt.setAttribute('aria-expanded', 'false'); }
    });
  }

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---- bio.db: allowlisted queries over static JSON. no eval, no Function ---- */
  var out = document.getElementById('db-out'), form = document.getElementById('db-form'),
      inp = document.getElementById('db-in'), pane = document.getElementById('db');
  if (!out || !form || !inp) return;

  var DB = null, TABLES = BioDB.TABLES;
  var HELP = [
    'A small read-only database about Alex.',
    'Capitals do not matter. Quotes are optional.',
    '',
    '  .tables                    what is in here',
    '  .schema projects           the columns',
    '  select * from roles        a whole table',
    '  select name from skills    one column',
    '  describe alex              a sentence about me',
    '',
    'Filter, search, sort:',
    '  select * from skills where category = domain',
    '  select * from projects where problem contains bills',
    '  select * from roles order by sort_key limit 3',
    '',
    'Tables: ' + TABLES.join(', ') + '.',
    'Typing just a table name reads all of it.'
  ].join('\n');
  var EXAMPLES = [
    'select name, stack from projects',
    'select * from roles order by sort_key limit 3',
    'select name from skills where category = domain',
    'describe alex'
  ];

  function line(text, cls) {
    var d = document.createElement('div');
    if (cls) d.className = cls;
    d.textContent = text;
    out.appendChild(d);
  }
  /* cells stay on one line like a sqlite CLI; long prose is clipped and the table scrolls sideways */
  function cell(v) { return v.length > 68 ? v.slice(0, 67) + '\u2026' : v; }
  function table(rows, cols) {
    if (!rows.length) return line('no rows matched. try a shorter search, or .tables to see what is here.', 'muted');
    var wrap = document.createElement('div'); wrap.className = 'tbl';
    var t = document.createElement('table'), tr = t.createTHead().insertRow();
    cols.forEach(function (c) { var th = document.createElement('th'); th.textContent = c; tr.appendChild(th); });
    var tb = t.createTBody();
    rows.forEach(function (r) {
      var row = tb.insertRow();
      cols.forEach(function (c) {
        var td = row.insertCell(), v = r[c] == null ? '' : String(r[c]);
        if (/^https?:\/\//.test(v)) {
          var a = document.createElement('a');
          a.href = v; a.rel = 'noopener'; a.textContent = cell(v.replace(/^https?:\/\//, ''));
          td.appendChild(a);
        } else {
          td.textContent = cell(v);
          if (v.length > 68) td.title = v;
        }
      });
    });
    wrap.appendChild(t); out.appendChild(wrap);
    line('(' + rows.length + (rows.length === 1 ? ' row)' : ' rows)'), 'muted');
  }

  function run(raw) {
    line('sql> ' + String(raw).trim(), 'cmd');
    var r = BioDB.run(DB, raw);
    if (r.kind === 'help') line(HELP);
    else if (r.kind === 'clear') out.textContent = '';
    else if (r.kind === 'rows') table(r.rows, r.cols);
    else if (r.kind === 'error') line(r.text, 'err');
    else line(r.text);
    pane.scrollTop = pane.scrollHeight;
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); run(inp.value); });
  pane.addEventListener('click', function (e) { if (e.target.tagName !== 'A' && e.target.tagName !== 'BUTTON') inp.focus(); });

  /* idle state: the box already holds a working query; these run on click so nothing must be typed */
  line('-- A small database about Alex. Press Run to see the query below, or click one of these:', 'muted');
  EXAMPLES.forEach(function (ex) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'db-ex'; b.textContent = ex;
    b.addEventListener('click', function () { inp.value = ex; run(ex); });
    out.appendChild(b);
  });
  line('-- Or type help. Plain words work too: projects, show tables, about.', 'muted');

  fetch(new URL('../data/bio.json', SELF)).then(function (r) { return r.json(); }).then(function (d) { DB = d; })
    .catch(function () { line('could not load assets/data/bio.json', 'err'); });
})();
