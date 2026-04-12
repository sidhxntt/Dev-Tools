#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import path from "path";
import fs from "fs";
import { scanCodebase } from "./scanner.js";
import { generateReadme } from "./generator.js";

const program = new Command();

const BANNER = `
${chalk.cyan("╔══════════════════════════════════════╗")}
${chalk.cyan("║")}  ${chalk.bold.white("README WIZARD")} ${chalk.dim("✦ powered by Claude")}  ${chalk.cyan("║")}
${chalk.cyan("╚══════════════════════════════════════╝")}
`;

program
  .name("readme-wizard")
  .description("AI-powered README generator that scans your codebase")
  .version("1.0.0");

program
  .command("generate [dir]")
  .alias("gen")
  .description("Scan a project directory and generate a README")
  .option("-o, --output <file>", "Output file path", "README.md")
  .option("-m, --model <model>", "Claude model to use", "claude-sonnet-4-20250514")
  .option("--max-files <n>", "Max files to include in context", "80")
  .option("--max-lines <n>", "Max lines per file to read", "150")
  .option("--no-tree", "Skip project tree generation")
  .option("--dry-run", "Print the README to stdout instead of writing to file")
  .option("--overwrite", "Overwrite existing README without prompting")
  .action(async (dir = ".", options) => {
    console.log(BANNER);

    const targetDir = path.resolve(process.cwd(), dir);

    if (!fs.existsSync(targetDir)) {
      console.error(chalk.red(`✗ Directory not found: ${targetDir}`));
      process.exit(1);
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error(chalk.red("✗ ANTHROPIC_API_KEY environment variable is not set."));
      console.error(chalk.dim("  Export it with: export ANTHROPIC_API_KEY=your-key-here"));
      process.exit(1);
    }

    const outputPath = path.resolve(targetDir, options.output);
    if (!options.dryRun && fs.existsSync(outputPath) && !options.overwrite) {
      console.warn(chalk.yellow(`⚠  ${options.output} already exists. Use --overwrite to replace it.`));
      process.exit(1);
    }

    // Step 1: Scan
    const scanSpinner = ora({
      text: chalk.dim("Scanning codebase..."),
      color: "cyan",
    }).start();

    let scanResult;
    try {
      scanResult = await scanCodebase(targetDir, {
        maxFiles: parseInt(options.maxFiles),
        maxLines: parseInt(options.maxLines),
        includeTree: options.tree !== false,
      });
      scanSpinner.succeed(
        chalk.green(`Scanned`) +
          chalk.dim(
            ` ${scanResult.fileCount} files across ${scanResult.dirCount} directories`
          )
      );
    } catch (err) {
      scanSpinner.fail(chalk.red("Scan failed: " + err.message));
      process.exit(1);
    }

    // Step 2: Generate
    const genSpinner = ora({
      text: chalk.dim("Asking Claude to write your README..."),
      color: "cyan",
    }).start();

    let readme;
    try {
      readme = await generateReadme(scanResult, {
        model: options.model,
        projectDir: targetDir,
      });
      genSpinner.succeed(chalk.green("README generated") + chalk.dim(` (${readme.length} chars)`));
    } catch (err) {
      genSpinner.fail(chalk.red("Generation failed: " + err.message));
      process.exit(1);
    }

    // Step 3: Output
    if (options.dryRun) {
      console.log("\n" + chalk.dim("─".repeat(60)));
      console.log(readme);
      console.log(chalk.dim("─".repeat(60)));
    } else {
      fs.writeFileSync(outputPath, readme, "utf-8");
      console.log(
        "\n" +
          chalk.bold.green("✔ Done! ") +
          chalk.white("README written to ") +
          chalk.cyan(path.relative(process.cwd(), outputPath))
      );
      console.log(
        chalk.dim(
          `\n  Tip: Review the README and tweak any project-specific details.\n`
        )
      );
    }
  });

program
  .command("scan [dir]")
  .description("Only scan and show what would be sent to the LLM")
  .option("--max-files <n>", "Max files to include", "80")
  .option("--max-lines <n>", "Max lines per file", "150")
  .action(async (dir = ".", options) => {
    console.log(BANNER);
    const targetDir = path.resolve(process.cwd(), dir);

    const spinner = ora({ text: chalk.dim("Scanning..."), color: "cyan" }).start();
    const result = await scanCodebase(targetDir, {
      maxFiles: parseInt(options.maxFiles),
      maxLines: parseInt(options.maxLines),
      includeTree: true,
    });
    spinner.succeed(chalk.green("Scan complete"));

    console.log("\n" + chalk.bold("Project Tree:"));
    console.log(chalk.dim(result.tree));
    console.log(chalk.bold(`\nFiles included: `) + result.fileCount);
    console.log(chalk.bold(`Context size: `) + `~${Math.round(result.contextSize / 1000)}k chars`);
  });

program.parse();