# BRIEF — alexhalloran.traqqit.com

Partly interviewed, partly authored. Four of the eight Step 0 topics were
answered directly by Alex in a four-question pass on 2026-10-16 and are marked
**ANSWERED**. The rest are drawn from the site that is already live, from the
resume he supplied on 2026-09-20, and from the original build brief he wrote on
2026-09-15. Those are marked **AUTHORED** and are evidence-backed, not invented:
every fact in them already exists in the repo.

No facts were invented for this build. His standing rule holds: no employers,
clients, metrics, dates, quotes, or testimonials that are not already on record.

---

## The eight topics

**1. Vibe, three to five words. AUTHORED.**
Dense, operational, unglamorous, exact.
References: a SQL client with a result grid open. A hospital chargemaster. A
plain-text ledger. All three are things that are read for information, by
someone who is working, and none of them is trying to be liked.

**2. The scroll journey, section by section. AUTHORED** from the IA of the live
site, reordered for a surface rather than a document.
Connect, then what actually arrives, then what gets done to it, then the record
of nine years, then the handover, then how to reach him.

**3. The energy curve. AUTHORED.**
Calm at the open, because a surface that shouts is not a surface. Low and
recognising through the feed. Rising through the work. Steady and factual across
the record. Highest at the handover. Quiet at the close, which is where a tool
should end.

**4. The feeling curve, and the one moment. AUTHORED.**

| Act | Feeling | What on screen causes it |
|---|---|---|
| 1 Connect | Curiosity | The page is already running. No headline asks for attention; a prompt has already returned rows about a person. |
| 2 The feed | Recognition | The real schema of what lands in a health plan's lap. Anyone who has done the work knows this list on sight. |
| 3 The work | Capability | The feeds above become three things that run. The wipe is the point: it becomes something. |
| 4 The record | Weight | Nine years as rows, with real dates and no adjectives. |
| 5 The handover | **Agency — PEAK** | The prompt unlocks. It has been running queries for the visitor; now the caret is theirs. |
| 6 Contact | Settled | The last query returns how to reach him. Nothing fades out. |

No two adjacent acts carry the same feeling.

**The peak**, as the sentence a visitor would say to a friend:
> "His site let me type SQL at it, and it actually answered."

It lives in act 5 and holds the largest span on the page by a clear margin.

**The tell-someone sentence:**
> It's the site where scrolling is running the queries, and then it hands you
> the keyboard.

**Authored silence:** the beat between act 4 and act 5, where the result pane
empties and the caret sits alone before the prompt unlocks. That is composed, not
dead scroll. The verification pass should expect it.

**5. One thing no other site does. ANSWERED.**
Scroll runs the queries. Chosen from four candidate seeds.

**6. How far from premium-minimal. ANSWERED.**
Dense. Information-forward, small type, high count, tables and figures as
texture.

**7. One unbroken world, or distinct scenes?**
Resolved by the grammar choice in topic 1 of the question pass: a live surface is
one continuous surface whose state changes, which is neither a worldflight nor a
set of cuts. The chrome persists for the whole page; the panes inside it change.

**8. What assets exist. ANSWERED.**
Alex is supplying his own photos and footage. None had arrived at build time
(`site/assets/img/` was empty), so the page ships with no photography and a
marked slot. This grammar bans full-bleed photography anyway, so a photo's job
here is small and specific: a portrait cell inside the surface, labelled like
every other record. The page is correct with the slot empty and improves when it
is filled. No generated imagery, no API key, no spend.

---

## Grammar: live surface

The page behaves like the thing he builds. Real panes, real markup, real logic
over the real `bio.json` that already ships on the site. Scroll drives their
state.

Why the other seven lost:

- **Filmic one-shot** carries a burden of proof and loses it here. It wants a
  scrub hero, and there is no footage, no ffmpeg on this machine, and no budget
  for generated video. More to the point, Alex's original brief for this site
  said in plain words that it must not be a landing page, and filmic one-shot is
  the landing-page grammar.
- **Chaptered editorial** was the strongest runner-up and fits his Substack
  writing, but it makes the page a document about the work. He chose the
  grammar where the page is the work.
- **Continuous world** requires travel through a real place. There is none, and
  it is the expensive, fragile one.
- **Typographic poster** is the right answer when there are no assets, which is
  nearly true here, but it bans the tables and data that are the entire point of
  a dense aesthetic. Type as imagery would hide the only material he has.
- **Gallery / catalog** suits the project list but not the career. Three projects
  is a thin collection, and the question a hiring manager has is "should I
  believe this", which this grammar explicitly refuses to answer.
- **Split stage** was a real contender: "what arrives" against "what they read"
  is a genuine two-sider. It lost because the comparison is one act of the
  argument, not the whole of it, and spending the entire page on it would drop
  the record and the handover.
- **Rhythmic cutlist** is for energy brands. A medical economics analyst
  pulsing at twelve cuts would read as a costume.

Grammar constraints honored: no marketing chrome, no wordmark-plus-CTA bar, no
scrims, no full-bleed photography, no kinetic headline stacks, no hero claim over
footage. Copy lives in the surface's own idiom: labels, status lines, column
headers, empty states. Bans observed: no `scrub`, no `kinetic`, no `spotlight`,
no `magnet`, drift held to two stops.

**The honesty rule.** Every pane is operable markup computing its state from real
data in the repo. Nothing is a painted screenshot. The query engine is the same
allowlisted parser already shipping on the live site, extracted to a pure
function so the page and the hand-typed prompt share one code path.

