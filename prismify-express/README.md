# prismify-express

[![npm](https://img.shields.io/badge/npm-1.0.0-blue.svg)](https://npmjs.com/package/prismify-express)
[![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A CLI tool that automatically generates a complete Express REST API from your Prisma schema. Transform your database schema into production-ready API endpoints with full CRUD operations, validation, and pagination.

## Features

- 🚀 **Zero configuration** - Generate APIs directly from Prisma schema files
- 📝 **Full CRUD operations** - GET, POST, PATCH, DELETE endpoints for each model
- 🔍 **Built-in pagination** - Configurable page size and ordering
- ✅ **Input validation** - Type checking and required field validation
- 🗂️ **Clean project structure** - Organized routes, middleware, and configuration
- 📊 **Enum support** - Handles Prisma enum types automatically
- 🔗 **Relationship handling** - Excludes relation fields from API responses appropriately
- 📦 **Complete setup** - Generates package.json, .env templates, and .gitignore

## Prerequisites

- Node.js 14.0.0 or higher
- A Prisma schema file (schema.prisma)

## Installation

Install globally via npm:

```bash
npm install -g prismify-express
```

Or use npx to run without installing:

```bash
npx prismify-express generate schema.prisma
```

## Usage

### Basic Generation

Generate an API from your Prisma schema:

```bash
prismify-express generate prisma/schema.prisma
```

### Custom Output Directory

Specify a custom output directory:

```bash
prismify-express generate prisma/schema.prisma --output ./my-api
```

### Skip Package.json Generation

If you want to manage dependencies yourself:

```bash
prismify-express generate prisma/schema.prisma --no-package
```

### Preview Mode

See what files would be generated without writing them:

```bash
prismify-express generate prisma/schema.prisma --dry-run
```

## Generated API Structure

The tool generates a complete Express.js project with the following structure:

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

## Generated API Endpoints

For each Prisma model, the following REST endpoints are generated:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/{model}s` | List all records with pagination |
| `GET` | `/api/{model}s/:id` | Get single record by ID |
| `POST` | `/api/{model}s` | Create new record |
| `PATCH` | `/api/{model}s/:id` | Update existing record |
| `DELETE` | `/api/{model}s/:id` | Delete record |

### Example API Calls

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

## Configuration

After generation, configure your environment:

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Set your database connection:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
PORT=3000
```

3. Install dependencies:
```bash
npm install
```

4. Generate Prisma client:
```bash
npx prisma generate
```

5. Run database migrations:
```bash
npx prisma migrate dev
```

6. Start the server:
```bash
npm start
```

## Example Prisma Schema

The tool works with standard Prisma schemas:

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  USER
  ADMIN
}
```

## CLI Reference

```bash
prismify-express generate <schema> [options]

Arguments:
  schema                  Path to Prisma schema file

Options:
  -o, --output <dir>      Output directory (default: "./generated-api")
  --no-package           Skip generating package.json
  --dry-run              Preview output without writing files
  -h, --help             Display help for command
```

## Project Structure

- **`src/parser.js`** - Parses Prisma schema files and extracts models/enums
- **`src/generator.js`** - Generates Express route files and project structure
- **`src/index.js`** - CLI interface and main orchestration logic
- **`docs/index.html`** - Project documentation and landing page

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
