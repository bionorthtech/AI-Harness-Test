import { describe, expect } from "bun:test"
import { LayerNode } from "@opencode-ai/core/effect/layer-node"
import { Effect, Exit } from "effect"
import { TaskTool } from "../../src/tool/task"
import { Session } from "@/session/session"
import { SessionID, MessageID } from "../../src/session/schema"
import { CrossSpawnSpawner } from "@opencode-ai/core/cross-spawn-spawner"
import { FSUtil } from "@opencode-ai/core/fs-util"
import { Truncate } from "@/tool/truncate"
import { Agent } from "../../src/agent/agent"
import { Database } from "@opencode-ai/core/database/database"
import { SessionProjector } from "@opencode-ai/core/session/projector"
import { BackgroundJob } from "@/background/job"
import { testEffect } from "../lib/effect"
import { AppNodeBuilder } from "@opencode-ai/core/effect/app-node-builder"
import { Layer } from "effect"
import { Config } from "@/config/config"
import { TestConfig } from "../fixture/config"
import { RuntimeFlags } from "@/effect/runtime-flags"
import type * as Tool from "../../src/tool/tool"

const it = testEffect(
  AppNodeBuilder.build(
    LayerNode.group([
      CrossSpawnSpawner.node,
      FSUtil.node,
      Truncate.node,
      Agent.node,
      Session.node,
      Database.node,
      SessionProjector.node,
      BackgroundJob.node,
      Config.node,
      RuntimeFlags.node,
    ]),
    [[Config.node, Layer.succeed(Config.Service, TestConfig.make())]],
  ),
)

const makeCtx = (sessionID: string) =>
  ({
    sessionID: SessionID.make(sessionID),
    messageID: MessageID.make("msg_test"),
    callID: "",
    agent: "build",
    abort: AbortSignal.any([]),
    messages: [],
    metadata: () => Effect.void,
    ask: () => Effect.void,
  }) as unknown as Tool.Context

describe("TaskTool spawn-depth cap", () => {
  it.instance("a child session cannot delegate at the default depth", () =>
    Effect.gen(function* () {
      const sessions = yield* Session.Service
      const top = yield* sessions.create({})
      const child = yield* sessions.create({ parentID: top.id })

      const tool = yield* TaskTool
      const resolved = yield* tool.init()
      const exit = yield* resolved
        .execute(
          {
            description: "delegate again",
            prompt: "do something",
            subagent_type: "explore",
            task_id: undefined,
            background: undefined,
          } as never,
          makeCtx(child.id),
        )
        .pipe(Effect.exit)

      expect(Exit.isFailure(exit)).toBe(true)
      expect(String(exit)).toContain("spawn-depth cap")
    }),
  )

  it.instance("a top-level session passes the depth guard", () =>
    Effect.gen(function* () {
      const sessions = yield* Session.Service
      const top = yield* sessions.create({})

      const tool = yield* TaskTool
      const resolved = yield* tool.init()
      const exit = yield* resolved
        .execute(
          {
            description: "first delegation",
            prompt: "do something",
            subagent_type: "explore",
            task_id: undefined,
            background: undefined,
          } as never,
          makeCtx(top.id),
        )
        .pipe(Effect.exit)

      // Spawning may fail later in this minimal test environment (no provider),
      // but it must NOT be the depth guard that rejects a top-level session.
      expect(String(exit)).not.toContain("spawn-depth cap")
    }),
  )
})
