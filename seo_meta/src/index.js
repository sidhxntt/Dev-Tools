#!/usr/bin/env node

/**
 * seo-meta-cli.js
 * Interactive CLI to inject all SEO / social-meta tags into an HTML file.
 * No AI calls — pure stdin prompts + string injection.
 *
 * Usage:
 *   node seo-meta-cli.js
 *   node seo-meta-cli.js --input ./index.html --output ./dist/index.html
 */

import readline from "readline";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ─── ANSI helpers ────────────────────────────────────────────────────────────
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  white: "\x1b[37m",
  bgBlack: "\x1b[40m",
  bgCyan: "\x1b[46m",
};

const bold = (s) => `${c.bold}${s}${c.reset}`;
const dim = (s) => `${c.dim}${s}${c.reset}`;
const cyan = (s) => `${c.cyan}${s}${c.reset}`;
const green = (s) => `${c.green}${s}${c.reset}`;
const yellow = (s) => `${c.yellow}${s}${c.reset}`;
const red = (s) => `${c.red}${s}${c.reset}`;
const magenta = (s) => `${c.magenta}${s}${c.reset}`;
const blue = (s) => `${c.blue}${s}${c.reset}`;

// ─── RL wrapper ──────────────────────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

async function prompt(label, hint = "", defaultVal = "") {
  const hintStr = hint ? dim(` (${hint})`) : "";
  const defStr = defaultVal ? dim(` [${defaultVal}]`) : "";
  const answer = await ask(`  ${cyan("›")} ${bold(label)}${hintStr}${defStr}: `);
  return answer.trim() || defaultVal;
}

async function promptOptional(label, hint = "") {
  const hintStr = hint ? dim(` (${hint})`) : "";
  const answer = await ask(`  ${dim("›")} ${label}${hintStr}${dim(" [optional, enter to skip]")}: `);
  return answer.trim();
}

async function promptList(label, hint = "") {
  const hintStr = hint ? dim(` (${hint})`) : "";
  const answer = await ask(`  ${cyan("›")} ${bold(label)}${hintStr}${dim(" [comma-separated]")}: `);
  return answer
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function section(title) {
  const line = "─".repeat(60);
  console.log(`\n${c.cyan}${line}${c.reset}`);
  console.log(`  ${c.bold}${c.cyan}${title}${c.reset}`);
  console.log(`${c.cyan}${line}${c.reset}\n`);
}

function info(msg) {
  console.log(`  ${blue("ℹ")} ${dim(msg)}`);
}

function success(msg) {
  console.log(`  ${green("✔")} ${green(msg)}`);
}

function warn(msg) {
  console.log(`  ${yellow("⚠")} ${yellow(msg)}`);
}

// ─── Banner ──────────────────────────────────────────────────────────────────
function banner() {
  console.clear();
  console.log(`
${c.cyan}${c.bold}
  ███████╗███████╗ ██████╗      ███╗   ███╗███████╗████████╗ █████╗
  ██╔════╝██╔════╝██╔═══██╗     ████╗ ████║██╔════╝╚══██╔══╝██╔══██╗
  ███████╗█████╗  ██║   ██║     ██╔████╔██║█████╗     ██║   ███████║
  ╚════██║██╔══╝  ██║   ██║     ██║╚██╔╝██║██╔══╝     ██║   ██╔══██║
  ███████║███████╗╚██████╔╝     ██║ ╚═╝ ██║███████╗   ██║   ██║  ██║
  ╚══════╝╚══════╝ ╚═════╝      ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝
${c.reset}${c.dim}  Interactive SEO Meta Tag Injector for HTML files${c.reset}
  ${dim("─────────────────────────────────────────────────────")}
`);
}

// ─── Parse CLI args ──────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { input: null, output: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--input" && args[i + 1]) opts.input = args[++i];
    if (args[i] === "--output" && args[i + 1]) opts.output = args[++i];
  }
  return opts;
}

