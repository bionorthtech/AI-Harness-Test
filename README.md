<h1 align="center">Bridle</h1>

<p align="center">
  <em>An open-source, protocol-first agent harness — built on a duplicated OpenCode base and reshaped into Bridle.</em>
</p>

---

> **Status: early base.** This repository is a duplicate of [OpenCode](https://github.com/sst/opencode) (MIT) that we are reshaping into **Bridle**. The plumbing — client/server daemon, TUI, provider-agnostic loop (Vercel AI SDK), MCP client, LSP, plugins — comes from OpenCode and works today. The Bridle-specific reskin and differentiators are being layered on top. Internals still say `opencode` in many places; renaming is a tracked step (see the execution plan).

## Why this exists

We evaluated the open-source landscape and chose to **build on a proven base rather than start from scratch** ([`docs/base-evaluation.md`](docs/base-evaluation.md)). OpenCode is the closest architectural match to the Bridle design — same stack (TypeScript on Bun), client/server split, MCP + LSP, provider-agnostic — and MIT-licensed, so we duplicated it and are layering Bridle's differentiators on top.

## The Bridle design & plan

The vision, architecture, and identity live in [`docs/`](docs/):

| Doc | What it is |
|---|---|
| [`docs/harness-research.md`](docs/harness-research.md) | Comparative research across Claude Code, OpenClaw, Hermes, OpenCode, Aider, Goose, Cline/Roo, Continue, OpenHands, SWE-agent, MCP |
| [`docs/architecture.md`](docs/architecture.md) | Full Bridle architecture & phased build plan |
| [`docs/design-system.md`](docs/design-system.md) | Visual identity: graphite-and-steel, dark-first, the TUI theme |
| [`docs/base-evaluation.md`](docs/base-evaluation.md) | Why we duplicated OpenCode; license strategy |
| [`docs/execution-plan.md`](docs/execution-plan.md) | The step-by-step plan for reshaping this base into Bridle |
| [`examples/terminal-ui.html`](examples/terminal-ui.html) | Interactive prototype of the target Bridle TUI |

## Run it

Requires [Bun](https://bun.sh) ≥ 1.3.

```sh
bun install
bun run dev        # starts the TUI (currently the OpenCode CLI, Bridle-themed)
```

The Bridle terminal theme is preset in [`.opencode/tui.json`](.opencode/tui.json) (`"theme": "bridle"`, defined in [`.opencode/themes/bridle.json`](.opencode/themes/bridle.json)) — graphite ground, steel accent, matching the design system. Switch interactively with `/theme` inside the TUI.

## License & attribution

Bridle is a duplication (not a fork) of OpenCode, used under the **MIT License** (retained in [`LICENSE`](LICENSE)); see [`NOTICE`](NOTICE) for attribution. New Bridle code is intended for **Apache-2.0** distribution — see [`docs/base-evaluation.md`](docs/base-evaluation.md) §4. Not affiliated with or endorsed by OpenCode.
