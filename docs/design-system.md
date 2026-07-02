# Bridle — Design System

*Visual identity and component language for the harness, its surfaces, and its docs. v1, 2026-07-02. Companion to [`architecture.md`](./architecture.md).*

---

## 0. Design thesis

A bridle is **worked leather and steel hardware** — something a craftsperson made to steer a powerful animal with precision and trust. That is the whole identity in one image:

- **Leather** is the ground: warm, dark, calm, matte. It's the surface everything sits on — a terminal you spend hours in shouldn't glare at you.
- **Steel** is the signal: a single cool blue-grey, the color of a buckle and a bit against tan leather. It marks what's live, focused, or actionable, and it is *never* asked to also mean "success" or "danger."
- **Craft** is the execution: nothing decorative, everything functional, tight tolerances. Monospace carries the brand because this is an instrument, not an app.

The look is **dark-first** (the terminal is home), **mono-forward** (the tool speaks in the terminal's own voice), and **warm-neutral** (leather, not slate). It deliberately avoids the two current AI-tool clichés — warm-cream-with-terracotta, and near-black-with-one-acid-pop — by pairing a *warm* dark ground with a *cool* accent, which almost nobody does.

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

The terminal UI is the product's face. Anatomy, top to bottom:

- **Header rail** — mark + session name + model slot + runtime badge (`host` / `container` / `remote`) + mode pill. One line, `text-faint` except the active mode.
- **Transcript** — the scrollable body. User turns flush-left with a steel caret `▍`; agent turns unmarked (the default voice); tool calls in a collapsed `surface` block with a mono label header (`● fs.edit  src/app.ts`) that expands to show args/output; observations framed distinctly (tenet #2 — you can always *see* that content came from a tool, not a person).
- **Inline diff** — additions on a `success`-tinted gutter, deletions on `danger`-tinted, both at low tint over `surface`; a right-aligned `[a]ccept  [r]eject  [e]dit` affordance. Diffs are first-class UI, not dumped text.
- **Permission prompt** — a `surface-raised` card with a `warning` left-edge, the exact action in mono, and `deny → ask → allow` context; keyboard-first (`y`/`n`/`a`).
- **Subagent tree** — a live indented tree (Hermes) showing spawned children and their current tool call, each a dim branch off the parent.
- **Status line** — always-on footer: mode · runtime · model · token/budget meter (a thin bar that shifts toward `warning` as it fills) · elapsed. `tabular-nums` throughout.

### 4.2 Buttons & controls

Flat, square-ish (4px radius — leather-tooled, not pill-soft), mono labels. Primary = `steel` fill on dark text; secondary = `border-strong` outline, transparent fill; danger = `danger` outline that fills on hover. Focus is a 2px `steel` ring, always visible. No shadows on controls — depth comes from surface layering, not drop-shadows.

### 4.3 Mode dial

The four permission modes render as a segmented control, the active segment filled: `plan` (steel-soft), `review` (neutral), `auto-edit` (steel), `full-auto` (warning-tinted — armed autonomy always reads as "pay attention"). Shift+Tab cycles it, matching the keybinding.

### 4.4 Badges & pills

- **Trust tier** — §1.5, always label + color, `community` outlined.
- **Runtime** — `host` (steel-soft), `container` (neutral), `remote` (neutral) — a small chip so you always know where tools are running.
- **Status** — success/warning/danger soft-tint pills for run outcomes.

### 4.5 Cards, tables, code

Cards: `surface` fill, 1px `border`, 10px radius, generous internal padding, no heavy shadow (a single soft `0 8px 24px -12px` at most). Tables: uppercase mono column heads on a `surface-raised` strip, hairline rows, `tabular-nums`, hover row-tint; wide tables scroll inside their own container. Code blocks: `bg`-dark even in light theme (code is always "terminal"), mono, generous line-height, a language chip top-right.

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

## 8. Tokens (implementation)

Ship as CSS custom properties + a JSON token file consumed by the TUI renderer and the web console alike, so terminal and browser stay in lockstep. Theme = a swap of the token set; `bg`/`surface`/`text`/`steel`/semantics are the stable contract, everything else derives. The palette validates for WCAG AA on text pairs in both themes (steel-on-dark, text-on-surface, every semantic-on-its-tint).

---

*This system dresses every surface in §15 of the architecture — TUI, headless output, IDE panes, channel messages, and the web console — from one token contract, so Bridle looks like one tool everywhere it runs.*