// ─── Collect all SEO data via prompts ────────────────────────────────────────
async function collectData() {
  const data = {};

  // ── 1. File paths ──────────────────────────────────────────────────────────
  section("📁  File Paths");
  info("Provide input HTML file and where to write the output.");

  const opts = parseArgs();
  data.inputFile = opts.input || await prompt("Input HTML file path", "e.g. ./index.html");
  data.outputFile = opts.output || await prompt("Output HTML file path", "e.g. ./dist/index.html", data.inputFile);

  if (!fs.existsSync(data.inputFile)) {
    console.log(`\n  ${red("✖")} ${red("File not found:")} ${data.inputFile}`);
    process.exit(1);
  }

  // ── 2. Primary meta ────────────────────────────────────────────────────────
  section("🔤  Primary Meta Tags");
  info("These appear in browser tabs and search engine results.");

  data.title = await prompt("Page <title>", "shown in browser tab & Google results");
  data.description = await prompt("Meta description", "120–160 chars ideal", "");
  data.keywords = await promptList("Meta keywords", "comma-separated");
  data.author = await prompt("Author name");
  data.canonicalUrl = await prompt("Canonical URL", "full URL, e.g. https://example.com/page");
  data.robots = await prompt("Robots directive", "index,follow / noindex,nofollow", "index, follow");
  data.lang = await prompt("Language (hreflang)", "e.g. en, en-US", "en");

  // ── 3. Open Graph ──────────────────────────────────────────────────────────
  section("📣  Open Graph  (Facebook · WhatsApp · Slack previews)");
  info("Controls how your link looks when shared on social platforms.");

  data.ogTitle = await prompt("og:title", "defaults to page title", data.title);
  data.ogDescription = await prompt("og:description", "defaults to meta description", data.description);
  data.ogUrl = await prompt("og:url", "defaults to canonical URL", data.canonicalUrl);
  data.ogType = await prompt("og:type", "website / article / profile", "website");
  data.ogSiteName = await prompt("og:site_name", "your brand / site name");
  data.ogLocale = await prompt("og:locale", "e.g. en_US", "en_US");
  data.ogImage = await prompt("og:image URL", "1200×630 px PNG/JPG recommended");
  data.ogImageAlt = await prompt("og:image:alt", "alt text for OG image");
  data.ogImageWidth = await prompt("og:image:width", "pixels", "1200");
  data.ogImageHeight = await prompt("og:image:height", "pixels", "630");
  data.ogImageType = await prompt("og:image:type", "e.g. image/png", "image/png");

  // Article-specific (optional)
  const isArticle = data.ogType === "article";
  if (isArticle) {
    section("📰  Article-specific Open Graph");
    data.articlePublishedTime = await promptOptional("article:published_time", "ISO 8601, e.g. 2025-01-01T00:00:00Z");
    data.articleModifiedTime = await promptOptional("article:modified_time");
    data.articleAuthor = await promptOptional("article:author", "profile URL");
    data.articleSection = await promptOptional("article:section", "e.g. Technology");
    data.articleTags = await promptList("article:tag", "comma-separated keywords");
  }

  // ── 4. Twitter / X Card ───────────────────────────────────────────────────
  section("𝕏  Twitter / X Card");
  info("Controls appearance when your link is tweeted or shared on X.");

  data.twitterCard = await prompt("twitter:card", "summary / summary_large_image / app / player", "summary_large_image");
  data.twitterSite = await promptOptional("twitter:site", "@handle of site, e.g. @mysite");
  data.twitterCreator = await promptOptional("twitter:creator", "@handle of content author");
  data.twitterTitle = await prompt("twitter:title", "defaults to og:title", data.ogTitle);
  data.twitterDescription = await prompt("twitter:description", "defaults to og:description", data.ogDescription);
  data.twitterImage = await prompt("twitter:image", "defaults to og:image", data.ogImage);
  data.twitterImageAlt = await prompt("twitter:image:alt", "defaults to og:image:alt", data.ogImageAlt);

  // ── 5. Theme / PWA ────────────────────────────────────────────────────────
  section("🎨  Theme & PWA");

  data.themeColor = await prompt("theme-color", "hex, e.g. #000000", "#000000");
  data.colorScheme = await prompt("color-scheme", "light / dark / light dark", "dark");
  data.appName = await prompt("application-name", "short PWA name");
  data.appleMobileWebAppTitle = await prompt("apple-mobile-web-app-title", "defaults to app name", data.appName);
  data.appleStatusBarStyle = await prompt(
    "apple-mobile-web-app-status-bar-style",
    "default / black / black-translucent",
    "black-translucent"
  );

  // ── 6. Geo ────────────────────────────────────────────────────────────────
  section("🌍  Geo / Regional");

  data.geoRegion = await promptOptional("geo.region", "e.g. IN-KA, US-CA");
  data.geoPlacename = await promptOptional("geo.placename", "e.g. Bengaluru, India");

  // ── 7. Favicon paths ──────────────────────────────────────────────────────
  section("🖼️  Favicon Paths");
  info("Leave blank to skip a particular favicon size.");

  data.favicon32 = await promptOptional("favicon 32×32 path", "e.g. assets/favicon-32x32.png");
  data.favicon16 = await promptOptional("favicon 16×16 path", "e.g. assets/favicon-16x16.png");
  data.appleTouchIcon = await promptOptional("apple-touch-icon 180×180 path");
  data.favicon192 = await promptOptional("favicon 192×192 path (Android/PWA)");
  data.favicon512 = await promptOptional("favicon 512×512 path");
  data.faviconIco = await promptOptional("favicon.ico path (legacy)");

  // ── 8. JSON-LD Structured Data ────────────────────────────────────────────
  section("🧩  JSON-LD Structured Data  (Person schema)");
  info("Powers Google Knowledge Panel and rich results.");

  data.jsonldEnabled = (await prompt("Include Person JSON-LD schema?", "yes / no", "yes")).toLowerCase().startsWith("y");

  if (data.jsonldEnabled) {
    data.personName = await prompt("Person name");
    data.personAlternateName = await promptOptional("alternateName / handle");
    data.personUrl = await prompt("Person URL", "defaults to canonical", data.canonicalUrl);
    data.personImage = await promptOptional("Person image URL");
    data.personJobTitle = await prompt("jobTitle");
    data.personDescription = await promptOptional("Short bio / description");
    data.personEmail = await promptOptional("Email (will be in public schema)");
    data.personAddressLocality = await promptOptional("City");
    data.personAddressCountry = await promptOptional("Country code, e.g. IN, US");
    data.personSameAs = await promptList("sameAs URLs", "LinkedIn, GitHub, Twitter… comma-separated");
    data.personKnowsAbout = await promptList("knowsAbout", "skills/topics, comma-separated");

    data.orgEnabled = (await prompt("Add worksFor organization?", "yes / no", "yes")).toLowerCase().startsWith("y");
    if (data.orgEnabled) {
      data.orgName = await prompt("Organization name");
      data.orgUrl = await promptOptional("Organization URL");
    }
  }

  // ── 9. Performance / preconnect ───────────────────────────────────────────
  section("⚡  Performance Hints");
  info("preconnect and dns-prefetch hints speed up external resource loading.");

  data.preconnectUrls = await promptList(
    "preconnect URLs",
    "e.g. https://fonts.googleapis.com,https://cdnjs.cloudflare.com"
  );
  data.dnsPrefetchUrls = await promptList("dns-prefetch URLs", "e.g. https://cal.com,https://medium.com");

  // ── 10. Extra scripts ─────────────────────────────────────────────────────
  section("📦  Extra <script> Tags");
  info("Add third-party <script src> URLs (e.g. GSAP, analytics). Leave blank to skip.");

  data.extraScripts = [];
  let addMore = true;
  while (addMore) {
    const src = await promptOptional("Script src URL");
    if (!src) break;
    const defer = (await prompt("  Load with defer?", "yes/no", "yes")).toLowerCase().startsWith("y");
    data.extraScripts.push({ src, defer });
    addMore = (await prompt("  Add another script?", "yes/no", "no")).toLowerCase().startsWith("y");
  }

  return data;
}

