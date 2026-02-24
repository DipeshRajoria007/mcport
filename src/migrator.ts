import type {
  MigrationEntry,
  MigrationPlan,
  MigrationOptions,
} from "./types.js";
import { parseCodexConfig } from "./parser.js";
import { convertServer } from "./converter.js";
import {
  claudeMcpExists,
  claudeMcpAddJson,
  claudeMcpRemove,
} from "./claude-cli.js";
import { backupClaudeConfig, formatMigrationTable, confirm } from "./utils.js";
import chalk from "chalk";

export async function buildMigrationPlan(
  options: MigrationOptions
): Promise<MigrationPlan> {
  const codexServers = await parseCodexConfig(options.codexConfigPath);

  if (codexServers.length === 0) {
    return { entries: [], codexConfigPath: options.codexConfigPath };
  }

  const entries: MigrationEntry[] = [];

  for (const codexServer of codexServers) {
    let target;
    try {
      target = convertServer(codexServer, {
        resolveEnvVars: options.resolveEnvVars,
      });
    } catch (err: any) {
      console.log(
        chalk.yellow(`  Warning: Skipping "${codexServer.name}" - ${err.message}`)
      );
      continue;
    }

    const exists = await claudeMcpExists(codexServer.name);

    let action: MigrationEntry["action"];
    let reason: string | undefined;

    if (exists && options.overwrite) {
      action = "overwrite";
      reason = "Server exists in Claude Code; will be overwritten (--overwrite)";
    } else if (exists) {
      action = "skip_existing";
      reason =
        "Server already exists in Claude Code; use --overwrite to replace";
    } else {
      action = "add";
    }

    entries.push({
      name: codexServer.name,
      source: codexServer,
      target,
      action,
      reason,
    });
  }

  return { entries, codexConfigPath: options.codexConfigPath };
}

export async function executeMigrationPlan(
  plan: MigrationPlan,
  options: MigrationOptions
): Promise<void> {
  const toApply = plan.entries.filter(
    (e) => e.action === "add" || e.action === "overwrite"
  );

  // Show preview
  console.log(formatMigrationTable(plan));

  if (toApply.length === 0) {
    console.log(chalk.yellow("\nNo servers to migrate."));
    return;
  }

  if (options.dryRun) {
    console.log(chalk.cyan("\n[Dry run] No changes were made."));
    return;
  }

  const proceed = await confirm(
    `\nMigrate ${toApply.length} server(s) to Claude Code?`
  );
  if (!proceed) {
    console.log(chalk.yellow("Migration cancelled."));
    return;
  }

  await backupClaudeConfig();

  let successCount = 0;
  let failCount = 0;

  for (const entry of toApply) {
    process.stdout.write(`  Migrating ${chalk.bold(entry.name)}... `);

    if (entry.action === "overwrite") {
      await claudeMcpRemove(entry.name, options.scope);
    }

    const result = await claudeMcpAddJson(
      entry.name,
      entry.target,
      options.scope
    );

    if (result.success) {
      console.log(chalk.green("done"));
      successCount++;
    } else {
      console.log(chalk.red("failed"));
      console.log(chalk.red(`    ${result.output}`));
      failCount++;
    }
  }

  const skipCount = plan.entries.length - toApply.length;
  console.log(
    `\n${chalk.green(`${successCount} migrated`)}, ` +
      `${chalk.red(`${failCount} failed`)}, ` +
      `${chalk.gray(`${skipCount} skipped`)}`
  );
}
