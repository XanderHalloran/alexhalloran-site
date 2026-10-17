/* End-to-end check for /v2, the scroll surface.
 *
 *   cd site && python3 -m http.server 8801      (serve the SITE directory)
 *   SCROLLCRAFT_CHROME=<chrome or edge> node tools/check_v2.mjs [url]
 *
 * Exits non-zero on the first failure. Covers the things the scrollcraft
 * harness cannot: that the rail has real lateral travel, that scroll actually
 * types and runs the queries, that the prompt hands over to the visitor, and
 * that the close renders real contact rows.
 */
import { chromium } from 'playwright-core';

const URL = process.argv[2] || 'http://localhost:8801/v2/';
const CHROME = process.env.SCROLLCRAFT_CHROME;
let failed = 0;

function ok(name, pass, detail) {
  console.log((pass ? 'PASS  ' : 'FAIL  ') + name + (detail == null ? '' : '   ' + detail));
  if (!pass) failed++;
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });


/* Scroll to an exact act progress, in document coordinates. boundingBox() is
   viewport relative, and a flow act's progress runs across its whole visible
   life, so both need the engine's own formula rather than a guess. */
async function toP(sel, want) {
  await page.evaluate(([s, f]) => {
    const el = document.querySelector(s);
    const top = el.getBoundingClientRect().top + scrollY;
    const h = el.offsetHeight;
    scrollTo(0, el.classList.contains('sc-act--pinned')
      ? top + f * Math.max(h - innerHeight, 1)
      : top + f * (h + innerHeight) - innerHeight);
  }, [sel, want]);
  await page.waitForTimeout(600);
}

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);

/* 1. the surface is already in a state: the ground query ran before anyone scrolled */
const groundRows = await page.locator('#now tbody tr').count();
ok('ground query rendered its rows', groundRows === 4, groundRows + ' rows');

const prompt0 = await page.inputValue('#rail-in');
ok('prompt shows the ground query', prompt0.startsWith('select * from roles'), JSON.stringify(prompt0));

/* 2. scroll is the query cursor: part-way into an act the query is partly typed */
await toP('#sources', 0.20);
const partial = await page.inputValue('#rail-in');
ok('scroll types this act own query, part-way through',
  partial !== prompt0 &&
  partial.length > 0 &&
  'select * from sources'.indexOf(partial) === 0 &&
  partial !== 'select * from sources',
  JSON.stringify(partial));

await toP('#sources', 0.55);
const srcRows = await page.locator('#sources tbody tr').count();
ok('finishing the type runs the query', srcRows === 7, srcRows + ' rows');

/* 3. the pan rail must actually have somewhere to travel. devices.md: measure
      it, the harness reports no dead scroll either way. */
await toP('#record', 0.35);
const over = await page.evaluate(() => {
  const r = document.querySelector('.roles');
  return r ? r.scrollWidth - innerWidth : -1;
});
ok('record rail overflows the viewport by at least half a screen', over > 720, over + 'px of travel');

const roleCards = await page.locator('#record .role').count();
ok('record drew every role', roleCards === 7, roleCards + ' cards');

/* 4. the peak: the log is a real record, and the prompt hands over */
await toP('#console', 0.62);
const logged = await page.locator('#log li').count();
ok('query log accumulated what ran', logged >= 4, logged + ' entries');
const open = await page.evaluate(() => document.body.classList.contains('is-open'));
ok('console opened at the peak', open === true);

/* 5. the visitor gets the keyboard, and it is the same parser */
await page.fill('#rail-in', 'select name from skills where category = languages');
await page.click('.rail__go');
await page.waitForTimeout(300);
const ownRows = await page.locator('#console .own tbody tr').count();
ok('a typed query runs and returns rows', ownRows === 2, ownRows + ' rows');

await page.fill('#rail-in', 'drop table roles');
await page.click('.rail__go');
await page.waitForTimeout(250);
const refused = await page.locator('#console .own .msg--err').innerText();
ok('a write is refused in plain words', /not something bio\.db understands/.test(refused));

/* 6. the close resolves: real contact rows, real links, nothing faded out */
/* the engine sizes pinned acts in vh during layout, so the document grows after
   the first scroll and one jump lands short of the real bottom */
for (let i = 0; i < 3; i++) {
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(400);
}
const contactRows = await page.locator('#contact tbody tr').count();
ok('close renders the contact rows', contactRows === 5, contactRows + ' rows');
const mailto = await page.locator('#contact a[href^="mailto:"]').count();
ok('close carries a live mailto', mailto === 1);
const lastOpacity = await page.evaluate(() => {
  const n = document.querySelector('#contact .pane');
  return parseFloat(getComputedStyle(n).opacity);
});
ok('the last screen is not faded out', lastOpacity > 0.95, 'opacity ' + lastOpacity);

const footVisible = await page.evaluate(() => {
  const r = document.querySelector('.foot').getBoundingClientRect();
  return r.top > 0 && r.bottom < innerHeight - 56;   // clears the fixed rail
});
ok('the footer clears the fixed prompt rail', footVisible === true);

await page.screenshot({ path: 'scrollcraft/builds/alexhalloran/lab/close.png' });

ok('no console errors', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
console.log(failed ? '\n' + failed + ' FAILED' : '\nall checks passed');
process.exit(failed ? 1 : 0);