// ─── Build the meta block ────────────────────────────────────────────────────
function buildMetaBlock(d) {
  const lines = [];
  const tag = (attrs) => `  <meta ${attrs} />`;
  const link = (attrs) => `  <link ${attrs} />`;
  const comment = (text) => `\n  <!-- ${text} -->`;

  // ── Primary meta
  lines.push(comment("═══════════════════════════════════════════════════════"));
  lines.push(comment("  PRIMARY META                                          "));
  lines.push(comment("═══════════════════════════════════════════════════════"));
  lines.push(`  <title>${d.title}</title>`);
  if (d.description) lines.push(tag(`name="description" content="${d.description}"`));
  if (d.keywords.length) lines.push(tag(`name="keywords" content="${d.keywords.join(", ")}"`));
  if (d.author) lines.push(tag(`name="author" content="${d.author}"`));
  lines.push(tag(`name="robots" content="${d.robots}"`));
  if (d.canonicalUrl) lines.push(link(`rel="canonical" href="${d.canonicalUrl}"`));
  if (d.lang) lines.push(link(`rel="alternate" hreflang="${d.lang}" href="${d.canonicalUrl}"`));

  // ── Favicons
  lines.push(comment("═══════════════════════════════════════════════════════"));
  lines.push(comment("  FAVICONS                                               "));
  lines.push(comment("═══════════════════════════════════════════════════════"));
  if (d.favicon32) lines.push(link(`rel="icon" type="image/png" sizes="32x32" href="${d.favicon32}"`));
  if (d.favicon16) lines.push(link(`rel="icon" type="image/png" sizes="16x16" href="${d.favicon16}"`));
  if (d.appleTouchIcon) lines.push(link(`rel="apple-touch-icon" sizes="180x180" href="${d.appleTouchIcon}"`));
  if (d.favicon192) lines.push(link(`rel="icon" type="image/png" sizes="192x192" href="${d.favicon192}"`));
  if (d.favicon512) lines.push(link(`rel="icon" type="image/png" sizes="512x512" href="${d.favicon512}"`));
  if (d.faviconIco) lines.push(link(`rel="shortcut icon" href="${d.faviconIco}"`));

  // ── Open Graph
  lines.push(comment("═══════════════════════════════════════════════════════"));
  lines.push(comment("  OPEN GRAPH                                             "));
  lines.push(comment("═══════════════════════════════════════════════════════"));
  lines.push(tag(`property="og:type" content="${d.ogType}"`));
  lines.push(tag(`property="og:site_name" content="${d.ogSiteName}"`));
  lines.push(tag(`property="og:locale" content="${d.ogLocale}"`));
  if (d.ogUrl) lines.push(tag(`property="og:url" content="${d.ogUrl}"`));
  lines.push(tag(`property="og:title" content="${d.ogTitle}"`));
  lines.push(tag(`property="og:description" content="${d.ogDescription}"`));
  if (d.ogImage) {
    lines.push(tag(`property="og:image" content="${d.ogImage}"`));
    lines.push(tag(`property="og:image:secure_url" content="${d.ogImage}"`));
    lines.push(tag(`property="og:image:type" content="${d.ogImageType}"`));
    lines.push(tag(`property="og:image:width" content="${d.ogImageWidth}"`));
    lines.push(tag(`property="og:image:height" content="${d.ogImageHeight}"`));
    if (d.ogImageAlt) lines.push(tag(`property="og:image:alt" content="${d.ogImageAlt}"`));
  }

  // Article-specific
  if (d.ogType === "article") {
    if (d.articlePublishedTime) lines.push(tag(`property="article:published_time" content="${d.articlePublishedTime}"`));
    if (d.articleModifiedTime) lines.push(tag(`property="article:modified_time" content="${d.articleModifiedTime}"`));
    if (d.articleAuthor) lines.push(tag(`property="article:author" content="${d.articleAuthor}"`));
    if (d.articleSection) lines.push(tag(`property="article:section" content="${d.articleSection}"`));
    (d.articleTags || []).forEach((t) => lines.push(tag(`property="article:tag" content="${t}"`)));
  }

  // ── Twitter / X
  lines.push(comment("═══════════════════════════════════════════════════════"));
  lines.push(comment("  TWITTER / X CARD                                       "));
  lines.push(comment("═══════════════════════════════════════════════════════"));
  lines.push(tag(`name="twitter:card" content="${d.twitterCard}"`));
  if (d.twitterSite) lines.push(tag(`name="twitter:site" content="${d.twitterSite}"`));
  if (d.twitterCreator) lines.push(tag(`name="twitter:creator" content="${d.twitterCreator}"`));
  if (d.ogUrl) lines.push(tag(`name="twitter:url" content="${d.ogUrl}"`));
  lines.push(tag(`name="twitter:title" content="${d.twitterTitle}"`));
  lines.push(tag(`name="twitter:description" content="${d.twitterDescription}"`));
  if (d.twitterImage) lines.push(tag(`name="twitter:image" content="${d.twitterImage}"`));
  if (d.twitterImageAlt) lines.push(tag(`name="twitter:image:alt" content="${d.twitterImageAlt}"`));

  // ── Theme / PWA
  lines.push(comment("═══════════════════════════════════════════════════════"));
  lines.push(comment("  THEME / PWA                                            "));
  lines.push(comment("═══════════════════════════════════════════════════════"));
  lines.push(tag(`name="theme-color" content="${d.themeColor}"`));
  lines.push(tag(`name="color-scheme" content="${d.colorScheme}"`));
  if (d.appName) lines.push(tag(`name="application-name" content="${d.appName}"`));
  lines.push(tag(`name="mobile-web-app-capable" content="yes"`));
  lines.push(tag(`name="apple-mobile-web-app-capable" content="yes"`));
  lines.push(tag(`name="apple-mobile-web-app-status-bar-style" content="${d.appleStatusBarStyle}"`));
  if (d.appleMobileWebAppTitle) lines.push(tag(`name="apple-mobile-web-app-title" content="${d.appleMobileWebAppTitle}"`));

  // ── Geo
  if (d.geoRegion || d.geoPlacename) {
    lines.push(comment("═══════════════════════════════════════════════════════"));
    lines.push(comment("  GEO / REGIONAL                                         "));
    lines.push(comment("═══════════════════════════════════════════════════════"));
    if (d.geoRegion) lines.push(tag(`name="geo.region" content="${d.geoRegion}"`));
    if (d.geoPlacename) lines.push(tag(`name="geo.placename" content="${d.geoPlacename}"`));
  }

  // ── Performance
  if (d.preconnectUrls.length || d.dnsPrefetchUrls.length) {
    lines.push(comment("═══════════════════════════════════════════════════════"));
    lines.push(comment("  PERFORMANCE HINTS                                      "));
    lines.push(comment("═══════════════════════════════════════════════════════"));
    d.preconnectUrls.forEach((url) => lines.push(link(`rel="preconnect" href="${url}" crossorigin`)));
    d.dnsPrefetchUrls.forEach((url) => lines.push(link(`rel="dns-prefetch" href="${url}"`)));
  }

  // ── JSON-LD
  if (d.jsonldEnabled) {
    lines.push(comment("═══════════════════════════════════════════════════════"));
    lines.push(comment("  JSON-LD STRUCTURED DATA                                "));
    lines.push(comment("═══════════════════════════════════════════════════════"));

    const graph = [];

    const person = {
      "@type": "Person",
      "@id": `${d.personUrl}#person`,
      name: d.personName,
    };
    if (d.personAlternateName) person.alternateName = d.personAlternateName;
    if (d.personUrl) person.url = d.personUrl;
    if (d.personImage) person.image = d.personImage;
    if (d.personJobTitle) person.jobTitle = d.personJobTitle;
    if (d.personDescription) person.description = d.personDescription;
    if (d.personEmail) person.email = d.personEmail;
    if (d.personAddressLocality || d.personAddressCountry) {
      person.address = { "@type": "PostalAddress" };
      if (d.personAddressLocality) person.address.addressLocality = d.personAddressLocality;
      if (d.personAddressCountry) person.address.addressCountry = d.personAddressCountry;
    }
    if (d.personSameAs.length) person.sameAs = d.personSameAs;
    if (d.personKnowsAbout.length) person.knowsAbout = d.personKnowsAbout;
    if (d.orgEnabled) {
      person.worksFor = { "@type": "Organization", name: d.orgName };
      if (d.orgUrl) person.worksFor.url = d.orgUrl;
    }
    graph.push(person);

    const website = {
      "@type": "WebSite",
      "@id": `${d.canonicalUrl}#website`,
      url: d.canonicalUrl,
      name: `${d.personName} — Portfolio`,
      description: d.description,
      author: { "@id": `${d.personUrl}#person` },
      inLanguage: d.lang === "en" ? "en-US" : d.lang,
    };
    graph.push(website);

    const jsonld = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 4);
    lines.push(`  <script type="application/ld+json">\n${jsonld
      .split("\n")
      .map((l) => "  " + l)
      .join("\n")}\n  </script>`);
  }

  // ── Extra scripts
  if (d.extraScripts.length) {
    lines.push(comment("═══════════════════════════════════════════════════════"));
    lines.push(comment("  EXTRA SCRIPTS                                          "));
    lines.push(comment("═══════════════════════════════════════════════════════"));
    d.extraScripts.forEach(({ src, defer }) => {
      lines.push(`  <script src="${src}"${defer ? " defer" : ""}></script>`);
    });
  }

  return lines.join("\n");
}

