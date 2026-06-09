const pages = ["home", "profile", "programming", "algorithms", "engineering", "research", "projects"];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getRequestedPage() {
  const page = new URLSearchParams(window.location.search).get("page");
  if (pages.includes(page)) return page;

  const legacyHash = window.location.hash.replace("#", "");
  return pages.includes(legacyHash) ? legacyHash : "home";
}

function renderPage(page, { historyMode = "push", smooth = true } = {}) {
  const nextPage = pages.includes(page) ? page : "home";

  document.querySelectorAll(".page-view").forEach((view) => {
    view.hidden = view.dataset.page !== nextPage;
  });

  document.querySelectorAll("[data-page-link]").forEach((link) => {
    const active = link.dataset.pageLink === nextPage;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  const title = nextPage === "home" ? "Home" : nextPage[0].toUpperCase() + nextPage.slice(1);
  document.title = `${title} | Chenglong`;

  if (historyMode !== "none") {
    const url = nextPage === "home" ? "./" : `./?page=${nextPage}`;
    const method = historyMode === "replace" ? "replaceState" : "pushState";
    window.history[method]({ page: nextPage }, "", url);
  }

  window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
}

function initRouter() {
  renderPage(getRequestedPage(), { historyMode: "replace", smooth: false });

  document.querySelectorAll("[data-page-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      renderPage(link.dataset.pageLink);
    });
  });

  window.addEventListener("popstate", () => {
    renderPage(getRequestedPage(), { historyMode: "none", smooth: false });
  });
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Unable to load ${path}: ${response.status}`);
  return response.json();
}

function renderTags(items) {
  return items.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("");
}

function getNotes(notes, module, group) {
  return notes.filter((note) => note.module === module && note.group === group);
}

function renderNoteLinks(notes) {
  if (!notes.length) {
    return `<p class="empty-notes">暂无笔记。</p>`;
  }

  return `
    <ul class="note-list">
      ${notes
        .map(
          (note) => `
            <li>
              <a href="${escapeHtml(note.href)}">
                <span>${escapeHtml(note.title)}</span>
                <small>${escapeHtml(note.tags.join(" / "))}</small>
              </a>
            </li>
          `,
        )
        .join("")}
    </ul>
  `;
}

function renderProfile(profile, noteCount) {
  const metrics = profile.metrics.map(([value, label], index) =>
    index === 1 ? [String(noteCount).padStart(2, "0"), label] : [value, label],
  );

  document.getElementById("profile-facts").innerHTML = profile.facts
    .map(
      ([label, value]) =>
        `<div class="fact-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`,
    )
    .join("");

  document.getElementById("system-metrics").innerHTML = metrics
    .map(
      ([value, label]) =>
        `<div class="metric"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`,
    )
    .join("");
}

function renderProgramming(languages, notes) {
  document.getElementById("language-grid").innerHTML = languages
    .map((language) => {
      const relatedNotes = getNotes(notes, "programming", language.name);
      return `
        <article class="language-card">
          <div class="language-top">
            <h3>${escapeHtml(language.name)}</h3>
            <span class="language-status">${escapeHtml(language.status)}</span>
          </div>
          <p>${escapeHtml(language.use)}</p>
          <div class="language-block">
            <span>关注主题</span>
            <div class="tags">${renderTags(language.topics)}</div>
          </div>
          <div class="language-block">
            <span>笔记入口</span>
            ${renderNoteLinks(relatedNotes)}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderAlgorithms(algorithms, notes) {
  document.getElementById("algorithm-board").innerHTML = algorithms
    .map((lane) => {
      const relatedNotes = getNotes(notes, "algorithms", lane.title);
      return `
        <article class="algorithm-lane">
          <span class="lane-score">${escapeHtml(lane.score)}</span>
          <h3>${escapeHtml(lane.title)}</h3>
          <p>${escapeHtml(lane.note)}</p>
          <ul class="lane-list">
            ${lane.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
          <div class="note-block">
            <span>相关笔记</span>
            ${renderNoteLinks(relatedNotes)}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderEngineering(engineering, notes) {
  document.getElementById("engineering-stack").innerHTML = engineering
    .map((item) => {
      const relatedNotes = getNotes(notes, "engineering", item.title);
      return `
        <article class="engineering-card">
          <div class="engineering-card-top">
            <h3>${escapeHtml(item.title)}</h3>
            <span class="stack-status">${escapeHtml(item.status)}</span>
          </div>
          <p>${escapeHtml(item.note)}</p>
          <div class="tags">${renderTags(item.tags)}</div>
          <div class="note-block">
            <span>相关笔记</span>
            ${renderNoteLinks(relatedNotes)}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderResearch(research, notes) {
  document.getElementById("research-ledger").innerHTML = research
    .map((item) => {
      const relatedNotes = getNotes(notes, "research", item.type);
      return `
        <article class="research-item">
          <span class="research-type">${escapeHtml(item.type)}</span>
          <div>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.note)}</p>
            <div class="tags">${renderTags(item.tags)}</div>
            <div class="note-block">
              <span>相关笔记</span>
              ${renderNoteLinks(relatedNotes)}
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderProjects(projects) {
  document.getElementById("project-grid").innerHTML = projects
    .map(
      (project) => `
        <article class="project-card">
          <span class="status">${escapeHtml(project.status)}</span>
          <h3>${escapeHtml(project.title)}</h3>
          <p>${escapeHtml(project.note)}</p>
          <div class="tags">${renderTags(project.tags)}</div>
        </article>
      `,
    )
    .join("");
}

function renderLoadError(error) {
  console.error(error);
  document.querySelectorAll(".dynamic-content").forEach((container) => {
    container.innerHTML = `<p class="content-error">内容加载失败，请确认已运行 <code>npm run build</code>。</p>`;
  });
}

async function initContent() {
  try {
    const [profile, capabilities, projects, notes] = await Promise.all([
      loadJson("./data/profile.json"),
      loadJson("./data/capabilities.json"),
      loadJson("./data/projects.json"),
      loadJson("./data/notes.json"),
    ]);

    renderProfile(profile, notes.length);
    renderProgramming(capabilities.languages, notes);
    renderAlgorithms(capabilities.algorithms, notes);
    renderEngineering(capabilities.engineering, notes);
    renderResearch(capabilities.research, notes);
    renderProjects(projects);
  } catch (error) {
    renderLoadError(error);
  }
}

initRouter();
initContent();
