# mcport

Your MCPs deserve a better home. Migrate MCP server configurations from [OpenAI Codex CLI](https://github.com/openai/codex) to [Claude Code](https://docs.anthropic.com/en/docs/claude-code) in one command.

## Why?

Switching from Codex CLI to Claude Code? You probably have a bunch of MCP servers configured in `~/.codex/config.toml` — Slack, GitHub, Atlassian, Figma, Postman, and more. Re-adding them one by one is painful. **mcport** reads your Codex config, converts each MCP server to Claude Code's format, and adds them automatically.

## How it works

```
~/.codex/config.toml (TOML)          ~/.claude.json (JSON)
┌─────────────────────────┐          ┌──────────────────────────┐
│ [mcp_servers.slack]     │          │ "slack": {               │
│ command = "npx"         │  ──────> │   "command": "npx",      │
│ args = ["-y", "..."]   │  mcport  │   "args": ["-y", "..."], │
│ [mcp_servers.slack.env] │          │   "env": { ... }         │
│ SLACK_BOT_TOKEN = "..." │          │ }                        │
└─────────────────────────┘          └──────────────────────────┘
```

### Conversion mapping

| Codex (TOML) | Claude Code (JSON) |
|---|---|
| `url = "..."` | `{ "type": "http", "url": "..." }` |
| `url` + `bearer_token_env_var = "VAR"` | `{ "type": "http", "url": "...", "headers": { "Authorization": "Bearer ..." } }` |
| `command = "..."` + `args = [...]` | `{ "command": "...", "args": [...] }` |
| `[mcp_servers.<name>.env]` | `{ ..., "env": { "KEY": "value" } }` |

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and available as `claude` in your PATH
- An existing Codex CLI config at `~/.codex/config.toml`

## Installation

```bash
# Run directly with npx (no install needed)
npx mcport

# Or install globally
npm install -g mcport
```

## Usage

### Preview what will be migrated (recommended first step)

```bash
npx mcport --dry-run
```

Output:

```
mcport — Codex CLI -> Claude Code MCP migration

Migration Plan (from /Users/you/.codex/config.toml)
────────────────────────────────────────────────────────────
 + figma [HTTP] ADD
     { "type": "http", "url": "http://127.0.0.1:3845/mcp" }
 - github [HTTP] SKIP
     Server already exists in Claude Code; use --overwrite to replace
 + atlassian [stdio] ADD
     { "command": "...", "args": [...], "env": { ... } }
 + postman [HTTP] ADD
     { "type": "http", "url": "https://mcp.postman.com/minimal" }
 + slack [stdio] ADD
     { "command": "npx", "args": [...], "env": { ... } }
────────────────────────────────────────────────────────────
 4 to add, 0 to overwrite, 1 to skip

[Dry run] No changes were made.
```

### Run the migration

```bash
npx mcport
```

You'll see the same preview, then a confirmation prompt before any changes are made. A backup of `~/.claude.json` is created automatically.

### Overwrite existing servers

If a server with the same name already exists in Claude Code, mcport skips it by default. Use `--overwrite` to replace:

```bash
npx mcport --overwrite
```

### Resolve bearer tokens from environment

By default, bearer token env vars (like `GITHUB_PAT_TOKEN`) are kept as `${VAR_NAME}` placeholders. To resolve them from your current shell:

```bash
npx mcport --resolve-env
```

### Use a custom Codex config path

```bash
npx mcport -c /path/to/your/config.toml
```

### Migrate to current project only

By default, servers are added at the `user` scope (available in all projects). To add them only to the current project:

```bash
npx mcport --scope local
```

## All options

```
Usage: mcport [options]

Options:
  -V, --version              output the version number
  -c, --codex-config <path>  Path to Codex config.toml (default: ~/.codex/config.toml)
  -n, --dry-run              Preview changes without applying them
  --overwrite                Overwrite existing Claude MCP servers with same names
  -s, --scope <scope>        Claude Code scope: "user" or "local" (default: "user")
  --resolve-env              Resolve bearer token env vars from current environment
  -h, --help                 display help for command
```

## Safety

- **Dry-run by default mindset** — always preview with `--dry-run` first
- **Auto-backup** — `~/.claude.json` is backed up before any changes
- **Non-destructive** — existing Claude MCP servers are never touched unless you pass `--overwrite`
- **Confirmation prompt** — asks before applying changes (skipped in dry-run)
- **Uses official CLI** — adds servers via `claude mcp add-json` instead of editing config files directly

## Project structure

```
src/
  index.ts       — CLI entry point
  types.ts       — TypeScript interfaces
  parser.ts      — Parses Codex TOML config
  converter.ts   — Converts Codex → Claude MCP format
  claude-cli.ts  — Wraps `claude mcp` commands
  migrator.ts    — Orchestrates plan → preview → execute
  utils.ts       — Backup, confirm, formatting helpers
```

## Contributing

```bash
git clone https://github.com/DipeshRajoria007/mcport.git
cd mcport
npm install
npm run dev -- --dry-run   # run from source
npm run build              # compile TypeScript
```

## License

MIT
