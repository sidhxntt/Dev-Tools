import fs from "fs";
import path from "path";
import { glob } from "glob";
import ignore from "ignore";

// Files we always skip — binary, build artifacts, secrets
const ALWAYS_IGNORE = [
  "node_modules/**",
  ".git/**",
  "dist/**",
  "build/**",
  "out/**",
  ".next/**",
  "__pycache__/**",
  "*.pyc",
  "*.pyo",
  ".env",
  ".env.*",
  "*.lock",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "*.min.js",
  "*.min.css",
  "*.map",
  "*.jpg",
  "*.jpeg",
  "*.png",
  "*.gif",
  "*.svg",
  "*.ico",
  "*.woff",
  "*.woff2",
  "*.ttf",
  "*.eot",
  "*.pdf",
  "*.zip",
  "*.tar",
  "*.gz",
  "coverage/**",
  ".nyc_output/**",
  "*.test.js.snap",
  ".DS_Store",
  "Thumbs.db",
];

// Priority files — read these first and fully
const PRIORITY_PATTERNS = [
  "package.json",
  "pyproject.toml",
  "setup.py",
  "setup.cfg",
  "Cargo.toml",
  "go.mod",
  "composer.json",
  "build.gradle",
  "pom.xml",
  "Makefile",
  "Dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  ".github/workflows/*.yml",
  "requirements*.txt",
  "*.config.js",
  "*.config.ts",
  "vite.config.*",
  "webpack.config.*",
  "tsconfig.json",
  "README*",
];

// File extensions we read (source code only)
const READABLE_EXTENSIONS = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
  ".py", ".rb", ".go", ".rs", ".java", ".kt", ".swift",
  ".c", ".cpp", ".h", ".hpp", ".cs",
  ".html", ".css", ".scss", ".sass", ".less",
  ".json", ".yaml", ".yml", ".toml", ".ini", ".cfg",
  ".md", ".mdx", ".txt", ".rst",
  ".sh", ".bash", ".zsh", ".fish",
  ".sql", ".graphql", ".proto",
  ".env.example", ".env.template",
  "Dockerfile", "Makefile", "Procfile",
]);

function buildTree(dir, prefix = "", depth = 0, maxDepth = 4) {
  if (depth > maxDepth) return "";
  const entries = fs.readdirSync(dir, { withFileTypes: true }).filter((e) => {
    const name = e.name;
    if (name.startsWith(".") && name !== ".github") return false;
    if (["node_modules", "dist", "build", "out", "__pycache__", ".next"].includes(name)) return false;
    return true;
  });

  let tree = "";
  entries.forEach((entry, i) => {
    const isLast = i === entries.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const childPrefix = isLast ? "    " : "│   ";
    tree += prefix + connector + entry.name + "\n";
    if (entry.isDirectory()) {
      tree += buildTree(path.join(dir, entry.name), prefix + childPrefix, depth + 1, maxDepth);
    }
  });
  return tree;
}

function isReadable(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath);
  return READABLE_EXTENSIONS.has(ext) || READABLE_EXTENSIONS.has(basename);
}

function isPriority(filePath) {
  const basename = path.basename(filePath);
  const rel = filePath;
  return PRIORITY_PATTERNS.some((pat) => {
    if (pat.includes("*")) {
      // Simple glob match
      const regex = new RegExp("^" + pat.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*") + "$");
      return regex.test(rel) || regex.test(basename);
    }
    return basename === pat || rel.endsWith("/" + pat);
  });
}

function loadGitignore(dir) {
  const ig = ignore();
  const gitignorePath = path.join(dir, ".gitignore");
  if (fs.existsSync(gitignorePath)) {
    ig.add(fs.readFileSync(gitignorePath, "utf-8"));
  }
  ig.add(ALWAYS_IGNORE);
  return ig;
}

function readFileSafe(filePath, maxLines) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    if (lines.length <= maxLines) return content;
    return lines.slice(0, maxLines).join("\n") + `\n\n... [truncated at ${maxLines} lines, ${lines.length} total]`;
  } catch {
    return null;
  }
}

export async function scanCodebase(dir, options = {}) {
  const { maxFiles = 80, maxLines = 150, includeTree = true } = options;

  const ig = loadGitignore(dir);

  // Get all files
  const allFiles = await glob("**/*", {
    cwd: dir,
    nodir: true,
    dot: false,
    ignore: ALWAYS_IGNORE,
  });

  // Filter by gitignore and readability
  const readableFiles = allFiles
    .filter((f) => !ig.ignores(f))
    .filter((f) => isReadable(f))
    .sort((a, b) => {
      // Priority files first
      const aPri = isPriority(a) ? 0 : 1;
      const bPri = isPriority(b) ? 0 : 1;
      if (aPri !== bPri) return aPri - bPri;
      // Shorter paths first (closer to root)
      return a.split("/").length - b.split("/").length;
    });

  // Cap at maxFiles
  const selectedFiles = readableFiles.slice(0, maxFiles);

  // Read file contents
  const fileContents = [];
  let contextSize = 0;

  for (const relPath of selectedFiles) {
    const absPath = path.join(dir, relPath);
    const stat = fs.statSync(absPath);
    if (stat.size > 500_000) continue; // skip huge files

    const ml = isPriority(relPath) ? maxLines * 3 : maxLines;
    const content = readFileSafe(absPath, ml);
    if (content === null) continue;

    fileContents.push({ path: relPath, content });
    contextSize += content.length;
  }

  // Count directories
  const dirs = new Set(selectedFiles.map((f) => path.dirname(f)).filter((d) => d !== "."));

  // Build tree
  const projectName = path.basename(dir);
  let tree = "";
  if (includeTree) {
    tree = `${projectName}/\n` + buildTree(dir);
  }

  return {
    projectName,
    projectDir: dir,
    tree,
    files: fileContents,
    fileCount: fileContents.length,
    dirCount: dirs.size,
    contextSize,
    allFileList: readableFiles,
  };
}