# seo-meta

> Interactive Node.js CLI that injects every SEO / social-meta tag into any HTML file.  
> **No AI calls. No internet. Pure stdin prompts.**

---

## Features

| Category | Tags injected |
|---|---|
| Primary meta | `<title>`, description, keywords, author, canonical, robots, hreflang |
| Favicons | 16px, 32px, 180px (apple), 192px, 512px, `.ico` |
| Open Graph | All standard OG tags + article-specific tags |
| Twitter / X Card | All card variants |
| Theme / PWA | theme-color, color-scheme, apple-mobile-web-app-* |
| Geo | geo.region, geo.placename |
| Performance | preconnect, dns-prefetch |
| JSON-LD | Person + WebSite schema (Google Knowledge Panel) |
| Scripts | Extra `<script src>` tags with optional `defer` |

---

## Requirements

- **Node.js ≥ 18** (uses native ESM `import`, no install needed)

---

## Usage

```bash
# Basic — prompts you for input/output file paths first
node seo-meta.js

# Skip file path prompts with flags
node seo-meta.js --input ./index.html --output ./dist/index.html
```

Or make it executable and run globally:

```bash
chmod +x seo-meta.js
npm link          # registers `seo-meta` as a global command
seo-meta --input ./index.html
```

---

## What happens to my HTML?

The CLI finds the `<head>` tag in your file using this priority:

1. **Replaces** the entire body of `<head>…</head>` with the generated block
2. Falls back to inserting **after `<head>`**
3. Falls back to inserting **before `</head>`**
4. Last resort: **prepends** a new `<head>` block to the file

Your original file is never overwritten unless `--output` (or your answer) points to the same path.

---

## Saved config

After writing the HTML, the CLI also saves a `.seo-config.json` file next to the output HTML with all your answers. You can inspect or version-control it.

---

## Prompt reference

```
📁  File Paths            — input / output HTML paths
🔤  Primary Meta          — title, description, keywords, author, canonical, robots, hreflang
🖼️  Favicons              — paths for all icon sizes
📣  Open Graph            — og:* tags + optional article:* tags
𝕏   Twitter / X Card      — twitter:* tags
🎨  Theme & PWA           — theme-color, PWA meta
🌍  Geo / Regional        — geo.region, geo.placename
⚡  Performance Hints     — preconnect, dns-prefetch URLs
🧩  JSON-LD               — Person + WebSite schema
📦  Extra Scripts         — arbitrary <script src> tags
```

---

## License

MIT