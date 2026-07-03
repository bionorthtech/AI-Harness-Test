import { Effect, Schema } from "effect"
import { sql } from "drizzle-orm"
import * as Tool from "./tool"
import DESCRIPTION from "./session-search.txt"
import { Database } from "@opencode-ai/core/database/database"

export const Parameters = Schema.Struct({
  query: Schema.String.annotate({
    description: "distinctive word or short phrase to find in past conversation text",
  }),
  limit: Schema.optional(Schema.Finite).annotate({
    description: "max matching snippets to return (default 10, max 25)",
  }),
})

type Row = {
  session_id: string
  title: string
  time_created: number
  snippet: string
}

type Metadata = {
  matches: number
}

const SNIPPET_CHARS = 240

export const SessionSearchTool = Tool.define<typeof Parameters, Metadata, Database.Service>(
  "session_search",
  Effect.gen(function* () {
    const database = yield* Database.Service

    return {
      description: DESCRIPTION,
      parameters: Parameters,
      execute: (params: Schema.Schema.Type<typeof Parameters>, ctx: Tool.Context<Metadata>) =>
        Effect.gen(function* () {
          yield* ctx.ask({
            permission: "session_search",
            patterns: ["*"],
            always: ["*"],
            metadata: {},
          })

          const limit = Math.min(Math.max(1, Math.floor(params.limit ?? 10)), 25)
          const needle = params.query.trim()
          if (!needle) throw new Error("session_search requires a non-empty query")

          // LIKE over text parts, escaping LIKE wildcards in the user query.
          const escaped = needle.replace(/([\\%_])/g, "\\$1")
          const rows = (yield* Effect.orDie(database.db.all(sql`
              SELECT
                part.session_id AS session_id,
                session.title AS title,
                part.time_created AS time_created,
                substr(
                  json_extract(part.data, '$.text'),
                  max(1, instr(lower(json_extract(part.data, '$.text')), lower(${needle})) - 80),
                  ${SNIPPET_CHARS}
                ) AS snippet
              FROM part
              JOIN session ON session.id = part.session_id
              WHERE part.session_id != ${ctx.sessionID}
                AND json_extract(part.data, '$.type') = 'text'
                AND lower(json_extract(part.data, '$.text')) LIKE ${"%" + escaped.toLowerCase() + "%"} ESCAPE '\\'
              ORDER BY part.time_created DESC
              LIMIT ${limit}
            `))) as Row[]

          if (rows.length === 0) {
            return {
              title: `no matches for "${needle}"`,
              output: `No past-session messages matched "${needle}". Try a more distinctive term.`,
              metadata: { matches: 0 },
            }
          }

          const bySession = new Map<string, { title: string; when: number; snippets: string[] }>()
          for (const row of rows) {
            const entry = bySession.get(row.session_id) ?? { title: row.title, when: row.time_created, snippets: [] }
            entry.snippets.push(row.snippet.replace(/\s+/g, " ").trim())
            bySession.set(row.session_id, entry)
          }

          const output = [...bySession.entries()]
            .map(([id, entry]) => {
              const when = new Date(entry.when).toISOString().slice(0, 10)
              const snippets = entry.snippets.map((snippet) => `  …${snippet}…`).join("\n")
              return `${entry.title} (${when}, session ${id})\n${snippets}`
            })
            .join("\n\n")

          return {
            title: `${rows.length} match${rows.length === 1 ? "" : "es"} for "${needle}"`,
            output,
            metadata: { matches: rows.length },
          }
        }),
    } satisfies Tool.DefWithoutID<typeof Parameters, Metadata>
  }),
)
