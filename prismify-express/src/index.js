#!/usr/bin/env node

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs-extra');
const path = require('path');

const { parsePrismaSchema } = require('./parser');
const {
  generateRouteFile,
  generateAppFile,
  generateServerFile,
  generatePackageJson,
  toKebabCase,
} = require('./generator');

const pkg = require('../package.json');

// ─── Banner ────────────────────────────────────────────────────────────────

function printBanner() {
  console.log();
  console.log(chalk.bold.cyan('  ┌─────────────────────────────────┐'));
  console.log(chalk.bold.cyan('  │') + chalk.bold.white('  prisma-to-express  ') + chalk.gray('v' + pkg.version) + '   ' + chalk.bold.cyan('│'));
  console.log(chalk.bold.cyan('  │') + chalk.gray('  Prisma schema → Express REST API') + chalk.bold.cyan(' │'));
  console.log(chalk.bold.cyan('  └─────────────────────────────────┘'));
  console.log();
}

// ─── CLI ───────────────────────────────────────────────────────────────────

program
  .name('prisma-to-express')
  .description('Generate a complete Express REST API from your Prisma schema')
  .version(pkg.version);

program
  .command('generate <schema>')
  .alias('g')
  .description('Generate Express API from a Prisma schema file')
  .option('-o, --output <dir>', 'Output directory', './generated-api')
  .option('--no-package', 'Skip generating package.json')
  .option('--dry-run', 'Preview output without writing files')
  .action(async (schemaPath, opts) => {
    printBanner();

    // ── Resolve paths ──
    const resolvedSchema = path.resolve(process.cwd(), schemaPath);
    const resolvedOutput = path.resolve(process.cwd(), opts.output);

    // ── Validate input ──
    if (!fs.existsSync(resolvedSchema)) {
      console.error(chalk.red(`✖ Schema file not found: ${resolvedSchema}`));
      process.exit(1);
    }

    const spinner = ora({ text: chalk.cyan('Parsing schema...'), color: 'cyan' }).start();

    try {
      // ── Parse ──
      const schemaContent = fs.readFileSync(resolvedSchema, 'utf-8');
      const { models, enums } = parsePrismaSchema(schemaContent);

      if (models.length === 0) {
        spinner.fail(chalk.red('No models found in the schema file.'));
        process.exit(1);
      }

      spinner.succeed(chalk.green(`Parsed ${models.length} model(s): `) + chalk.white(models.map(m => m.name).join(', ')));

      if (enums.length > 0) {
        console.log(chalk.gray(`  Found ${enums.length} enum(s): ${enums.map(e => e.name).join(', ')}`));
      }

      console.log();

      // ── Generate files ──
      const filesToWrite = [];

      // Routes
      for (const model of models) {
        filesToWrite.push({
          path: path.join(resolvedOutput, 'src', 'routes', `${toKebabCase(model.name)}.js`),
          content: generateRouteFile(model),
          label: `routes/${toKebabCase(model.name)}.js`,
        });
      }

      // App
      filesToWrite.push({
        path: path.join(resolvedOutput, 'src', 'app.js'),
        content: generateAppFile(models),
        label: 'src/app.js',
      });

      // Server
      filesToWrite.push({
        path: path.join(resolvedOutput, 'src', 'server.js'),
        content: generateServerFile(),
        label: 'src/server.js',
      });

      // Package.json
      if (opts.package !== false) {
        filesToWrite.push({
          path: path.join(resolvedOutput, 'package.json'),
          content: generatePackageJson(resolvedOutput),
          label: 'package.json',
        });
      }

      // Copy prisma schema
      filesToWrite.push({
        path: path.join(resolvedOutput, 'prisma', 'schema.prisma'),
        content: schemaContent,
        label: 'prisma/schema.prisma',
      });

      // .env example
      filesToWrite.push({
        path: path.join(resolvedOutput, '.env.example'),
        content: 'DATABASE_URL="postgresql://user:password@localhost:5432/mydb"\nPORT=3000\n',
        label: '.env.example',
      });

      // .gitignore
      filesToWrite.push({
        path: path.join(resolvedOutput, '.gitignore'),
        content: 'node_modules/\n.env\ndist/\n',
        label: '.gitignore',
      });

      // ── Write or preview ──
      if (opts.dryRun) {
        console.log(chalk.bold.yellow('  DRY RUN — no files will be written\n'));
        for (const file of filesToWrite) {
          console.log(chalk.green('  ✔ ') + chalk.white(file.label));
        }
        console.log();
      } else {
        const writeSpinner = ora({ text: chalk.cyan('Writing files...'), color: 'cyan' }).start();

        for (const file of filesToWrite) {
          fs.ensureDirSync(path.dirname(file.path));
          fs.writeFileSync(file.path, file.content, 'utf-8');
        }

        writeSpinner.succeed(chalk.green(`Wrote ${filesToWrite.length} files to `) + chalk.white(opts.output));
        console.log();
      }

      // ── Summary ──
      printSummary(models, opts.output, opts.dryRun);

    } catch (err) {
      spinner.fail(chalk.red('Failed: ' + err.message));
      if (process.env.DEBUG) console.error(err);
      process.exit(1);
    }
  });

