/**
 * Generates Express route files from parsed Prisma models.
 */

function toCamelCase(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function toKebabCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function getValidationFields(fields) {
  return fields.filter(f => !f.isId && !f.isRelation && !f.isUpdatedAt && !f.isCreatedAt && !f.hasDefault);
}

function getTypeValidator(field) {
  const map = {
    String: 'string',
    Int: 'number',
    Float: 'number',
    Boolean: 'boolean',
    DateTime: 'string',
    Json: 'object',
    BigInt: 'number',
    Decimal: 'number',
  };
  return map[field.type] || 'string';
}

function generateRouteFile(model) {
  const name = model.name;
  const camel = toCamelCase(name);
  const route = toKebabCase(name);

  const writeableFields = getValidationFields(model.fields);
  const idField = model.fields.find(f => f.isId);
  const idName = idField ? idField.name : 'id';
  const idType = idField && (idField.type === 'Int' || idField.type === 'BigInt') ? 'parseInt' : null;
  const idParse = idType ? `${idType}(req.params.id)` : 'req.params.id';

  const createFields = writeableFields.filter(f => !f.isOptional);
  const updateFields = writeableFields;

  // Build select object (exclude relation fields)
  const selectFields = model.fields
    .filter(f => !f.isRelation)
    .map(f => `      ${f.name}: true`)
    .join(',\n');

  // Build body validation for create
  const createValidation = createFields.map(f =>
    `    if (typeof body.${f.name} !== '${getTypeValidator(f)}') {
      return res.status(400).json({ error: '${f.name} is required and must be a ${getTypeValidator(f)}' });
    }`
  ).join('\n');

  // Build create data
  const createData = writeableFields.map(f =>
    `      ${f.name}: body.${f.name},`
  ).join('\n');

  // Build update data
  const updateData = updateFields.map(f =>
    `      ...(body.${f.name} !== undefined && { ${f.name}: body.${f.name} }),`
  ).join('\n');

  return `const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');

const router = Router();
const prisma = new PrismaClient();

const select = {
${selectFields}
};

// GET /api/${route}s — List all ${name}s
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, orderBy = '${idName}', order = 'asc' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [items, total] = await Promise.all([
      prisma.${camel}.findMany({
        skip,
        take: parseInt(limit),
        orderBy: { [orderBy]: order },
        select,
      }),
      prisma.${camel}.count(),
    ]);

    res.json({
      data: items,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch ${camel}s' });
  }
});

// GET /api/${route}s/:id — Get single ${name}
router.get('/:id', async (req, res) => {
  try {
    const item = await prisma.${camel}.findUnique({
      where: { ${idName}: ${idParse} },
      select,
    });

    if (!item) return res.status(404).json({ error: '${name} not found' });
    res.json({ data: item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch ${camel}' });
  }
});

// POST /api/${route}s — Create ${name}
router.post('/', async (req, res) => {
  try {
    const body = req.body;
${createValidation ? createValidation + '\n' : ''}
    const item = await prisma.${camel}.create({
      data: {
${createData}
      },
      select,
    });

    res.status(201).json({ data: item });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A ${camel} with this value already exists' });
    }
    res.status(500).json({ error: 'Failed to create ${camel}' });
  }
});

// PATCH /api/${route}s/:id — Update ${name}
router.patch('/:id', async (req, res) => {
  try {
    const body = req.body;

    const exists = await prisma.${camel}.findUnique({ where: { ${idName}: ${idParse} } });
    if (!exists) return res.status(404).json({ error: '${name} not found' });

    const item = await prisma.${camel}.update({
      where: { ${idName}: ${idParse} },
      data: {
${updateData}
      },
      select,
    });

    res.json({ data: item });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A ${camel} with this value already exists' });
    }
    res.status(500).json({ error: 'Failed to update ${camel}' });
  }
});

// DELETE /api/${route}s/:id — Delete ${name}
router.delete('/:id', async (req, res) => {
  try {
    const exists = await prisma.${camel}.findUnique({ where: { ${idName}: ${idParse} } });
    if (!exists) return res.status(404).json({ error: '${name} not found' });

    await prisma.${camel}.delete({ where: { ${idName}: ${idParse} } });
    res.json({ message: '${name} deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete ${camel}' });
  }
});

module.exports = router;
`;
}

function generateAppFile(models) {
  const imports = models.map(m =>
    `const ${toCamelCase(m.name)}Routes = require('./routes/${toKebabCase(m.name)}');`
  ).join('\n');

  const uses = models.map(m =>
    `app.use('/api/${toKebabCase(m.name)}s', ${toCamelCase(m.name)}Routes);`
  ).join('\n');

  const routeList = models.map(m => {
    const r = toKebabCase(m.name);
    return [
      `//   GET    /api/${r}s`,
      `//   GET    /api/${r}s/:id`,
      `//   POST   /api/${r}s`,
      `//   PATCH  /api/${r}s/:id`,
      `//   DELETE /api/${r}s/:id`,
    ].join('\n');
  }).join('\n');

  return `const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
${imports}

${uses}

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Generated routes:
${routeList}

module.exports = app;
`;
}

function generateServerFile() {
  return `const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(\`🚀 Server running on http://localhost:\${PORT}\`);
  console.log(\`📊 Health check: http://localhost:\${PORT}/health\`);
});
`;
}

function generatePackageJson(outputDir) {
  const name = require('path').basename(outputDir);
  return JSON.stringify({
    name: name || 'express-api',
    version: '1.0.0',
    description: 'Generated Express API from Prisma schema',
    main: 'src/server.js',
    scripts: {
      start: 'node src/server.js',
      dev: 'nodemon src/server.js',
    },
    dependencies: {
      '@prisma/client': '^5.0.0',
      cors: '^2.8.5',
      express: '^4.18.2',
    },
    devDependencies: {
      nodemon: '^3.0.0',
      prisma: '^5.0.0',
    },
  }, null, 2);
}

module.exports = {
  generateRouteFile,
  generateAppFile,
  generateServerFile,
  generatePackageJson,
  toCamelCase,
  toKebabCase,
};