# Bridle — Design System

*Visual identity and component language for the harness, its surfaces, and its docs. v1, 2026-07-02. Companion to [`architecture.md`](./architecture.md).*

---

## 0. Design thesis

A bridle is **worked leather and steel hardware** — something a craftsperson made to steer a powerful animal with precision and trust. That is the whole identity in one image:

- **Leather** is the ground: warm, dark, calm, matte. It's the surface everything sits on — a terminal you spend hours in shouldn't glare at you.
- **Steel** is the signal: a single cool blue-grey, the color of a buckle and a bit against tan leather. It marks what's live, focused, or actionable, and it is *never* asked to also mean "success" or "danger."
- **Craft** is the execution: nothing decorative, everything functional, tight tolerances. Monospace carries the brand because this is an instrument, not an app.

The look is **dark-first** (the terminal is home), **mono-forward** (the tool speaks in the terminal's own voice), and **warm-neutral** (leather, not slate). It deliberately avoids the two current AI-tool clichés — warm-cream-with-terracotta, and near-black-with-one-acid-pop — by pairing a *warm* dark ground with a *cool* accent, which almost nobody does.

### 0.1 Anti-slop rules (non-negotiable)

The fastest way to make a tool look AI-generated is to reach for the effects everyone else does. Bridle bans them outright:

- **No glows.** No coloured drop-shadows, no `text-shadow`, no `box-shadow` used to make an element "float" or emit light. Depth comes from surface layering and 1px borders, never from a halo.
- **No decorative gradients.** No gradient fills on backgrounds, heroes, meters, or text. A meter is one solid colour that *changes* colour by state (steel → warning), it does not fade between them. The only gradients permitted anywhere are functional data encodings inside a chart, and even those are avoided when a solid will do.
- **No blur / glassmorphism.** No `backdrop-filter`, no frosted panels.
- **No emoji as UI.** Icons are the line set (§5); emoji never stand in for state or action.
- **No purple-to-blue, no acid pop, no giant centered hero.** Restraint reads as craft.
- **No motion that performs** (§6). Motion confirms state; it never decorates.

If a treatment's only job is to look impressive, it doesn't ship. Everything on screen earns its place by carrying information.

---

## 1. Color

### 1.1 Principle

Warm leather neutrals, one cool steel brand accent, and a semantic set kept strictly separate from the brand. The brand color does not carry status; status colors do not appear as decoration. Every neutral is warm (a red/yellow bias), never a dead grey — chosen, not defaulted.

### 1.2 Dark theme (primary)

| Token | Hex | Use |
|---|---|---|
| `bg` | `#1A1512` | App/terminal ground — near-black warm brown |
| `surface` | `#221C18` | Panels, cards, the TUI transcript area |
| `surface-raised` | `#2C2521` | Popovers, permission prompts, active input |
| `border` | `#3A322B` | Hairlines, dividers |
| `border-strong` | `#4C4239` | Emphasized edges, focus containers |
| `text` | `#ECE3D5` | Primary text — parchment, not pure white |
| `text-secondary` | `#B2A692` | Secondary/labels |
| `text-faint` | `#7C7060` | Metadata, timestamps, hints |
| **`steel`** | **`#6BA0CE`** | **Brand accent** — links, focus ring, active nav, cursor, the mark |
| `steel-strong` | `#8CB8DC` | Hover/brighter accent |
| `steel-soft` | `#25333F` | Accent background tint (selected row, active pill) |

### 1.3 Light theme (docs, console, day mode)

| Token | Hex | Use |
|---|---|---|
| `bg` | `#F4EEE3` | Parchment ground |
| `surface` | `#FBF7EF` | Cards/panels |
| `surface-raised` | `#FFFFFF` | Raised elements |
| `border` | `#E2D9C8` | Hairlines |
| `border-strong` | `#CDC2AC` | Emphasized edges |
| `text` | `#221C16` | Primary |
| `text-secondary` | `#5B5145` | Secondary |
| `text-faint` | `#8A7D6B` | Metadata |
| **`steel`** | **`#356291`** | Brand accent (darkened for AA on light) |
| `steel-soft` | `#DDE7F0` | Accent tint |

### 1.4 Semantic colors (both themes, tuned per background)

Distinct in hue from steel and from each other; each has a foreground and a soft background tint.

| Role | Dark | Light | Meaning |
|---|---|---|---|
| `success` | `#7FA96C` (moss) | `#4E7A3C` | Passed, applied, allowed, merged |
| `warning` | `#D9A441` (brass) | `#9A6E15` | Ask/confirm, caution, `full-auto` armed |
| `danger` | `#C8583F` (oxblood) | `#A83B24` | Denied, destructive, failed, blocked |
| `info` | `#6BA0CE` (steel) | `#356291` | Neutral notice (reuses brand — intentional) |

### 1.5 Trust tiers (the marketplace palette)

The one place color encodes a security fact. Used on skill/plugin/block badges everywhere (§4.4):

| Tier | Swatch | Dark | Signal |
|---|---|---|---|
| `builtin` | steel | `#6BA0CE` | Ships with Bridle; fully trusted |
| `official` | moss | `#7FA96C` | Maintained by the Bridle org |
| `verified` | brass | `#D9A441` | Identity-checked publisher |
| `community` | faint outline | `#7C7060` | Unverified — warned by default |

Tier color is always paired with a text label and (for `community`) an outline-not-fill treatment, so it reads without color vision.

---

## 2. Typography

**The tool speaks in monospace.** Brand, headings, labels, and code are all mono — it's the terminal's native voice and it makes Bridle unmistakable in a screenshot. Body/reading text is a humanist sans for comfort in longer passages (docs, console). No serif — this is an instrument, not an essay.

| Role | Face | Notes |
|---|---|---|
| Brand / display / headings | **IBM Plex Mono** | Engineering heritage, real character (the slab-ish serifs on `i`/`l`), not the default JetBrains/Fira reach. Weights 500/600/700. |
| Labels / eyebrows / badges | IBM Plex Mono, 600, uppercase, `+0.06em` tracking | The "system voice." |
| Code / TUI / data | IBM Plex Mono, 400/500 | Same family — the UI and the code it shows are one continuous surface. |
| Body / prose / UI text | **IBM Plex Sans** | Superfamily-matched to the mono; humanist, warm, screen-legible. Weights 400/500/600/700. |

Type scale (1.2 minor-third, mono headings get `-0.01em` tracking and `text-wrap: balance`):

`12 · 13 · 14 · 16 (base) · 19 · 23 · 28 · 34 · 41`

Rules: body line-height 1.6, headings 1.15; measure capped ~68ch for sans prose, ~78ch for mono; `font-variant-numeric: tabular-nums` anywhere digits align (tables, budgets, token counts, the status line).

---

## 3. The mark

A minimal, geometric **bit-and-strap** glyph — two short vertical leather straps joined by a horizontal steel bar with a ring, reading equally as a bridle bit and as a stylized `H` (harness). Constructed on an 8px grid, single weight, no gradients. Renders at 16px (favicon, status line) through wall-size. Monochrome by default; the crossbar is the only element allowed to take `steel` when a spot of brand color is wanted. Wordmark sets the name in IBM Plex Mono 600, lowercase `bridle`, with the `i`-dot optionally replaced by a small steel square (the ring).

---

## 4. Components

### 4.1 The TUI (flagship surface)

**The TUI is Claude Code's proven layout, re-skinned — not a reinvention.** Claude Code's terminal anatomy is the most battle-tested agent TUI in the world; we adopt its structure wholesale and change only what makes it *ours*: the colour (steel-on-leather instead of orange-on-black) and the mascot (the Bridle bit-ring `⦿` instead of the sparkle `✻`). A Claude Code user should feel instantly at home; a Bridle user should never mistake a screenshot for anything else. Anatomy, top to bottom, mirroring Claude Code element-for-element:

- **Welcome box** — a rounded 1px-bordered box on session start: `⦿ Welcome to bridle`, a `/help` hint line, and `cwd:` — exactly Claude Code's opening box, mascot and colour swapped.
- **Transcript** — flush-left, no chrome. Assistant text and every tool call are marked with the `⏺` bullet (Claude Code's convention): the bullet is `text`-coloured for the assistant's own words and `steel` for a tool call. Tool calls read `⏺ Read(src/auth/refresh.ts)`; their results indent under a `⎿` turnstile in `faint` (`⎿  Read 84 lines`). Observations are visibly framed as tool output, never as a person's words (tenet #2).
- **Inline diff** — under an `⏺ Update(file)` call, Claude Code's diff format: a `⎿ Updated … with N additions and M removals` summary, then numbered lines — deletions `12 -` on a `danger` low-tint with `danger` text, additions `12 +` on a `success` low-tint with `success` text. Line numbers in `faint`, `tabular-nums`.
- **Permission prompt** — Claude Code's numbered box, restyled: a rounded card with a `warning` left-edge, the exact action in mono, then `❯ 1. Yes` / `2. Yes, and don't ask again for <pattern>` / `3. No, tell bridle what to do (esc)`. Keyboard-first; the `❯` cursor and selected number are `steel`.
- **Thinking indicator** — Claude Code's animated-gerund line, themed to the tack room: `⦿ Cinching… (4s · ↑ 1.2k tokens · esc to interrupt)`. The mascot does a slow single-glyph pulse (reduced-motion: static), never a spinner storm.
- **Input box** — the bottom rounded-border box with a `> ` prompt and a steel caret `▍`, identical in structure to Claude Code's composer.
- **Mode hint line** — directly under the input, Claude Code's `⏵⏵` affordance: `⏵⏵ full-auto · host  (shift+tab to cycle)` on the left in the mode's colour (full-auto in `warning`), `? for shortcuts` on the right in `faint`.
- **Subagent tree** — a live indented tree (Hermes) of spawned children and their current tool call, each a dim branch off the parent.
- **Status footer** — mode · runtime · model · token/budget meter (a thin bar that is solid `steel` and flips to solid `warning` past 80% — it never gradient-fades) · elapsed. `tabular-nums` throughout.

The mascot `⦿` is the only glyph swap that matters: wherever Claude Code shows `✻`, Bridle shows the bit-ring. Everything else is a colour-token substitution over a layout users already trust.

### 4.2 Buttons & controls

Flat, square-ish (4px radius — leather-tooled, not pill-soft), mono labels. Primary = `steel` fill on dark text; secondary = `border-strong` outline, transparent fill; danger = `danger` outline that fills on hover. Focus is a 2px `steel` ring, always visible. No shadows on controls — depth comes from surface layering, not drop-shadows.

### 4.3 Mode dial

The four permission modes render as a segmented control, the active segment filled: `plan` (steel-soft), `review` (neutral), `auto-edit` (steel), `full-auto` (warning-tinted — armed autonomy always reads as "pay attention"). Shift+Tab cycles it, matching the keybinding.

### 4.4 Badges & pills

- **Trust tier** — §1.5, always label + color, `community` outlined.
- **Runtime** — `host` (steel-soft), `container` (neutral), `remote` (neutral) — a small chip so you always know where tools are running.
- **Status** — success/warning/danger soft-tint pills for run outcomes.

### 4.5 Cards, tables, code

Cards: `surface` fill, 1px `border`, 10px radius, generous internal padding, **no drop-shadow at all** — separation comes from the border and the surface-layer step (`bg` → `surface` → `surface-raised`), never a halo (§0.1). Tables: uppercase mono column heads on a `surface-raised` strip, hairline rows, `tabular-nums`, hover row-tint; wide tables scroll inside their own container. Code blocks: `bg`-dark even in light theme (code is always "terminal"), mono, generous line-height, a language chip top-right.

---

## 5. Iconography

Line icons, 1.5px stroke on a 24px grid, rounded joins, no fills — hardware-catalog precision, matching the mono type's evenness. A small custom set for Bridle concepts: runtime (host/container/remote), the mode dial states, trust tiers, checkpoint/rewind (a leftward arc), subagent (branch), memory (a bookmark-strap), skill (a tag). Emoji are never used as UI iconography.

---

## 6. Motion

Restrained and functional — motion confirms state, it doesn't perform.

- **Streaming** is the primary motion: tokens arrive; a soft `steel` cursor pulses only while generating.
- **Transitions** 120–160ms, `ease-out`; expand/collapse of tool blocks and diffs animate height; nothing bounces.
- **Meters** (budget/token bar) ease as they fill.
- Everything honors `prefers-reduced-motion` — the pulse and height animations drop to instant.

The anti-goal: no gratuitous fades, no gradient shimmer, no attention-seeking micro-interactions. A tool you run for eight hours must never feel busy.

---

## 7. Voice & copy

Terminal-plain. Controls say exactly what happens (`Apply`, then a toast `Applied`). Errors state what broke and the fix, no apology (`Runtime unreachable — start Docker, or run with runtime: host`). Labels are lowercase mono nouns (`runtime`, `budget`, `checkpoint`). The product refers to itself as `bridle` (lowercase, mono) in-surface. Numbers are always concrete — token counts, dollar budgets, elapsed time — never "a lot" or "almost done."

---

## 8. Continuity & adaptability

The system has one job beyond looking good: **be continuous across every surface and adapt to every context without breaking.**

**One token contract, every surface.** Ship the palette and scale as CSS custom properties *and* a JSON token file, consumed by the TUI renderer, the web console, the IDE panes, and the docs site alike. `bg` / `surface` / `text` / `steel` / the semantics are the stable contract; everything else derives from them. A colour is defined once and every surface reads the same value, so the terminal, the Slack message, and the browser dashboard are visibly the same tool — not a family resemblance, the same identity.

**Continuous, not sectioned-off.** Surfaces share the same ground, the same bullets (`⏺`/`⎿`), the same mascot, the same mode/runtime chips. Moving from the TUI to the web console should feel like scrolling, not switching apps. Layouts flow on a single spacing scale (a 4px base step) so nothing snaps between contexts.

**Adaptable — themes.** A theme is a swap of the token set, nothing more. Dark ships first (the terminal is home); light is a full peer for docs, the console, and day-mode terminals. Both validate for **WCAG AA** on every text pair (steel-on-ground, text-on-surface, each semantic-on-its-tint). Adding a third theme (high-contrast, a user's brand) is a token file, never a rewrite.

**Adaptable — size & density.** Type is set in relative units against a single scale; the whole UI scales with the user's terminal font size or browser zoom. Fixed-width terminal content (diffs, trees, tables) scrolls inside its own container so a narrow window never breaks the layout — it adapts by scrolling, not by reflowing box-drawing into nonsense. Grids collapse from multi-column to single-column at their natural breakpoints.

**Adaptable — surface constraints.** The same design degrades gracefully: full colour + line icons in a truecolor terminal or browser; a 16-colour fallback map for basic terminals; plain-text framing (the `⏺`/`⎿`/`❯` glyphs) that still reads with no colour at all. The identity survives all the way down to a monochrome SSH session.

---

*This system dresses every surface in §15 of the architecture — TUI, headless output, IDE panes, channel messages, and the web console — from one token contract, so Bridle looks like one tool everywhere it runs, in every theme, at every size.*
