/* theme toggle, mobile nav, terminal. no deps. */
(function () {
  'use strict';
  var root = document.documentElement;

  /* ---- theme ---- */
  var tt = document.getElementById('theme-toggle');
  function isDark() {
    return root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function paintToggle() {
    if (!tt) return;
    var d = isDark();
    tt.setAttribute('aria-pressed', String(d));
    tt.setAttribute('aria-label', d ? 'Switch to light theme' : 'Switch to dark theme');
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

  /* ---- terminal ---- */
  var out = document.getElementById('term-out'), form = document.getElementById('term-form'),
      inp = document.getElementById('term-in'), term = document.getElementById('term');
  if (!out || !form || !inp) return;

  var CMDS = {
    help: 'commands: whoami  work  stack  teach  contact  clear',
    whoami: 'Alex Halloran. Medical economics analyst in Phoenix, AZ.\nClaims, contracts, and the code that connects them. Also: Data Hound Technologies, GCU adjunct.',
    work: [
      'healthcare price transparency   #work  (healthcare.traqqit.com)',
      'medical bill review automation  #work',
      'digital signage for clubs       #work'
    ].join('\n'),
    stack: [
      'data      sql (t-sql, postgres, mysql), python, r, dax, duckdb, parquet',
      'platforms sql server, snowflake, databricks, epic clarity/caboodle, power bi, tableau',
      'build     flask, fastapi, n8n, docker, github actions, raspberry pi, grafana, influxdb',
      'domain    aco/mssp, medicare advantage, hedis, risk adjustment, capitation, bundles, mrf'
    ].join('\n'),
    teach: 'Grand Canyon University, graduate health informatics.\nHIM-650, HCI-690. Previously HIM-615.',
    contact: 'email     alex@datahoundtech.com\nlinkedin  linkedin.com/in/alex-halloran'
  };

  function print(text, cls) {
    var d = document.createElement('div');
    if (cls) d.className = cls;
    d.textContent = text;
    out.appendChild(d);
    term.scrollTop = term.scrollHeight;
  }
  function run(raw) {
    var cmd = raw.trim().toLowerCase();
    print('$ ' + raw, 'cmd');
    if (!cmd) return;
    if (cmd === 'clear') { out.textContent = ''; return; }
    if (CMDS.hasOwnProperty(cmd)) print(CMDS[cmd]);
    else print('command not found: ' + cmd + ' (try help)');
  }
  function size() { inp.style.width = Math.max(1, inp.value.length + 1) + 'ch'; }

  form.addEventListener('submit', function (e) { e.preventDefault(); run(inp.value); inp.value = ''; size(); });
  inp.addEventListener('input', size);
  term.addEventListener('click', function () { inp.focus(); });

  /* auto-type whoami once on load; skipped under reduced motion (prints instantly instead) */
  var word = 'whoami', i = 0;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { run(word); return; }
  setTimeout(function tick() {
    if (document.activeElement === inp && inp.value !== word.slice(0, i)) return; /* user started typing; stop */
    if (i < word.length) { inp.value = word.slice(0, ++i); size(); setTimeout(tick, 90); }
    else { run(word); inp.value = ''; size(); }
  }, 700);
})();
