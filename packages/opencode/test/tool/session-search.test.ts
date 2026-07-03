import { describe, expect } from "bun:test"
import { LayerNode } from "@opencode-ai/core/effect/layer-node"
import { Effect } from "effect"
import { SessionSearchTool } from "../../src/tool/session-search"
import { Session } from "@/session/session"
import { SessionID, MessageID, PartID } from "../../src/session/schema"
import { CrossSpawnSpawner } from "@opencode-ai/core/cross-spawn-spawner"
import { FSUtil } from "@opencode-ai/core/fs-util"
import { Truncate } from "@/tool/truncate"
import { Agent } from "../../src/agent/agent"
import { Database } from "@opencode-ai/core/database/database"
import { SessionProjector } from "@opencode-ai/core/session/projector"
import { testEffect } from "../lib/effect"
import { ProviderV2 } from "@opencode-ai/core/provider"
import { ModelV2 } from "@opencode-ai/core/model"
import type * as Tool from "../../src/tool/tool"

const it = testEffect(
  LayerNode.compile(
    LayerNode.group([CrossSpawnSpawner.node, FSUtil.node, Truncate.node, Agent.node, Session.node, Database.node, SessionProjector.node]),
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

const seedSession = (text: string) =>
  Effect.gen(function* () {
    const session = yield* Session.Service
    const info = yield* session.create({})
    const message = yield* session.updateMessage({
      id: MessageID.ascending(),
      role: "user",
      sessionID: info.id,
      agent: "build",
      model: { providerID: ProviderV2.ID.make("test"), modelID: ModelV2.ID.make("test") },
      time: { created: Date.now() },
    })
    yield* session.updatePart({
      id: PartID.ascending(),
      sessionID: info.id,
      messageID: message.id,
      type: "text",
      text,
    })
    return info.id
  })

const search = (query: string, fromSession: string) =>
  Effect.gen(function* () {
    const tool = yield* SessionSearchTool
    const resolved = yield* tool.init()
    return yield* resolved.execute({ query, limit: undefined }, makeCtx(fromSession))
  })

describe("SessionSearchTool", () => {
  it.instance("finds text from past sessions", () =>
    Effect.gen(function* () {
      yield* seedSession("we decided the giraffe deployment strategy is canary-first")
      const result = yield* search("giraffe deployment", "ses_other")
      expect(result.metadata.matches).toBeGreaterThan(0)
      expect(result.output).toContain("giraffe deployment")
    }),
  )

  it.instance("excludes the current session from results", () =>
    Effect.gen(function* () {
      const id = yield* seedSession("the pangolin migration only exists here")
      const excluded = yield* search("pangolin migration", id)
      expect(excluded.metadata.matches).toBe(0)
      const included = yield* search("pangolin migration", "ses_other")
      expect(included.metadata.matches).toBeGreaterThan(0)
    }),
  )

  it.instance("returns a clear empty result for no matches", () =>
    Effect.gen(function* () {
      const result = yield* search("xylophone-quasar-nonsense", "ses_other")
      expect(result.metadata.matches).toBe(0)
      expect(result.output).toContain("No past-session messages matched")
    }),
  )
})
