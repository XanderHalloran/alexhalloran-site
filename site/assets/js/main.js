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

  /* ---- bio.db: allowlisted queries over static JSON ---- */
  var out = document.getElementById('db-out'), form = document.getElementById('db-form'),
      inp = document.getElementById('db-in'), pane = document.getElementById('db');
  if (!out || !form || !inp) return;

  var DB = null, TABLES = ['projects', 'roles', 'skills', 'posts'];
  var HELP = [
    'bio.db — a read-only database about Alex.',
    '  help                    this list',
    '  .tables                 list tables',
    '  .schema <table>         columns of a table',
    '  describe alex           short bio',
    '  select <cols|*> from <table>',
    '    [where <col> = \'x\' | <col> like \'%x%\']',
    '    [order by <col> [asc|desc]] [limit n]',
    'One table per query. No joins, no writes.'
  ].join('\n');
  var EXAMPLES = ['select name, stack from projects', '.schema roles', "select name from skills where category = 'Domain'"];

  function line(text, cls) {
    var d = document.createElement('div');
    if (cls) d.className = cls;
    d.textContent = text;
    out.appendChild(d);
  }
  /* cells stay on one line like a sqlite CLI; long prose is clipped and the table scrolls sideways */
  function cell(v) { return v.length > 68 ? v.slice(0, 67) + '…' : v; }
  function table(rows, cols) {
    if (!rows.length) return line('(0 rows)', 'muted');
    var wrap = document.createElement('div'); wrap.className = 'tbl';
    var t = document.createElement('table'), tr = t.createTHead().insertRow();
    cols.forEach(function (c) { var th = document.createElement('th'); th.textContent = c; tr.appendChild(th); });
    var tb = t.createTBody();
    rows.forEach(function (r) {
      var row = tb.insertRow();
      cols.forEach(function (c) {
        var td = row.insertCell(), v = r[c] == null ? '' : String(r[c]);
        if (/^https?:\/\//.test(v)) { var a = document.createElement('a'); a.href = v; a.rel = 'noopener'; a.textContent = cell(v.replace(/^https?:\/\//, '')); td.appendChild(a); }
        else { td.textContent = cell(v); if (v.length > 68) td.title = v; }
      });
    });
    wrap.appendChild(t); out.appendChild(wrap);
    line('(' + rows.length + (rows.length === 1 ? ' row)' : ' rows)'), 'muted');
  }
  function unq(s) { return s.replace(/^'(.*)'$/, '$1').replace(/''/g, "'"); }

  /* select <cols> from <table> [where col (=|like) 'v'] [order by col [asc|desc]] [limit n] */
  var SELECT = /^select\s+(.+?)\s+from\s+(\w+)(?:\s+where\s+(\w+)\s*(=|like)\s*('(?:[^']|'')*'))?(?:\s+order\s+by\s+(\w+)(?:\s+(asc|desc))?)?(?:\s+limit\s+(\d+))?\s*;?$/i;

  function select(q) {
    var m = SELECT.exec(q);
    if (!m) return line('syntax: select <cols|*> from <table> [where ...] [order by ...] [limit n]  (try help)', 'err');
    var tname = m[2].toLowerCase();
    if (TABLES.indexOf(tname) < 0) return line('no such table: ' + tname + '  (try .tables)', 'err');
    var rows = DB[tname].slice(), all = Object.keys(rows[0] || {});
    var cols = m[1].trim() === '*' ? all : m[1].split(',').map(function (c) { return c.trim().toLowerCase(); });
    var bad = cols.concat(m[3] ? [m[3].toLowerCase()] : [], m[6] ? [m[6].toLowerCase()] : []).filter(function (c) { return all.indexOf(c) < 0; });
    if (bad.length) return line('no such column: ' + bad[0] + '  (try .schema ' + tname + ')', 'err');
    if (m[3]) {
      var col = m[3].toLowerCase(), val = unq(m[5]).toLowerCase();
      if (m[4] === '=') rows = rows.filter(function (r) { return String(r[col]).toLowerCase() === val; });
      else { /* LIKE: % = any run, _ = one char, case-insensitive */
        var re = new RegExp('^' + val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.') + '$', 'i');
        rows = rows.filter(function (r) { return re.test(String(r[col])); });
      }
    }
    if (m[6]) {
      var oc = m[6].toLowerCase(), dir = (m[7] || 'asc').toLowerCase() === 'desc' ? -1 : 1;
      rows.sort(function (a, b) { return (a[oc] > b[oc] ? 1 : a[oc] < b[oc] ? -1 : 0) * dir; });
    }
    if (m[8]) rows = rows.slice(0, +m[8]);
    table(rows, cols);
  }

  function run(raw) {
    var q = raw.trim(), lc = q.toLowerCase().replace(/;$/, '');
    line('sql> ' + q, 'cmd');
    if (!lc) return;
    if (!DB) return line('bio.db is still loading. try again in a second.', 'err');
    if (lc === 'help' || lc === '.help') line(HELP);
    else if (lc === 'clear' || lc === '.clear') out.textContent = '';
    else if (lc === '.tables') line(TABLES.join('  '));
    else if (/^\.schema(\s|$)/.test(lc)) {
      var t = lc.split(/\s+/)[1];
      if (!t) TABLES.forEach(function (n) { line(n + ' (' + Object.keys(DB[n][0] || {}).join(', ') + ')'); });
      else if (TABLES.indexOf(t) < 0) line('no such table: ' + t + '  (try .tables)', 'err');
      else line(t + ' (' + Object.keys(DB[t][0] || {}).join(', ') + ')');
    }
    else if (lc === 'describe alex' || lc === 'whoami' || lc === 'select bio') line(DB.bio);
    else if (/^select\b/.test(lc)) select(lc);
    else line('not a bio.db command: ' + q + '  (try help)', 'err');
    pane.scrollTop = pane.scrollHeight;
  }
  function size() { inp.style.width = Math.max(1, inp.value.length + 1) + 'ch'; }

  form.addEventListener('submit', function (e) { e.preventDefault(); run(inp.value); inp.value = ''; size(); });
  inp.addEventListener('input', size);
  pane.addEventListener('click', function (e) { if (e.target.tagName !== 'A' && e.target.tagName !== 'BUTTON') inp.focus(); });

  /* idle state: clickable example queries */
  line('-- bio.db ready. try one of these, or type help:', 'muted');
  EXAMPLES.forEach(function (ex) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'db-ex'; b.textContent = ex;
    b.addEventListener('click', function () { inp.value = ex; size(); inp.focus(); });
    out.appendChild(b);
  });

  fetch(new URL('../data/bio.json', SELF)).then(function (r) { return r.json(); }).then(function (d) { DB = d; })
    .catch(function () { line('could not load assets/data/bio.json', 'err'); });
})();
