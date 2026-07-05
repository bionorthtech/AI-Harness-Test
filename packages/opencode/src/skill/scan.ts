export * as SkillScan from "./scan"

// Static safety scan for skill/plugin content — the first line of Bridle's
// supply-chain defense (see docs/architecture.md §9, and the OpenClaw
// "ClawHavoc" incident in docs/harness-research.md §7 that motivates it).
//
// This is a heuristic pre-filter, not a sandbox: it flags the patterns that
// showed up in real malicious skills so the harness can warn/quarantine
// before content ever runs. Execution isolation (runtimes, §10) is the
// actual containment; this keeps obvious hostile content from getting that far.

export type Severity = "critical" | "warning"

export interface Finding {
  readonly severity: Severity
  readonly category: string
  readonly message: string
  readonly evidence: string
}

export interface Report {
  readonly findings: Finding[]
  readonly risk: "clean" | "suspicious" | "dangerous"
}

interface Rule {
  readonly category: string
  readonly severity: Severity
  readonly message: string
  readonly pattern: RegExp
}

const RULES: Rule[] = [
  // --- prompt injection: content trying to steer the agent ---
  {
    category: "prompt-injection",
    severity: "critical",
    message: "attempts to override prior instructions",
    pattern: /\b(ignore|disregard|forget)\b[^.\n]{0,40}\b(previous|prior|above|earlier|all)\b[^.\n]{0,20}\b(instruction|prompt|rule|direction)/i,
  },
  {
    category: "prompt-injection",
    severity: "warning",
    message: "references the system prompt or developer instructions",
    pattern: /\b(system prompt|developer message|your instructions|reveal your|print your (system|initial))\b/i,
  },
  // --- exfiltration: reading secrets and sending them out ---
  {
    category: "exfiltration",
    severity: "critical",
    message: "pipes environment/secrets to a network destination",
    pattern: /\b(env|printenv|cat\s+[^\n|]*\.(env|pem|key)|~\/\.(aws|ssh|config))\b[^\n]{0,80}\|[^\n]{0,40}\b(curl|wget|nc|ncat|http)/i,
  },
  {
    category: "exfiltration",
    severity: "critical",
    message: "posts local data to a remote URL",
    pattern: /\b(curl|wget|fetch|Invoke-WebRequest|iwr)\b[^\n]{0,120}(--data|--data-binary|-d\s|-F\s|-T\s|--upload-file|-InFile|-Body)\b/i,
  },
  {
    category: "exfiltration",
    severity: "warning",
    message: "reads well-known credential locations",
    pattern: /(~\/\.aws\/credentials|~\/\.ssh\/id_|\.npmrc|\.netrc|id_rsa\b|GITHUB_TOKEN|AWS_SECRET|OPENAI_API_KEY|ANTHROPIC_API_KEY)/i,
  },
  // --- destructive / privilege actions ---
  {
    category: "destructive",
    severity: "critical",
    message: "recursive force-delete of a broad path",
    pattern: /\brm\s+-[a-z]*r[a-z]*f[a-z]*\s+(\/|~|\$HOME|\*|\.)\S*/i,
  },
  {
    category: "destructive",
    severity: "critical",
    message: "pipes a remote script straight into a shell",
    pattern: /\b(curl|wget|iwr|Invoke-WebRequest)\b[^\n|]{0,160}\|\s*(sudo\s+)?(ba|z|)sh\b/i,
  },
  {
    category: "destructive",
    severity: "warning",
    message: "disk-level overwrite or filesystem format",
    pattern: /\b(dd\s+if=|mkfs|:\(\)\s*\{|>\s*\/dev\/sd)/i,
  },
  {
    category: "obfuscation",
    severity: "warning",
    message: "decodes and executes obfuscated payload",
    pattern: /\b(base64\s+-d|atob|eval)\b[^\n]{0,60}\|\s*(ba|z|)sh\b|\beval\s*\(\s*(atob|Buffer\.from)/i,
  },
]

function evidence(text: string, match: RegExpMatchArray): string {
  const idx = match.index ?? 0
  const raw = text.slice(Math.max(0, idx - 12), idx + match[0].length + 12).replace(/\s+/g, " ").trim()
  return raw.length > 160 ? raw.slice(0, 157) + "…" : raw
}

export function scan(content: string): Report {
  const findings: Finding[] = []
  for (const rule of RULES) {
    const match = content.match(rule.pattern)
    if (!match) continue
    findings.push({
      severity: rule.severity,
      category: rule.category,
      message: rule.message,
      evidence: evidence(content, match),
    })
  }
  const risk = findings.some((f) => f.severity === "critical")
    ? "dangerous"
    : findings.length > 0
      ? "suspicious"
      : "clean"
  return { findings, risk }
}
