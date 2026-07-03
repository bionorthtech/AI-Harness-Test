// Secret scrubbing for subprocess environments — an always-on Bridle rail.
// Variables whose names look credential-like are stripped from spawned shells
// unless explicitly passed through, so a prompt-injected `env | curl` can't
// exfiltrate what the harness process happens to hold.

const SECRET_NAME = /(KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|AUTH)/i

// Infrastructure variables that match the pattern but are not secrets and
// break everyday workflows when removed (ssh-agent, kerberos config).
const BUILTIN_PASS = new Set(["SSH_AUTH_SOCK", "KRB5CCNAME"])

export function isSecretName(name: string) {
  return SECRET_NAME.test(name) && !BUILTIN_PASS.has(name.toUpperCase())
}

export function scrubEnv(
  env: NodeJS.ProcessEnv,
  options: { enabled: boolean; pass: readonly string[] },
): { env: NodeJS.ProcessEnv; scrubbed: string[] } {
  if (!options.enabled) return { env: { ...env }, scrubbed: [] }
  const pass = new Set(options.pass.map((name) => name.toUpperCase()))
  const out: NodeJS.ProcessEnv = {}
  const scrubbed: string[] = []
  for (const [name, value] of Object.entries(env)) {
    if (isSecretName(name) && !pass.has(name.toUpperCase())) {
      scrubbed.push(name)
      continue
    }
    out[name] = value
  }
  return { env: out, scrubbed }
}
