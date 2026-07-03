import { describe, expect, test } from "bun:test"
import { scrubEnv, isSecretName } from "../../src/tool/shell/scrub"

describe("scrubEnv", () => {
  const env = {
    PATH: "/usr/bin",
    HOME: "/home/u",
    GITHUB_TOKEN: "ghp_x",
    AWS_SECRET_ACCESS_KEY: "aws_x",
    DB_PASSWORD: "hunter2",
    MY_CREDENTIALS: "x",
    AUTH_HEADER: "Bearer x",
    OPENAI_API_KEY: "sk-x",
    SSH_AUTH_SOCK: "/tmp/agent.sock",
    NODE_ENV: "test",
  }

  test("strips credential-like names, keeps the rest", () => {
    const { env: out, scrubbed } = scrubEnv(env, { enabled: true, pass: [] })
    expect(out.PATH).toBe("/usr/bin")
    expect(out.NODE_ENV).toBe("test")
    expect(out.GITHUB_TOKEN).toBeUndefined()
    expect(out.AWS_SECRET_ACCESS_KEY).toBeUndefined()
    expect(out.DB_PASSWORD).toBeUndefined()
    expect(out.MY_CREDENTIALS).toBeUndefined()
    expect(out.AUTH_HEADER).toBeUndefined()
    expect(out.OPENAI_API_KEY).toBeUndefined()
    expect(scrubbed.sort()).toEqual(
      ["AUTH_HEADER", "AWS_SECRET_ACCESS_KEY", "DB_PASSWORD", "GITHUB_TOKEN", "MY_CREDENTIALS", "OPENAI_API_KEY"].sort(),
    )
  })

  test("infrastructure pseudo-secrets survive (ssh-agent keeps working)", () => {
    const { env: out } = scrubEnv(env, { enabled: true, pass: [] })
    expect(out.SSH_AUTH_SOCK).toBe("/tmp/agent.sock")
  })

  test("pass_env allowlists specific vars case-insensitively", () => {
    const { env: out, scrubbed } = scrubEnv(env, { enabled: true, pass: ["github_token"] })
    expect(out.GITHUB_TOKEN).toBe("ghp_x")
    expect(scrubbed).not.toContain("GITHUB_TOKEN")
    expect(out.DB_PASSWORD).toBeUndefined()
  })

  test("disabled passes everything through untouched", () => {
    const { env: out, scrubbed } = scrubEnv(env, { enabled: false, pass: [] })
    expect(out).toEqual({ ...env })
    expect(scrubbed).toEqual([])
  })

  test("isSecretName matches the documented pattern", () => {
    expect(isSecretName("STRIPE_API_KEY")).toBe(true)
    expect(isSecretName("MY_AUTH")).toBe(true)
    expect(isSecretName("PATH")).toBe(false)
    expect(isSecretName("SSH_AUTH_SOCK")).toBe(false)
  })
})