program
  .command('inspect <schema>')
  .alias('i')
  .description('Inspect a Prisma schema and list detected models and fields')
  .action((schemaPath) => {
    printBanner();

    const resolvedSchema = path.resolve(process.cwd(), schemaPath);
    if (!fs.existsSync(resolvedSchema)) {
      console.error(chalk.red(`✖ Schema file not found: ${resolvedSchema}`));
      process.exit(1);
    }

    const schemaContent = fs.readFileSync(resolvedSchema, 'utf-8');
    const { models, enums } = parsePrismaSchema(schemaContent);

    if (models.length === 0) {
      console.log(chalk.yellow('No models found.'));
      return;
    }

    for (const model of models) {
      console.log(chalk.bold.cyan(`  model ${model.name}`));
      for (const f of model.fields) {
        const tags = [];
        if (f.isId) tags.push(chalk.yellow('@id'));
        if (f.isUnique) tags.push(chalk.blue('@unique'));
        if (f.isOptional) tags.push(chalk.gray('optional'));
        if (f.isRelation) tags.push(chalk.magenta('relation'));
        if (f.hasDefault) tags.push(chalk.gray(`default(${f.defaultValue})`));
        const tagStr = tags.length ? '  ' + tags.join(' ') : '';
        console.log(
          `    ${chalk.white(f.name.padEnd(20))} ${chalk.green((f.type + (f.isArray ? '[]' : '')).padEnd(15))}${tagStr}`
        );
      }
      console.log();
    }

    if (enums.length > 0) {
      for (const e of enums) {
        console.log(chalk.bold.magenta(`  enum ${e.name}`));
        for (const v of e.values) {
          console.log(`    ${chalk.white(v)}`);
        }
        console.log();
      }
    }
  });

function printSummary(models, output, dryRun) {
  console.log(chalk.bold('  Generated endpoints:\n'));

  for (const model of models) {
    const route = toKebabCase(model.name);
    console.log(`  ${chalk.bold.white(model.name)}`);
    console.log(`    ${chalk.green('GET')}    ${chalk.gray(`/api/${route}s`)}`);
    console.log(`    ${chalk.green('GET')}    ${chalk.gray(`/api/${route}s/:id`)}`);
    console.log(`    ${chalk.yellow('POST')}   ${chalk.gray(`/api/${route}s`)}`);
    console.log(`    ${chalk.blue('PATCH')}  ${chalk.gray(`/api/${route}s/:id`)}`);
    console.log(`    ${chalk.red('DELETE')} ${chalk.gray(`/api/${route}s/:id`)}`);
    console.log();
  }

  if (!dryRun) {
    console.log(chalk.bold('  Next steps:\n'));
    console.log(`    ${chalk.gray('1.')} cd ${output}`);
    console.log(`    ${chalk.gray('2.')} npm install`);
    console.log(`    ${chalk.gray('3.')} cp .env.example .env  ${chalk.gray('# add your DATABASE_URL')}`);
    console.log(`    ${chalk.gray('4.')} npx prisma generate`);
    console.log(`    ${chalk.gray('5.')} npm run dev`);
    console.log();
  }
}

program.parse(process.argv);