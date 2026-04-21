# DEV TOOLS

[![Node.js](https://img.shields.io/badge/node.js-%3E%3D14-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A collection of developer productivity tools including an AI-powered README generator and a Prisma-to-Express API generator.

> To more about these tools please refer their corresponding README
## Features

### README Wizard
- **AI-Powered Documentation** - Generate comprehensive README files using Claude AI
- **Intelligent Codebase Scanning** - Automatically analyzes project structure and key files
- **Smart Content Filtering** - Excludes binary files, build artifacts, and secrets
- **Multiple Output Options** - Generate files or preview with `--dry-run`
- **Configurable Limits** - Control max files and lines to stay within token limits
- **Project Tree Generation** - Visual directory structure in output
- **Gitignore Integration** - Respects existing `.gitignore` patterns

### Prismify Express
- **Zero Configuration** - Generate APIs directly from Prisma schema files
- **Full CRUD Operations** - GET, POST, PATCH, DELETE endpoints for each model
- **Built-in Pagination** - Configurable page size and ordering
- **Input Validation** - Type checking and required field validation
- **Clean Project Structure** - Organized routes, middleware, and configuration
- **Enum Support** - Handles Prisma enum types automatically
- **Complete Setup** - Generates package.json, .env templates, and .gitignore

### SEO Meta CLI
- **Zero Dependencies** - Pure Node.js 18+, no npm installs required
- **Interactive Prompts** - Step-by-step stdin prompts with defaults and hints
- **Complete Coverage** - Injects primary meta, favicons, Open Graph, Twitter/X Card, PWA, Geo, JSON-LD, and performance hints
- **Smart Injection** - Detects and replaces `<head>` content intelligently with graceful fallbacks
- **Article Schema Support** - Optional `article:*` Open Graph tags for blog/news pages
- **Person JSON-LD** - Generates Person + WebSite schema for Google Knowledge Panel
- **Config Persistence** - Saves answers to a `.seo-config.json` for version control and reuse
- **Flag Support** - `--input` / `--output` flags to skip file path prompts in scripts

## Prerequisites

- Node.js 14.0.0 or higher
- Anthropic API key (for README Wizard)
- Prisma schema file (for Prismify Express)

## Installation

### Global Installation

```bash
# Install README Wizard
npm install -g @sidhxntt/readme-wizard

# Install Prismify Express
npm install -g @sidhxntt/prismify-express

# Install SEO Meta CLI
npm install -g @sidhxntt/seo-meta
```

### Local Installation

```bash
# Use with npx (no installation required)
npx @sidhxntt/readme-wizard generate
npx @sidhxntt/prismify-express generate schema.prisma
npx @sidhxntt/seo-meta
```

## Configuration

### README Wizard

Set your Anthropic API key as an environment variable:

```bash
export ANTHROPIC_API_KEY=your-api-key-here
```

## Usage

### README Wizard

#### Generate README for current directory
```bash
readme-wizard generate
```

#### Generate for specific directory
```bash
readme-wizard generate /path/to/project
```

#### Preview without writing file
```bash
readme-wizard generate --dry-run
```

#### Custom output location
```bash
readme-wizard generate -o DOCUMENTATION.md
```

#### Scan only (see what would be sent to AI)
```bash
readme-wizard scan
```

### Prismify Express

#### Basic generation from Prisma schema
```bash
prismify-express generate prisma/schema.prisma
```

#### Custom output directory
```bash
prismify-express generate prisma/schema.prisma --output ./my-api
```

#### Skip package.json generation
```bash
prismify-express generate prisma/schema.prisma --no-package
```

#### Preview mode
```bash
prismify-express generate prisma/schema.prisma --dry-run
```

### SEO Meta CLI

#### Interactive mode (prompts for everything)
```bash
seo-meta
```

#### Skip file path prompts with flags
```bash
seo-meta --input ./index.html --output ./dist/index.html
```

#### Run without installing
```bash
node seo-meta.js --input ./index.html
```

## CLI Reference

### README Wizard Commands

#### `generate [dir]` (alias: `gen`)
Generate a README by scanning the project and sending context to Claude AI.

**Options:**
- `-o, --output <file>` - Output file path (default: `README.md`)
- `-m, --model <model>` - Claude model to use (default: `claude-sonnet-4-20250514`)
- `--max-files <n>` - Maximum files to include in context (default: `80`)
- `--max-lines <n>` - Maximum lines per file to read (default: `150`)
- `--no-tree` - Skip project tree generation
- `--dry-run` - Print README to stdout instead of writing file
- `--overwrite` - Overwrite existing README without prompting

#### `scan [dir]`
Scan project and show what would be sent to the LLM without generating README.

**Options:**
- `--max-files <n>` - Maximum files to include (default: `80`)
- `--max-lines <n>` - Maximum lines per file (default: `150`)

### Prismify Express Commands

#### `generate <schema> [options]`
Generate Express API from Prisma schema.

**Arguments:**
- `schema` - Path to Prisma schema file

**Options:**
- `-o, --output <dir>` - Output directory (default: `./generated-api`)
- `--no-package` - Skip generating package.json
- `--dry-run` - Preview output without writing files

### SEO Meta CLI Commands

#### `seo-meta [options]`
Interactively populate all SEO meta tags into an HTML file.

**Options:**
- `--input <file>` - Input HTML file path
- `--output <file>` - Output HTML file path (defaults to input path)

**Prompted sections (in order):**

| Section | Tags / Data |
|---|---|
| Primary Meta | `<title>`, description, keywords, author, canonical, robots, hreflang |
| Favicons | 16px, 32px, 180px (Apple), 192px, 512px, `.ico` |
| Open Graph | `og:*` tags + optional `article:*` tags |
| Twitter / X Card | `twitter:*` tags, all card types |
| Theme / PWA | theme-color, color-scheme, `apple-mobile-web-app-*` |
| Geo | geo.region, geo.placename |
| Performance | preconnect, dns-prefetch links |
| JSON-LD | Person + WebSite schema |
| Extra Scripts | Arbitrary `<script src>` with optional `defer` |

## Generated API Structure (Prismify Express)

```
generated-api/
├── prisma/
│   └── schema.prisma          # Copy of your original schema
├── src/
│   ├── routes/
│   │   ├── user.js           # Routes for User model
│   │   └── post.js           # Routes for Post model
│   ├── app.js                # Express app configuration
│   └── server.js             # Server entry point
├── .env.example              # Environment variables template
├── .gitignore               # Git ignore file
└── package.json             # Dependencies and scripts
```

### Generated API Endpoints

For each Prisma model, the following REST endpoints are generated:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/{model}s` | List all records with pagination |
| `GET` | `/api/{model}s/:id` | Get single record by ID |
| `POST` | `/api/{model}s` | Create new record |
| `PATCH` | `/api/{model}s/:id` | Update existing record |
| `DELETE` | `/api/{model}s/:id` | Delete record |

### Example API Usage

```bash
# List users with pagination
GET /api/users?page=1&limit=10&orderBy=createdAt&order=desc

# Get specific user
GET /api/users/123

# Create new user
POST /api/users
{
  "email": "user@example.com",
  "name": "John Doe"
}

# Update user
PATCH /api/users/123
{
  "name": "Jane Doe"
}

# Delete user
DELETE /api/users/123
```

## Project Structure

```
dev_tools/
├── docs/
│   └── index.html              # Project documentation
├── prismify-express/
│   ├── src/
│   │   ├── generator.js        # Express route generation logic
│   │   ├── index.js           # CLI interface and orchestration
│   │   └── parser.js          # Prisma schema parsing
│   ├── package.json           # Package configuration
│   └── README.md              # Tool-specific documentation
├── readme_wizard/
│   ├── src/
│   │   ├── generator.js       # Claude AI integration
│   │   ├── index.js          # CLI entry point
│   │   └── scanner.js        # Codebase scanning logic
│   ├── package.json          # Package configuration
│   └── README.md             # Tool-specific documentation
└── seo_meta_cli/
    ├── seo-meta.js        # CLI entry point + injector
    ├── package.json           # Package configuration
    └── README.md              # Tool-specific documentation
```

### Key Files

- **`readme_wizard/src/index.js`** - Main CLI application using Commander.js with colorful output
- **`readme_wizard/src/scanner.js`** - Core scanning logic that builds project trees and filters files
- **`readme_wizard/src/generator.js`** - Handles Anthropic API integration and prompt construction
- **`prismify-express/src/parser.js`** - Parses Prisma schema files and extracts models/enums
- **`prismify-express/src/generator.js`** - Generates Express route files and project structure
- **`prismify-express/src/index.js`** - CLI interface and main orchestration logic
- **`seo_meta_cli/seo-meta.js`** - Interactive prompts, meta block builder, and HTML injector
- **`docs/index.html`** - Project documentation and landing page

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Install dependencies in both packages:
   ```bash
   cd readme_wizard && npm install
   cd ../prismify-express && npm install
   ```
4. Make your changes and test with real projects
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

Both tools use modern Node.js features and ES modules (readme-wizard) / CommonJS (prismify-express).

## License

MIT