---

## Nav, hero, close

- **Nav** is app chrome: a persistent status rail carrying the connection, the
  query currently running, the row count, and jump targets for each pane. It is
  real navigation, not a bar with a button in it.
- **Hero** is the surface already in a state. A query has run before the visitor
  arrived and its rows are on screen. There is no title plate.
- **Close** is an actual input. The prompt, live, with the caret in it, and the
  contact row as its last result. No magnetic button; this page spent its whole
  length being a tool.

## Signature move: scroll is the query cursor

Each act carries a `data-q` attribute holding a real query. A rAF loop reads the
`--sc-p` the engine publishes on the active act and types that query into the
persistent prompt one character at a time, in step with the scroll. Reaching the
end of the typing executes it against the real JSON, and the rows draw into the
act's pane. Scrolling back up un-types it, character by character, and clears the
result. Scroll position is literally the cursor position.

At the peak the prompt unlocks and the visitor gets the keyboard.

It is not a kit device, not a parameter change, and it cannot be described as
something the engine already does. The engine is untouched.

## Fingerprint gate

Registry at `scrollcraft/FINGERPRINTS.md` was seeded empty. This is the first
build, so there is nothing to clear. The row is appended after shipping.

## Score

| # | Beat | Device | Span | Why this one |
|---|---|---|---|---|
| 1 | Connect | `pin` | 2.0 | The surface has to hold still while its state establishes. |
| 2 | The feed | `flow` + `in` | natural | The list of what arrives is a document, not a performance. Reading order is the whole effect. |
| 3 | The work | `reveal` | natural | A wipe is a change of state, which is exactly what a pipeline stage is. |
| 4 | The record | `pan` | 2.4 | Lateral travel reads as breadth. Nine years of roles is a range, not an argument. |
| 5 | The handover | `pin` + bespoke | 3.4 | The peak. The surface holds while control changes hands. Largest span by a clear margin. |
| 6 | Contact | `flow` | natural | The page stops performing and becomes a prompt. A pinned close would still be theatre. |

Four distinct device families (`pin`, `flow`+`in`, `reveal`, `pan`). No family
twice in a row. No `scrub` at all. Measured length is **9.8 viewport-heights**
(8838px at a 900px viewport), well outside the 13.6-13.8 band the skill flags as
a prior fingerprint, and short because a working surface should be.

---

## What changed during the build

Recorded because the plan above is not what shipped in three places.

**`count` was dropped, not used.** The plan put real figures (7 tables, 63 rows)
in the status rail as entry counters. They never ticked: the engine's entry
observer uses `rootMargin: '0px 0px -10% 0px'`, and a rail fixed to the bottom
edge sits inside that excluded band, so the page shipped a visible and false
`0 tables · 0 rows`. Rather than relocate a device to somewhere it would work,
the rail now computes both figures from the loaded data on boot, so they cannot
drift from the JSON. The score keeps its four distinct families without it, and
forcing the device in would have been a device looking for a reason.

**The feeling curve for act 3 was rewritten after the feel check.** It was
planned as "Relief, the mess resolves into stages", from a version where that act
was a pipeline diagram. The act became the projects table instead, and scrolled
cold it reads as Capability rather than Relief. Per feel.md the page wins that
argument, so the curve above is the corrected one. Checked against act 4, which
reads as Weight: "he makes things" and "he has done this since 2016" are
different enough that neither act is filler.

**One act writes the prompt per frame.** The first build let every act type into
the shared prompt, and because a flow act's progress runs across its entire
visible life, two neighbouring acts are mid-flight at the same time and the later
one won. The prompt flickered between two queries. The end-to-end check caught it.
The loop now picks the first act still mid-type as the single writer, which is the
same scoping problem devices.md §10 describes for drift.

## Verification

- Scrollcraft harness, 33 positions: **no dead scroll**, and **every cue clears
  4.5:1** at its worst frame. Desktop 1440x900, phone 390x844, and reduced
  motion all green. No console errors at any position.
- `tools/check_v2.mjs`, 15 end-to-end assertions, all passing: the ground query
  renders before any scroll, scroll types an act's own query part-way, finishing
  the type runs it, the record rail has 1160px of real lateral travel, all seven
  roles draw, the query log accumulates what actually ran, the console opens at
  the peak, a hand-typed query returns rows, a write is refused in plain words,
  the close renders five real contact rows with a live mailto, the last screen is
  not faded out, and the footer clears the fixed rail.
- Read by eye: the landing state, the sources act, the record rail, the peak and
  the close. The contact sheet could not be built because this machine has no
  full ffmpeg, so the frames were read individually instead.

**Not verified:** a real phone. Headless Chromium cannot reproduce iOS touch
scrolling or Low Power Mode. There is no video on this page, which removes the
usual iOS failure mode, but the horizontal result grids and the fixed prompt rail
with a soft keyboard open are both untested on a real device.

## Palette and type

Off-black with warm tan, which is one of the rotations taste.md names and is
also continuous with the clay accent already on the live site. Not cream and
brass. Not violet.

```
--sc-canvas  #0d1113   --sc-surface #151b1e
--sc-ink     #e8eef0   --sc-ink-soft #8fa0a6
--sc-accent  #d4a373   --sc-accent-ink #0d1113
```

Two faces: Space Grotesk carries display and prose, Roboto Mono carries every
surface element. Both are already on the site, so this is continuity rather than
a third costume, and monospace here is doing its sanctioned job: code, data and
labels.
