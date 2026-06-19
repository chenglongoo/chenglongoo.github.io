import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const notesDir = path.join(rootDir, "notes");
const dataDir = path.join(rootDir, "data");
const outputDir = path.join(rootDir, "generated", "notes");
const notesIndexFile = path.join(dataDir, "notes.json");
const distDir = path.join(rootDir, "dist");
const siteUrl = "https://chenglongoo.github.io";

const requiredFields = ["title", "module", "group"];
const validModules = new Set(["programming", "algorithms", "engineering", "research"]);

marked.setOptions({
  gfm: true,
  breaks: false,
});

function walkMarkdownFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkMarkdownFiles(fullPath);
    return entry.isFile() && entry.name.endsWith(".md") ? [fullPath] : [];
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function validateMetadata(data, filePath) {
  const relativePath = path.relative(rootDir, filePath);

  for (const field of requiredFields) {
    if (typeof data[field] !== "string" || !data[field].trim()) {
      throw new Error(`${relativePath}: front matter field "${field}" is required`);
    }
  }

  if (!validModules.has(data.module)) {
    throw new Error(`${relativePath}: unsupported module "${data.module}"`);
  }

  if (data.tags !== undefined && !Array.isArray(data.tags)) {
    throw new Error(`${relativePath}: "tags" must be an array`);
  }
}

function createSlug(filePath) {
  return path
    .relative(notesDir, filePath)
    .replace(/\.md$/i, "")
    .split(path.sep)
    .join("-");
}

function sanitizeMarkdown(markdown) {
  return sanitizeHtml(marked.parse(markdown), {
    allowedTags: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "a",
      "ul",
      "ol",
      "li",
      "blockquote",
      "pre",
      "code",
      "strong",
      "em",
      "del",
      "hr",
      "br",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "img"
    ],
    allowedAttributes: {
      a: ["href", "title"],
      img: ["src", "alt", "title"],
      code: ["class"]
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer"
      })
    }
  });
}

function readJson(fileName) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, fileName), "utf8"));
}

function assertString(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} must be a non-empty string`);
  }
}

function validateDataFiles() {
  const profile = readJson("profile.json");
  const capabilities = readJson("capabilities.json");
  const projects = readJson("projects.json");

  if (!Array.isArray(profile.facts) || !Array.isArray(profile.metrics)) {
    throw new Error("data/profile.json must contain facts and metrics arrays");
  }

  for (const [index, fact] of profile.facts.entries()) {
    if (!Array.isArray(fact) || fact.length !== 2) {
      throw new Error(`data/profile.json facts[${index}] must be a [label, value] pair`);
    }
  }

  for (const key of ["languages", "algorithms", "engineering", "research"]) {
    if (!Array.isArray(capabilities[key])) {
      throw new Error(`data/capabilities.json "${key}" must be an array`);
    }
  }

  for (const language of capabilities.languages) {
    assertString(language.name, "language.name");
    assertString(language.status, `${language.name}.status`);
    assertString(language.use, `${language.name}.use`);
    if (!Array.isArray(language.topics)) throw new Error(`${language.name}.topics must be an array`);
  }

  for (const lane of capabilities.algorithms) {
    assertString(lane.title, "algorithm.title");
    assertString(lane.score, `${lane.title}.score`);
    assertString(lane.note, `${lane.title}.note`);
    if (!Array.isArray(lane.items)) throw new Error(`${lane.title}.items must be an array`);
  }

  for (const item of capabilities.engineering) {
    assertString(item.title, "engineering.title");
    assertString(item.status, `${item.title}.status`);
    assertString(item.note, `${item.title}.note`);
    if (!Array.isArray(item.tags)) throw new Error(`${item.title}.tags must be an array`);
  }

  for (const item of capabilities.research) {
    assertString(item.type, "research.type");
    assertString(item.title, `${item.type}.title`);
    assertString(item.note, `${item.type}.note`);
    if (!Array.isArray(item.tags)) throw new Error(`${item.type}.tags must be an array`);
  }

  if (!Array.isArray(projects)) {
    throw new Error("data/projects.json must be an array");
  }

  for (const [index, project] of projects.entries()) {
    assertString(project.status, `projects[${index}].status`);
    assertString(project.title, `projects[${index}].title`);
    assertString(project.note, `projects[${index}].note`);
    if (!Array.isArray(project.tags)) throw new Error(`projects[${index}].tags must be an array`);
  }

  return capabilities;
}

function expectedNoteGroups(capabilities) {
  return new Map([
    ["programming", new Set(capabilities.languages.map((item) => item.name))],
    ["algorithms", new Set(capabilities.algorithms.map((item) => item.title))],
    ["engineering", new Set(capabilities.engineering.map((item) => item.title))],
    ["research", new Set(capabilities.research.map((item) => item.type))]
  ]);
}

function validateNoteCoverage(notes, capabilities) {
  const expected = expectedNoteGroups(capabilities);
  const seen = new Map();

  for (const note of notes) {
    const groups = expected.get(note.module);
    if (!groups || !groups.has(note.group)) {
      throw new Error(`Note "${note.title}" uses unknown group "${note.module}/${note.group}"`);
    }
    const key = `${note.module}/${note.group}`;
    if (!seen.has(key)) seen.set(key, 0);
    seen.set(key, seen.get(key) + 1);
  }

  const uncovered = [];
  for (const [module, groups] of expected.entries()) {
    for (const group of groups) {
      if (!seen.has(`${module}/${group}`)) uncovered.push(`${module}/${group}`);
    }
  }

  if (uncovered.length) {
    throw new Error(`Missing notes for capability groups: ${uncovered.join(", ")}`);
  }
}

function renderNotePage(note, contentHtml) {
  const tags = note.tags
    .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
    .join("");

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(note.title)} | Chenglong</title>
    <meta name="description" content="${escapeHtml(`${note.title} - Chenglong 的学习笔记`)}" />
    <link rel="stylesheet" href="../../styles.css" />
  </head>
  <body>
    <canvas id="signal-canvas" aria-hidden="true"></canvas>
    <header class="site-header">
      <a class="brand" href="../../" aria-label="返回首页">
        <span class="brand-mark">CL</span>
        <span class="brand-text">Chenglong</span>
      </a>
      <nav class="nav" aria-label="主导航">
        <a href="../../?page=profile">Profile</a>
        <a href="../../?page=programming">Programming</a>
        <a href="../../?page=algorithms">Algorithms</a>
        <a href="../../?page=engineering">Engineering</a>
        <a href="../../?page=research">Research</a>
        <a href="../../?page=projects">Projects</a>
      </nav>
    </header>

    <main class="note-shell">
      <a class="back-link" href="../../?page=${escapeHtml(note.module)}">返回列表</a>
      <article class="note-reader">
        <p class="eyebrow">${escapeHtml(`${note.module} / ${note.group}`)}</p>
        <div class="note-meta">${tags}</div>
        <div class="note-content">${contentHtml}</div>
      </article>
    </main>

    <footer class="site-footer">
      <span>Built for GitHub Pages.</span>
      <span>Markdown note viewer.</span>
    </footer>

    <script src="../../background.js"></script>
  </body>
</html>
`;
}

