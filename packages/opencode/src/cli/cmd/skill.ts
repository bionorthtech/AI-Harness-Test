import { Effect } from "effect"
import { readFileSync, statSync, readdirSync } from "fs"
import path from "path"
import { cmd } from "./cmd"
import { effectCmd } from "../effect-cmd"
import { SkillScan } from "../../skill/scan"
import { UI } from "../ui"

function collectSkillFiles(target: string): string[] {
  const stat = statSync(target)
  if (stat.isFile()) return [target]
  const found: string[] = []
  const walk = (dir: string, depth: number) => {
    if (depth > 6) return
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full, depth + 1)
      else if (entry.name === "SKILL.md") found.push(full)
    }
  }
  walk(target, 0)
  return found
}

const riskStyle = {
  clean: UI.Style.TEXT_SUCCESS,
  suspicious: UI.Style.TEXT_WARNING,
  dangerous: UI.Style.TEXT_DANGER,
} as const

const ScanCommand = effectCmd({
  command: "scan <target>",
  describe: "static safety scan of a skill file or directory (injection/exfiltration/destructive patterns)",
  builder: (yargs) =>
    yargs.positional("target", {
      type: "string",
      description: "path to a SKILL.md file or a directory of skills",
      demandOption: true,
    }),
  handler: Effect.fn("Cli.skill.scan")(function* (args) {
    const files = yield* Effect.sync(() => collectSkillFiles(args.target))
    if (files.length === 0) {
      UI.println(UI.Style.TEXT_DIM + "no SKILL.md files found under " + args.target)
      return
    }
    let dangerous = 0
    let suspicious = 0
    for (const file of files) {
      const content = yield* Effect.sync(() => readFileSync(file, "utf8"))
      const report = SkillScan.scan(content)
      if (report.risk === "dangerous") dangerous++
      if (report.risk === "suspicious") suspicious++
      const badge = `${riskStyle[report.risk]}${report.risk.toUpperCase()}${UI.Style.TEXT_NORMAL}`
      UI.println(`${badge}  ${UI.Style.TEXT_DIM}${file}${UI.Style.TEXT_NORMAL}`)
      for (const finding of report.findings) {
        const mark = finding.severity === "critical" ? UI.Style.TEXT_DANGER + "✕" : UI.Style.TEXT_WARNING + "!"
        UI.println(
          `  ${mark}${UI.Style.TEXT_NORMAL} ${finding.category}: ${finding.message}\n    ${UI.Style.TEXT_DIM}${finding.evidence}${UI.Style.TEXT_NORMAL}`,
        )
      }
    }
    UI.println("")
    UI.println(
      `${files.length} scanned · ${riskStyle.dangerous}${dangerous} dangerous${UI.Style.TEXT_NORMAL} · ${riskStyle.suspicious}${suspicious} suspicious${UI.Style.TEXT_NORMAL}`,
    )
    if (dangerous > 0) process.exitCode = 1
  }),
})

export const SkillCommand = cmd({
  command: "skill",
  describe: "manage and vet skills",
  builder: (yargs) => yargs.command(ScanCommand).demandCommand(),
  async handler() {},
})
