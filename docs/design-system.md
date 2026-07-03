# Bridle — Design System

*Visual identity and component language for the harness, its surfaces, and its docs. v1, 2026-07-02. Companion to [`architecture.md`](./architecture.md).*

---

## 0. Design thesis

Bridle is a machined instrument: a **black-anodized body with steel hardware** — precise, matte, made to steer something powerful with trust. That is the whole identity in one image:

- **Graphite** is the ground: a true near-black, cool and calm and matte. It's the surface everything sits on — a terminal you live in should recede, not glow. Not brown, not slate; black.
- **Steel** is the signal: a single cool blue-grey, the color of machined hardware against a black body. It marks what's live, focused, or actionable, and it is *never* asked to also mean "success" or "danger."
- **Craft** is the execution: nothing decorative, everything functional, tight tolerances. Monospace carries the brand because this is an instrument, not an app.

The look is **dark-first** (the terminal is home), **mono-forward** (the tool speaks in the terminal's own voice), and **neutral** (graphite, not slate, not brown). It deliberately avoids the two current AI-tool clichés — warm-cream-with-terracotta, and near-black-with-one-acid-pop — by grounding on a genuinely neutral near-black and spending its one color on a cool steel accent. The dark theme is modelled on the terminals people already trust: Claude Code and OpenCode both sit on a near-black neutral, never a warm ground.

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
| `bg` | `#0B0B0D` | App/terminal ground — true near-black, faintly cool |
| `surface` | `#141417` | Panels, cards, the TUI transcript area |
| `surface-raised` | `#1C1C20` | Popovers, permission prompts, active input |
| `border` | `#292930` | Hairlines, dividers |
| `border-strong` | `#3A3A43` | Emphasized edges, focus containers |
| `text` | `#E8E8EC` | Primary text — near-white, neutral |
| `text-secondary` | `#A4A4AD` | Secondary/labels |
| `text-faint` | `#6B6B74` | Metadata, timestamps, hints |
| **`steel`** | **`#6BA0CE`** | **Brand accent** — links, focus ring, active nav, cursor, the mark |
| `steel-strong` | `#8FBBE0` | Hover/brighter accent |
| `steel-soft` | `#17222D` | Accent background tint (selected row, active pill) |

### 1.3 Light theme (docs, console, day mode)

| Token | Hex | Use |
|---|---|---|
| `bg` | `#F3F3F5` | Neutral off-white ground |
| `surface` | `#FAFAFC` | Cards/panels |
| `surface-raised` | `#FFFFFF` | Raised elements |
| `border` | `#E3E3E8` | Hairlines |
| `border-strong` | `#CDCDD5` | Emphasized edges |
| `text` | `#17171B` | Primary |
| `text-secondary` | `#55555E` | Secondary |
| `text-faint` | `#83838D` | Metadata |
| **`steel`** | **`#33628F`** | Brand accent (darkened for AA on light) |
| `steel-soft` | `#DCE7F1` | Accent tint |

### 1.4 Semantic colors (both themes, tuned per background)

Distinct in hue from steel and from each other; each has a foreground and a soft background tint.

| Role | Dark | Light | Meaning |
|---|---|---|---|
| `success` | `#7FA96C` (moss) | `#4E7A3C` | Passed, applied, allowed, merged |
| `warning` | `#D9A441` (brass) | `#9A6E15` | Ask/confirm, caution, `full-auto` armed |
| `danger` | `#C8583F` (oxblood) | `#A83B24` | Denied, destructive, failed, blocked |
| `info` | `#6BA0CE` (steel) | `#33628F` | Neutral notice (reuses brand — intentional) |

### 1.5 Trust tiers (the marketplace palette)

The one place color encodes a security fact. Used on skill/plugin/block badges everywhere (§4.4):

| Tier | Swatch | Dark | Signal |
|---|---|---|---|
| `builtin` | steel | `#6BA0CE` | Ships with Bridle; fully trusted |
| `official` | moss | `#7FA96C` | Maintained by the Bridle org |
| `verified` | brass | `#D9A441` | Identity-checked publisher |
| `community` | faint outline | `#6B6B74` | Unverified — warned by default |

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

**The TUI is Claude Code's proven layout, re-skinned — not a reinvention.** Claude Code's terminal anatomy is the most battle-tested agent TUI in the world; we adopt its structure wholesale and change only what makes it *ours*: the colour (steel-on-graphite instead of orange-on-black) and the mascot (the Bridle bit-ring `⦿` instead of the sparkle `✻`). A Claude Code user should feel instantly at home; a Bridle user should never mistake a screenshot for anything else. Anatomy, top to bottom, mirroring Claude Code element-for-element:

- **Welcome box** — a rounded 1px-bordered box on session start: `⦿ Welcome to bridle`, a `/help` hint line, and `cwd:` — exactly Claude Code's opening box, mascot and colour swapped.
- **Transcript** — flush-left, no chrome. Assistant text and every tool call are marked with a solid **dot** `●` (a plain text glyph — never the `⏺` "record" codepoint, which many terminals and browsers colour-emoji into an orange disc): the dot is `text`-coloured for the assistant's own words and `steel` for a tool call. Tool calls read `● Read(src/auth/refresh.ts)`; their results indent under a `⎿` turnstile in `faint` (`⎿  Read 84 lines`). Observations are visibly framed as tool output, never as a person's words (tenet #2). **Rule: only ever use codepoints that render as monochrome text glyphs (`●`, `⎿`, `❯`, `▸`, `▍`, `⦿`); never one with an emoji presentation, and force text presentation (`U+FE0E`) if in doubt.**
- **Inline diff** — under a `● Update(file)` call, Claude Code's diff format: a `⎿ Updated … with N additions and M removals` summary, then numbered lines — deletions `12 -` on a `danger` low-tint with `danger` text, additions `12 +` on a `success` low-tint with `success` text. Line numbers in `faint`, `tabular-nums`.
- **Permission prompt** — Claude Code's numbered box, restyled: a rounded card with a `warning` left-edge, the exact action in mono, then `❯ 1. Yes` / `2. Yes, and don't ask again for <pattern>` / `3. No, tell bridle what to do (esc)`. Keyboard-first; the `❯` cursor and selected number are `steel`. While a prompt is pending, the status line shows Claude Code's **amber "awaiting permission" dot** (`●` in `warning`) so a paused agent is obvious at a glance.
- **Thinking indicator** — Claude Code's animated-gerund line: `⦿ Cinching… (4s · ↑ 1.2k tokens · esc to interrupt)`. The mascot does a slow single-glyph pulse (reduced-motion: static), never a spinner storm.
- **Input box** — the bottom rounded-border box with a `> ` prompt and a steel caret `▍`, identical in structure to Claude Code's composer. Placeholder advertises the input affordances Bridle borrows from OpenCode: **`@` for fuzzy file references, `!` to run a shell line, `/` for slash commands.**
- **Mode hint line** — directly under the input, Claude Code's accept-edits affordance rendered with a text-safe `▸▸`: `▸▸ full-auto · host  (shift+tab to cycle)` on the left in the mode's colour (full-auto in `warning`), `? for shortcuts · esc to interrupt` on the right in `faint`.
- **Subagent tree** — a live indented tree (Hermes) of spawned children and their current tool call, each a dim branch off the parent.
- **Status footer** — Claude Code's bottom strip, our fields: `runtime · model · ⎇ branch · context-meter NN% · $cost · elapsed`. The context meter is a thin bar, solid `steel`, that flips to solid `warning` past 80% used — it never gradient-fades. `tabular-nums` throughout, so nothing jitters as numbers tick.

The mascot `⦿` is the only glyph swap that matters: wherever Claude Code shows `✻`, Bridle shows the bit-ring. Everything else is a colour-token substitution over a layout users already trust.

#### 4.1.1 Terminal theming — inherit by default, paint on request

The `#0B0B0D` ground in the mockups is the **`bridle-dark` theme**, not a background Bridle stamps over the user's terminal. A TUI doesn't own its window the way a web page does: the colour behind the text is whatever the user's **terminal emulator theme** sets (iTerm, Alacritty, Ghostty, Kitty, Windows Terminal, tmux…). Like Claude Code and OpenCode, Bridle **feels native first** — it does not hard-paint the full screen by default, so it blends into the theme the user already runs. Three layers make this coherent:

1. **Auto-detect + match (default).** On launch, Bridle probes the terminal's real background (`OSC 11` query, falling back to `COLORFGBG`) to tell light from dark and selects `bridle-dark` or `bridle-light` so contrast is always right. It then *inherits* the user's background and paints only the element backgrounds that carry meaning — diff gutters, the selected row, the permission card's amber edge — plus the steel accent and framing glyphs.
2. **Force a theme (opt-in).** `theme: "bridle-dark"` (or `bridle-light`, or a user theme) makes Bridle paint the exact designed ground everywhere, for people who want the screenshot look regardless of their terminal.
3. **Truecolor with graceful fallback.** Steel and the semantics are emitted as 24-bit truecolor, so on a capable terminal they render exactly as designed over any background; on a 256- or 16-colour terminal they map to the nearest safe values, and the `●`/`⎿`/`❯` framing still reads with no colour at all.

So: it looks like the mockup in a dark terminal (or when `bridle-dark` is forced), and it blends into the user's own theme otherwise — but the steel identity and the tool-output framing survive either way. Themes ship from the same token contract (§8) as `bridle-dark` / `bridle-light`, so a terminal theme and the web console's theme are literally the same values.

### 4.2 Buttons & controls

Flat, square-ish (4px radius — machined, not pill-soft), mono labels. Primary = `steel` fill on dark text; secondary = `border-strong` outline, transparent fill; danger = `danger` outline that fills on hover. Focus is a 2px `steel` ring, always visible. No shadows on controls — depth comes from surface layering, not drop-shadows.

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
