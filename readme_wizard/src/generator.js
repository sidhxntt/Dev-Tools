import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildPrompt(scanResult) {
  const { projectName, tree, files, allFileList } = scanResult;

  const fileSection = files
    .map((f) => `### \`${f.path}\`\n\`\`\`\n${f.content}\n\`\`\``)
    .join("\n\n");

  const allFilesList = allFileList.join("\n");

  return `You are an expert technical writer. Your job is to write a world-class README.md for the project described below.

## Project Name
${projectName}

## Full File List (all files in the project)
\`\`\`
${allFilesList}
\`\`\`

## Project Directory Tree
\`\`\`
${tree}
\`\`\`

## File Contents (key files, possibly truncated)
${fileSection}

---

Write a comprehensive, high-quality README.md for this project. Follow these rules strictly:

1. **Detect the project type** from the files (npm package, Python library, CLI tool, web app, API, etc.) and tailor the README accordingly.
2. **Infer the project's purpose** from the code — don't make things up; only document what you can see.
3. **Include these sections** as applicable (skip any that don't apply):
   - Title + one-liner description
   - Badges (language, license if detected, build status placeholder)
   - Features list (bulleted, concrete)
   - Prerequisites / Requirements
   - Installation (exact commands, copy-pasteable)
   - Configuration (env vars, config files — only what you see in the code)
   - Usage / Quick Start (with real code examples drawn from the actual code)
   - API Reference or CLI Reference (if applicable)
   - Project Structure (use the tree, explain key dirs/files)
   - Contributing guide
   - License (only if detected)

4. **Use the actual code** to write real examples — not placeholder pseudocode.
5. **Be concise but complete** — a developer should be able to clone, install, and run the project using only this README.
6. Use proper Markdown formatting: code blocks with language hints, headers, tables where helpful.
7. Do NOT include any commentary outside the README content — output ONLY the raw Markdown.
8. Do NOT use placeholder text like "[Your Name]" or "[Description here]" — infer everything from the code or omit the field.

Output only the final README.md content, starting with the # title.`;
}

export async function generateReadme(scanResult, options = {}) {
  const { model = "claude-sonnet-4-20250514" } = options;

  const prompt = buildPrompt(scanResult);

  const message = await client.messages.create({
    model,
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude: " + content.type);
  }

  let readme = content.text.trim();

  // Strip accidental markdown fences around the whole output
  if (readme.startsWith("```markdown")) {
    readme = readme.slice("```markdown".length);
  } else if (readme.startsWith("```md")) {
    readme = readme.slice("```md".length);
  } else if (readme.startsWith("```")) {
    readme = readme.slice(3);
  }
  if (readme.endsWith("```")) {
    readme = readme.slice(0, -3);
  }

  return readme.trim() + "\n";
}