function buildNotes() {
  const seenSlugs = new Set();
  const notes = walkMarkdownFiles(notesDir).map((filePath) => {
    const source = fs.readFileSync(filePath, "utf8");
    const parsed = matter(source);
    validateMetadata(parsed.data, filePath);

    const slug = createSlug(filePath);
    if (seenSlugs.has(slug)) {
      throw new Error(`Duplicate generated note slug: ${slug}`);
    }
    seenSlugs.add(slug);

    const note = {
      title: parsed.data.title.trim(),
      module: parsed.data.module.trim(),
      group: parsed.data.group.trim(),
      tags: (parsed.data.tags || []).map(String),
      href: `./generated/notes/${slug}.html`
    };

    const contentHtml = sanitizeMarkdown(parsed.content);
    fs.writeFileSync(path.join(outputDir, `${slug}.html`), renderNotePage(note, contentHtml));
    return note;
  });

  notes.sort((a, b) => {
    if (a.module !== b.module) return a.module.localeCompare(b.module);
    if (a.group !== b.group) return a.group.localeCompare(b.group);
    return a.title.localeCompare(b.title);
  });

  fs.writeFileSync(notesIndexFile, `${JSON.stringify(notes, null, 2)}\n`);
  return notes.length;
}

function buildDist() {
  const rootFiles = ["index.html", "app.js", "background.js", "styles.css"];

  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });

  for (const file of rootFiles) {
    fs.copyFileSync(path.join(rootDir, file), path.join(distDir, file));
  }

  fs.cpSync(dataDir, path.join(distDir, "data"), { recursive: true });
  fs.cpSync(path.join(rootDir, "generated"), path.join(distDir, "generated"), { recursive: true });
  writeSeoFiles();
  fs.writeFileSync(path.join(distDir, ".nojekyll"), "");
}

function writeSeoFiles() {
  const notes = JSON.parse(fs.readFileSync(notesIndexFile, "utf8"));
  const urls = [
    "",
    "?page=profile",
    "?page=programming",
    "?page=algorithms",
    "?page=engineering",
    "?page=research",
    "?page=projects",
    ...notes.map((note) => note.href.replace(/^\.\//, ""))
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${siteUrl}/${url}</loc>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

  const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

  fs.writeFileSync(path.join(distDir, "sitemap.xml"), sitemap);
  fs.writeFileSync(path.join(distDir, "robots.txt"), robots);
}

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(dataDir, { recursive: true });

const capabilities = validateDataFiles();
const noteCount = buildNotes();
validateNoteCoverage(JSON.parse(fs.readFileSync(notesIndexFile, "utf8")), capabilities);
buildDist();
console.log(`Built ${noteCount} note pages and the dist/ deployment artifact.`);
