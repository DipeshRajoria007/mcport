#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { access } from "node:fs/promises";
import { buildMigrationPlan, executeMigrationPlan } from "./migrator.js";
import { getDefaultCodexConfigPath } from "./utils.js";
import { checkClaudeCli } from "./claude-cli.js";
import type { MigrationOptions } from "./types.js";

const program = new Command();

program
  .name("mcport")
  .description(
    "Migrate MCP server configurations from OpenAI Codex CLI to Claude Code"
  )
  .version("1.0.0")
  .option(
    "-c, --codex-config <path>",
    "Path to Codex config.toml",
    getDefaultCodexConfigPath()
  )
  .option("-n, --dry-run", "Preview changes without applying them", false)
  .option(
    "--overwrite",
    "Overwrite existing Claude MCP servers with same names",
    false
  )
  .option(
    "-s, --scope <scope>",
    'Claude Code scope: "user" (all projects) or "local" (current project)',
    "user"
  )
  .option(
    "--resolve-env",
    "Resolve bearer token env vars from current environment",
    false
  )
  .action(async (opts) => {
    try {
      console.log(
        chalk.bold("mcport") +
          chalk.gray(" — Codex CLI -> Claude Code MCP migration\n")
      );

      // Pre-flight: check claude CLI
      const claudeAvailable = await checkClaudeCli();
      if (!claudeAvailable) {
        console.error(
          chalk.red(
            '"claude" CLI not found. Install Claude Code first:\n' +
              "  https://docs.anthropic.com/en/docs/claude-code"
          )
        );
        process.exit(1);
      }

      // Pre-flight: check source config
      try {
        await access(opts.codexConfig);
      } catch {
        console.error(
          chalk.red(`Codex config not found at ${opts.codexConfig}`)
        );
        console.error(
          chalk.gray("  Use -c / --codex-config to specify a different path")
        );
        process.exit(1);
      }

      const options: MigrationOptions = {
        codexConfigPath: opts.codexConfig,
        dryRun: opts.dryRun,
        overwrite: opts.overwrite,
        scope: opts.scope as "user" | "local",
        resolveEnvVars: opts.resolveEnv,
      };

      // Build migration plan
      const plan = await buildMigrationPlan(options);

      if (plan.entries.length === 0) {
        console.log(chalk.yellow("No MCP servers found in Codex config."));
        process.exit(0);
      }

      // Execute (or preview in dry-run mode)
      await executeMigrationPlan(plan, options);
    } catch (error: any) {
      console.error(chalk.red(`\nError: ${error.message}`));
      process.exit(1);
    }
  });

program.parse();
