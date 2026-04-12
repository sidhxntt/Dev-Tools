 /**
 * Parses a Prisma schema file and extracts model definitions.
 */

function parsePrismaSchema(schemaContent) {
  const models = [];
  const enums = [];

  // Extract enums
  const enumRegex = /enum\s+(\w+)\s*\{([^}]+)\}/g;
  let enumMatch;
  while ((enumMatch = enumRegex.exec(schemaContent)) !== null) {
    const name = enumMatch[1];
    const values = enumMatch[2]
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('//'));
    enums.push({ name, values });
  }

  // Extract models
  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
  let modelMatch;

  while ((modelMatch = modelRegex.exec(schemaContent)) !== null) {
    const modelName = modelMatch[1];
    const body = modelMatch[2];
    const fields = parseFields(body, enums);
    models.push({ name: modelName, fields });
  }

  return { models, enums };
}

function parseFields(body, enums) {
  const fields = [];
  const lines = body.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('@@'));

  for (const line of lines) {
    // Match: fieldName  FieldType  modifiers...  @directives
    const match = line.match(/^(\w+)\s+([\w\[\]?]+)(.*)?$/);
    if (!match) continue;

    const [, name, rawType, rest = ''] = match;

    const isOptional = rawType.endsWith('?');
    const isArray = rawType.includes('[]');
    const baseType = rawType.replace('?', '').replace('[]', '');

    const isId = rest.includes('@id');
    const isUnique = rest.includes('@unique');
    const hasDefault = rest.includes('@default');
    const isRelation = rest.includes('@relation') || isRelationType(baseType, enums);
    const isUpdatedAt = rest.includes('@updatedAt');
    const isCreatedAt = name === 'createdAt' || name === 'updatedAt';

    // Extract default value
    let defaultValue = null;
    const defaultMatch = rest.match(/@default\(([^)]+)\)/);
    if (defaultMatch) defaultValue = defaultMatch[1];

    fields.push({
      name,
      type: baseType,
      isOptional,
      isArray,
      isId,
      isUnique,
      hasDefault,
      defaultValue,
      isRelation,
      isUpdatedAt,
      isCreatedAt,
      raw: line,
    });
  }

  return fields;
}

function isRelationType(type, enums) {
  const scalarTypes = ['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Bytes', 'BigInt', 'Decimal'];
  const enumNames = enums.map(e => e.name);
  return !scalarTypes.includes(type) && !enumNames.includes(type);
}

module.exports = { parsePrismaSchema };