import type {
  CodexMcpServer,
  ClaudeMcpServer,
  ClaudeHttpMcpServer,
  ClaudeStdioMcpServer,
} from "./types.js";

/**
 * Convert a Codex MCP server config to Claude Code format.
 *
 * Conversion rules:
 * 1. url present → HTTP server; bearer_token_env_var → Authorization header
 * 2. command present → stdio server; args and env copied as-is
 * 3. Both url and command → prefer url (HTTP), log warning
 */
export function convertServer(
  server: CodexMcpServer,
  options: { resolveEnvVars: boolean }
): ClaudeMcpServer {
  if (server.url) {
    const result: ClaudeHttpMcpServer = {
      type: "http",
      url: server.url,
    };

    if (server.bearer_token_env_var) {
      const envValue = options.resolveEnvVars
        ? process.env[server.bearer_token_env_var]
        : undefined;

      const token = envValue || `\${${server.bearer_token_env_var}}`;
      result.headers = {
        Authorization: `Bearer ${token}`,
      };
    }

    return result;
  }

  if (server.command) {
    const result: ClaudeStdioMcpServer = {
      command: server.command,
    };

    if (server.args && server.args.length > 0) {
      result.args = server.args;
    }

    if (server.env && Object.keys(server.env).length > 0) {
      result.env = { ...server.env };
    }

    return result;
  }

  throw new Error(
    `Server "${server.name}" has neither url nor command defined`
  );
}
