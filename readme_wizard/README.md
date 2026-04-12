# README Wizard

[![Node.js](https://img.shields.io/badge/node.js-%3E%3D16-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CLI](https://img.shields.io/badge/type-CLI%20tool-orange.svg)](https://github.com/topics/cli)

AI-powered README generator that scans your codebase and creates comprehensive documentation using Claude AI.

## Features

- **Intelligent Codebase Scanning** - Automatically discovers and analyzes project structure
- **Priority File Detection** - Focuses on key files like `package.json`, `Dockerfile`, config files
- **Smart Content Filtering** - Excludes binary files, build artifacts, and secrets
- **Multiple Output Options** - Generate files or preview with `--dry-run`
- **Configurable Limits** - Control max files and lines to stay within token limits
- **Project Tree Generation** - Visual directory structure in output
- **Gitignore Integration** - Respects existing `.gitignore` patterns
- **CLI-First Design** - Simple commands with helpful spinners and colored output

## Prerequisites

- Node.js 16 or higher
- Anthropic API key (for Claude AI access)

## Installation

Install globally via npm:

```bash
npm install -g readme-wizard 
```

Or run directly with npx:

```bash
npx readme-wizard generate
```

## Configuration

Set your Anthropic API key as an environment variable:

```bash
export ANTHROPIC_API_KEY=your-api-key-here
```

## Usage

### Generate README for current directory

```bash
readme-wizard generate
```

### Generate for specific directory

```bash
readme-wizard generate /path/to/project
```

### Preview without writing file

```bash
readme-wizard generate --dry-run
```

### Custom output location

```bash
readme-wizard generate -o DOCUMENTATION.md
```

### Scan only (see what would be sent to AI)

```bash
readme-wizard scan
```

## CLI Reference

### `generate [dir]` (alias: `gen`)

Generate a README by scanning the project and sending context to Claude AI.

**Options:**
- `-o, --output <file>` - Output file path (default: `README.md`)
- `-m, --model <model>` - Claude model to use (default: `claude-sonnet-4-20250514`)
- `--max-files <n>` - Maximum files to include in context (default: `80`)
- `--max-lines <n>` - Maximum lines per file to read (default: `150`)
- `--no-tree` - Skip project tree generation
- `--dry-run` - Print README to stdout instead of writing file
- `--overwrite` - Overwrite existing README without prompting

### `scan [dir]`

Scan project and show what would be sent to the LLM without generating README.

**Options:**
- `--max-files <n>` - Maximum files to include (default: `80`)
- `--max-lines <n>` - Maximum lines per file (default: `150`)

## Project Structure

```
Readme_generator_llm/
├── docs/
│   └── index.html          # Project documentation page
├── src/
│   ├── index.js           # CLI entry point and command definitions
│   ├── scanner.js         # Codebase scanning and file analysis
│   └── generator.js       # Claude AI integration and README generation
└── package.json           # NPM package configuration
```

### Key Files

- **`src/index.js`** - Main CLI application using Commander.js with colorful output via Chalk and Ora
- **`src/scanner.js`** - Core scanning logic that builds project trees, respects gitignore, and categorizes files by priority
- **`src/generator.js`** - Handles Anthropic API integration and prompt construction for Claude AI
- **`docs/index.html`** - Landing page with installation and usage instructions

## How It Works

1. **Scan Phase** - Recursively walks project directory, filtering files based on:
   - Gitignore patterns + built-in exclusions (node_modules, build artifacts, etc.)
   - File extension allowlist (source code, configs, documentation)
   - Priority patterns (package.json, Dockerfile, etc. get full content)

2. **Context Building** - Creates structured prompt with:
   - Project name (from directory or package.json)
   - Complete file listing
   - Directory tree visualization
   - Key file contents (truncated if needed)

3. **AI Generation** - Sends context to Claude AI with specific instructions to:
   - Detect project type and purpose
   - Generate appropriate sections (installation, usage, etc.)
   - Use real code examples from the scanned files
   - Output clean Markdown without placeholders

## Contributing

1. Clone the repository
2. Install dependencies: `npm install`
3. Run in development mode: `npm run dev`
4. Make your changes and test with real projects
5. Submit a pull request

The codebase uses ES modules and modern Node.js features. Key dependencies:
- `@anthropic-ai/sdk` - Claude AI integration
- `commander` - CLI framework
- `chalk` & `ora` - Terminal styling and spinners
- `glob` & `ignore` - File system operations
