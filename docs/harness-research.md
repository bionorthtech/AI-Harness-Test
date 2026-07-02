# The Ultimate Open-Source Harness — Research Review

*Compiled 2026-07-02. Scope: comparative research across coding/personal-assistant agent harnesses, to inform the design of this project.*

## 0. What counts as "the harness"

An agent **harness** is everything wrapped around a model call that turns raw next-token prediction into a working assistant: the loop that decides when to call the model again, the tools it's allowed to use, the permission gate in front of those tools, the memory that survives between turns and sessions, the extensibility surface (plugins/skills/MCP), the sandbox the tools actually execute in, and the CLI/TUI/API surfaces a human or another program drives it through. The model is a component; the harness is the product. This document surveys how the strongest open harnesses currently solve each of those pieces, so we can pick deliberately rather than default to whatever the first tutorial shows.

**Systems surveyed in depth:** Claude Code (Anthropic), OpenClaw, Hermes Agent (Nous Research), OpenCode (Anomaly/SST), Aider, Goose (Block), Cline, Roo Code, Continue.dev, OpenHands (ex-OpenDevin), SWE-agent, plus the Model Context Protocol (MCP) as connective tissue, and — as supporting cast for the memory and multi-agent sections — MemGPT/Letta, mem0, CrewAI, AutoGen/AG2, and LangGraph.

---

## 1. Landscape at a glance

| Harness | Core architecture | Extensibility unit | Memory model | Sandbox/infra | Surfaces |
|---|---|---|---|---|---|
| **Claude Code** | Single-threaded agent loop; parallel read-tools, serial write-tools | Plugins (commands+agents+skills+hooks+MCP bundle) | CLAUDE.md hierarchy + tiered compaction (microcompact/auto-compact/session-memory) | Host process, `bypassPermissions` for CI/containers | CLI/TUI, SDK, headless `-p` |
| **OpenClaw** | Gateway (control plane) + pluggable agent runtimes | ClawHub skills marketplace + channel plugins | `MEMORY.md` + daily notes + SQLite/sqlite-vec hybrid search (70% vector / 30% BM25) | Self-hosted Node process or Docker | 20+ chat channels, native macOS/iOS/Android |
| **Hermes Agent** | One shared `AIAgent` class across all entry points | Skills (progressive disclosure) + memory-provider plugins | Flat `MEMORY.md`/`USER.md` (hard char caps, agent self-edits) + SQLite FTS5 session search | Unix-socket child process for `execute_code`; two isolation modes | CLI, ACP (editor), 20 gateway adapters, API |
| **OpenCode** | True client/server split (TS backend + Go/Solid TUI client) | Directory-based plugins + custom tools + agents | `AGENTS.md`, compaction as a plugin hook | Runs on host; LSP servers auto-spawned per language | TUI, desktop (beta), IDE, CI |
| **Aider** | Chat loop around a ranked "repo map" (tree-sitter + PageRank) | Edit-format plugins (whole/diff/udiff), architect mode (2-model split) | Repo map + `CONVENTIONS.md` + git history as memory/undo | Runs on host, git as safety net | CLI, experimental browser UI |
| **Goose** | MCP-native host; sessions in SQLite | "Extensions" = MCP servers; YAML **recipes** (composable, parameterized, sub-recipes) | `.goosehints` (static) + Memory extension (dynamic, file-backed) | Runs on host | CLI + Desktop (shared config) |
| **Cline / Roo Code** | VS Code extension; Plan/Act mode gate | MCP marketplace; Roo adds **custom modes** (regex-scoped tool/file access) | Community **Memory Bank** pattern (markdown files, convention not code) | Shadow git repo, checkpoint-per-tool-call | VS Code (+ Cline SDK/CLI) |
| **Continue.dev** | IDE extension + CLI sharing one agent loop | **Blocks** (models/rules/tools/MCP/prompts) published to a Hub, composed via `uses:` | Rules + context providers (RAG-style), no bespoke long-term memory store | Runs on host; CLI has staged permission trust | VS Code, JetBrains, CLI |
| **OpenHands** | Central append-only **EventStream** (Action/Observation), agent = pure function of history | Pluggable `AgentHub` implementations (CodeActAgent = code-as-action) | Microagents/"skills" — always-on or keyword-triggered | Docker/E2B/Daytona sandboxed action-execution server | Web UI, CLI, GitHub Action, headless eval |
| **SWE-agent** | Agent-Computer Interface (ACI) — the tool surface is the product | N/A (research framework) | N/A | Docker | CLI, benchmark harness |
| **MCP** | JSON-RPC 2.0 client/server; tools/resources/prompts primitives | The connective standard nearly everyone above now speaks | N/A (protocol, not an agent) | stdio / Streamable HTTP / SSE(deprecated) / WebSocket transports | N/A |

