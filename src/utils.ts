import { copyFile, access } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import chalk from "chalk";
import type { MigrationPlan } from "./types.js";

export function getDefaultCodexConfigPath(): string {
  return join(homedir(), ".codex", "config.toml");
}

export async function backupClaudeConfig(): Promise<string> {
  const claudeJsonPath = join(homedir(), ".claude.json");
  const backupPath = `${claudeJsonPath}.backup.${Date.now()}`;

  try {
    await access(claudeJsonPath);
    await copyFile(claudeJsonPath, backupPath);
    console.log(chalk.gray(`  Backup created: ${backupPath}`));
    return backupPath;
  } catch {
    return "";
  }
}

export async function confirm(message: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} [y/N] `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

export function formatMigrationTable(plan: MigrationPlan): string {
  const lines: string[] = [];

  lines.push("");
  lines.push(chalk.bold(`Migration Plan (from ${plan.codexConfigPath})`));
  lines.push(chalk.gray("\u2500".repeat(60)));

  for (const entry of plan.entries) {
    const icon =
      entry.action === "add"
        ? chalk.green("+")
        : entry.action === "overwrite"
          ? chalk.yellow("~")
          : chalk.gray("-");

    const actionLabel =
      entry.action === "add"
        ? chalk.green("ADD")
        : entry.action === "overwrite"
          ? chalk.yellow("OVERWRITE")
          : chalk.gray("SKIP");

    const serverType = entry.source.url ? "HTTP" : "stdio";

    lines.push(
      ` ${icon} ${chalk.bold(entry.name)} [${serverType}] ${actionLabel}`
    );

    const jsonPreview = JSON.stringify(entry.target, null, 2)
      .split("\n")
      .map((l) => `     ${chalk.dim(l)}`)
      .join("\n");
    lines.push(jsonPreview);

    if (entry.reason) {
      lines.push(`     ${chalk.gray(entry.reason)}`);
    }
  }

  lines.push(chalk.gray("\u2500".repeat(60)));

  const addCount = plan.entries.filter((e) => e.action === "add").length;
  const overwriteCount = plan.entries.filter(
    (e) => e.action === "overwrite"
  ).length;
  const skipCount = plan.entries.filter(
    (e) => e.action === "skip_existing"
  ).length;

  lines.push(
    ` ${chalk.green(`${addCount} to add`)}, ` +
      `${chalk.yellow(`${overwriteCount} to overwrite`)}, ` +
      `${chalk.gray(`${skipCount} to skip`)}`
  );

  return lines.join("\n");
}
