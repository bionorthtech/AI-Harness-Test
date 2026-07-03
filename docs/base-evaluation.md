# Bridle — Choosing a Base to Build On

*Nothing gets built from scratch. This memo evaluates existing open-source foundations and recommends the one to fork/adopt. 2026-07-03. Companion to [`architecture.md`](./architecture.md).*

---

## 0. The question

We have a full architecture ([`architecture.md`](./architecture.md)) and a design system ([`design-system.md`](./design-system.md)). We do **not** want to hand-write a daemon, an agent loop, a provider abstraction, an MCP client, an LSP bridge, and a TUI from an empty directory — all of that already exists, working and battle-tested, in open source. The task is to pick the right **base** and spend our effort on Bridle's *differentiators* (trust-tiered marketplace, capped self-editing memory, shadow-git checkpoints, sandboxed runtimes, the mode/permission engine, the reskin) rather than re-solving solved problems.

Three shapes of "base" exist:

1. **Fork a whole product** — start from a working harness (daemon + TUI + loop) and reshape it.
2. **Assemble on a framework** — take a batteries-included agent framework and build the harness/surfaces on top.
3. **Wire up an SDK** — take a low-level model/tool SDK and build almost everything ourselves.

---

## 1. Candidates evaluated

| Candidate | License | Lang / runtime | What it already is | Alignment with Bridle |
|---|---|---|---|---|
| **OpenCode** (`sst`/`anomalyco`) | **MIT** | TypeScript / **Bun** | A complete, ~165k-star open-source coding harness: **client/server split**, polished **TUI**, provider-agnostic loop (built on Vercel AI SDK), **MCP** client, **LSP** integration, plugin system, sessions, share links | **Highest.** This is the exact architecture we reverse-engineered our client/server, LSP, plugin, and TUI decisions from. Same stack (TS/Bun). |
| **Mastra** | **Apache-2.0** (core; `ee/` is enterprise-licensed) | TypeScript | A "batteries-included" agent *framework*: agents, workflows, memory, RAG, evals, MCP-server authoring, local dev UI. Called "the default scaffold for Claude Code-style TS agents." | **High as a substrate**, but it's a framework, not a harness — no daemon/TUI/permissions/surfaces. We'd assemble those. License matches ours exactly. |
| **Vercel AI SDK** (`vercel/ai`) | **Apache-2.0** | TypeScript | The reference model layer: provider-agnostic completion, streaming, **tool calling**, structured output. Not an agent/harness by itself. | **Adopt regardless** — this is our §12 provider abstraction. OpenCode and Mastra both already build on it. |
| **Claude Agent SDK** (`@anthropic-ai/claude-agent-sdk`) | **Proprietary** (Anthropic Commercial ToS) | TS / Python | The library form of Claude Code's exact loop + tools + context management. | **Excluded as a base.** Proprietary and Claude-locked — cannot found an open, provider-agnostic, Apache-2.0 harness. We already borrowed its *design*, which is free to do. |
| **OpenClaw** | (varies) | TS / Node | Gateway + channels + skills marketplace. | **Not a base.** Multi-channel reach is appealing but its security track record (CVE-2026-25253, ClawHavoc) is exactly what we're designing *against*; adopting its code inherits that surface. Study it, don't fork it. |
| **Goose** (Block) | Apache-2.0 | **Rust** | MCP-native, recipes, extensions. | **Wrong stack.** Excellent ideas (recipes → our blocks) but Rust, not our TS/Bun pick. |
| **OpenAI Agents SDK (TS)** / **VoltAgent** | MIT / Apache-2.0 | TypeScript | Lightweight agent loops, observability. | Fine libraries, but thinner than Mastra and less complete than forking OpenCode. Keep as references. |

---

## 2. Recommendation

**Primary: fork OpenCode (MIT) as the harness base; keep the Vercel AI SDK (Apache-2.0) it already uses as the model substrate.**

Why OpenCode is the right base and not a from-scratch build or a framework assembly:

- **It already *is* ~80% of Bridle's Phase 0–1.** A forked OpenCode gives us, working, on day one: the client/server daemon, the reactive TUI, a provider-agnostic loop (Anthropic/OpenAI/Google/OpenRouter/Ollama), an MCP client, LSP-backed code intelligence, a plugin system, sessions, and config. Our entire "Foundation" and most of "Walk" phase collapse into *fork + reskin*.
- **Same stack, zero mismatch.** TypeScript on Bun is exactly what the architecture picked (§17). We're not adapting a foreign runtime.
- **The architecture is already OpenCode-shaped.** We derived our client/server split, LSP-as-a-tool-source, plugin lifecycle hooks, and TUI-quality bar *from studying OpenCode*. Forking it means the base and the blueprint agree instead of fighting.
- **MIT lets us do anything** — fork, modify, rebrand, and relicense our distribution (see §4). No copyleft, no field-of-use limits.

Mastra is the **fallback** if, on closer inspection, forking a whole product feels like inheriting too many of someone else's decisions: it's Apache-2.0 (a license match), it's the most complete TS *framework*, and it gives agents/memory/workflows/MCP for free — but we would still build the daemon, TUI, permission engine, and every surface ourselves. More control, materially more work.

**Adopt the Vercel AI SDK either way.** It is the provider-agnostic layer from §12 — don't hand-roll model calls, streaming, or tool-call parsing when the reference implementation is Apache-2.0 and already under both candidates.

---

## 3. What we get for free vs. what Bridle still builds

