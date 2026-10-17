/* bio.db: the allowlisted read-only query engine, as a pure function.
   No eval, no Function, no DOM. Shared by the hero pane (main.js) and the
   scroll surface (/v2), so there is exactly one parser to trust and to check. */
(function (global) {
  'use strict';

  var TABLES = ['projects', 'roles', 'education', 'skills', 'posts', 'sources', 'contact'];

  /* plain words in, sql out, so someone who types "projects" still gets somewhere */
  function normalize(q) {
    var s = String(q).trim().replace(/[;\s]+$/, '').replace(/\s+/g, ' ').toLowerCase(), m;
    if (TABLES.indexOf(s) >= 0) return 'select * from ' + s;
    if (/^(show |list )?tables$/.test(s)) return '.tables';
    if (/^(about|bio|who is alex|describe alex|whoami)$/.test(s)) return 'describe alex';
    if ((m = /^(?:\.?schema|columns|describe|explain) (\w+)$/.exec(s))) return '.schema ' + m[1];
    if ((m = /^(?:list|show|get) (\w+)$/.exec(s)) && TABLES.indexOf(m[1]) >= 0) return 'select * from ' + m[1];
    return s;
  }

  /* select <cols> from <table> [where col (=|!=|like|contains) value] [order by col [asc|desc]] [limit n] */
  var SELECT = /^select\s+(.+?)\s+from\s+(\w+)(?:\s+where\s+(\w+)\s*(=|!=|like|contains)\s*(.+?))?(?:\s+order\s+by\s+(\w+)(?:\s+(asc|desc))?)?(?:\s+limit\s+(\d+))?$/;

  function unquote(v) {
    return v.trim().replace(/^'(.*)'$/, '$1').replace(/^"(.*)"$/, '$1').replace(/''/g, "'");
  }

  function noTable(name) {
    return { kind: 'error', text: 'there is no table called "' + name + '". These exist: ' + TABLES.join(', ') + '.' };
  }

  function select(db, q) {
    var m = SELECT.exec(q);
    if (!m) return { kind: 'error', text: 'I could not read that. The shape is: select * from <table> [where ...] [order by ...] [limit n]. Type help for worked examples.' };
    var name = m[2];
    if (TABLES.indexOf(name) < 0) return noTable(name);
    var rows = db[name].slice(), all = Object.keys(rows[0] || {});
    var cols = m[1].trim() === '*' ? all : m[1].split(',').map(function (c) { return c.trim(); });
    var bad = cols.concat(m[3] || [], m[6] || []).filter(function (c) { return all.indexOf(c) < 0; });
    if (bad.length) return { kind: 'error', text: '"' + bad[0] + '" is not a column in ' + name + '. It has: ' + all.join(', ') + '.' };
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
    return { kind: 'rows', cols: cols, rows: rows, table: name };
  }

  function schema(db, t) {
    if (!t) return { kind: 'text', text: TABLES.map(function (n) { return n + ' (' + Object.keys(db[n][0] || {}).join(', ') + ')'; }).join('\n') };
    if (TABLES.indexOf(t) < 0) return noTable(t);
    return { kind: 'text', text: t + ' (' + Object.keys(db[t][0] || {}).join(', ') + ')' };
  }

  /* run returns a shape, never DOM: {kind:'rows'|'text'|'error'|'clear'|'help'} */
  function run(db, raw) {
    var q = normalize(raw);
    if (!q) return { kind: 'error', text: 'type a query, or pick one of the examples.' };
    if (!db) return { kind: 'error', text: 'still loading. give it a second and run it again.' };
    if (q === 'help') return { kind: 'help' };
    if (q === 'clear') return { kind: 'clear' };
    if (q === '.tables') return { kind: 'text', text: TABLES.join('  ') };
    if (q.indexOf('.schema') === 0) return schema(db, q.split(' ')[1]);
    if (q === 'describe alex') return { kind: 'text', text: db.bio };
    if (q.indexOf('select') === 0) return select(db, q);
    return { kind: 'error', text: '"' + String(raw).trim() + '" is not something bio.db understands. Type help to see what it does.' };
  }

  global.BioDB = { TABLES: TABLES, normalize: normalize, run: run };
})(this);
