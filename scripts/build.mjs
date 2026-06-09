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
  fs.writeFileSync(path.join(distDir, ".nojekyll"), "");
}

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(dataDir, { recursive: true });

const noteCount = buildNotes();
buildDist();
console.log(`Built ${noteCount} note pages and the dist/ deployment artifact.`);
