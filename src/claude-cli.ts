import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ClaudeMcpServer } from "./types.js";

const execFileAsync = promisify(execFile);

export async function claudeMcpExists(name: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync("claude", ["mcp", "get", name], {
      timeout: 10000,
    });
    return !stdout.includes("No MCP server found");
  } catch {
    return false;
  }
}

export async function claudeMcpAddJson(
  name: string,
  config: ClaudeMcpServer,
  scope: "user" | "local"
): Promise<{ success: boolean; output: string }> {
  try {
    const jsonStr = JSON.stringify(config);
    const { stdout, stderr } = await execFileAsync(
      "claude",
      ["mcp", "add-json", "-s", scope, name, jsonStr],
      { timeout: 15000 }
    );
    return { success: true, output: stdout || stderr };
  } catch (error: any) {
    return {
      success: false,
      output: error.stderr || error.message,
    };
  }
}

export async function claudeMcpRemove(
  name: string,
  scope: "user" | "local"
): Promise<{ success: boolean; output: string }> {
  try {
    const { stdout, stderr } = await execFileAsync(
      "claude",
      ["mcp", "remove", "-s", scope, name],
      { timeout: 10000 }
    );
    return { success: true, output: stdout || stderr };
  } catch (error: any) {
    return {
      success: false,
      output: error.stderr || error.message,
    };
  }
}

export async function checkClaudeCli(): Promise<boolean> {
  try {
    await execFileAsync("claude", ["--version"], { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}
