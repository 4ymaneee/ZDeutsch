const themeTitle = document.getElementById("theme-title");
const levelPill = document.getElementById("level-pill");
const levelList = document.getElementById("level-list");
const sectionList = document.getElementById("section-list");
const themeGrid = document.getElementById("theme-grid");
const themeSearchInput = document.getElementById("theme-search");
const homeLoader = document.getElementById("home-loader");
const versionModal = document.getElementById("version-modal");
const versionOverlay = document.getElementById("version-overlay");
const versionTitle = document.getElementById("version-title");
const versionOptions = document.getElementById("version-options");
const versionCloseBtn = document.getElementById("version-close");

const state = {
  db: null,
  config: null,
  shreibenDb: null,
  level: null,
  theme: null,
  pendingTheme: null,
  search: "",
  section: "lesen",
  parts: null
};

const SECTION_KEYS = ["lesen", "horen", "shreiben"];

function getSectionFromHash() {
  const raw = String(window.location.hash || "")
    .replace(/^#/, "")
    .trim()
    .toLowerCase();
  if (!raw) {
    return null;
  }
  return SECTION_KEYS.includes(raw) ? raw : null;
}

function syncSectionHash(section, options = {}) {
  const target = String(section || "").trim().toLowerCase();
  if (!target || !SECTION_KEYS.includes(target)) {
    return;
  }
  const current = String(window.location.hash || "")
    .replace(/^#/, "")
    .trim()
    .toLowerCase();
  if (current === target) {
    return;
  }
  const nextUrl = `${window.location.pathname}${window.location.search}#${target}`;
  if (options.replace) {
    window.history.replaceState(null, "", nextUrl);
    return;
  }
  window.location.hash = target;
}

function setHomeLoaderVisible(show) {
  if (!homeLoader) {
    return;
  }
  homeLoader.classList.toggle("hidden", !show);
}

function updateHeader() {
  if (themeTitle) {
    themeTitle.textContent = "Select a theme";
  }
  if (levelPill) {
    levelPill.textContent = (state.level || "").toUpperCase();
  }
}

function renderChoiceButton(label, active) {
  return createEl(
    "button",
    classNames(
      "rounded-full border px-4 py-2 text-xs font-display uppercase tracking-[0.2em]",
      active
        ? "border-azure/60 bg-azure/10 text-azure ring-2 ring-azure/20"
        : "border-stone-300 bg-stone-50 text-slate shadow-sm"
    ),
    label
  );
}

function makeMetaPill(label) {
  return createEl(
    "span",
    "theme-meta-pill",
    label
  );
}

function clampPercent(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatPassedExamsLabel(value) {
  const passedExams = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  if (passedExams === 0) {
    return "No exams passed yet";
  }
  if (passedExams === 1) {
    return "1 exam passed";
  }
  return `${passedExams} exams passed`;
}

function getThemeStatus(progressSummary) {
  const passMark = Number.isFinite(state.config?.scoreConfig?.passPercent)
    ? state.config.scoreConfig.passPercent
    : DEFAULT_CONFIG.scoreConfig.passPercent;
  if (!progressSummary) {
    return {
      label: "New",
      className: "theme-card-status-new"
    };
  }
  if (progressSummary.passedExams > 0 || progressSummary.lastPercent >= passMark) {
    return {
      label: "Passed",
      className: "theme-card-status-passed"
    };
  }
  return {
    label: "In progress",
    className: "theme-card-status-progress"
  };
}

function getThemeProgressSummary(levelKey, themeKey, versionKeys) {
  if (typeof loadLesenProgressStore !== "function") {
    return null;
  }
  const store = loadLesenProgressStore();
  const keys = versionKeys?.length ? versionKeys : ["default"];
  const entries = keys
    .map((versionKey) => store[makeLesenProgressEntryKey(levelKey, themeKey, versionKey)])
    .filter((entry) => entry && typeof entry === "object");
  if (!entries.length) {
    return null;
  }
  const latest = entries.reduce((current, item) => {
    if (!current) {
      return item;
    }
    const currentTime = Number.isFinite(current.lastAttemptAt) ? current.lastAttemptAt : 0;
    const itemTime = Number.isFinite(item.lastAttemptAt) ? item.lastAttemptAt : 0;
    return itemTime > currentTime ? item : current;
  }, null);
  const passedExams = entries.reduce((sum, item) => {
    const value = Number.isFinite(item.passedAttempts) ? item.passedAttempts : 0;
    return sum + value;
  }, 0);
  const passedVersions = entries.reduce((sum, item) => sum + (item.lastPassed ? 1 : 0), 0);
  const lastPercent = Number.isFinite(latest?.lastPercent) ? latest.lastPercent : 0;
  return {
    lastPercent,
    passedExams,
    passedVersions,
    versionCount: keys.length
  };
}

function refreshIcons() {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

function makeLucideIcon(name, className) {
  const icon = createEl("i", className);
  icon.setAttribute("data-lucide", name);
  icon.setAttribute("aria-hidden", "true");
  return icon;
}

function makeDownloadIcon() {
  return makeLucideIcon("download", "h-4 w-4");
}

async function loadParts() {
  const paths = ["database/parts.json", "../database/parts.json"];
  for (const path of paths) {
    try {
      const response = await fetch(path);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      // ignore
    }
  }
  return null;
}

function getPartConfig(levelKey, module) {
  if (!state.parts) {
    return null;
  }
  const levelEntry = state.parts.levels?.[levelKey] || {};
  const parts = Array.isArray(levelEntry) ? levelEntry : levelEntry.parts || [];
  return parts.find((part) => part.module === module) || null;
}

function getPdfFilename(levelKey, themeKey, versionKey) {
  const version = versionKey || "default";
  return `${levelKey}-${themeKey}-${version}.pdf`;
}

async function loadNamedDatabase(fileName) {
  if (!fileName) {
    return null;
  }
  const paths = [`database/${fileName}`, `../database/${fileName}`];
  for (const path of paths) {
    try {
      const response = await fetch(path);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      // ignore and try next
    }
  }
  return null;
}

function getShreibenTasks(levelKey) {
  const levelEntry = state.shreibenDb?.levels?.[levelKey];
  if (!levelEntry) {
    return [];
  }

  const normalizeTitle = (value) => {
    return String(value || "")
      .replace(/^#{1,6}\s+/, "")
      .replace(/^[\-*+]\s+/, "")
      .replace(/\*\*/g, "")
      .replace(/`/g, "")
      .trim();
  };

  const markdownTitle = (markdown, index) => {
    const lines = String(markdown || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const heading = lines.find((line) => /^#{1,6}\s+/.test(line));
    if (heading) {
      const value = normalizeTitle(heading);
      if (value) {
        return value;
      }
    }
    if (lines.length) {
      const value = normalizeTitle(lines[0]);
      if (value) {
        return value;
      }
    }
    return `Task ${index + 1}`;
  };

  if (Array.isArray(levelEntry.tasks)) {
    return levelEntry.tasks.map((task, index) => {
      const id = String(task?.id || `task-${index + 1}`).trim() || `task-${index + 1}`;
      const istructions = String(task?.istructions ?? task?.instructions ?? "").trim();
      const fallbackTitle = String(task?.title || "").trim();
      const title = fallbackTitle || markdownTitle(istructions, index);
      return {
        id,
        title,
        prompt: String(task?.content || "").trim(),
        partKey: "teil-1",
        partLabel: "Schreiben"
      };
    });
  }

  const order = levelEntry.partOrder || Object.keys(levelEntry.parts || {});
  const tasks = [];
  order.forEach((partKey) => {
    const partEntry = levelEntry.parts?.[partKey];
    const partTasks = partEntry?.content?.tasks || [];
    partTasks.forEach((task, index) => {
      const id = String(task?.id || `task-${index + 1}`).trim() || `task-${index + 1}`;
      const istructions = String(task?.istructions ?? task?.instructions ?? "").trim();
      const fallbackTitle = String(task?.title || "").trim();
      const title = fallbackTitle || markdownTitle(istructions, index);
      const prompt = String(task?.content || task?.prompt || "").trim();
      tasks.push({
        id,
        title,
        prompt,
        partKey,
        partLabel: partEntry?.meta?.partLabel || partKey
      });
    });
  });
  return tasks;
}

function countWords(text) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function getShreibenWordCount(levelKey, taskId, partKey = "teil-1") {
  if (!levelKey || !taskId) {
    return 0;
  }
  const storageKey = `zdeutsch.shreiben.${levelKey}.${taskId}`;
  const current = window.localStorage.getItem(storageKey);
  if (current) {
    return countWords(current);
  }

  const legacyStorageKey = `zdeutsch.shreiben.${levelKey}.${partKey}.${taskId}`;
  const legacyText = window.localStorage.getItem(legacyStorageKey) || "";
  return countWords(legacyText);
}

const PDF_STYLES = `
  @page {
    size: A4;
    margin: 0;
  }
  .pdf-export {
    font-family: "Helvetica Neue", Arial, sans-serif;
    font-size: 12px;
    color: #1f2933;
    margin: 0;
    padding: 10mm 14mm 12mm;
    width: 210mm;
    max-width: 210mm;
    background: #ffffff;
  }
  .pdf-export,
  .pdf-export * {
    box-sizing: border-box;
  }
  .pdf-export .no-break {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .pdf-export h2 {
    font-size: 18px;
    margin: 0 0 12px;
  }
  .pdf-export h3 {
    font-size: 14px;
    margin: 12px 0 8px;
  }
  .pdf-export p {
    margin: 0 0 8px;
    line-height: 1.5;
  }
  .pdf-export .page {
    padding: 8px 0 16px;
    page-break-after: always;
    break-after: page;
  }
  .pdf-export .page:last-of-type {
    page-break-after: auto;
    break-after: auto;
  }
  .pdf-export .version-block + .version-block {
    page-break-before: always;
    break-before: page;
  }
  .pdf-export .meta {
    border: 1px solid #e7d9c6;
    background: #fbf7f0;
    padding: 10px 12px;
    border-radius: 12px;
    margin-bottom: 16px;
  }
  .pdf-export .meta,
  .pdf-export .item,
  .pdf-export .question,
  .pdf-export .text-block,
  .pdf-export .correction-block,
  .pdf-export .blank-lines,
  .pdf-export .word-bank,
  .pdf-export .anzeige-list,
  .pdf-export .answer-line {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .pdf-export .meta-title {
    font-size: 16px;
    font-weight: 700;
  }
  .pdf-export .meta-subtitle {
    margin-top: 4px;
    color: #5c6672;
  }
  .pdf-export .columns {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
  .pdf-export .section {
    margin-bottom: 12px;
    break-inside: auto;
  }
  .pdf-export .col {
    min-width: 0;
  }
  .pdf-export .grid-two {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px 12px;
  }
  .pdf-export .grid-two .item {
    margin-bottom: 0;
  }
  .pdf-export .item {
    border: 1px solid #e7d9c6;
    border-radius: 12px;
    padding: 10px 12px;
    margin-bottom: 10px;
    background: #fff;
  }
  .pdf-export .item-id {
    font-weight: 700;
    margin-bottom: 6px;
    color: #0f766e;
  }
  .pdf-export .item-text {
    line-height: 1.45;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  .pdf-export .list {
    padding-left: 16px;
    margin: 0;
  }
  .pdf-export .list.grid-two {
    padding-left: 0;
    list-style-position: inside;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px 16px;
  }
  .pdf-export .list.grid-two li {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .pdf-export .list li {
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  .pdf-export .question {
    border: 1px solid #e7d9c6;
    border-radius: 12px;
    padding: 10px 12px;
    margin-bottom: 10px;
  }
  .pdf-export .question-title {
    font-weight: 600;
    margin-bottom: 6px;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  .pdf-export .text-block {
    border: 1px solid #e7d9c6;
    border-radius: 12px;
    padding: 12px;
    background: #fff;
    margin-bottom: 12px;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  .pdf-export .answer-line {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
  }
  .pdf-export .answer-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: #6b7280;
    white-space: nowrap;
  }
  .pdf-export .answer-rule {
    display: block;
    flex: 1;
    border-bottom: 1px solid #bfb6a6;
    height: 12px;
  }
  .pdf-export .blank {
    display: inline-flex;
    align-items: flex-end;
    gap: 6px;
    margin: 0 4px;
  }
  .pdf-export .blank-id {
    font-size: 10px;
    color: #6b7280;
  }
  .pdf-export .blank-line {
    display: block;
    flex: 1;
    min-width: 72px;
    border-bottom: 1px solid #bfb6a6;
    height: 12px;
  }
  .pdf-export .blank-lines {
    margin-top: 10px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px 12px;
  }
  .pdf-export .blank-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
  }
  .pdf-export .blank-row .answer-rule {
    height: 12px;
  }
  .pdf-export .word-bank {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .pdf-export .word-bank span {
    border: 1px solid #e7d9c6;
    border-radius: 999px;
    padding: 4px 8px;
    background: #fbf7f0;
    font-size: 11px;
  }
  .pdf-export .corrections {
    page-break-before: always;
    break-before: page;
  }
  .pdf-export .corrections-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px 12px;
  }
  .pdf-export .correction-block {
    border: 1px solid #e7d9c6;
    border-radius: 12px;
    padding: 10px 12px;
    margin-bottom: 10px;
    background: #fff;
  }
  .pdf-export .doc-title {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .pdf-export .doc-subtitle {
    font-size: 12px;
    color: #5c6672;
    margin-bottom: 16px;
  }
`;

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapWords(value) {
  const text = String(value || "");
  return text
    .split(/(\s+)/)
    .map((chunk) => {
      if (!chunk) {
        return "";
      }
      if (/^\s+$/.test(chunk)) {
        return chunk;
      }
      return `<span class="no-break">${escapeHtml(chunk)}</span>`;
    })
    .join("");
}

function wrapAllWords(root) {
  const doc = root?.ownerDocument || document;
  const nodeFilter = (doc.defaultView && doc.defaultView.NodeFilter) || NodeFilter;
  const walker = doc.createTreeWalker(
    root,
    nodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) {
          return nodeFilter.FILTER_SKIP;
        }
        const parent = node.parentElement;
        if (!parent) {
          return nodeFilter.FILTER_SKIP;
        }
        if (parent.closest(".no-break")) {
          return nodeFilter.FILTER_SKIP;
        }
        const tag = parent.tagName;
        if (tag === "STYLE" || tag === "SCRIPT" || tag === "TITLE") {
          return nodeFilter.FILTER_SKIP;
        }
        return nodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const nodes = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }
  nodes.forEach((textNode) => {
    const parts = textNode.nodeValue.split(/(\s+)/);
    const fragment = doc.createDocumentFragment();
    parts.forEach((part) => {
      if (!part) {
        return;
      }
      if (/^\s+$/.test(part)) {
        fragment.append(doc.createTextNode(part));
        return;
      }
      const span = doc.createElement("span");
      span.className = "no-break";
      span.textContent = part;
      fragment.append(span);
    });
    textNode.parentNode.replaceChild(fragment, textNode);
  });
}

function renderHeaderBlock(title, subtitle) {
  return `
    <div class="meta">
      <div class="meta-title">${wrapWords(title)}</div>
      <div class="meta-subtitle">${wrapWords(subtitle || "")}</div>
    </div>
  `;
}

function renderAnswerLine(label) {
  const safeLabel = label ? wrapWords(label) : wrapWords("Antwort");
  return `
    <div class="answer-line">
      <span class="answer-label">${safeLabel}:</span>
      <span class="answer-rule"></span>
    </div>
  `;
}

function getBlankIdsFromSegments(segments) {
  const ids = [];
  const seen = new Set();
  (segments || []).forEach((segment) => {
    if (segment.type === "text") {
      return;
    }
    const value = segment.id;
    if (value === undefined || value === null) {
      return;
    }
    const key = String(value);
    if (!seen.has(key)) {
      seen.add(key);
      ids.push(key);
    }
  });
  return ids;
}

function getBlankIds(content) {
  const ids = [];
  const seen = new Set();
  const addId = (value) => {
    if (value === undefined || value === null) {
      return;
    }
    const key = String(value);
    if (!seen.has(key)) {
      seen.add(key);
      ids.push(key);
    }
  };
  (content?.blanks || []).forEach((blank) => addId(blank.id));
  getBlankIdsFromSegments(content?.segments || []).forEach(addId);
  return ids;
}

function renderBlankLines(blankIds) {
  if (!blankIds.length) {
    return "";
  }
  return `
    <div class="blank-lines">
      ${blankIds
        .map(
          (id) => `
            <div class="blank-row">
              <span class="answer-label">Lücke ${wrapWords(id)}</span>
              <span class="answer-rule"></span>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderTextList(items, options = {}) {
  const answerLabel = options.answerLabel;
  return (items || [])
    .map(
      (item) => `
        <div class="item">
          <div class="item-id">${wrapWords(item.id)}</div>
          <div class="item-text">${wrapWords(item.text)}</div>
          ${answerLabel ? renderAnswerLine(answerLabel) : ""}
        </div>
      `
    )
    .join("");
}

function renderTextGrid(items, options = {}) {
  const answerLabel = options.answerLabel;
  return `
    <div class="grid-two">
      ${(items || [])
        .map(
          (item) => `
            <div class="item">
              <div class="item-id">${wrapWords(item.id)}</div>
              <div class="item-text">${wrapWords(item.text)}</div>
              ${answerLabel ? renderAnswerLine(answerLabel) : ""}
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderHeadlines(items) {
  return `
    <ul class="list">
      ${(items || [])
        .map(
          (item) => `
            <li><strong>${wrapWords(item.id)}.</strong> ${wrapWords(item.text)}</li>
          `
        )
        .join("")}
    </ul>
  `;
}

function splitParagraphs(paragraphs) {
  const list = paragraphs || [];
  const totalChars = list.reduce((sum, item) => sum + item.length, 0);
  if (list.length <= 4 && totalChars < 1400) {
    return [list];
  }
  const target = totalChars / 2;
  const first = [];
  const second = [];
  let current = 0;
  list.forEach((para, index) => {
    if (index === list.length - 1) {
      second.push(para);
      return;
    }
    if (current < target) {
      first.push(para);
      current += para.length;
    } else {
      second.push(para);
    }
  });
  return [first, second].filter((block) => block.length);
}

function renderQuestion(question) {
  const options = (question.options || [])
    .map(
      (option) => `
        <li><strong>${wrapWords(option.id.toUpperCase())})</strong> ${wrapWords(option.text)}</li>
      `
    )
    .join("");
  return `
    <div class="question">
      <div class="question-title">${wrapWords(question.id)}. ${wrapWords(question.prompt)}</div>
      <ul class="list">${options}</ul>
      ${renderAnswerLine("Antwort")}
    </div>
  `;
}

function renderSegments(segments) {
  return (segments || [])
    .map((segment) => {
      if (segment.type === "text") {
        return wrapWords(segment.value);
      }
      return `
        <span class="blank">
          <span class="blank-id">${wrapWords(segment.id)}</span>
          <span class="blank-line"></span>
        </span>
      `;
    })
    .join("");
}

function renderOptionsPerBlank(blanks) {
  return `
    <ul class="list grid-two">
      ${(blanks || [])
        .map(
          (blank) => `
            <li><strong>Lücke ${wrapWords(blank.id)}:</strong> ${wrapWords(
              (blank.options || []).join(" / ")
            )}</li>
          `
        )
        .join("")}
    </ul>
  `;
}

function renderWordBank(options) {
  return `
    <div class="word-bank">
      ${(options || []).map((option) => `<span>${wrapWords(option)}</span>`).join("")}
    </div>
  `;
}

function renderTeil1(content) {
  return `
    <section class="page">
      ${renderHeaderBlock("Lesen Teil 1", content.instruction || "")}
      <div class="section">
        <h3>${wrapWords("Überschriften")}</h3>
        ${renderHeadlines(content.headlines || [])}
      </div>
      <div class="section">
        <h3>${wrapWords("Texte")}</h3>
        ${renderTextList(content.texts || [], { answerLabel: "Antwort" })}
      </div>
    </section>
  `;
}

function renderTeil2(content) {
  const paragraphList = content.passage?.paragraphs || [];
  const textBlocks = splitParagraphs(paragraphList)
    .map((block) => block.map((para) => `<p>${wrapWords(para)}</p>`).join(""))
    .map((block) => `<div class="text-block">${block || ""}</div>`)
    .join("");
  const questions = (content.questions || []).map(renderQuestion).join("");
  return `
    <section class="page">
      ${renderHeaderBlock("Lesen Teil 2", content.instruction || "")}
      <h3>${wrapWords(content.passage?.title || "")}</h3>
      ${textBlocks}
      <h3>${wrapWords("Aufgaben")}</h3>
      ${questions}
    </section>
  `;
}

function renderTeil3(content) {
  return `
    <section class="page">
      ${renderHeaderBlock("Lesen Teil 3", "Ordnen Sie die Situationen den Anzeigen zu.")}
      <h3>${wrapWords("Situationen")}</h3>
      ${renderTextGrid(content.situations || [], { answerLabel: "Antwort" })}
      <h3>${wrapWords("Anzeigen")}</h3>
      ${renderTextGrid(content.ads || [])}
    </section>
  `;
}

function renderSprach1(content) {
  const blanks = content.blanks || [];
  const blankIds = getBlankIds(content);
  return `
    <section class="page">
      ${renderHeaderBlock("Sprachbausteine 1", content.instruction || "")}
      <div class="text-block">${renderSegments(content.segments || [])}</div>
      ${renderBlankLines(blankIds)}
      <h3>${wrapWords("Optionen")}</h3>
      ${renderOptionsPerBlank(blanks)}
    </section>
  `;
}

function renderSprach2(content) {
  const blankIds = getBlankIds(content);
  const wordBank = (content.wordBank && content.wordBank.length)
    ? content.wordBank.map((item) => item.text || item.answer || item)
    : (content.options || []).length
      ? content.options
      : (content.blanks || []).map((item) => item.answer).filter(Boolean);
  return `
    <section class="page">
      ${renderHeaderBlock("Sprachbausteine 2", content.instruction || "")}
      <div class="text-block">${renderSegments(content.segments || [])}</div>
      ${renderBlankLines(blankIds)}
      <h3>${wrapWords("Wortliste")}</h3>
      ${renderWordBank(wordBank)}
    </section>
  `;
}

function renderCorrections(lesenEntry, label) {
  const parts = lesenEntry.parts || {};
  const blocks = ["teil-1", "teil-2", "teil-3", "sprachbausteine-1", "sprachbausteine-2"]
    .filter((key) => parts[key])
    .map((partKey) => {
      const content = parts[partKey].content || {};
      if (partKey === "teil-1") {
        const answers = (content.answers || [])
          .map((answer) => `<li>${wrapWords(`Text ${answer.textId} → ${answer.headlineId}`)}</li>`)
          .join("");
        return `
          <div class="correction-block">
            <h3>${wrapWords("Lesen Teil 1")}</h3>
            <ul class="list">${answers}</ul>
          </div>
        `;
      }
      if (partKey === "teil-2") {
        const answers = (content.questions || [])
          .map(
            (question) =>
              `<li>${wrapWords(
                `Frage ${question.id} → ${(question.answerId?.toUpperCase() || "")} ${question.answerText || ""}`
              )}</li>`
          )
          .join("");
        return `
          <div class="correction-block">
            <h3>${wrapWords("Lesen Teil 2")}</h3>
            <ul class="list">${answers}</ul>
          </div>
        `;
      }
      if (partKey === "teil-3") {
        const answers = (content.answers || [])
          .map(
            (answer) =>
              `<li>${wrapWords(`Situation ${answer.situationId} → ${answer.adId}`)}</li>`
          )
          .join("");
        return `
          <div class="correction-block">
            <h3>${wrapWords("Lesen Teil 3")}</h3>
            <ul class="list">${answers}</ul>
          </div>
        `;
      }
      if (partKey === "sprachbausteine-1") {
        const answers = (content.answers || [])
          .map((answer) => `<li>${wrapWords(`Lücke ${answer.id} → ${answer.answer}`)}</li>`)
          .join("");
        return `
          <div class="correction-block">
            <h3>${wrapWords("Sprachbausteine 1")}</h3>
            <ul class="list">${answers}</ul>
          </div>
        `;
      }
      if (partKey === "sprachbausteine-2") {
        const answers = (content.answers || [])
          .map((answer) => `<li>${wrapWords(`Lücke ${answer.id} → ${answer.answer}`)}</li>`)
          .join("");
        return `
          <div class="correction-block">
            <h3>${wrapWords("Sprachbausteine 2")}</h3>
            <ul class="list">${answers}</ul>
          </div>
        `;
      }
      return "";
    });

  const titleText = label ? `Korrekturen (${label})` : "Korrekturen";
  const title = wrapWords(titleText);
  return `
    <section class="page corrections">
      <h2>${title}</h2>
      <div class="corrections-grid">
        ${blocks.join("")}
      </div>
    </section>
  `;
}

function buildPdfMarkup({ levelLabel, versions }) {
  const versionBlocks = (versions || []).map((version) => {
    const lesenEntry = version.lesenEntry || {};
    const parts = lesenEntry.parts || {};
    const orderedParts = ["teil-1", "teil-2", "teil-3", "sprachbausteine-1", "sprachbausteine-2"]
      .filter((key) => parts[key])
      .map((partKey) => {
        const content = parts[partKey].content || {};
        if (partKey === "teil-1") {
          return renderTeil1(content);
        }
        if (partKey === "teil-2") {
          return renderTeil2(content);
        }
        if (partKey === "teil-3") {
          return renderTeil3(content);
        }
        if (partKey === "sprachbausteine-1") {
          return renderSprach1(content);
        }
        if (partKey === "sprachbausteine-2") {
          return renderSprach2(content);
        }
        return "";
      });

    return `
      <div class="version-block">
        <div class="doc-title">${wrapWords(version.examTitle || "")}</div>
        <div class="doc-subtitle">${wrapWords(levelLabel)} · ${wrapWords(version.versionLabel || "")}</div>
        ${orderedParts.join("")}
        ${renderCorrections(lesenEntry, version.versionLabel)}
      </div>
    `;
  });

  return versionBlocks.join("");
}

async function fetchPdfBlob(url) {
  try {
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) {
      return null;
    }
    return await response.blob();
  } catch (error) {
    return null;
  }
}

function downloadBlob(blob, fileName) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

let cachedLogoData = null;

async function getLogoData() {
  if (cachedLogoData) {
    return cachedLogoData;
  }
  try {
    const response = await fetch("logo.svg", { cache: "force-cache" });
    if (!response.ok) {
      return null;
    }
    const svgText = await response.text();
    const blob = new Blob([svgText], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const image = new Image();
    const dataUrl = await new Promise((resolve, reject) => {
      image.onload = () => {
        const maxHeight = 24;
        const ratio = image.width / image.height || 1;
        const canvas = document.createElement("canvas");
        canvas.height = maxHeight;
        canvas.width = Math.round(maxHeight * ratio);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/png"));
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Logo load failed"));
      };
      image.src = url;
    });
    cachedLogoData = { dataUrl, width: image.width, height: image.height };
    return cachedLogoData;
  } catch (error) {
    return null;
  }
}

function addPdfHeaderFooter(pdf, { headerTitle, footerText, logoData }) {
  const pageCount = pdf.internal.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const headerY = 26;
  const footerY = pageHeight - 18;
  const leftMargin = 40;
  const rightMargin = pageWidth - 40;

  pdf.setFont("helvetica", "normal");
  for (let i = 1; i <= pageCount; i += 1) {
    pdf.setPage(i);
    if (logoData?.dataUrl) {
      const logoHeight = 18;
      const ratio = logoData.width / logoData.height || 1;
      const logoWidth = logoHeight * ratio;
      pdf.addImage(logoData.dataUrl, "PNG", leftMargin, headerY - 14, logoWidth, logoHeight);
      pdf.setFontSize(10);
      pdf.text("Zadelkhair   Deutsch Exam Library", leftMargin + logoWidth + 8, headerY);
    } else {
      pdf.setFontSize(10);
      pdf.text("Zadelkhair   Deutsch Exam Library", leftMargin, headerY);
    }
    pdf.setFontSize(12);
    pdf.text(headerTitle || "", rightMargin, headerY, { align: "right" });

    pdf.setFontSize(9);
    pdf.text(footerText || "", leftMargin, footerY);
    pdf.text(`Page ${i} / ${pageCount}`, rightMargin, footerY, { align: "right" });
  }
}

async function generatePdfFromData({ levelLabel, versions, fileName, headerTitle }) {
  if (!window.html2pdf) {
    throw new Error("html2pdf is not available.");
  }
  const styleTag = document.createElement("style");
  styleTag.textContent = PDF_STYLES;
  document.head.append(styleTag);

  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.overflow = "auto";
  overlay.style.background = "rgba(255, 255, 255, 0.92)";
  overlay.style.zIndex = "9999";

  const container = document.createElement("div");
  container.className = "pdf-export";
  container.style.width = "210mm";
  container.style.margin = "0";
  container.style.background = "#ffffff";
  container.style.boxSizing = "border-box";
  container.innerHTML = buildPdfMarkup({
    levelLabel,
    versions
  });
  wrapAllWords(container);

  overlay.append(container);
  document.body.append(overlay);

  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    const worker = window.html2pdf()
      .set({
        margin: [60, 0, 50, 0],
        filename: fileName,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          scrollX: 0,
          scrollY: 0
        },
        pagebreak: {
          mode: ["css", "legacy"],
          avoid: ".meta,.columns,.item,.question,.text-block,.correction-block,.blank-lines,.answer-line"
        },
        jsPDF: { unit: "pt", format: "a4", orientation: "portrait" }
      })
      .from(container);
    const pdf = await worker.toPdf().get("pdf");
    const logoData = await getLogoData();
    addPdfHeaderFooter(pdf, {
      headerTitle,
      footerText: "created by abdelkoddous zadelkhair",
      logoData
    });
    pdf.save(fileName);
  } finally {
    overlay.remove();
    styleTag.remove();
  }
}

async function downloadThemePdf(themeKey, themeEntry) {
  if (!themeEntry || !themeKey) {
    return;
  }
  const versionKeys = getVersionKeys(themeEntry);
  const defaultVersion = themeEntry.defaultVersion || versionKeys[0] || "default";
  const hasMultipleVersions = versionKeys.length > 1;
  const resolvedVersionKeys = hasMultipleVersions ? versionKeys : [defaultVersion];
  const levelKey = state.level || "b1";
  const fileName = hasMultipleVersions
    ? getPdfFilename(levelKey, themeKey, "all")
    : getPdfFilename(levelKey, themeKey, defaultVersion);
  const url = new URL(`exports/${fileName}`, window.location.href).href;
  const buildVersionData = (versionKey) => {
    const versionEntry = themeEntry.versions?.[versionKey] || themeEntry.versions?.default;
    const lesenEntry = versionEntry?.lesen || themeEntry.lesen;
    if (!lesenEntry) {
      return null;
    }
    return {
      versionKey,
      versionLabel: versionEntry?.label || versionKey,
      examTitle: versionEntry?.title || themeEntry.title || themeKey,
      lesenEntry
    };
  };
  const versions = resolvedVersionKeys
    .map(buildVersionData)
    .filter(Boolean);

  const existingBlob = await fetchPdfBlob(url);
  if (existingBlob) {
    downloadBlob(existingBlob, fileName);
    return;
  }

  if (!versions.length) {
    window.alert("PDF data is missing for this theme.");
    return;
  }

  try {
    await generatePdfFromData({
      levelLabel: levelKey.toUpperCase(),
      versions,
      fileName,
      headerTitle: themeEntry.title || themeKey
    });
  } catch (error) {
    console.error(error);
    window.alert("Failed to generate the PDF in the browser.");
  }
}

function closeVersionModal() {
  if (!versionModal) {
    return;
  }
  versionModal.classList.add("hidden");
  state.pendingTheme = null;
}

function buildLesenUrl(themeKey, versionKey) {
  const params = new URLSearchParams();
  if (state.level) {
    params.set("level", state.level);
  }
  if (themeKey) {
    params.set("theme", themeKey);
  }
  if (versionKey) {
    params.set("version", versionKey);
  }
  const query = params.toString();
  return `lesen.html${query ? `?${query}` : ""}`;
}

function selectThemeVersion(themeKey, versionKey) {
  closeVersionModal();
  window.location.href = buildLesenUrl(themeKey, versionKey);
}

function openVersionModal(themeKey, themeEntry) {
  if (!versionModal || !versionOptions) {
    const versionKeys = getVersionKeys(themeEntry);
    const fallback = themeEntry.defaultVersion || versionKeys[0] || "default";
    selectThemeVersion(themeKey, fallback);
    return;
  }
  state.pendingTheme = themeKey;
  if (versionTitle) {
    versionTitle.textContent = themeEntry.title || "Select version";
  }
  versionOptions.innerHTML = "";
  const versionKeys = getVersionKeys(themeEntry);
  versionKeys.forEach((versionKey) => {
    const versionEntry = themeEntry.versions?.[versionKey];
    const label = versionEntry?.label || `Version ${versionKey}`;
    const isDefault = versionKey === themeEntry.defaultVersion;
    const button = createEl(
      "button",
      classNames(
        "w-full rounded-2xl border border-stone-300 bg-white/90 p-4 text-left shadow-sm transition-transform",
        isDefault ? "ring-2 ring-azure/20" : "hover:border-stone-300 hover:-translate-y-0.5"
      )
    );
    button.type = "button";
    button.append(
      createEl("div", "text-sm font-display text-ink", label),
      createEl("div", "mt-1 text-xs text-slate", versionEntry?.title || "")
    );
    button.addEventListener("click", () => {
      selectThemeVersion(themeKey, versionKey);
    });
    versionOptions.append(button);
  });
  versionModal.classList.remove("hidden");
}

function handleThemeSelection(themeKey, themeEntry) {
  const versionKeys = getVersionKeys(themeEntry);
  if (versionKeys.length > 1) {
    openVersionModal(themeKey, themeEntry);
    return;
  }
  const fallback = themeEntry.defaultVersion || versionKeys[0] || "default";
  selectThemeVersion(themeKey, fallback);
}

function renderLevelButtons() {
  const levels = Object.keys(state.db.levels || {});
  if (!state.level) {
    state.level = levels[0] || null;
  }
  levelList.innerHTML = "";
  levels.forEach((levelKey) => {
    const button = renderChoiceButton(levelKey.toUpperCase(), levelKey === state.level);
    button.type = "button";
    button.addEventListener("click", () => {
      state.level = levelKey;
      state.theme = null;
      window.localStorage.setItem("lastLevel", levelKey);
      renderHome();
    });
    levelList.append(button);
  });
}

function renderSectionButtons() {
  sectionList.innerHTML = "";
  const sectionLabels = {
    lesen: "LESEN",
    horen: "HÖREN",
    shreiben: "SHREIBEN"
  };
  const levelKey = state.level || "b1";
  const levelEntry = state.parts?.levels?.[levelKey];
  const partConfigs = Array.isArray(levelEntry) ? levelEntry : (levelEntry?.parts || []);
  const availableSections = partConfigs.length
    ? Array.from(new Set(partConfigs.map((entry) => normalize(entry.module)).filter(Boolean)))
    : ["lesen", "horen"];

  if (!availableSections.includes(state.section)) {
    state.section = availableSections[0] || "lesen";
  }
  syncSectionHash(state.section, { replace: true });

  availableSections.forEach((value) => {
    const label = sectionLabels[value] || value.toUpperCase();
    const button = renderChoiceButton(label, state.section === value);
    button.type = "button";
    button.addEventListener("click", () => {
      if (state.section === value) {
        syncSectionHash(value);
        return;
      }
      state.section = value;
      syncSectionHash(state.section);
      renderSectionButtons();
      renderThemeCards();
    });
    sectionList.append(button);
  });
}

function renderThemeCards() {
  themeGrid.innerHTML = "";
  const levelKey = state.level || "b1";
  if (state.section === "horen") {
    const partConfig = getPartConfig(levelKey, "horen");
    themeGrid.append(
      createEl(
        "div",
        "rounded-3xl border border-stone-200 bg-white/90 p-6 text-sm text-slate",
        "Hören-Codes öffnen eine separate Übung, bei der Sie Aussagen als richtig oder falsch markieren."
      )
    );
    if (partConfig) {
      themeGrid.append(buildHorenCard(levelKey, partConfig));
    } else {
      themeGrid.append(
        createEl(
          "div",
          "rounded-2xl border border-rose/30 bg-rose/10 p-4 text-sm text-rose",
          "Für diese Ebene sind noch keine Hören-Codes verfügbar."
        )
      );
    }
    return;
  }
  if (state.section === "shreiben") {
    const partConfig = getPartConfig(levelKey, "shreiben");
    const tasks = getShreibenTasks(levelKey);
    if (partConfig && tasks.length) {
      tasks.forEach((task) => {
        themeGrid.append(buildShreibenCard(levelKey, task));
      });
    } else {
      themeGrid.append(
        createEl(
          "div",
          "rounded-2xl border border-rose/30 bg-rose/10 p-4 text-sm text-rose",
          "Für diese Ebene sind noch keine Schreiben-Aufgaben verfügbar."
        )
      );
    }
    return;
  }
  const levelEntry = state.db.levels[levelKey] || {};
  let themes = levelEntry.themeOrder?.length
    ? levelEntry.themeOrder
    : Object.keys(levelEntry.themes || {});
  const query = normalize(state.search);
  if (query) {
    themes = themes.filter((themeKey) => {
      const entry = levelEntry.themes?.[themeKey];
      const title = entry?.title || themeKey;
      return normalize(title).includes(query);
    });
  }
  if (state.theme && !themes.includes(state.theme)) {
    state.theme = null;
  }
  if (!state.theme && themes.length) {
    state.theme = themes[0] || null;
  }

  themes.forEach((themeKey) => {
    const themeEntry = levelEntry.themes?.[themeKey];
    if (!themeEntry) {
      return;
    }
    const versionKeys = getVersionKeys(themeEntry);
    const defaultVersion = themeEntry.defaultVersion || versionKeys[0];
    const versionEntry = themeEntry.versions?.[defaultVersion];
    const partCount = versionEntry?.lesen?.partOrder?.length
      || versionEntry?.lesen?.counts?.parts
      || themeEntry.lesen?.partOrder?.length
      || themeEntry.lesen?.counts?.parts
      || themeEntry.counts?.parts
      || 0;
    const card = createEl(
      "button",
      classNames("theme-card", themeKey === state.theme ? "theme-card-active" : "")
    );
    card.type = "button";
    const header = createEl("div", "theme-card-header");
    const titleWrap = createEl("div", "theme-card-title-wrap");
    titleWrap.append(
      createEl("div", "theme-card-title", themeEntry.title || themeKey),
      createEl("div", "theme-card-subtitle", "Reading practice")
    );
    const actions = createEl("div", "theme-card-actions");
    const levelBadge = createEl(
      "span",
      "theme-card-level",
      (state.level || "").toUpperCase()
    );
    const downloadBtn = createEl(
      "button",
      "theme-card-download"
    );
    downloadBtn.type = "button";
    downloadBtn.title = "Download PDF";
    downloadBtn.append(makeDownloadIcon());
    downloadBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      downloadThemePdf(themeKey, themeEntry);
    });
    actions.append(levelBadge, downloadBtn);
    header.append(titleWrap, actions);

    const progressSummary = getThemeProgressSummary(levelKey, themeKey, versionKeys);
    const status = getThemeStatus(progressSummary);
    const lastPercent = clampPercent(progressSummary?.lastPercent || 0);

    const summaryRow = createEl("div", "theme-card-summary");
    const statusBadge = createEl("span", classNames("theme-card-status", status.className), status.label);
    const scoreBox = createEl("div", "theme-card-score");
    scoreBox.append(
      createEl("span", "theme-card-score-label", "Last score"),
      createEl("span", "theme-card-score-value", `${lastPercent}%`)
    );
    summaryRow.append(statusBadge, scoreBox);

    const progressBar = createEl("div", "theme-card-progress-track");
    const progressFill = createEl("div", "theme-card-progress-fill");
    progressFill.style.width = `${lastPercent}%`;
    progressBar.append(progressFill);

    const meta = createEl("div", "theme-card-meta");
    meta.append(makeMetaPill(`${partCount} parts`));
    if (versionKeys.length > 1) {
      meta.append(makeMetaPill(`${versionKeys.length} versions`));
    }
    if (progressSummary) {
      meta.append(makeMetaPill(formatPassedExamsLabel(progressSummary.passedExams)));
      if (progressSummary.versionCount > 1) {
        meta.append(makeMetaPill(`Passed versions: ${progressSummary.passedVersions}/${progressSummary.versionCount}`));
      }
    } else {
      meta.append(makeMetaPill("No attempts yet"));
    }

    card.append(header, summaryRow, progressBar, meta);
    card.addEventListener("click", () => {
      handleThemeSelection(themeKey, themeEntry);
    });
    themeGrid.append(card);
  });

  if (!themes.length) {
    themeGrid.append(
      createEl(
        "div",
        "rounded-2xl border border-stone-200 bg-stone-50 p-6 text-sm text-slate",
        "No themes found."
      )
    );
  }
  refreshIcons();
}

function buildHorenCard(levelKey, partConfig) {
  const title = partConfig?.name || "Hören Codes";
  const subtitle = partConfig?.description || "Markieren Sie jede Aussage als richtig oder falsch.";
  const file = partConfig?.file || "horen-codes.json";
  const card = createEl(
    "a",
    classNames(
      "rounded-2xl border border-stone-300 bg-white/90 p-5 text-left shadow-panel transition-transform hover:-translate-y-0.5 hover:border-azure/40 min-h-[140px] flex flex-col justify-between",
      "ring-2 ring-mint/10"
    )
  );
  card.href = `horen.html?level=${levelKey}`;
  card.append(
    createEl("div", "text-sm font-display text-ink", title),
    createEl("div", "mt-2 text-xs text-slate", subtitle)
  );
  return card;
}

function buildShreibenCard(levelKey, task) {
  const title = task?.title || "Schreiben";
  const wordCount = getShreibenWordCount(levelKey, task?.id, task?.partKey);
  const progressTarget = 150;
  const progressPercent = Math.max(0, Math.min(100, Math.round((wordCount / progressTarget) * 100)));
  const statusLabel = wordCount > 0 ? "In progress" : "Not started";
  const href = `shreiben.html?level=${encodeURIComponent(levelKey)}&task=${encodeURIComponent(task?.id || "")}`;
  const card = createEl("a", "theme-card");
  card.href = href;

  const topRow = createEl("div", "theme-card-header");
  const titleWrap = createEl("div", "theme-card-title-wrap");
  titleWrap.append(
    createEl("div", "theme-card-title", title),
    createEl("div", "theme-card-subtitle", "Writing practice")
  );

  const levelBadge = createEl(
    "span",
    "theme-card-level",
    levelKey.toUpperCase()
  );
  const actions = createEl("div", "theme-card-actions");
  actions.append(levelBadge);
  topRow.append(titleWrap, actions);

  const summaryRow = createEl("div", "theme-card-summary");
  const scoreBox = createEl("div", "theme-card-score");
  scoreBox.append(
    createEl("span", "theme-card-score-label", "Words"),
    createEl("span", "theme-card-score-value", `${wordCount}`)
  );
  summaryRow.append(
    createEl("span", "theme-card-status theme-card-status-progress", statusLabel),
    scoreBox
  );

  const progressBar = createEl("div", "theme-card-progress-track");
  const progressFill = createEl("div", "theme-card-progress-fill");
  progressFill.style.width = `${progressPercent}%`;
  progressBar.append(progressFill);

  card.append(topRow, summaryRow, progressBar);
  return card;
}

function renderHome() {
  renderLevelButtons();
  renderSectionButtons();
  renderThemeCards();
  if (themeSearchInput) {
    themeSearchInput.value = state.search || "";
  }
  updateHeader();
}

function resolveInitialLevel() {
  const levels = Object.keys(state.db.levels || {});
  if (!levels.length) {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("level");
  if (fromUrl && levels.includes(fromUrl)) {
    return fromUrl;
  }
  const stored = window.localStorage.getItem("lastLevel");
  if (stored && levels.includes(stored)) {
    return stored;
  }
  return levels[0];
}

if (themeSearchInput) {
  themeSearchInput.addEventListener("input", () => {
    state.search = themeSearchInput.value || "";
    renderThemeCards();
  });
}

window.addEventListener("hashchange", () => {
  if (!state.db) {
    return;
  }
  const hashSection = getSectionFromHash();
  if (!hashSection || hashSection === state.section) {
    return;
  }
  state.section = hashSection;
  renderSectionButtons();
  renderThemeCards();
});

if (versionCloseBtn) {
  versionCloseBtn.addEventListener("click", () => {
    closeVersionModal();
  });
}

if (versionOverlay) {
  versionOverlay.addEventListener("click", () => {
    closeVersionModal();
  });
}

async function init() {
  if (typeof setupCommunityWidgets === "function") {
    setupCommunityWidgets();
  }
  state.config = await loadConfig();
  setHomeLoaderVisible(true);
  state.db = await loadDatabase(state.config);
  state.shreibenDb = await loadNamedDatabase("shreiben.json");
  state.parts = await loadParts();
  setHomeLoaderVisible(false);
  if (!state.db) {
    themeGrid.innerHTML = "";
    themeGrid.append(
      createEl(
        "div",
        "rounded-2xl border border-stone-200 bg-stone-50 p-6 text-sm text-slate",
        "database/lesen.json not found. Run scripts/build_database.py"
      )
    );
    updateHeader();
    return;
  }

  state.level = resolveInitialLevel();
  const hashSection = getSectionFromHash();
  if (hashSection) {
    state.section = hashSection;
  }
  renderHome();
}

init();
