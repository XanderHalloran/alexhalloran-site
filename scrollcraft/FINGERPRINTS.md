# Fingerprints

Every site you build with **scroll-craft** gets one row here, appended after it
ships. The registry exists so your next build can prove it is a different page
rather than a re-skin of one you already made.

This file is **yours**. It starts empty on purpose: the gate is about not
repeating *yourself*, so it has nothing to say until you have built something.

The rules and the gate live in the skill's
`references/uniqueness.md`. Short version:

**A new build must differ from EVERY row below on at least 4 of the 6
dimensions.** Four against each row individually, not four on average across the
table. If a planned build fails, change the plan. Never edit a row to make room
for it.

The six dimensions are: **grammar**, **nav treatment**, **hero device**,
**act-sequence shape**, **close pattern**, **signature move**.

Dimension 6 is free, because a signature move is unique by definition. So the
gate really asks for three more out of the remaining five, and a build that
changes only grammar and world will fail it.

---

## The registry

| Build | Grammar | Nav treatment | Hero device | Act-sequence shape | Close pattern | Signature move | World | Port |
|---|---|---|---|---|---|---|---|---|

*(empty: your first build has nothing to clear, so build whatever the interview
points at. From the second onwards, this table is the constraint.)*

---

## What is taken

Add a bullet here whenever a build claims something a later build should avoid
reusing: a grammar, a nav treatment, a close pattern, a signature move, an
act-count-and-length band. The shared columns are what the next build inherits
as a constraint, so writing them down is the whole point.

Nothing is taken yet.

---

## Appending a row

After shipping, add one line to the table and one bullet to **What is taken** if
the build claimed something new. Fill every column. Say what the build shares
with existing rows.

Rows are append-only. A build that has been superseded stays in the table,
because the space it occupies is still occupied.

---

## Worked example

The skill's author kept a registry of twelve builds across eight page grammars.
If you want to see what a filled-in table looks like, and which shapes tend to
collide, read `EXAMPLES.md` in the scroll-craft repository. Treat it as
illustration only: those rows are somebody else's builds and they do **not**
constrain yours.

---

## Builds

### 01 · alexhalloran.traqqit.com /v2 · 2026-10-16

| Dimension | What it is |
|---|---|
| Grammar | Live surface. The page is a read-only database client running over the site's own `bio.json`. |
| Nav treatment | App chrome, two pieces: a fixed top tab strip that reports the current pane, and a fixed bottom prompt rail carrying the live query and the row counts. No wordmark-plus-CTA bar anywhere. |
| Hero device | The surface already in a state. A query ran before the visitor arrived and its four rows are on screen at p=0. No title plate, no hero claim. |
| Act-sequence shape | `pin` 2.0, `flow`+`in`, `reveal`, `pan` 2.8, `pin` 3.6 (peak), `flow`. Six acts, 9.8 viewport-heights measured. No `scrub` on the page. |
| Close pattern | An actual input. The last query returns the contact rows as real links, and the prompt stays live with the caret in it. No magnetic button, no spotlight. |
| Signature move | Scroll is the query cursor. Act progress types that act's query into the persistent prompt one character at a time, completing it runs it against the real JSON, and scrolling back up un-types it. At the peak the prompt hands over to the visitor. |

World: no photography at all. Dense data surface, off-black ground with a warm
tan accent, Space Grotesk over Roboto Mono.

Port: alexhalloran.traqqit.com/v2/ (unlisted, `noindex`, beside the plain site).

Shares with prior rows: nothing. This is the first build in this registry, so
the gate was free. What the **next** build must avoid reusing: the live-surface
grammar, app chrome as navigation, a hero that is a result set, a close that is
a real input, and anything that drives a shared chrome element from act progress.