---

## 2. Architecture patterns

Three real architectural families showed up, not a dozen variations on one idea:

**A. The monolithic agent loop** (Claude Code, Aider, Hermes's `AIAgent`, Goose). One process assembles context → calls the model → routes tool calls → repeats. Simple, easy to reason about, easy to embed. Claude Code's twist is running read-only tools (Read/Glob/Grep/read-only MCP) **concurrently** while serializing state-mutating tools (Edit/Write/Bash) — a cheap win we should copy directly, since most of an agent's wall-clock time in exploratory turns is parallel-safe I/O.

**B. Client/server split** (OpenCode, OpenClaw's Gateway, Continue's CLI+IDE). The agent core runs as a persistent server process; TUI/desktop/IDE/CI are all clients speaking to it over a local API. This is the architecture that buys you multi-surface support (terminal today, desktop app or IDE plugin later) without forking the agent logic — OpenCode's SDK-exposed server API is the cleanest example. It also enables session resumption and background/detached runs for free. **This is the pattern to build on if we want more than a single CLI.**

**C. Event-stream / pure-function-of-history** (OpenHands). Every agent decision is an immutable `Action`, every environment result an immutable `Observation`, both flow through one append-only pub/sub stream, and the agent is (conceptually) `f(history) → next_action`. This is more ceremony than approach A, but it pays off specifically for: replayability, pluggable security analyzers that hook the same stream, and cleanly separating "what the LLM sees" (`role`) from "who produced it" (`source`) — which is exactly the seam that prevents a malicious tool result from masquerading as a user instruction. Given that prompt injection via tool output is a live threat (see §3), this separation is worth adopting even inside a simpler loop, not just in a full event-sourced system.

**Agent-Computer Interface (SWE-agent) as a cross-cutting lesson, not just an architecture**: SWE-agent's core finding — that raw bash access measurably produces *more* errors than a constrained, LLM-shaped interface (windowed file viewer instead of `cat`, lint-on-edit, explicit "no output" messages instead of silence) — applies regardless of which architecture family we pick. OpenHands' CodeActAgent takes the opposite bet (give the model bash + Python + let it write code as the action) and also works well. The reconciling view: **CodeAct-style code-as-action is good for expressiveness; ACI-style constrained tools are good for reliability on narrow, high-frequency operations** (file editing specifically). We don't have to choose one globally — file editing can be a tight ACI-style tool while general execution stays open-ended bash/Python.

---

## 3. Tool systems

Every harness ends up with roughly the same core tool set (read file, write/edit file, run shell, search, fetch web), so the differentiation is in *how edits get applied reliably* and *how much structure is imposed on the model's output*:

- **Whole-file rewrite** (simplest, works with any model, expensive/slow on large files and prone to truncation on weaker models).
- **Search/replace diff blocks** (Aider's `diff` format, Claude Code's Edit tool) — surgical, requires the model to reproduce exact surrounding context.
- **Unified diff (`udiff`)** — Aider's most token-efficient format; measurably reduces "laziness"/truncation failures because the model only emits changed hunks.
- **Windowed viewer + lint-on-edit** (SWE-agent's ACI) — rejects syntactically broken edits before they ever land, keeping the transcript in a valid state instead of compounding errors turn over turn.

**LSP as a first-class tool source is underused outside OpenCode.** OpenCode auto-spawns real language servers per file extension and feeds diagnostics (not just linter text) back to the model, plus gives it hover/go-to-definition/find-references — genuine code intelligence instead of grep-based approximation. This is one of the highest-leverage, least-copied ideas in the survey.

**Programmatic tool calling (Hermes's `execute_code`)** is the other standout: instead of one tool call per inference turn, the model writes a short Python script against RPC stubs for its tools; the script runs in a child process over a Unix socket, and only `print()` output re-enters the context window. A 20-file `read_file` loop that would normally cost 20 tool-call round-trips (and dump 20 files into context) costs one inference call and only the printed summary. This is a genuine solve for the "context gets flooded by intermediate tool results" problem that every harness with a large tool surface eventually hits.

---

## 4. Extensibility: plugins, skills, MCP, hooks

MCP has won as the **cross-vendor tool-transport standard** — Goose is built on it natively; Cline, Roo, Continue, Claude Code, and OpenClaw all speak it; Anthropic donated its governance to a Linux-Foundation-hosted foundation (with Block and OpenAI as co-founders) in December 2025. Building on MCP from day one instead of a bespoke tool-registration format is close to a free win: it means the marketplace of existing MCP servers (GitHub, databases, browsers, Slack, etc.) is usable immediately.

Above the transport layer, three distinct extensibility *shapes* emerged, and they solve different problems — a serious harness probably wants all three, not one:

1. **Skills = markdown instructions, progressively disclosed.** Claude Code's `SKILL.md`, Hermes's skill directories, OpenClaw's ClawHub skills, and OpenHands' microagents are all the same idea: a directory with frontmatter (name, description, trigger conditions) plus a markdown body, loaded either always-on or only when a keyword/context matches. Hermes's implementation is the most refined: `skills_list()` costs ~3K tokens of metadata only, full bodies load on demand, and — distinctively — the **agent authors its own skills** after a task that took 5+ tool calls or after correcting a mistake, gated by an optional human-approval setting. This is the actual mechanism behind "the agent that grows with you," and it's a much cheaper thing to build than a real learning/fine-tuning loop.

2. **Plugins = code that hooks the runtime.** OpenCode's plugin functions receive a context object and return handlers for lifecycle events (`tool.execute.before/after`, `session.compacted`, `permission.asked`, etc.) — structurally identical to Claude Code's **hooks** system (~30 named lifecycle events: SessionStart, PreToolUse with the ability to block via exit code, PostToolUse, PreCompact, etc.). This is the right layer for policy enforcement (block a dangerous Bash pattern before it runs), telemetry, and integrating external systems (post a Slack message on session end) — things that are awkward to express as "an instruction the model reads."

3. **Recipes/workflows = parameterized, shareable task templates.** Goose's YAML recipes (with Jinja-style parameters and `sub_recipes` that are themselves independent agent configs) and Continue's Hub **blocks** (versioned, `owner/slug`-addressed, composed via `uses:` + `override`) both solve "stop copy-pasting the same agent config/prompt across a team." Continue's model — treat every reusable unit (a model config, a rule, an MCP server, a prompt) as an independently versioned, publishable package — is the more general and more composable of the two, and maps cleanly onto a plugin-marketplace design.

**The marketplace-trust problem is real and already happened.** OpenClaw's ClawHub grew past 10,700 listed skills; an independent audit found 341 malicious skills in a sample of 2,857 (335 traced to one coordinated campaign, "ClawHavoc"), and the confirmed-malicious count kept growing after. Whatever plugin/skill registry we build needs **signing, sandboxed execution, and a trust-tier system (builtin/official/trusted/community) from the first release**, not bolted on after an incident — this is the single clearest lesson from the entire survey (detailed in §7).

---

## 5. Memory & context management

Four genuinely different philosophies, in increasing order of mechanical sophistication:

| Approach | Example | How it works | Trade-off |
|---|---|---|---|
| **Flat file, always injected** | OpenClaw `MEMORY.md`, Hermes `MEMORY.md`/`USER.md`, Goose `.goosehints`, Aider `CONVENTIONS.md`, Claude Code `CLAUDE.md` | Markdown file(s), loaded whole into the system prompt every session | Zero infrastructure, fully auditable, no "hidden state" — but doesn't scale past a few KB and requires either the human or the agent to actively curate it |
| **Self-editing, size-bounded blocks** | MemGPT/Letta's "core memory" | Agent edits its own memory via tool calls (`core_memory_append/replace`); when full, oldest turns get recursively summarized out | The model decides what's worth keeping "hot" — genuinely OS-inspired (RAM vs. paged storage) rather than a document the agent merely reads |
| **Extraction/consolidation pipeline** | mem0 | LLM extracts atomic facts from conversation, classifies each as ADD/UPDATE/DELETE/NOOP against nearest neighbors, never overwrites (preserves temporal history), retrieves via a fused score (semantic + BM25 + graph + recency) | Much higher quality than raw RAG-over-transcript, but is real infrastructure (vector DB + graph store + SQL) to run and operate |
| **Hybrid file + vector search** | OpenClaw's `memory.sqlite` (sqlite-vec, 70/30 vector/BM25 blend) | Daily markdown notes are the source of truth; SQLite gives searchability without a separate vector DB service | Good middle ground: still auditable as files, but searchable at scale without standing up infrastructure |

Two design details worth stealing directly:

- **Hermes's hard character cap + rejected write** (not silent truncation) forces the agent to actively consolidate/prune its own memory file when it's full, rather than quietly losing information off the end — a small mechanism with an outsized effect on memory quality over long lifetimes.
- **Letta's explicit doctrine that "retrieval is a tool for memory, not memory itself."** A pile of vector-searched chat history is not memory — it's a fallback for "what did we say about X." Structured, size-bounded, self-editing state is memory. This should shape our default: ship a small, always-injected, agent-editable core memory file, and treat semantic session search as a separate, explicitly-invoked recall tool — not the primary memory mechanism.

**Context compaction** deserves its own line: Claude Code's three-tier approach (microcompact = free, cache-TTL-driven discard of stale tool results; auto-compact = full LLM summarization past a token threshold; session-memory-compact = skip the summarization call using pre-extracted durable notes) is the most sophisticated of the group and worth reproducing — compaction quality is one of the most noticeable UX differences between a harness that "feels smart over a long session" and one that doesn't.

---

## 6. Permissions & the multi-agent question

**Permission models converge on the same three levers**, expressed differently everywhere: (1) a mode that governs default posture (Claude Code's `default`/`acceptEdits`/`plan`/`bypassPermissions`, Cline's Plan/Act), (2) per-action-category auto-approval (Cline's granular Auto Approve, Continue CLI's staged trust recorded to `~/.continue/permissions.yaml`), and (3) explicit allow/deny/ask pattern lists (Claude Code's `Bash(npm run test *)`-style rules, evaluated deny → ask → allow). **Diff-before-apply plus a rollback mechanism is the safety net everyone converges on**, but the implementations differ in an important way: Cline/Roo's **shadow git repo** (a separate git history from the project's real `.git`, auto-committed after every tool use) is strictly better than relying on the project's real git history for undo, because it doesn't pollute commit history and captures files the project's `.gitignore` would otherwise hide from tracking. This is worth adopting wholesale as the default rollback mechanism, independent of whatever the project's own git usage looks like.

**Subagent isolation is the load-bearing idea across every harness that has it** (Claude Code's Task/Agent tool, Hermes's `delegate_task`, OpenCode's agent configs): a child agent gets its own context window and only a summary re-enters the parent's context. This is simultaneously a context-management technique (don't let 20 files' worth of exploration bloat the main conversation) and a permission technique (a read-only "Explore" subagent literally cannot call Write/Edit, no matter what it's tricked into wanting to do). Hermes adds one useful guardrail the others don't emphasize: **default `max_spawn_depth: 1`** — children can't themselves delegate unless explicitly permitted — which caps runaway recursive spawning by default rather than by convention.

Whether to go further into full multi-agent orchestration (CrewAI's role-based crews, AutoGen/AG2's conversational group chat, LangGraph's graph-based state machine with checkpointing/replay) is a separate question from single-agent-with-subagents. None of the harnesses above need a graph orchestrator to be useful — subagent delegation with depth limits covers the "parallelize exploration, isolate risk" use case that actually comes up in coding/assistant work. LangGraph-style durable, resumable, branching orchestration earns its complexity when *workflow* durability (not just conversation memory) matters — e.g., a long-running multi-day task that must survive process restarts. That's a real but distinct feature to design later, not a v1 requirement.

---

## 7. Infrastructure, sandboxing & security

Execution environment choices split cleanly by how much the project trusts its own tool calls:

- **Runs on the host, git as the safety net** — Aider, OpenCode, Goose, Continue, Cline/Roo. Simplest to ship, and fine when the human is present and reviewing diffs turn by turn.
- **Sandboxed action-execution server** — OpenHands' pluggable `LocalRuntime`/`DockerRuntime`/`RemoteRuntime`, with third-party backends (E2B microVMs, Daytona, Modal) swappable in. This is the right default for anything that runs *unattended* or executes less-trusted, model-generated shell/code — which is most agent work once you stop supervising every command.
- **Isolated subprocess per risky call** — Hermes's `execute_code` scrubs environment variables matching `KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|AUTH` before handing the child process its environment, and caps timeout/output size/tool-call count per execution. Cheap, targeted mitigation that doesn't require standing up a full container runtime.

### Case study: what OpenClaw's incident history teaches us

OpenClaw is the most instructive cautionary tale in this survey precisely because it succeeded — 250K+ stars in ~60 days — and its security record scaled with its popularity:

- **CVE-2026-25253** (CVSS 8.8): the local Control UI accepted an unvalidated `gatewayUrl` query parameter that triggered a WebSocket handshake leaking the auth token — one click, full remote compromise. Root cause was an unauthenticated-by-default local control plane, not a sophisticated exploit.
- Exposed instances scanned by Censys grew from ~1,000 to 21,000+ in a single week; a separate study found 42,665 exposed instances, 93.4% of verified-vulnerable ones showing auth bypass.
- **"ClawHavoc"**: 341 of 2,857 audited ClawHub skills were malicious, most traced to one coordinated campaign; the confirmed count kept climbing past 824 as the marketplace grew past 10,700 skills.
- A researcher demonstrated prompt injection could exfiltrate an exposed agent's full system prompt, tool config, memory files, loaded skills, and embedded credentials.

**Direct design implications for us:**
1. **No local control surface is exposed without authentication by default**, ever — not even on `127.0.0.1`, since the CVE above was exactly a same-host trust assumption being bypassed via browser-initiated WebSocket.
2. **Skills/plugins from a marketplace are untrusted input by default.** Signing, a trust-tier system, and static scanning for prompt-injection/exfiltration/destructive patterns need to exist *before* we open a public registry, not after.
3. **Environment/secret scrubbing for any executed subprocess** (Hermes's KEY/TOKEN/SECRET pattern-matching approach) is cheap insurance worth including even in the simplest execution path.
4. **Source separation** (OpenHands' `Event.source` vs. `role` split) should be a rule, not a nice-to-have: tool output must never be structurally indistinguishable from a user instruction, or prompt injection via a malicious file/webpage/tool-response becomes trivial.

---

## 8. Config, CLI & API/SDK design

Config hierarchy is nearly universal in shape: **managed/org policy → CLI flags → local (gitignored) → project (committed) → user/global**, with array-valued settings (permission rules, MCP servers) *merging* across scopes rather than one scope replacing another — Claude Code's model, and worth copying exactly since the alternative (full override) makes org-wide policy impossible to enforce alongside per-project customization.

Headless/scriptable invocation is table stakes now, not a nice-to-have: Claude Code's `claude -p "prompt" --allowedTools ...`, Continue's `cn -p "prompt"`, and the general pattern of "same agent loop, but one-shot and stdout-only" is what makes a harness usable from CI, cron, or another program instead of only interactively. Pair this with an **SDK that's literally the library form of the same agent loop** (the Claude Agent SDK's positioning) rather than a thin wrapper around the CLI — that's what lets other tools (or our own future GUI) embed the agent without shelling out.

A config file format detail worth a specific call-out: OpenClaw's use of **JSON5** (comments + trailing commas allowed) for its main config file is a small but real quality-of-life win over strict JSON for a file humans hand-edit and re-read months later — worth adopting for our own primary config file.

---

## 9. Style/UX & multi-surface design

The TUI-quality bar has moved: OpenCode built its own terminal renderer (OpenTUI, Zig core with React/Vue/Solid bindings) rather than wrapping an existing toolkit, and it shows — reviewers specifically call out its responsiveness relative to older ncurses-style TUIs. If our harness ships a terminal UI, it should not be an afterthought; it's the primary surface most users will judge the whole project by in the first five minutes.

Multi-surface reach (terminal + chat channels + native apps) is OpenClaw's and Hermes's actual differentiator versus the terminal-first tools, and it's enabled specifically by the architectural choices in §2: OpenClaw's Gateway and Hermes's single shared `AIAgent` class both work *because* platform-specific code was pushed to a thin entry-point layer instead of being allowed to leak into the agent core. If multi-surface (Slack/Discord/Telegram bot, not just CLI) is a goal for us, the client/server or shared-core-class pattern is a prerequisite, not an add-on we can retrofit later.

Plan/Act as a distinct, human-gated mode (Claude Code's `plan` mode with a dedicated read-only Explore/Plan subagent; Cline's Plan/Act where the model cannot self-transition) is cheap to build and meaningfully reduces "the agent went off and did something I didn't want" incidents — a good default even before more granular permission rules exist.

---

## 10. Synthesis — a proposed shape for our harness

Pulling the above into concrete choices, oriented around "combine the best ideas, don't reinvent what's already solved well":

1. **Architecture**: client/server split from day one (OpenCode-style) — a persistent agent-core server, with the CLI/TUI as the first client. This is more upfront work than a monolithic loop but is the only pattern that doesn't require a rewrite later if we want a desktop app, IDE extension, or chat-channel bridge. Within the loop: parallel read-tools / serial write-tools (Claude Code), and an explicit `source` vs. `role` separation on every message (OpenHands) so tool output can never masquerade as user instruction.
2. **Tools**: MCP as the extensibility transport from day one. File editing via a constrained ACI-style tool (windowed view, lint-on-edit) rather than raw `cat`+overwrite; general execution via bash/Python. LSP-backed diagnostics and code intelligence (OpenCode) rather than grep-only awareness. A programmatic/batched tool-calling path (Hermes's `execute_code`) once the base tool surface is stable, to solve context-flooding on multi-file operations.
3. **Extensibility**: three layers — skills (markdown, progressively disclosed, agent-authorable with human-approval gate), hooks (code, lifecycle events, for policy/telemetry), and shareable config blocks (Continue's Hub model: versioned, `owner/slug`-addressed, composable via `uses:`) for models/rules/MCP servers/prompts. Trust tiers and signing built into the registry design before it's public-facing.
4. **Memory**: a small, always-injected, self-editing core memory file with a hard size cap that rejects overflow writes (forcing consolidation, not truncation) — plus a separate, explicitly-invoked session-search tool for recall, never conflating the two. Tiered compaction (cheap discard → summarize → pre-extracted notes) for long-session context management.
5. **Permissions**: mode + auto-approve categories + allow/deny/ask pattern rules, merged (not overridden) across managed/project/user config scopes. Shadow-git checkpointing after every tool call as the default rollback mechanism, independent of the project's real git history. Subagents as the default isolation primitive, with a depth cap on recursive delegation.
6. **Infrastructure**: host execution by default for interactive use (fast iteration), with a pluggable sandboxed-runtime interface (Docker minimum, E2B/Daytona-style pluggability later) required for any unattended/CI mode. Environment/secret scrubbing on every subprocess regardless of sandbox tier. No local control surface ever exposed without authentication, including on localhost.
7. **Config/CLI**: layered config files in a comment-friendly format (JSON5 or YAML), headless one-shot invocation (`--print`-equivalent) from day one, and a real SDK (library form of the agent loop) rather than a CLI-wrapper SDK.
8. **UX**: a genuinely well-built TUI as the flagship surface; Plan/Act as a default-on gated mode; multi-surface (chat channels, IDE) treated as future clients of the same server core, not bolted onto the CLI's internals.

---

## 11. Open decisions — for your review

These are the calls that materially change scope and are yours to make before implementation starts:

- **Single-binary CLI vs. client/server from day one?** Client/server is more upfront engineering but is the only path to multi-surface later without a rewrite (§2, §10.1).
- **How far into multi-agent orchestration?** Subagent delegation (cheap, high-value) vs. a full graph orchestrator like LangGraph's (durable/resumable workflows — real but bigger scope) (§6).
- **How ambitious on multi-surface reach?** Terminal-only, terminal+IDE, or terminal+chat-channels-like-OpenClaw — each is a different amount of entry-point/adapter work (§9).
- **Sandboxing default**: host execution (fast, simpler, more trust required) vs. sandboxed-by-default (OpenHands-style, slower to set up, much safer for unattended use) (§7).
- **Plugin/skill marketplace**: build one at all, and if so, how much trust/signing infrastructure ships in v1 vs. later — given ClawHavoc, "later" has a real cost (§4, §7).
- **License and governance model** — not researched here (this doc is architecture-focused), but worth deciding early given how much of this space is shifting toward foundation-governed projects (MCP → Agentic AI Foundation; OpenClaw's own transition).

---

## Appendix — full source list

**Claude Code / MCP**: code.claude.com/docs (agent-sdk/agent-loop, settings, hooks, sub-agents, mcp, permission-modes, headless), anthropic.com/news/claude-code-plugins, arxiv.org/html/2604.14228v1, modelcontextprotocol.io/specification/2025-06-18, en.wikipedia.org/wiki/Model_Context_Protocol, anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation, thenewstack.io/why-the-model-context-protocol-won, ivision.com/blog/model-context-protocol-security

**OpenClaw**: docs.openclaw.ai (gateway/configuration, concepts/agent-runtimes, concepts/agent-loop, concepts/memory, tools/skills, install/docker), openrouter.ai/docs/guides/coding-agents/openclaw-integration, allthingsopen.org/articles/openclaw-viral-open-source-ai-agent-architecture, theregister.com (2026/05/17 agent-harnesses piece), fortune.com (2026/02/19), en.wikipedia.org/wiki/OpenClaw, thehackernews.com/2026/02/openclaw-bug-enables-one-click-remote, giskard.ai/knowledge/openclaw-security-vulnerabilities

**Hermes Agent**: github.com/NousResearch/hermes-agent, hermes-agent.nousresearch.com/docs (architecture, memory, memory-providers, skills, code-execution, delegation, providers, acp), github.com/NousResearch/Hermes-Function-Calling, huggingface.co/datasets/NousResearch/hermes-function-calling-v1, github.com/NousResearch/atropos

**OpenCode / Aider**: opencode.ai/docs (config, plugins, custom-tools, lsp, tui, keybinds), opentui.com, github.com/anomalyco/opencode, deepwiki.com/sst/opencode, aider.chat/docs (repomap, ctags, edit-formats, unified-diffs, git, config, usage/modes, usage/browser, usage/lint-test)

**Goose / Cline / Roo / Continue**: deepwiki.com/block/goose, block.github.io/goose (custom-extensions, mcp/tutorial-mcp, recipes, sub-recipes, .goosehints post), goose-docs.ai/docs/mcp/memory-mcp, docs.cline.bot (auto-approve, checkpoints, mcp-marketplace, memory-bank), github.com/cline/mcp-marketplace, roocodeinc.github.io/Roo-Code/features/custom-modes, github.com/GreatScottyMac/roo-code-memory-bank, docs.continue.dev (cli/overview, guides/understanding-configs, hub/blocks/intro, customize/mcp-tools, ide-extensions/agent/how-it-works, customize/deep-dives/autocomplete)

**OpenHands / SWE-agent / memory / multi-agent**: docs.openhands.dev (sdk/arch/events, openhands/usage/architecture/runtime, overview/skills), arxiv.org/html/2511.03690v1, daytona.io/dotfiles, runtime.all-hands.dev, openhands.dev/blog/sota-on-swe-bench-verified, swe-agent.com/1.0/background/aci, arxiv.org/pdf/2405.15793, letta.com/blog/agent-memory, leoniemonigatti.com/blog/memgpt.html, docs.mem0.ai/core-concepts/memory-evaluation, arxiv.org/abs/2504.19413, pickaxe.co/post/crewai-vs-langgraph-vs-autogen, qubittool.com/blog/ai-agent-framework-comparison-2026
