# Bridle — Architecture & Build Plan

*The ultimate open-source agent harness. Blueprint v1, 2026-07-02. Companion to [`harness-research.md`](./harness-research.md), which surveys the systems every decision below is traced to.*

---

## 0. Working name & positioning

**Bridle** (working codename — easy to change before public launch): the bridle is the part of the harness that steers a powerful animal. The daemon is `bridled`, the client is `bridle`, the registry is the **Bridle Hub**. Alternatives if this doesn't land: *Tack*, *Reins*, *Yoke*.

Positioning in one sentence: **a self-hosted, protocol-first agent core that any surface can drive** — terminal, IDE, chat channel, CI, or another program — combining Claude Code's loop discipline, OpenCode's client/server architecture, Hermes's learning and memory mechanics, OpenClaw's multi-channel reach, OpenHands' event-stream safety model, and a supply-chain trust story none of them shipped with.

The model is a component. The harness is the product.

---

## 1. Design tenets

Ten rules that settle arguments before they start. Each traces to a research finding.

1. **The core is a server; every UI is a client.** No agent logic ever lives in a surface. *(OpenCode, OpenClaw Gateway, Hermes `AIAgent`)*
2. **Tool output is never a user instruction.** Every event carries `source` separate from LLM-facing `role`, enforced structurally, not by convention. *(OpenHands)*
3. **No hidden state.** Everything the agent "remembers" is a file or a row a human can read. Memory is auditable or it isn't memory. *(OpenClaw's memory doctrine)*
4. **Retrieval is a tool for memory, not memory itself.** Small, capped, self-edited core memory; search is a separate, explicit recall tool. *(Letta)*
5. **Constrain the high-frequency tools, free the long tail.** File editing is a tight ACI-style tool with lint-on-accept; general execution is open bash/Python. *(SWE-agent vs. CodeAct, reconciled)*
6. **Nothing mutating runs unlogged or unrevertable.** Shadow-git checkpoint after every mutating tool call, always, in every mode. *(Cline/Roo)*
7. **Untrusted by default.** Marketplace content is hostile until signed, scanned, and tier-labeled. Local control surfaces authenticate even on localhost. *(ClawHavoc, CVE-2026-25253)*
8. **Speak standards where they exist.** MCP for tools, ACP for editors, agentskills.io for skill format. Invent protocol only where no standard exists. *(MCP's win)*
9. **The context window is the scarcest resource.** Progressive disclosure, programmatic tool calling, tiered compaction, subagent isolation — every subsystem is designed to keep junk out of context. *(Hermes, Claude Code)*
10. **Headless is not a mode, it's the foundation.** The interactive TUI is sugar over the same one-shot-capable core that CI uses. *(Claude Code `-p`, Continue `cn -p`)*

---

## 2. Decisions — the six open questions, resolved

"Spare no expense" resolves scope questions toward the maximal design, phased so the expense is sequenced rather than simultaneous.

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | Single binary vs. client/server | **Client/server from day one.** `bridled` daemon + Bridle Protocol; the TUI is client #1. | Only pattern that adds desktop/IDE/channels without a rewrite. The daemon can still ship inside one binary that self-spawns (`bridle` launches `bridled` if absent) so the UX feels like a single tool. |
| 2 | Multi-agent depth | **Subagents with depth caps in v1; durable workflow graphs in v2.** | Delegation + isolation covers 90% of real value (parallel exploration, permission scoping). LangGraph-style durable orchestration is real but a separate milestone (Phase 5). |
| 3 | Multi-surface ambition | **Full reach, phased:** TUI → headless/SDK → IDE via ACP → channel gateway (Slack/Discord/Telegram/WhatsApp) → desktop/web console. | The architecture (decision 1) makes each surface a thin adapter. Channels are what made OpenClaw and Hermes categorically different products. |
| 4 | Sandboxing default | **Pluggable Runtime interface from day one — host/native is a first-class target for every mode, including full-auto.** Bridle runs natively on the machine with no container required; the sandbox is an *option you can reach for*, not a floor you must clear. Sandbox (container/remote) is the *recommended* default for **unattended** runs, and choosing full-auto-on-host surfaces a one-time explainer + `runtime: host` opt-in — but it is fully supported, never refused. Secret scrubbing, checkpointing, budgets, and network policy apply in **every** runtime, so host runs are still guarded. | Matches guardrails to supervision level without ever taking native execution away. Many users run on a laptop or a trusted server and don't want Docker in the loop; forcing a sandbox would make the tool unusable for them. Safety comes from the always-on rails (§6, §16), not from denying the host. |
| 5 | Marketplace & trust | **Build the Hub, but no unsigned artifact ever installs.** Signing, trust tiers, static scanning, and sandboxed skill execution ship in the Hub's v1 — the Hub launches later than skills themselves (Phase 4), never before its trust infra. | ClawHavoc demonstrated the cost of "later." |
| 6 | License & governance | **Apache-2.0**, contributor DCO, governance charter written for eventual foundation donation (the direction MCP, Goose, and OpenClaw all went). | Patent grant matters for enterprise adoption; foundation-readiness is cheap now and expensive to retrofit. |

---

## 3. System overview

Five layers, strictly separated — the cleanest idea in OpenClaw's design, kept and hardened:

```
┌────────────────────────────── SURFACES ──────────────────────────────┐
│  bridle TUI │ headless CLI │ IDE (ACP) │ desktop │ web │ channels…   │
└──────┬───────────────────────────────────────────────────────────────┘
       │  Bridle Protocol — JSON-RPC 2.0 over WS/HTTP, token-authed,
       │  per-client capability scopes, streamed event subscriptions
┌──────┴───────────────────────────────────────────────────────────────┐
│                        bridled — the core daemon                      │
│                                                                       │
│  Session manager (lanes, resume, share)     Event log (append-only)  │
│  Agent loop (context asm → infer → tools)   Permission engine        │
│  Memory subsystem            Skills / Hooks / Blocks                 │
│  MCP client + MCP server     Subagent manager    Checkpointer        │
└──────┬───────────────────────────────────┬───────────────────────────┘
       │  Runtime interface                │  Provider interface
┌──────────────────────────────┐   ┌───────┴──────────────────────────┐
│  host / native  (default)    │   │ anthropic │ openai │ openrouter  │
│  container (Docker/Podman)    │   │ google │ bedrock │ ollama/local… │
│  remote (E2B/Daytona/Modal…)  │   └──────────────────────────────────┘
└──────────────────────────────┘
```

- **Surfaces** contain zero agent logic — they render events and forward input.
- **`bridled`** owns sessions, the loop, permissions, memory, extensibility. One daemon serves many concurrent sessions and many connected clients.
- **Runtimes** answer "where do tools execute"; **Providers** answer "which model thinks." Both are swappable interfaces, never reachable except through the core. **The default runtime is the host itself** — Bridle runs natively with nothing to containerize; Docker/Podman and remote sandboxes are opt-in isolation you reach for when you want it (§10).
- `bridled` is also **an MCP server itself**: any external MCP host (Claude Desktop, an editor) can mount a Bridle agent as a tool — the harness composes into other harnesses.

---

## 4. The core: event log, sessions, agent loop

### 4.1 Event log

Every session is an append-only sequence of typed, immutable events in SQLite — the OpenHands event-stream model inside a pragmatic loop:

```ts
Event {
  id: ulid, sessionId, ts,
  source: "user" | "agent" | "tool" | "system" | "subagent:<id>" | "hook:<name>",
  kind: "message" | "action" | "observation" | "permission" | "checkpoint"
      | "compaction" | "lifecycle" | "error",
  llmVisible: boolean,        // control-flow events exist but never reach the model
  payload: {...}
}
```

`source` is set by the core, never by the payload producer. When context is assembled, a tool observation renders with unmistakable framing regardless of its content — a webpage that says "ignore previous instructions" arrives as data inside a tool observation, structurally incapable of being a user turn. This is tenet #2 made mechanical. The log also buys replay (re-run any session against a new model/prompt for regression testing) and audit for free.

### 4.2 Sessions & lanes

- Runs are **serialized per session** ("lanes", from OpenClaw) — no tool races within a conversation; different sessions run fully parallel.
- Sessions persist in SQLite with provider metadata, working directory, token usage, and runtime binding; any client can resume any session (OpenCode's killer property).
- `session.fork` branches a session at any event for what-if exploration; `session.share` exports a redacted, read-only transcript.

### 4.3 Agent loop

```
intake → context assembly → inference → tool dispatch → persist → repeat until done
```

- **Context assembly** builds the system prompt in three cache-friendly tiers (Hermes): *stable* (identity, tool schemas, core rules) → *contextual* (project instructions, loaded skills, core memory) → *volatile* (recent events, current task). Stable tiers change rarely, maximizing provider prompt-cache hits.
- **Tool dispatch** runs read-only tools **concurrently** and mutating tools **serially** (Claude Code). Every tool self-declares `mutating: boolean`; MCP tools use their read-only annotation, defaulting to mutating when unannotated.
- **Failure policy**: provider errors walk a configurable fallback chain (model → model → provider); context overflow triggers compaction then retry (Hermes).
- **Stop conditions**: model signals completion, max-iteration cap, budget cap (tokens and/or dollars per session — first-class, not an afterthought), or human interrupt.

---

## 5. Tool layer

Built-in tools, grouped. Names are namespaced and boring on purpose.

| Group | Tools | Design notes |
|---|---|---|
| Files | `fs.read`, `fs.edit`, `fs.write`, `fs.glob` | `fs.read` is **windowed** (SWE-agent): bounded slices, never unbounded `cat`. `fs.edit` accepts search/replace blocks *and* udiff (Aider's two winners); **lint-on-accept** — a syntactically broken result rejects the edit with the linter error, keeping the transcript in a valid state. |
| Search | `search.grep`, `search.symbols` | ripgrep-backed; `symbols` is tree-sitter-backed with a **repo map** (Aider): dependency-graph PageRank over symbols, token-budgeted, always available as ambient context. |
| Execution | `shell.run`, `shell.bg`, `code.exec` | `shell.run` is a real PTY with timeout + output caps and explicit "command succeeded with no output" results (SWE-agent's null-result rule). `code.exec` is **programmatic tool calling** (Hermes): the model writes a Python script against generated RPC stubs; it runs in a child process over a Unix socket; only `print()` output re-enters context. Whitelisted callables, no recursive `code.exec`/delegation, resource-capped. |
| Code intel | `lsp.diagnostics`, `lsp.hover`, `lsp.definition`, `lsp.references` | Auto-spawned language servers per file type (OpenCode) — real compiler-grade feedback after every edit, not grep approximations. |
| Web | `web.fetch`, `web.search` | Fetched content is always framed as untrusted observation (tenet #2). |
| Agent | `agent.delegate`, `memory.*`, `skills.*`, `session.search` | Detailed in §7, §8, §11. |
| MCP | `mcp:<server>/<tool>` | Any MCP server (stdio / Streamable HTTP) mounts under a namespace; tools inherit the permission engine like natives. |

---

## 6. Permission & safety engine

Three levers (the convergent design across Claude Code, Cline, Continue), plus two mechanisms nobody pairs:

**Modes** — the posture dial:

| Mode | Reads | Edits | Shell | Runtime |
|---|---|---|---|---|
| `plan` | ✓ | ✗ (proposes) | ✗ | any (host or sandbox) — model *cannot* self-transition out (Cline's rule) |
| `review` (default) | ✓ | ask, diff-first | ask | any (host or sandbox) |
| `auto-edit` | ✓ | ✓ | ask | any (host or sandbox) |
| `full-auto` | ✓ | ✓ | ✓ | any — **host fully supported** (`runtime: host` + one-time explainer); sandbox *recommended* for unattended runs, not required |

Host and sandbox are peers: the same session, tools, and permission rules behave identically whichever runtime backs them. The mode dial governs *how much the agent may do*; the runtime governs *where it does it* — and you can pair any mode with any runtime, including running fully autonomous on bare metal.

**Rules** — pattern lists evaluated `deny → ask → allow`, first match wins, **merged (never overridden) across config scopes** so org policy and project customization coexist:

```json5
permissions: {
  deny:  ["shell.run(rm -rf *)", "fs.read(./.env*)", "web.fetch(*.internal.corp)"],
  ask:   ["shell.run(git push*)", "mcp:github/*"],
  allow: ["shell.run(npm test*)", "fs.edit(src/**)"],
}
```

**Category auto-approve** — per-group toggles (reads / edits / shell / web / MCP) for session-level trust ratcheting, recorded so trust decisions are reviewable (Continue's `permissions.yaml`).

**Checkpointing** — a **shadow git repository** outside the project's `.git` (Cline/Roo), committed after *every* mutating tool call in *every* mode. `bridle rewind` restores to any checkpoint; the project's real git history stays clean; files the project gitignores are still captured.

**Budgets** — hard per-session token/dollar/wall-clock caps that stop the loop rather than warn.

---

## 7. Memory subsystem

Layered exactly along the research's four philosophies, cheapest always-on, heaviest opt-in:

1. **Instruction files** (always injected, human-owned): `BRIDLE.md` at project root (+ `~/.bridle/BRIDLE.md` user-level, `.bridle/local.md` gitignored). Hierarchical merge like CLAUDE.md.
2. **Core memory** (always injected, *agent*-owned): `~/.bridle/agents/<id>/memory/CORE.md` and `USER.md`, hard-capped (4KB / 2KB). The agent edits them via `memory.add/replace/remove`. **Writes that would exceed the cap are rejected, not truncated** — the agent must consolidate first (Hermes's mechanism; it's what keeps memory curated instead of rotting).
3. **Daily notes**: `memory/YYYY-MM-DD.md`, today + yesterday auto-loaded (OpenClaw). Automatic **memory flush prompt before every compaction** so durable facts escape the summarizer.
4. **Recall index**: sqlite-vec + FTS5 hybrid search (70% cosine / 30% BM25, OpenClaw's tuning) over notes and session transcripts. Exposed only as the explicit `session.search` tool — recall is invoked, never ambiently stuffed into context (tenet #4).
5. **Provider plugins**: a `MemoryProvider` interface for Letta, mem0, Honcho, etc., for users who want extraction pipelines or user-modeling. One active at a time (Hermes's constraint — sane).

**Compaction** is three-tiered (Claude Code): **T0 microcompact** — drop stale tool observations past the prompt-cache TTL, no model call; **T1 summarize** — full LLM summarization past a token threshold, using a cheap model slot; **T2 notes-assisted** — durable notes already extracted (layer 3) let T1 skip or shrink. Compaction fires `pre-compact`/`post-compact` hooks so plugins can preserve what they need.

---

## 8. Extensibility: skills, hooks, blocks, plugins

Four shapes, four different problems:

### 8.1 Skills — knowledge (markdown, progressively disclosed)

agentskills.io-compatible directories:

```
skills/<name>/
  SKILL.md          # frontmatter: name, description (≤60ch), version,
  references/       #   triggers: [keywords], requires: {bins, env, os},
  scripts/          #   tier: builtin|official|verified|community
  templates/
```

- **Progressive disclosure** (Hermes): the model sees a ~metadata-only index; bodies load on invocation; reference files load individually.
- **Triggers** (OpenHands microagents): keyword-triggered skills load only when relevant — many specialized instruction sets coexist without bloating every prompt.
- **Agent-authored skills**: after a task with 5+ tool calls, a corrected mistake, or a novel workflow, the agent drafts/updates a skill — **gated by a human-approval diff by default**. This is the "grows with you" loop, and it's the feature that makes the harness compound in value.

### 8.2 Hooks — policy (code on lifecycle events)

~20 events at launch: `session.start/end`, `turn.start/end`, `tool.pre` (**blocking** — exit code or JSON verdict can deny/rewrite), `tool.post`, `permission.asked/denied`, `compaction.pre/post`, `checkpoint.created`, `subagent.spawned/finished`, `config.changed`, `file.edited`. Handler types: `command`, `http`, `mcp-tool`, `prompt`, `agent` (Claude Code's set). Declared in config or contributed by plugins.

### 8.3 Blocks — shareable config (versioned packages)

Continue's best idea, generalized: every reusable unit — a model config, a rule set, a prompt, an MCP server binding, a mode, a *recipe* (parameterized workflow, Goose) — is an `owner/slug@version` package composed via `uses:` + `override`. Teams pin golden configs; the Hub distributes them.

### 8.4 Plugins — capability (code that extends the runtime)

TS/JS modules, but **capability-scoped, not omnipotent** (our improvement over OpenCode/OpenClaw, where a plugin is arbitrary code with full core access): a plugin manifest declares needed capabilities (`hooks:tool.pre`, `tools:register`, `harness:register`, `channel:register`) and runs in an isolated worker with only those grants. Plugins register custom tools (Zod-schema'd), agent harnesses (external CLI backends, OpenClaw-style), channels, memory providers, and runtimes.

---

## 9. Bridle Hub — registry & supply-chain trust

The ClawHavoc chapter, inverted into requirements. The Hub does not launch until all five exist:

1. **Signing**: every artifact (skill/block/plugin) is sigstore-signed; the client verifies before install; unsigned artifacts do not install, period.
2. **Trust tiers**: `builtin` → `official` → `verified` (identity-checked publisher) → `community` (default-warned). Tier is displayed at install and gates defaults (e.g., community skills can't auto-load via triggers without opt-in).
3. **Static scanning** on publish *and* install: prompt-injection patterns, exfiltration signatures (network calls in scripts, env access), destructive-command patterns. Findings block or warn by tier.
4. **Sandboxed skill scripts**: `scripts/` in skills execute in the session's runtime under the permission engine — never with daemon privileges.
5. **Quarantine pipeline**: report → auto-unlist → forensic review → publisher-wide revocation (ClawHavoc was one actor × hundreds of artifacts; revocation must be publisher-granular).

Registry protocol is open (static JSON index + signatures over HTTPS), so self-hosted/org-internal hubs are first-class — the public Hub is just the default remote.

---

## 10. Runtimes — sandboxing & execution

```ts
interface Runtime {
  exec(cmd, opts): Stream<Output>     // PTY, timeout, output caps
  fs: { read, write, watch }          // scoped to workspace root
  snapshot(): CheckpointRef           // powers rewind on non-host runtimes
  network: NetworkPolicy              // per-session allow/deny lists
}
```

- **HostRuntime** — direct native execution on the user's machine. **Fully supported for every mode**, interactive *and* full-auto; no container, no daemon-in-a-daemon, nothing to install beyond Bridle itself. This is the default and the path most users will actually run: a laptop, a dev box, a trusted VPS. Tools execute as the user, in the real working directory, with the real toolchain already installed — zero setup tax. All the always-on rails below still apply, so "native" does not mean "unguarded."
- **ContainerRuntime** — OCI (Docker **or** Podman), workspace bind-mounted; the action-execution-server pattern (OpenHands) with the language toolchain, LSP servers, and a headless browser inside. *Recommended* for unattended/full-auto and for running less-trusted code, but never mandatory — reach for it when you want isolation, skip it when you don't.
- **RemoteRuntime** — adapter interface for E2B (microVMs), Daytona, Modal; also how cloud/CI execution works.

**Every runtime, always — including host**: environment scrubbing on spawn (variables matching `KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|AUTH` are stripped unless explicitly passed through — Hermes); per-session network policy; output/timeout caps; shadow-git checkpointing (§6) so any mutation is revertable; and per-session token/dollar/wall-clock budgets. These rails are what make host execution safe enough to be the default — the guardrails travel with the session, not with the container.

---

## 11. Subagents & orchestration

- Subagents are markdown-defined (frontmatter: tools allowlist, model, mode, memory access) in `.bridle/agents/` or `~/.bridle/agents/`, or spawned ad-hoc via `agent.delegate`.
- **Isolation is the point**: a child gets a fresh context containing only the goal/context fields the parent passes; only its final summary re-enters the parent (Claude Code, Hermes). A read-only `explorer` subagent *cannot* write, regardless of prompt injection.
- **`max_spawn_depth: 1` by default** (Hermes) — children don't delegate unless an orchestrator agent is explicitly granted depth. Parallelism via a concurrency cap (default 3).
- Built-ins: `explorer` (read-only, cheap model), `planner` (read-only, plan mode), `reviewer` (diff-scoped).
- **Phase 5 — Workflows**: durable, resumable graph orchestration (LangGraph's lesson) as a layer *above* sessions: nodes are agent runs, edges are typed conditions, state checkpoints to SQLite, survives daemon restarts. Recipes (§8.3) compile into simple workflows.

---

## 12. Providers & models

- Provider interface normalizes three API shapes: `chat_completions`, `anthropic_messages`, `responses` (Hermes's tri-mode covers effectively every vendor + every local server: Ollama, vLLM, llama.cpp, LM Studio via OpenAI-compat).
- **Model slots** (Hermes): `main`, `compact` (summarization), `vision`, `fast` (title/labels, explorer subagent) — each independently `provider/model/base_url`, so a frontier model thinks while cheap models do janitorial work.
- Native structured tool-calling when the provider has it; **Hermes-format XML tool calling (`<tool_call>`)** as the universal fallback so fine-tuned open-weight models work without vendor endpoints.
- Fallback chains on rate-limit/error; per-model metadata (context length, cache TTL, cost) drives compaction thresholds and budget math.

---

## 13. Config system

- **Format: JSON5** (comments + trailing commas — OpenClaw's quality-of-life call), schema-validated with precise errors; hot-reloaded where safe.
- **Scopes, highest to lowest**: managed (`/etc/bridle/managed.json5`, unoverridable org policy) → CLI flags → local (`.bridle/local.json5`, gitignored) → project (`.bridle/config.json5`, committed) → user (`~/.bridle/config.json5`). **Array-valued settings merge across scopes** (Claude Code) — this is what makes org policy + project customization compatible.

```json5
{
  model: { main: "anthropic/claude-sonnet-5", compact: "openrouter/deepseek/deepseek-v4" },
  mode: "review",
  permissions: { allow: ["shell.run(npm *)"], deny: ["fs.read(./.env*)"] },
  runtime: "host",
  uses: [ "acme/golden-rules@^2", "acme/github-mcp@1.4.0" ],   // blocks
  hooks: { "tool.pre": [{ handler: "command", run: ".bridle/hooks/guard.sh" }] },
  budget: { maxTokensPerSession: 2_000_000, maxUsdPerSession: 10 },
}
```

Project layout: `.bridle/{config.json5, local.json5, agents/, skills/, hooks/, BRIDLE.md}`. User: `~/.bridle/{config.json5, agents/, skills/, blocks-cache/, sessions.db}`.

---

## 14. Protocol & SDK

**Bridle Protocol**: JSON-RPC 2.0 over WebSocket (+ HTTP for one-shots). Same wire idiom as MCP and ACP — one mental model across the whole stack.

- **Auth always, even loopback**: per-client tokens minted at pairing; no unauthenticated endpoint exists (CVE-2026-25253's lesson). Browser-origin connections additionally require an origin allowlist.
- **Capability-scoped clients**: a channel adapter gets `session:message`; an IDE gets `session:*` + `fs:*`; a monitoring dashboard gets `events:read`. A compromised surface is a bounded surface.
- Core methods: `session.create/resume/fork/share`, `agent.run` (returns `runId` immediately, events stream after — OpenClaw), `agent.interrupt`, `permission.respond`, `events.subscribe(filter)`, `config.get/set`, `skills.*`, `memory.*`.

**SDK**: the TypeScript SDK *is* the core's public API surface (library form of the loop, not a CLI wrapper — Claude Agent SDK's positioning); Python SDK generated from the same protocol schema. Headless: `bridle -p "fix the failing tests" --mode full-auto --runtime container --output json` — usable from CI, cron, or another agent.

---

## 15. Surfaces

| Surface | What it is | Phase |
|---|---|---|
| **TUI** | The flagship. Custom high-fidelity terminal renderer (OpenTUI-class bar): streaming markdown, inline diffs with accept/reject, permission prompts, subagent tree view (Hermes), transcript scrubbing to any checkpoint, leader-key keybindings, themes. | 1 |
| **Headless CLI** | `bridle -p` one-shots; JSON/stream output; exit codes for CI. | 1 |
| **SDK** | TS + Python, protocol-native. | 2 |
| **IDE** | ACP server (Zed-originated standard; VS Code/JetBrains/Zed clients exist) — native editor diffs/panes without us writing extensions. | 4 |
| **Channel gateway** | Adapter plugins: Slack, Discord, Telegram, WhatsApp first; per-channel session isolation + DM pairing policy (OpenClaw). | 4 |
| **Desktop/Web console** | Session dashboard, config editor, Hub browser; authenticated like every other client. | 5 |

---

## 16. Security model (threat → mitigation)

| Threat | Mitigation |
|---|---|
| Prompt injection via tool output / web / files | Structural `source`/`role` separation (§4.1); untrusted framing on all fetched content; subagent isolation for risky browsing |
| Malicious marketplace artifacts | Signing + tiers + scanning + sandboxed scripts + quarantine (§9); nothing unsigned installs |
| Exposed control plane | Token auth on every endpoint incl. localhost; origin allowlists; capability-scoped clients (§14) |
| Secret exfiltration via subprocess | Env scrubbing on every spawn, every runtime (§10); network policy per session |
| Runaway autonomy | Always-on rails that travel with the session regardless of runtime: hard token/dollar/wall-clock budgets, iteration caps, spawn-depth caps, live interrupt, and revertable checkpoints. Sandbox is *recommended* for unattended full-auto but never required — host is fully supported, guarded by the same rails |
| Destructive file/shell actions | deny-first rule evaluation; lint-on-accept edits; shadow-git checkpoint after every mutation; `bridle rewind` |
| A compromised plugin | Capability-scoped worker isolation (§8.4) — a plugin has only its declared grants |

---

## 17. Stack

| Layer | Choice | Why |
|---|---|---|
| Core daemon | **TypeScript on Bun** | Largest plugin-author pool (OpenClaw + OpenCode prove community scale in TS); first-class MCP SDKs; Bun for startup + built-in SQLite. Performance-critical paths (repo-map ranking, embeddings) can drop to native modules later — the protocol boundary makes a future Rust core swap possible without touching clients. |
| TUI | TypeScript (SolidJS-style reactive renderer) | OpenTUI demonstrated the ceiling; separate process talking Bridle Protocol. |
| Storage | SQLite + sqlite-vec + FTS5 | Zero-ops, auditable files + searchable index (OpenClaw's proven combo). |
| Parsing/intel | tree-sitter + ripgrep + LSP | Aider's repo map + OpenCode's LSP, both best-in-class. |
| Sandbox | OCI (Docker/Podman) + remote adapters | OpenHands' proven runtime pattern. |
| Signing | sigstore | Industry standard, keyless option. |
| Monorepo | pnpm/Bun workspaces | — |

```
bridle/
  packages/
    protocol/      # schema, types, client libs (source of truth)
    core/          # bridled daemon
    tui/  cli/  sdk/  sdk-python/
    runtimes/      # host, container, remote adapters
    gateway/       # channel adapter plugins
    hub/           # registry service + signing/scanning tools
    skills/        # bundled skill set
  docs/  examples/  benchmarks/
```

---

## 18. Roadmap

Phases named for gaits — a bridle's progression. Each has a hard exit criterion; nothing advances on vibes.

| Phase | Name | Scope | Exit criterion |
|---|---|---|---|
| 0 | **Foundation** (~4 wks) | Protocol schema; daemon skeleton; event log; config system; provider interface (Anthropic/OpenAI/OpenRouter/Ollama); **HostRuntime (native execution)**; minimal loop with `fs.*`, `shell.run`, `search.grep`; headless `-p` | An unattended headless run completes a multi-step task natively (no container) end-to-end, fully replayable from its event log |
| 1 | **Walk** (~6 wks) | TUI v1; permission engine (modes/rules/categories); shadow-git checkpoints + rewind; ACI edit tool with lint-on-accept; windowed reads; repo map; LSP diagnostics | A developer uses Bridle daily on Bridle's own repo ("harness-hosted development") with `review` mode and rewind |
| 2 | **Trot** (~6 wks) | Memory subsystem (core/notes/recall index); tiered compaction; instruction files; skills with progressive disclosure + triggers; hooks | A 4-hour session stays coherent post-compaction; agent-authored skill lands via approval gate |
| 3 | **Canter** (~6 wks) | MCP client + server mode; subagents (built-ins + custom, depth caps); `code.exec` programmatic tool calling; ContainerRuntime (Docker/Podman) as an *optional* isolation target; full-auto mode; budgets | Full-auto fixes a real bug from a one-line prompt within budget with no human touches — verified running **both** natively on the host and in a container |
| 4 | **Gallop** (~8 wks) | Bridle Hub with complete trust pipeline (signing/tiers/scanning/quarantine); blocks; ACP IDE support; first channel adapters (Slack, Telegram); SDKs stable | Signed community skill published, installed, trigger-loaded; same session driven from terminal and Slack |
| 5 | **Steeplechase** | Workflows (durable graphs); desktop/web console; RemoteRuntime adapters (E2B/Daytona); replay-based regression benchmarks; multi-agent teams | A workflow survives a daemon restart mid-run and completes |

Parallel tracks from Phase 1: docs site, `bridle doctor`, benchmark harness (SWE-bench adapter — OpenHands showed eval-readiness keeps the loop honest).

---

## 19. Traceability — what we took from whom

| Source | Adopted |
|---|---|
| Claude Code | Parallel-read/serial-write dispatch; tiered compaction; config scope merging; hooks event set; plan mode; headless-first; SDK-as-the-loop |
| OpenCode | Client/server split; SDK-exposed server; LSP integration; TUI quality bar; plugin lifecycle events |
| OpenClaw | Layered runtime/provider/model separation; session lanes; `runId`-then-stream; file+sqlite-vec memory; daily notes; channel gateway; JSON5 config; *and the entire negative curriculum (§9, §16)* |
| Hermes Agent | Tiered prompt assembly; capped self-editing memory with rejected overflow; progressive skill disclosure; agent-authored skills; `code.exec`; spawn-depth caps; model slots; tri-mode provider abstraction; XML tool-call fallback |
| Aider | Repo map (tree-sitter + PageRank); udiff edit format; lint/test feedback loops; git-native philosophy |
| Cline / Roo | Shadow-git checkpoints; human-gated plan→act; category auto-approve; mode-scoped tool/file access |
| Continue | Blocks (config-as-versioned-package); staged permission trust; headless CLI parity |
| Goose | Recipes; MCP-native extension philosophy; SQLite sessions |
| OpenHands | Event stream; `source`/`role` separation; pluggable runtimes; keyword-triggered microagents; eval-readiness |
| SWE-agent | ACI: windowed viewer, lint-on-edit, null-result feedback |
| Letta / mem0 | "Retrieval is a tool, not memory"; self-editing bounded blocks; provider-plugin seam for heavier pipelines |
| MCP / ACP / agentskills.io | The standards we speak instead of invent |

---

## 20. Risks & honest unknowns

- **Scope.** This blueprint is several person-years at full breadth. The phase gates are the defense: each phase ships a usable product (Phase 1 alone ≈ a competitive coding CLI). Cut from the top (Phase 5, channels) not the bottom (safety, protocol).
- **TS-core performance ceiling.** Mitigated by the protocol boundary (core is swappable) and native modules for hot paths. Revisit at Phase 3 with benchmarks, not opinions.
- **Hub moderation is an ongoing cost, not a feature.** Budget for it operationally; the pipeline (§9) reduces but does not eliminate human review.
- **ACP/agentskills.io maturity.** Both are young standards; we track them but keep adapters thin so churn is absorbed at the edge.
- **Name collision check** ("Bridle") needed before public launch.

---

*Next step after review: approve/amend the six decisions and the stack call, then Phase 0 scaffolding begins — protocol schema and daemon skeleton first.*
