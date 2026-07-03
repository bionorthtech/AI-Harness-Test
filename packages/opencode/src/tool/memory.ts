import { Effect, Schema } from "effect"
import path from "path"
import { mkdirSync, readFileSync, writeFileSync } from "fs"
import * as Tool from "./tool"
import DESCRIPTION from "./memory.txt"
import { Global } from "@opencode-ai/core/global"

// Hard caps (characters). Writes that would exceed a cap are rejected —
// never truncated — forcing the agent to consolidate before adding more.
export const CAPS = { core: 4096, user: 2048 } as const

const FILES = { core: "CORE.md", user: "USER.md" } as const

export function memoryPath(dataDir: string, file: keyof typeof FILES) {
  return path.join(dataDir, "memory", FILES[file])
}

export function readMemory(dataDir: string, file: keyof typeof FILES): string {
  try {
    return readFileSync(memoryPath(dataDir, file), "utf8")
  } catch {
    return ""
  }
}

function writeMemory(dataDir: string, file: keyof typeof FILES, content: string) {
  const target = memoryPath(dataDir, file)
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, content)
}

export const Parameters = Schema.Struct({
  action: Schema.Literals(["add", "replace", "remove"]).annotate({
    description: "add appends text; replace swaps target for text; remove deletes target",
  }),
  file: Schema.Literals(["core", "user"]).annotate({
    description: "core = project/work memory (4096 chars); user = facts about the user (2048 chars)",
  }),
  text: Schema.optional(Schema.String).annotate({
    description: "text to add, or the replacement text for replace",
  }),
  target: Schema.optional(Schema.String).annotate({
    description: "exact existing substring to replace or remove",
  }),
})

type Metadata = {
  file: string
  size: number
  cap: number
}

export const MemoryTool = Tool.define<typeof Parameters, Metadata, Global.Service>(
  "memory",
  Effect.gen(function* () {
    const global = yield* Global.Service
    return {
      description: DESCRIPTION,
      parameters: Parameters,
      execute: (params: Schema.Schema.Type<typeof Parameters>, ctx: Tool.Context<Metadata>) =>
        Effect.gen(function* () {
          yield* ctx.ask({
            permission: "memory",
            patterns: [params.file],
            always: [params.file],
            metadata: { action: params.action },
          })

          const cap = CAPS[params.file]
          const current = readMemory(global.data, params.file)

          const next = (() => {
            switch (params.action) {
              case "add": {
                if (!params.text) throw new Error("memory add requires `text`")
                return current ? `${current.replace(/\n+$/, "")}\n${params.text}\n` : `${params.text}\n`
              }
              case "replace": {
                if (!params.target) throw new Error("memory replace requires `target`")
                if (!params.text) throw new Error("memory replace requires `text`")
                if (!current.includes(params.target))
                  throw new Error(`target not found in ${params.file} memory: ${JSON.stringify(params.target)}`)
                return current.replace(params.target, params.text)
              }
              case "remove": {
                if (!params.target) throw new Error("memory remove requires `target`")
                if (!current.includes(params.target))
                  throw new Error(`target not found in ${params.file} memory: ${JSON.stringify(params.target)}`)
                return current.replace(params.target, "")
              }
            }
          })()

          if (next.length > cap) {
            throw new Error(
              `${params.file} memory is capped at ${cap} chars and this write would make it ${next.length}. ` +
                `The write was REJECTED (memory is never truncated). Consolidate first: remove or rewrite stale ` +
                `entries with the remove/replace actions, then retry.`,
            )
          }

          writeMemory(global.data, params.file, next)

          return {
            title: `${params.file} memory ${params.action} (${next.length}/${cap} chars)`,
            output: `ok — ${params.file} memory is now ${next.length}/${cap} chars`,
            metadata: { file: params.file, size: next.length, cap },
          }
        }),
    } satisfies Tool.DefWithoutID<typeof Parameters, Metadata>
  }),
)
