import { describe, expect } from "bun:test"
import path from "path"
import os from "os"
import { mkdtempSync, readFileSync } from "fs"
import { LayerNode } from "@opencode-ai/core/effect/layer-node"
import { Effect, Exit } from "effect"
import { MemoryTool, CAPS, memoryPath } from "../../src/tool/memory"
import { SessionID, MessageID } from "../../src/session/schema"
import { CrossSpawnSpawner } from "@opencode-ai/core/cross-spawn-spawner"
import { FSUtil } from "@opencode-ai/core/fs-util"
import { Global } from "@opencode-ai/core/global"
import { Truncate } from "@/tool/truncate"
import { Agent } from "../../src/agent/agent"
import { testEffect } from "../lib/effect"
import { Git } from "@/git"
import type * as Tool from "../../src/tool/tool"
import { AppNodeBuilder } from "@opencode-ai/core/effect/app-node-builder"

const tmp = mkdtempSync(path.join(os.tmpdir(), "bridle-memory-test-"))

const toolLayer = AppNodeBuilder.build(
  LayerNode.group([CrossSpawnSpawner.node, FSUtil.node, Truncate.node, Agent.node, Git.node, Global.node]),
  [[Global.node, Global.layerWith({ data: tmp })]],
)

const it = testEffect(toolLayer)

const ctx = {
  sessionID: SessionID.make("ses_test"),
  messageID: MessageID.make("msg_test"),
  callID: "",
  agent: "build",
  abort: AbortSignal.any([]),
  messages: [],
  metadata: () => Effect.void,
  ask: () => Effect.void,
} as unknown as Tool.Context

const run = (params: {
  action: "add" | "replace" | "remove"
  file: "core" | "user"
  text?: string
  target?: string
}) =>
  Effect.gen(function* () {
    const tool = yield* MemoryTool
    const resolved = yield* tool.init()
    return yield* resolved.execute(params, ctx)
  })

describe("MemoryTool", () => {
  it.instance("add writes and reports size", () =>
    Effect.gen(function* () {
      const result = yield* run({ action: "add", file: "core", text: "project uses bun" })
      expect(result.output).toContain("ok")
      expect(readFileSync(memoryPath(tmp, "core"), "utf8")).toContain("project uses bun")
    }),
  )

  it.instance("replace swaps an existing entry", () =>
    Effect.gen(function* () {
      yield* run({ action: "add", file: "core", text: "typecheck with tsc" })
      yield* run({ action: "replace", file: "core", target: "typecheck with tsc", text: "typecheck with tsgo" })
      const content = readFileSync(memoryPath(tmp, "core"), "utf8")
      expect(content).toContain("typecheck with tsgo")
      expect(content).not.toContain("typecheck with tsc\n")
    }),
  )

  it.instance("remove deletes an existing entry", () =>
    Effect.gen(function* () {
      yield* run({ action: "add", file: "user", text: "prefers dark mode" })
      yield* run({ action: "remove", file: "user", target: "prefers dark mode" })
      expect(readFileSync(memoryPath(tmp, "user"), "utf8")).not.toContain("prefers dark mode")
    }),
  )

  it.instance("rejects writes that would exceed the cap instead of truncating", () =>
    Effect.gen(function* () {
      const before = readFileSync(memoryPath(tmp, "user"), "utf8")
      const huge = "x".repeat(CAPS.user + 1)
      const exit = yield* run({ action: "add", file: "user", text: huge }).pipe(Effect.exit)
      expect(Exit.isFailure(exit)).toBe(true)
      expect(String(exit)).toContain("REJECTED")
      // file untouched — rejected, not truncated
      expect(readFileSync(memoryPath(tmp, "user"), "utf8")).toBe(before)
    }),
  )

  it.instance("replace on a missing target fails with a clear error", () =>
    Effect.gen(function* () {
      const exit = yield* run({ action: "replace", file: "core", target: "never existed", text: "x" }).pipe(Effect.exit)
      expect(Exit.isFailure(exit)).toBe(true)
      expect(String(exit)).toContain("target not found")
    }),
  )
})
