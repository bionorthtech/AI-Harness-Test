import { Effect } from "effect"
import { Snapshot } from "../../snapshot"
import { effectCmd } from "../effect-cmd"
import { UI } from "../ui"

function ago(timestamp: number) {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export const RewindCommand = effectCmd({
  command: "rewind [checkpoint]",
  describe: "restore the working tree to a checkpoint (shadow git — your real .git is untouched)",
  builder: (yargs) =>
    yargs
      .positional("checkpoint", {
        type: "string",
        description: "checkpoint hash to restore (omit to list recent checkpoints)",
      })
      .option("limit", {
        type: "number",
        describe: "how many checkpoints to list",
        default: 20,
      }),
  handler: Effect.fn("Cli.rewind")(function* (args) {
    if (!args.checkpoint) {
      const entries = yield* Snapshot.Service.use((svc) => svc.log(args.limit))
      if (entries.length === 0) {
        UI.println(UI.Style.TEXT_DIM + "no checkpoints yet — checkpoints are written as the agent edits files")
        return
      }
      UI.println(UI.Style.TEXT_NORMAL_BOLD + "checkpoints" + UI.Style.TEXT_NORMAL + UI.Style.TEXT_DIM + "  (newest first)")
      for (const entry of entries) {
        UI.println(
          `  ${UI.Style.TEXT_HIGHLIGHT}${entry.hash.slice(0, 12)}${UI.Style.TEXT_NORMAL}  ${UI.Style.TEXT_DIM}${ago(entry.timestamp)}${UI.Style.TEXT_NORMAL}`,
        )
      }
      UI.println("")
      UI.println(UI.Style.TEXT_DIM + "restore with: bridle rewind <checkpoint>")
      return
    }
    yield* Snapshot.Service.use((svc) => svc.restore(args.checkpoint!))
    UI.println(
      `${UI.Style.TEXT_SUCCESS}✓${UI.Style.TEXT_NORMAL} restored working tree to ${UI.Style.TEXT_HIGHLIGHT}${args.checkpoint.slice(0, 12)}${UI.Style.TEXT_NORMAL} ${UI.Style.TEXT_DIM}(shadow git — your real .git history is untouched)${UI.Style.TEXT_NORMAL}`,
    )
  }),
})
