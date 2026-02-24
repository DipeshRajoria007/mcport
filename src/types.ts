// === Codex CLI types (source) ===

export interface CodexMcpServer {
  name: string;
  url?: string;
  bearer_token_env_var?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
}

// === Claude Code types (target) ===

export interface ClaudeHttpMcpServer {
  type: "http";
  url: string;
  headers?: Record<string, string>;
}

export interface ClaudeStdioMcpServer {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export type ClaudeMcpServer = ClaudeHttpMcpServer | ClaudeStdioMcpServer;

// === Migration types ===

export type MigrationAction = "add" | "skip_existing" | "overwrite";

export interface MigrationEntry {
  name: string;
  source: CodexMcpServer;
  target: ClaudeMcpServer;
  action: MigrationAction;
  reason?: string;
}

export interface MigrationPlan {
  entries: MigrationEntry[];
  codexConfigPath: string;
}

export interface MigrationOptions {
  codexConfigPath: string;
  dryRun: boolean;
  overwrite: boolean;
  scope: "user" | "local";
  resolveEnvVars: boolean;
}
