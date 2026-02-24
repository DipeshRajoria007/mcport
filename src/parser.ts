import { parse as parseTOML } from "smol-toml";
import { readFile } from "node:fs/promises";
import type { CodexMcpServer } from "./types.js";

/**
 * Parse Codex CLI config.toml and extract MCP server definitions.
 *
 * Expected TOML structure:
 *   [mcp_servers.<name>]
 *   url = "..."
 *   bearer_token_env_var = "..."
 *   command = "..."
 *   args = [...]
 *   [mcp_servers.<name>.env]
 *   KEY = "value"
 */
export async function parseCodexConfig(
  configPath: string
): Promise<CodexMcpServer[]> {
  const content = await readFile(configPath, "utf-8");
  const parsed = parseTOML(content);

  const mcpServersSection = parsed.mcp_servers;
  if (!mcpServersSection || typeof mcpServersSection !== "object") {
    return [];
  }

  const servers: CodexMcpServer[] = [];

  for (const [name, serverConfig] of Object.entries(
    mcpServersSection as Record<string, any>
  )) {
    const server: CodexMcpServer = { name };

    if (typeof serverConfig.url === "string") {
      server.url = serverConfig.url;
    }
    if (typeof serverConfig.bearer_token_env_var === "string") {
      server.bearer_token_env_var = serverConfig.bearer_token_env_var;
    }
    if (typeof serverConfig.command === "string") {
      server.command = serverConfig.command;
    }
    if (Array.isArray(serverConfig.args)) {
      server.args = serverConfig.args.map(String);
    }
    if (
      serverConfig.env &&
      typeof serverConfig.env === "object" &&
      !Array.isArray(serverConfig.env)
    ) {
      server.env = {};
      for (const [k, v] of Object.entries(serverConfig.env)) {
        server.env[k] = String(v);
      }
    }

    servers.push(server);
  }

  return servers;
}