// ─── Inject into HTML ────────────────────────────────────────────────────────
function injectIntoHtml(htmlContent, metaBlock) {
  const strategies = [
    // 1. Replace everything currently inside <head> … </head>
    {
      name: "Replace existing <head> content",
      pattern: /(<head[^>]*>)([\s\S]*?)(<\/head>)/i,
      replacer: (m, open, _body, close) => `${open}\n${metaBlock}\n${close}`,
    },
    // 2. Insert right after <head>
    {
      name: "Insert after <head>",
      pattern: /(<head[^>]*>)/i,
      replacer: (m, open) => `${open}\n${metaBlock}`,
    },
    // 3. Insert before </head>
    {
      name: "Insert before </head>",
      pattern: /(<\/head>)/i,
      replacer: (m, close) => `${metaBlock}\n${close}`,
    },
    // 4. Prepend to document (fallback)
    {
      name: "Prepend to document (no <head> found)",
      pattern: null,
      replacer: null,
    },
  ];

  for (const s of strategies) {
    if (!s.pattern) {
      warn(`No <head> tag found — prepending meta block to file.`);
      return `<head>\n${metaBlock}\n</head>\n\n${htmlContent}`;
    }
    if (s.pattern.test(htmlContent)) {
      info(`Strategy: ${s.name}`);
      return htmlContent.replace(s.pattern, s.replacer);
    }
  }

  return htmlContent;
}

