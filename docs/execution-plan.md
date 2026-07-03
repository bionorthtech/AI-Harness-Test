# Bridle — Execution Plan

*Turning the duplicated OpenCode base into Bridle. 2026-07-03. Companion to [`architecture.md`](./architecture.md) and [`base-evaluation.md`](./base-evaluation.md).*

---

## 0. Where we are

The repo is a duplicate of OpenCode (MIT) — the working plumbing from [`base-evaluation.md`](./base-evaluation.md): client/server daemon, TUI (OpenTUI), provider-agnostic loop (Vercel AI SDK `ai@6`), MCP client, LSP, plugin system, sessions. On top of it we have added the Bridle terminal **theme** (`.opencode/themes/bridle.json`, set as default) and attribution (`NOTICE`). Everything below turns that base into Bridle.

**Principle:** land changes in **thin, verifiable slices**, each of which keeps the base runnable (`bun install && bun run dev`). Reskin and rename *before* deep feature work, so every later change already looks and reads like Bridle.

**Legend:** ⬜ not started · 🟦 in progress · ✅ done

---

## Phase A — Green baseline & reskin *(make it ours on the surface)*

Goal: it builds, runs, and *looks* like Bridle; nothing renamed structurally yet.

- ✅ **A1. Duplicate the base.** OpenCode imported (MIT), history dropped, marketing bloat excluded.
- ✅ **A2. Bridle theme.** `.opencode/themes/bridle.json` (graphite/steel, dark+light) validated against the built-in schema; set default in `.opencode/tui.json`.
- ✅ **A5. Prune to harness-only.** Cut from 31 packages to the 14 in the dependency closure of the CLI+TUI (dropped `app`, `cli`(lildax), `client`, `console/*`, `desktop`, `enterprise`, `function`, `httpapi-codegen`, `sdk-next`, `session-ui`, `slack`, `stats/*`, `storybook`, `web`, `containers`, `docs`(their site), `identity`(their logos)). Scrubbed root: SST/infra, release machinery, GitHub app/action, VS Code sdk, husky, nix, upstream org files. Repo 84M → 41M; three orphaned dependency patches removed; workspaces/scripts/turbo reconciled.
- ✅ **A3. Green baseline.** After the prune, `bun install` succeeds (1,963 packages — the prune removed the git-hosted dep that blocked it), `bun turbo typecheck` passes **13/13**, and the CLI boots with its full command surface (`tui`, `serve`, `run`, `mcp`, `acp`, `providers`, `agents`, `models`). *(Remaining: visual confirmation of the Bridle-themed TUI in a real terminal.)*
- ✅ **A4. Wordmark.** Bridle block wordmark ("brid" muted + "le" bold, same texture-mark language) replaces the OpenCode art in all three copies: `packages/tui/src/logo.ts` (drives TUI home + CLI banner via re-export), `packages/tui/src/util/presentation.ts` (session epilogue), and `packages/opencode/src/cli/ui.ts` (--help banner, verified live). Compact `go` mark redrawn as "br". *(The `⦿` mascot placement in welcome/thinking lines rides with B3's user-visible string sweep — OpenCode has no sparkle-mascot glyph to swap.)*

## Phase B — Rename to Bridle *(make it ours structurally)*

Goal: `opencode` → `bridle` everywhere it's safe, with the build green at each step.

- ✅ **B1. Rename map.** Surveyed: 1,153 files mention `opencode`. Strategy locked: surgical surface-first rename (CLI identity → config/env aliasing with fallbacks → internal identifiers last, as a mechanical pass); `$schema` URLs stay on opencode.ai until we host our own schemas.
- ✅ **B2. Config surface (aliasing).** `bridle.json(c)` + `.bridle/` dirs discovered everywhere the opencode names are, bridle winning when both exist (verified functionally, 4 cases). Global XDG dirs (`~/.config`, data, cache, state, tmp) prefer `bridle/`, fall back to existing `opencode/` per-path (verified). All env flags readable as `BRIDLE_*` with `OPENCODE_*` fallback via the central Flag module (verified). *(Still open in B2: `bridled` daemon naming, JSON5 support — rides with the C-phase config work.)*
- 🟦 **B3. Binary + user-visible strings.** CLI identity done: yargs scriptName is `bridle` and all command describes swept (verified in `--help`). Remaining: TUI welcome/home strings, `⦿` mascot placement, session-epilogue "Continue" hint, docs-URL strings.
- ⬜ **B4. Status line.** Reshape the TUI footer to the design-system fields: `runtime · model · ⎇ branch · context-% · $cost · elapsed`, with the amber awaiting-permission dot (design-system §4.1).

## Phase C — Permissions & safety *(first differentiator)*

- ✅ **C1. Mode dial.** The four modes exist as native primary agents on the base's permission system: `plan` (existing) / `review` (new: edit+bash ask) / `auto-edit` (new: edits apply, bash asks) / `build` (existing permissive default = full-auto posture). Tab/Shift+Tab cycles them natively; user permission config overrides mode defaults. Verified via `bridle agent list`. *(Later: rename `build`→`full-auto`, model-side plan self-transition guard.)*
- ⬜ **C2. Rules engine.** `deny → ask → allow` glob rules, merged (not overridden) across config scopes.
- ⬜ **C3. Shadow-git checkpoints.** Adopt/extend OpenCode's `snapshot` into checkpoint-after-every-mutation with `bridle rewind`, in a shadow git separate from the project's `.git` (architecture §6).
- ⬜ **C4. Budgets.** Per-session token/$/wall-clock caps that stop the loop.

## Phase D — Memory *(differentiator)*

- ⬜ **D1. Instruction files.** `BRIDLE.md` hierarchy (replaces/augments `AGENTS.md`).
- ⬜ **D2. Capped self-editing core memory.** `CORE.md`/`USER.md` with hard caps that *reject* overflow writes (architecture §7).
- ⬜ **D3. Recall index + tiered compaction.** sqlite-vec + FTS5 recall as an explicit tool; wire into OpenCode's `compaction` (microcompact → summarize → notes-assisted).

## Phase E — Runtimes & subagents *(differentiator)*

- ⬜ **E1. Runtime interface.** Host (default, native) + Container (Docker/Podman) + Remote (E2B/Daytona) behind one interface; secret scrubbing on every spawn (architecture §10). Host stays first-class for all modes.
- ⬜ **E2. Subagents with depth caps.** Isolation + `max_spawn_depth`; built-in `explorer`/`planner`/`reviewer` (architecture §11).

## Phase F — Trust-tiered marketplace *(the headline differentiator)*

- ⬜ **F1. Signing + trust tiers** (builtin/official/verified/community); nothing unsigned installs.
- ⬜ **F2. Static scanning + sandboxed skill scripts + quarantine** (architecture §9). This is the ClawHavoc-proofing; it gates any public registry.

## Cross-cutting

- ⬜ **License hygiene.** As Bridle code replaces OpenCode code, apply the Apache-2.0 strategy (base-evaluation §4): keep MIT notices on inherited files, Apache-2.0 for new files, keep `NOTICE` current.
- ⬜ **Upstream non-differentiating fixes** back to OpenCode.
- ⬜ **CI.** Add Bridle's own workflows (we dropped upstream's on import); typecheck + a smoke run of the TUI.
- ⬜ **Benchmark harness.** SWE-bench adapter for regression tracking (architecture §18 parallel track).

---

## Immediate next 3 steps

1. **A3 — green baseline:** run `bun install` and `bun run dev`, confirm the Bridle-themed TUI launches, fix whatever breaks, and capture a screenshot.
2. **A4 — wordmark & mascot:** swap OpenCode branding in the TUI header/welcome for Bridle + `⦿`, apply the dot-bullet rule.
3. **A5 — prune packages:** drop the marketing/cloud packages so the tree is just the harness.

Each is a small, reviewable PR that keeps `bun run dev` working.

---

## Sequencing rationale

Reskin (A) and rename (B) come **before** the feature differentiators (C–F) on purpose: once the base looks and reads like Bridle, every later diff is legible as Bridle work rather than edits to someone else's product, and contributors aren't confused about what they're touching. The differentiators then land in dependency order — permissions/checkpoints first (they protect everything after), then memory, then runtimes/subagents, then the marketplace (which depends on the plugin/skill surfaces being stable).
