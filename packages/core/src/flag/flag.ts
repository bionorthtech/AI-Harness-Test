import { Config } from "effect"

// Every flag is readable under two names: BRIDLE_<X> (preferred) and
// OPENCODE_<X> (compatibility fallback). Exported property names keep the
// OPENCODE_ prefix until the repo-wide identifier rename lands.
function alias(key: string) {
  return key.replace(/^OPENCODE_/, "BRIDLE_")
}

function read(key: string) {
  return process.env[alias(key)] ?? process.env[key]
}

export function truthy(key: string) {
  const value = read(key)?.toLowerCase()
  return value === "true" || value === "1"
}

function aliasedBoolean(key: string) {
  return Config.boolean(alias(key)).pipe(
    Config.orElse(() => Config.boolean(key)),
    Config.withDefault(false),
  )
}

const copy = read("OPENCODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT")
const fff = read("OPENCODE_DISABLE_FFF")

function enabledByExperimental(key: string) {
  return read(key) === undefined ? truthy("OPENCODE_EXPERIMENTAL") : truthy(key)
}

export const Flag = {
  OTEL_EXPORTER_OTLP_ENDPOINT: process.env["OTEL_EXPORTER_OTLP_ENDPOINT"],
  OTEL_EXPORTER_OTLP_HEADERS: process.env["OTEL_EXPORTER_OTLP_HEADERS"],

  OPENCODE_AUTO_HEAP_SNAPSHOT: truthy("OPENCODE_AUTO_HEAP_SNAPSHOT"),
  OPENCODE_GIT_BASH_PATH: read("OPENCODE_GIT_BASH_PATH"),
  OPENCODE_CONFIG: read("OPENCODE_CONFIG"),
  OPENCODE_CONFIG_CONTENT: read("OPENCODE_CONFIG_CONTENT"),
  OPENCODE_DISABLE_AUTOUPDATE: truthy("OPENCODE_DISABLE_AUTOUPDATE"),
  OPENCODE_ALWAYS_NOTIFY_UPDATE: truthy("OPENCODE_ALWAYS_NOTIFY_UPDATE"),
  OPENCODE_DISABLE_PRUNE: truthy("OPENCODE_DISABLE_PRUNE"),
  OPENCODE_DISABLE_TERMINAL_TITLE: truthy("OPENCODE_DISABLE_TERMINAL_TITLE"),
  OPENCODE_SHOW_TTFD: truthy("OPENCODE_SHOW_TTFD"),
  OPENCODE_DISABLE_AUTOCOMPACT: truthy("OPENCODE_DISABLE_AUTOCOMPACT"),
  OPENCODE_DISABLE_MODELS_FETCH: truthy("OPENCODE_DISABLE_MODELS_FETCH"),
  OPENCODE_DISABLE_MOUSE: truthy("OPENCODE_DISABLE_MOUSE"),
  OPENCODE_FAKE_VCS: read("OPENCODE_FAKE_VCS"),
  OPENCODE_SERVER_PASSWORD: read("OPENCODE_SERVER_PASSWORD"),
  OPENCODE_SERVER_USERNAME: read("OPENCODE_SERVER_USERNAME"),
  OPENCODE_DISABLE_FFF: fff === undefined ? process.platform === "win32" : truthy("OPENCODE_DISABLE_FFF"),

  // Experimental
  OPENCODE_EXPERIMENTAL_FILEWATCHER: aliasedBoolean("OPENCODE_EXPERIMENTAL_FILEWATCHER"),
  OPENCODE_EXPERIMENTAL_DISABLE_FILEWATCHER: aliasedBoolean("OPENCODE_EXPERIMENTAL_DISABLE_FILEWATCHER"),
  OPENCODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT:
    copy === undefined ? process.platform === "win32" : truthy("OPENCODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"),
  OPENCODE_MODELS_URL: read("OPENCODE_MODELS_URL"),
  OPENCODE_MODELS_PATH: read("OPENCODE_MODELS_PATH"),
  OPENCODE_DB: read("OPENCODE_DB"),

  OPENCODE_WORKSPACE_ID: read("OPENCODE_WORKSPACE_ID"),
  OPENCODE_EXPERIMENTAL_WORKSPACES: enabledByExperimental("OPENCODE_EXPERIMENTAL_WORKSPACES"),

  // Evaluated at access time (not module load) because tests, the CLI, and
  // external tooling set these env vars at runtime.
  get OPENCODE_DISABLE_PROJECT_CONFIG() {
    return truthy("OPENCODE_DISABLE_PROJECT_CONFIG")
  },
  get OPENCODE_EXPERIMENTAL_REFERENCES() {
    return enabledByExperimental("OPENCODE_EXPERIMENTAL_REFERENCES")
  },
  get OPENCODE_TUI_CONFIG() {
    return read("OPENCODE_TUI_CONFIG")
  },
  get OPENCODE_CONFIG_DIR() {
    return read("OPENCODE_CONFIG_DIR")
  },
  get OPENCODE_PURE() {
    return truthy("OPENCODE_PURE")
  },
  get OPENCODE_PERMISSION() {
    return read("OPENCODE_PERMISSION")
  },
  get OPENCODE_PLUGIN_META_FILE() {
    return read("OPENCODE_PLUGIN_META_FILE")
  },
  get OPENCODE_CLIENT() {
    return read("OPENCODE_CLIENT") ?? "cli"
  },
}