// ─── Preview summary ─────────────────────────────────────────────────────────
function printSummary(d) {
  section("📋  Summary — Review before writing");
  const row = (k, v) => console.log(`  ${dim(k.padEnd(22))} ${v || dim("(not set)")}`);

  row("Title:", d.title);
  row("Description:", d.description?.slice(0, 60) + (d.description?.length > 60 ? "…" : ""));
  row("Canonical URL:", d.canonicalUrl);
  row("OG Image:", d.ogImage);
  row("Twitter Card:", d.twitterCard);
  row("Theme Color:", d.themeColor);
  row("JSON-LD:", d.jsonldEnabled ? `Person — ${d.personName}` : "disabled");
  row("Preconnects:", d.preconnectUrls.length || "none");
  row("Extra Scripts:", d.extraScripts.length || "none");
  row("Input File:", d.inputFile);
  row("Output File:", d.outputFile);
  console.log();
}

// ─── Save config ──────────────────────────────────────────────────────────────
function saveConfig(d) {
  const configPath = d.outputFile.replace(/\.html?$/, ".seo-config.json");
  fs.writeFileSync(configPath, JSON.stringify(d, null, 2), "utf8");
  success(`Config saved → ${configPath}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  banner();

  console.log(`  ${bold("Welcome!")} This tool injects all SEO meta tags into your HTML file.`);
  console.log(`  ${dim("Answer the prompts below. Press Enter to accept defaults shown in [brackets].")}\n`);

  const data = await collectData();

  printSummary(data);

  const proceed = await prompt("Write the file now?", "yes/no", "yes");
  if (!proceed.toLowerCase().startsWith("y")) {
    console.log(`\n  ${yellow("Aborted.")} No files were written.\n`);
    rl.close();
    return;
  }

  const htmlContent = fs.readFileSync(data.inputFile, "utf8");
  const metaBlock = buildMetaBlock(data);
  const outputHtml = injectIntoHtml(htmlContent, metaBlock);

  // Ensure output dir exists
  const outDir = path.dirname(data.outputFile);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(data.outputFile, outputHtml, "utf8");

  saveConfig(data);

  section("✅  Done");
  success(`HTML written → ${data.outputFile}`);
  console.log(`\n  ${dim("Tip: Re-run with previously saved config by piping it back in,")}`);
  console.log(`  ${dim("or use --input / --output flags to skip the file path prompts.")}\n`);

  rl.close();
}

main().catch((err) => {
  console.error(`\n  ${red("✖ Fatal error:")} ${err.message}\n`);
  process.exit(1);
});