Forking OpenCode draws a clean line between "inherited" and "our differentiators":

| Bridle subsystem (from `architecture.md`) | From OpenCode fork | Bridle builds on top |
|---|---|---|
| Client/server daemon + protocol (§4, §14) | ✅ inherited | Harden auth-on-localhost; capability-scoped clients |
| Agent loop, provider abstraction (§4, §12) | ✅ inherited (via AI SDK) | `source`/`role` event separation; model slots; XML-tool fallback |
| TUI (§15) | ✅ inherited (reskin only) | Apply the Bridle design system: graphite/steel, dot bullets, status line |
| MCP client + LSP (§3, §5) | ✅ inherited | MCP *server* mode (compose Bridle into other hosts) |
| Plugins / config (§8, §13) | ✅ inherited | Capability-scoped plugin isolation; blocks; JSON5 scope-merge |
| **Permission engine** (§6) | ⚠️ partial | Modes + allow/deny/ask + **shadow-git checkpoints** |
| **Memory** (§7) | ❌ minimal | Capped self-editing core memory; daily notes; tiered compaction |
| **Trust-tiered signed marketplace** (§9) | ❌ none | The headline differentiator — signing, tiers, scanning, quarantine |
| **Sandboxed runtimes** (§10) | ❌ host only | Pluggable host (default) / container / remote; secret scrubbing |
| **Subagents w/ depth caps** (§11) | ⚠️ partial | Isolation + `max_spawn_depth`; built-in explorer/planner/reviewer |

The four ❌ rows are precisely where Bridle earns its existence. Forking means we spend our time there instead of on plumbing.

---

## 4. License strategy

- OpenCode is **MIT** → we may fork, modify, rebrand, and distribute under our own terms, provided we retain the upstream MIT copyright/notice for the inherited code.
- **MIT is one-way compatible with Apache-2.0.** We can ship the combined Bridle distribution under **Apache-2.0** (our governance decision, §2 of the architecture): keep the original OpenCode `LICENSE`/notices for inherited files, license *new* Bridle code Apache-2.0, and add a `NOTICE` file crediting OpenCode. Vercel AI SDK (Apache-2.0) and Mastra-core (Apache-2.0) are already compatible.
- Avoid pulling in Mastra's `ee/` enterprise-licensed directories; stick to its Apache-2.0 core if used at all.
- Never vendor Claude Agent SDK code (proprietary).

---

## 5. Adoption plan (concrete first steps)

1. **Fork & stand it up.** Fork OpenCode, get it building and running under Bun locally, run its test suite — establish a green baseline before changing anything.
2. **Rename & rebrand.** `opencode` → `bridle` / `bridled`; swap the wordmark, mascot (`✻`/theirs → `⦿`), and default theme tokens to the Bridle design system (graphite `#0B0B0D` + steel, dot `●` bullets, CC-style status line). This alone makes it *feel* like Bridle.
3. **Reconcile the config surface** to our JSON5 + scope-merge model (§13) and the mode/permission vocabulary (§6).
4. **Layer the differentiators in roadmap order** (§18): shadow-git checkpoints → capped self-editing memory + tiered compaction → sandboxed runtimes (host default, container/remote) → subagents with depth caps → the trust-tiered signed marketplace (the big one).
5. **Upstream the non-differentiating fixes.** Bugs and generic improvements go back to OpenCode; our differentiators stay ours. Good open-source citizenship and it keeps our merge-debt low.

---

## 6. Roadmap impact

Forking collapses the front of the roadmap:

- **Phase 0 (Foundation)** and most of **Phase 1 (Walk)** become **"fork + reskin + reconcile config"** — days/weeks, not months, because the daemon, loop, TUI, MCP, and LSP already exist.
- The freed time moves to **Phases 2–4** — memory, sandboxed runtimes, and the signed marketplace — which is where Bridle is actually differentiated and where the ClawHavoc-grade security work lives.

Net: forking OpenCode is the difference between shipping a *reskin of a working harness with our differentiators* this quarter versus rebuilding plumbing for two quarters first.

---

## 7. Risks & mitigations

- **Inheriting upstream architecture decisions.** Mitigated by how closely our blueprint already tracks OpenCode; where we diverge (permissions, memory, marketplace) we're adding layers, not fighting existing ones.
- **Merge debt vs. upstream.** Mitigated by upstreaming generic fixes (§5.5) and keeping differentiators in clearly separated modules.
- **Governance history.** OpenCode went through the SST→anomalyco split; MIT insulates us from any future direction change — we own our fork.
- **Codebase ramp-up.** A ~165k-star project is large; budget real time to learn it before reshaping. The DeepWiki for `sst/opencode` and its docs are good on-ramps.

---

## 8. Decision requested

1. **Approve OpenCode (MIT) as the fork base** + Vercel AI SDK substrate — or choose the Mastra (Apache-2.0) assembly path instead.
2. Confirm **Apache-2.0** as the distribution license for the combined work (§4).
3. On approval, the first action is step 5.1 — fork, build under Bun, establish a green baseline — then reskin to the Bridle design system.

*Sources: OpenCode `LICENSE` (MIT), `vercel/ai` `LICENSE` (Apache-2.0), Mastra `LICENSE.md` (Apache-2.0 core + `ee/` enterprise), `@anthropic-ai/claude-agent-sdk` (Anthropic Commercial ToS). Framework landscape via Mastra, Vercel AI SDK, VoltAgent, and OpenAI Agents SDK documentation, July 2026.*
