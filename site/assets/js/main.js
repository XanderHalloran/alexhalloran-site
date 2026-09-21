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

  var DB = null, TABLES = ['projects', 'roles', 'education', 'skills', 'posts'];
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

  /* plain words in, sql out, so someone who types "projects" still gets somewhere */
  function normalize(q) {
    var s = q.trim().replace(/[;\s]+$/, '').replace(/\s+/g, ' ').toLowerCase(), m;
    if (TABLES.indexOf(s) >= 0) return 'select * from ' + s;
    if (/^(show |list )?tables$/.test(s)) return '.tables';
    if (/^(about|bio|who is alex|describe alex|whoami)$/.test(s)) return 'describe alex';
    if ((m = /^(?:\.?schema|columns|describe|explain) (\w+)$/.exec(s))) return '.schema ' + m[1];
    if ((m = /^(?:list|show|get) (\w+)$/.exec(s)) && TABLES.indexOf(m[1]) >= 0) return 'select * from ' + m[1];
    return s;
  }

  /* select <cols> from <table> [where col (=|!=|like|contains) value] [order by col [asc|desc]] [limit n] */
  var SELECT = /^select\s+(.+?)\s+from\s+(\w+)(?:\s+where\s+(\w+)\s*(=|!=|like|contains)\s*(.+?))?(?:\s+order\s+by\s+(\w+)(?:\s+(asc|desc))?)?(?:\s+limit\s+(\d+))?$/;
  function unquote(v) { return v.trim().replace(/^'(.*)'$/, '$1').replace(/^"(.*)"$/, '$1').replace(/''/g, "'"); }

  function select(q) {
    var m = SELECT.exec(q);
    if (!m) return line('I could not read that. The shape is: select * from <table> [where ...] [order by ...] [limit n]. Type help for worked examples.', 'err');
    var name = m[2];
    if (TABLES.indexOf(name) < 0) return line('there is no table called "' + name + '". These exist: ' + TABLES.join(', ') + '.', 'err');
    var rows = DB[name].slice(), all = Object.keys(rows[0] || {});
    var cols = m[1].trim() === '*' ? all : m[1].split(',').map(function (c) { return c.trim(); });
    var bad = cols.concat(m[3] || [], m[6] || []).filter(function (c) { return all.indexOf(c) < 0; });
    if (bad.length) return line('"' + bad[0] + '" is not a column in ' + name + '. It has: ' + all.join(', ') + '.', 'err');
    if (m[3]) {
      var col = m[3], op = m[4], val = unquote(m[5]).toLowerCase();
      rows = rows.filter(function (r) {
        var v = String(r[col]).toLowerCase();
        if (op === '=') return v === val;
        if (op === '!=') return v !== val;
        if (op === 'contains') return v.indexOf(val) >= 0;
        return new RegExp('^' + val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.') + '$').test(v);
      });
    }
    if (m[6]) {
      var by = m[6], dir = m[7] === 'desc' ? -1 : 1;
      rows.sort(function (a, b) { return (a[by] > b[by] ? 1 : a[by] < b[by] ? -1 : 0) * dir; });
    }
    if (m[8]) rows = rows.slice(0, +m[8]);
    table(rows, cols);
  }

  function run(raw) {
    var q = normalize(raw);
    if (!q) return line('type a query, or click one of the examples above.', 'muted');
    line('sql> ' + raw.trim(), 'cmd');
    if (!DB) return line('still loading. give it a second and press Run again.', 'err');
    if (q === 'help') line(HELP);
    else if (q === 'clear') out.textContent = '';
    else if (q === '.tables') line(TABLES.join('  '));
    else if (q.indexOf('.schema') === 0) {
      var t = q.split(' ')[1];
      if (!t) TABLES.forEach(function (n) { line(n + ' (' + Object.keys(DB[n][0] || {}).join(', ') + ')'); });
      else if (TABLES.indexOf(t) < 0) line('there is no table called "' + t + '". These exist: ' + TABLES.join(', ') + '.', 'err');
      else line(t + ' (' + Object.keys(DB[t][0] || {}).join(', ') + ')');
    }
    else if (q === 'describe alex') line(DB.bio);
    else if (q.indexOf('select') === 0) select(q);
    else line('"' + raw.trim() + '" is not something bio.db understands. Type help to see what it does.', 'err');
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
