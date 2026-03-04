const returnBtn = document.getElementById("return-btn");
const levelPill = document.getElementById("level-pill");
const themeTitle = document.getElementById("theme-title");
const partCards = document.getElementById("part-cards");
const contentContainer = document.getElementById("shreiben-content");
const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const fontSizeInput = document.getElementById("font-size-input");
const fontSizeValue = document.getElementById("font-size-value");

const EDITOR_FONT_SIZE_KEY = "zdeutsch.shreiben.editorFontSize";
const DEFAULT_EDITOR_FONT_SIZE = 16;
const GERMAN_SPECIAL_CHARS = ["ä", "ö", "ü", "ß", "Ä", "Ö", "Ü", "ẞ"];
const CHATGPT_CORRECTION_PROMPT = `You are a certified TELC Deutsch B2 examiner.

Your task is to evaluate a TELC B2 Schreiben (writing task) exactly like a real TELC examiner and provide a realistic score.

The TELC B2 writing section is scored on a **maximum of 45 points**.

To calculate the score realistically, you must follow this **two-step scoring process**.

---

STEP 1 — RAW EVALUATION (0–5 PER CRITERION)

Evaluate the text using the 4 official TELC criteria.

Each criterion must be scored from **0 to 5**.

1️⃣ Aufgabenbewältigung (Task Completion)
Evaluate:

* Did the candidate answer **all Leitpunkte** (required points)?
* Is the content relevant to the topic?
* Are ideas explained clearly?

Scoring guideline:
5 = All points fully addressed and well explained
4 = All points addressed but slightly incomplete
3 = Some points missing or weak explanations
2 = Several points missing
1 = Mostly irrelevant or very incomplete
0 = Off-topic

---

2️⃣ Textaufbau und Kohärenz (Structure & Coherence)

Evaluate:

* Logical order of ideas
* Clear introduction and conclusion
* Paragraph organization
* Use of connectors (z.B. außerdem, jedoch, deshalb)

Scoring guideline:
5 = Excellent structure and connectors
4 = Good structure with minor issues
3 = Acceptable but limited connectors
2 = Weak organization
1 = Very confusing structure
0 = No structure

---

3️⃣ Sprachliche Korrektheit (Grammar & Accuracy)

Evaluate:

* Grammar
* Verb position
* Articles and cases (Akkusativ/Dativ)
* Sentence construction
* Spelling and punctuation

Scoring guideline:
5 = Very few errors, almost perfect grammar
4 = Some errors but does not affect understanding
3 = Frequent errors but message understandable
2 = Many grammar errors affecting clarity
1 = Very difficult to understand
0 = Incomprehensible

---

4️⃣ Ausdruck und Wortschatz (Vocabulary & Expression)

Evaluate:

* Vocabulary variety
* Formal writing style
* Natural phrasing
* Avoiding repetition

Scoring guideline:
5 = Rich vocabulary and natural formal style
4 = Good vocabulary with minor repetition
3 = Basic vocabulary but acceptable
2 = Limited vocabulary
1 = Very repetitive or incorrect vocabulary
0 = Very poor vocabulary

---

STEP 2 — SCORE CONVERSION

Add the raw scores from the four criteria.

Maximum raw score = **20 points**.

Then convert the raw score to the TELC scale **/45** using this formula:

Final Score = (Raw Score ÷ 20) × 45

Example:
Raw score = 15
Final score = (15 ÷ 20) × 45 = **33.75 ≈ 34 / 45**

Round to the nearest whole number.

---

OUTPUT FORMAT

Your answer MUST follow this exact order.

1️⃣ FINAL SCORE

Write clearly:

Gesamtpunktzahl: **X / 45**

Also show the raw score:

Raw Score: **X / 20**

---

2️⃣ CORRECTED TEXT

Rewrite the student's text with corrections.

Rules:

* Keep the student's ideas.
* Only correct grammar, vocabulary, and style.
* Highlight ONLY the modifications using **bold**.
* Do not change the meaning.

---

3️⃣ FEEDBACK (IN ARABIC)

Explain the evaluation in Arabic with the following sections:

### تقييم إنجاز المهمة (Aufgabenbewältigung)

Explain if the candidate answered all required points.

### تنظيم النص والترابط (Textaufbau und Kohärenz)

Explain how well the text is structured.

### الصحة اللغوية (Sprachliche Korrektheit)

Explain grammar mistakes.

### المفردات والأسلوب (Ausdruck und Wortschatz)

Evaluate vocabulary and writing style.

---

4️⃣ MAIN ERRORS

List the most important mistakes detected in the text.

Example:

* verb position mistakes
* wrong article usage
* missing connectors
* informal expressions

---

5️⃣ HOW TO IMPROVE

Give practical advice in Arabic on how to improve the writing score in the TELC B2 exam.

---

Important rules:

* Be strict and realistic like a TELC examiner.
* Do NOT invent missing content.
* Keep the student's ideas.
* Highlight corrections using **bold**.
* Feedback must be written in **Arabic**.

----------------------------------------------------

[USER TEXT]`;

const state = {
  data: null,
  levelKey: "b2",
  partKey: "teil-1",
  taskId: null,
  drafts: {},
  editorFontSize: DEFAULT_EDITOR_FONT_SIZE
};

function refreshIcons() {
  if (typeof window.lucide !== "undefined" && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

async function loadShreibenDatabase() {
  const paths = ["database/shreiben.json", "../database/shreiben.json"];
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

function getLevelEntry() {
  return state.data?.levels?.[state.levelKey] || null;
}

function getPart(partKey) {
  return getLevelEntry()?.parts?.[partKey] || null;
}

function partHasTask(partKey, taskId) {
  const selectedTaskId = String(taskId || "").trim();
  if (!selectedTaskId) {
    return false;
  }
  const tasks = getPart(partKey)?.content?.tasks || [];
  return tasks.some((task) => String(task?.id || "").trim() === selectedTaskId);
}

function buildDraftStorageKey(levelKey, partKey, taskId) {
  return `zdeutsch.shreiben.${levelKey}.${partKey}.${taskId}`;
}

function getDraftStorageKey(taskId) {
  return buildDraftStorageKey(state.levelKey, state.partKey, taskId);
}

function getDraftSavedAtStorageKey(taskId) {
  return `${getDraftStorageKey(taskId)}.savedAt`;
}

function getDraft(taskId) {
  const key = getDraftStorageKey(taskId);
  if (!Object.prototype.hasOwnProperty.call(state.drafts, key)) {
    state.drafts[key] = window.localStorage.getItem(key) || "";
  }
  return state.drafts[key];
}

function setDraft(taskId, value) {
  const key = getDraftStorageKey(taskId);
  const savedAtKey = getDraftSavedAtStorageKey(taskId);
  const savedAt = Date.now();
  state.drafts[key] = value;
  window.localStorage.setItem(key, value);
  window.localStorage.setItem(savedAtKey, String(savedAt));
  return savedAt;
}

function getDraftSavedAt(taskId) {
  const raw = window.localStorage.getItem(getDraftSavedAtStorageKey(taskId));
  const numeric = Number.parseInt(raw || "", 10);
  return Number.isFinite(numeric) ? numeric : null;
}

function formatSavedTime(timestamp) {
  if (!Number.isFinite(timestamp)) {
    return "Not saved yet";
  }
  const date = new Date(timestamp);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `Saved at ${hh}:${mm}:${ss}`;
}

function countWords(text) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function renderPartList() {
  if (!partCards) {
    return;
  }
  partCards.innerHTML = "";
  const levelEntry = getLevelEntry();
  const order = levelEntry?.partOrder || [];
  order.forEach((partKey) => {
    const part = getPart(partKey);
    const button = createEl(
      "button",
      classNames(
        "rounded-full border px-4 py-2 text-xs font-display uppercase tracking-[0.2em]",
        partKey === state.partKey
          ? "border-azure/60 bg-azure/10 text-azure ring-2 ring-azure/20"
          : "border-stone-300 bg-stone-50 text-slate shadow-sm"
      ),
      part?.meta?.partLabel || partKey
    );
    button.type = "button";
    button.addEventListener("click", () => {
      if (state.partKey === partKey) {
        return;
      }
      state.partKey = partKey;
      if (!partHasTask(partKey, state.taskId)) {
        state.taskId = null;
      }
      renderPartList();
      renderActivePart();
    });
    partCards.append(button);
  });
}

function getStoredEditorFontSize() {
  const raw = window.localStorage.getItem(EDITOR_FONT_SIZE_KEY);
  const parsed = Number.parseInt(raw || "", 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_EDITOR_FONT_SIZE;
  }
  return Math.max(14, Math.min(24, parsed));
}

function applyEditorFontSize(value) {
  const size = Math.max(14, Math.min(24, Number.parseInt(value, 10) || DEFAULT_EDITOR_FONT_SIZE));
  state.editorFontSize = size;
  if (fontSizeInput) {
    fontSizeInput.value = String(size);
  }
  if (fontSizeValue) {
    fontSizeValue.textContent = `${size}px`;
  }
  document.querySelectorAll(".shreiben-editor").forEach((textarea) => {
    textarea.style.fontSize = `${size}px`;
  });
}

function persistEditorFontSize(value) {
  window.localStorage.setItem(EDITOR_FONT_SIZE_KEY, String(value));
}

function insertCharacterAtCursor(textarea, value) {
  if (!textarea) {
    return;
  }
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? textarea.value.length;
  const before = textarea.value.slice(0, start);
  const after = textarea.value.slice(end);
  textarea.value = `${before}${value}${after}`;
  const nextPosition = start + value.length;
  textarea.focus();
  textarea.setSelectionRange(nextPosition, nextPosition);
}

function buildChatGptCorrectionUrl() {
  return "https://chatgpt.com/";
}

function buildCorrectionPrompt(userText) {
  return `${CHATGPT_CORRECTION_PROMPT}\n${String(userText || "").trim()}`;
}

async function copyTextToClipboard(value) {
  const text = String(value || "");
  if (!text) {
    return false;
  }
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    // fallback below
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

async function copyPromptAndOpenChatGpt(userText) {
  const prompt = buildCorrectionPrompt(userText);
  const copied = await copyTextToClipboard(prompt);
  const notice = copied
    ? [
        "Prompt copied successfully.",
        "You will now be redirected to ChatGPT.",
        "Please paste the prompt there to see the correction.",
        "",
        "تم نسخ البرومبت بنجاح.",
        "سيتم الآن تحويلك إلى ChatGPT.",
        "يرجى لصق البرومبت هناك لرؤية التصحيح."
      ].join("\n")
    : [
        "Prompt could not be copied automatically.",
        "You will now be redirected to ChatGPT.",
        "Please copy/paste the prompt manually to see the correction.",
        "",
        "تعذر نسخ البرومبت تلقائيًا.",
        "سيتم الآن تحويلك إلى ChatGPT.",
        "يرجى نسخ/لصق البرومبت يدويًا لرؤية التصحيح."
      ].join("\n");

  window.alert(notice);
  window.location.href = buildChatGptCorrectionUrl();
}

function renderInfoBlock(title, children) {
  const block = createEl("section", "rounded-2xl border border-stone-200 bg-stone-50 p-4");
  block.append(createEl("h3", "text-sm font-display uppercase tracking-[0.2em] text-ink", title));
  children.forEach((item) => block.append(item));
  return block;
}

function renderTask(task) {
  const card = createEl("article", "rounded-3xl border border-stone-300 bg-white p-5 shadow-sm space-y-5");
  const titleRow = createEl("div", "flex flex-wrap items-center justify-between gap-3");
  titleRow.append(
    createEl("h3", "text-xl font-display text-ink", task.title || "Aufgabe"),
    createEl("span", "rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-[10px] font-display uppercase tracking-[0.2em] text-slate", "Beschwerde")
  );
  card.append(titleRow);

  const adNodes = [];
  if (task.ad?.header) {
    adNodes.push(createEl("p", "mt-3 text-sm font-display text-ink", task.ad.header));
  }
  if (task.ad?.tagline) {
    adNodes.push(createEl("p", "mt-1 text-sm font-semibold text-slate", task.ad.tagline));
  }
  (task.ad?.paragraphs || []).forEach((paragraph) => {
    adNodes.push(createEl("p", "mt-3 text-sm text-ink leading-relaxed", paragraph));
  });
  if ((task.ad?.offer || []).length) {
    const offerList = createEl("ul", "mt-3 list-disc pl-5 text-sm text-ink space-y-1");
    task.ad.offer.forEach((item) => {
      offerList.append(createEl("li", "", item));
    });
    adNodes.push(offerList);
  }
  if (task.ad?.price) {
    adNodes.push(createEl("p", "mt-3 text-sm font-display text-ink", task.ad.price));
  }
  if ((task.ad?.address || []).length) {
    const address = createEl("p", "mt-3 text-sm text-slate leading-relaxed", task.ad.address.join(", "));
    adNodes.push(address);
  }

  const promptNodes = [createEl("p", "mt-3 text-sm text-ink leading-relaxed", task.prompt || "")];
  if ((task.requirements?.mode || []).length) {
    const modeList = createEl("ul", "mt-3 list-disc pl-5 text-sm text-ink space-y-1");
    task.requirements.mode.forEach((item) => {
      modeList.append(createEl("li", "", item));
    });
    promptNodes.push(modeList);
  }
  if ((task.requirements?.points || []).length) {
    const pointsList = createEl("ul", "mt-3 list-disc pl-5 text-sm text-ink space-y-1");
    task.requirements.points.forEach((item) => {
      pointsList.append(createEl("li", "", item));
    });
    promptNodes.push(pointsList);
  }

  const layout = createEl("div", "space-y-4 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0");
  const leftColumn = createEl("div", "space-y-4 lg:h-[calc(100vh-15rem)] lg:overflow-y-auto lg:pr-1");
  leftColumn.append(
    renderInfoBlock("Anzeige", adNodes),
    renderInfoBlock("Aufgabe", promptNodes)
  );

  const rightColumn = createEl("div", "lg:h-[calc(100vh-15rem)] lg:pl-1");
  const writingBlock = createEl("section", "rounded-2xl border border-azure/30 bg-azure/10 p-4 flex flex-col gap-3 h-full");
  writingBlock.append(createEl("h4", "text-sm font-display uppercase tracking-[0.2em] text-azure", "Ihre Antwort"));

  const textarea = document.createElement("textarea");
  textarea.className = "shreiben-editor w-full flex-1 min-h-[320px] lg:min-h-0 rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-ink focus:outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/20";
  textarea.placeholder = "Schreiben Sie hier Ihre Beschwerde...";
  textarea.value = getDraft(task.id);
  textarea.style.fontSize = `${state.editorFontSize}px`;

  const infoRow = createEl("div", "flex flex-wrap items-center justify-between gap-2");
  const wordCounter = createEl("p", "text-xs uppercase tracking-[0.2em] text-slate font-display");
  const saveStatus = createEl("p", "text-xs uppercase tracking-[0.2em] text-slate font-display");

  const updateSaveStatus = (savedAt) => {
    saveStatus.textContent = formatSavedTime(savedAt);
  };
  const updateCounter = () => {
    wordCounter.textContent = `Wörter: ${countWords(textarea.value)}`;
  };
  textarea.addEventListener("input", () => {
    const savedAt = setDraft(task.id, textarea.value);
    updateCounter();
    updateSaveStatus(savedAt);
  });

  updateCounter();
  updateSaveStatus(getDraftSavedAt(task.id));
  infoRow.append(wordCounter, saveStatus);

  const actionsRow = createEl("div", "flex flex-wrap items-center gap-2");
  const actionButtonClasses = "inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-display uppercase tracking-[0.12em] text-ink hover:border-azure/40 hover:bg-stone-50";
  const copyAndOpenBtn = createEl(
    "button",
    actionButtonClasses,
    "Copy Prompt"
  );
  copyAndOpenBtn.type = "button";
  copyAndOpenBtn.addEventListener("click", async () => {
    const userText = String(textarea.value || "").trim();
    if (!userText) {
      window.alert("Bitte schreiben Sie zuerst Ihren Text.");
      return;
    }
    await copyPromptAndOpenChatGpt(userText);
  });
  actionsRow.append(copyAndOpenBtn);

  const toolbar = createEl("div", "mt-auto pt-2 border-t border-stone-200/80 flex flex-wrap items-center gap-2");
  toolbar.append(createEl("span", "text-[10px] font-display uppercase tracking-[0.2em] text-slate", "Sonderzeichen:"));
  GERMAN_SPECIAL_CHARS.forEach((char) => {
    const button = createEl(
      "button",
      "h-8 min-w-[2.25rem] rounded-xl border border-stone-300 bg-white px-2 text-sm font-display text-ink hover:border-stone-300",
      char
    );
    button.type = "button";
    button.addEventListener("click", () => {
      insertCharacterAtCursor(textarea, char);
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    });
    toolbar.append(button);
  });

  writingBlock.append(textarea, infoRow, actionsRow, toolbar);
  rightColumn.append(writingBlock);

  layout.append(leftColumn, rightColumn);
  card.append(layout);

  return card;
}

function renderActivePart() {
  contentContainer.innerHTML = "";
  const part = getPart(state.partKey);
  if (!part) {
    contentContainer.append(
      createEl(
        "div",
        "rounded-2xl border border-rose/30 bg-rose/10 p-4 text-sm text-rose",
        "Für diese Ebene ist noch keine Schreiben-Aufgabe verfügbar."
      )
    );
    return;
  }

  const instruction = part.content?.instruction;
  if (instruction) {
    contentContainer.append(
      createEl("div", "rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-slate", instruction)
    );
  }

  const tasks = part.content?.tasks || [];
  if (!tasks.length) {
    contentContainer.append(
      createEl("div", "rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-slate", "Noch keine Aufgaben vorhanden.")
    );
    return;
  }

  const taskId = String(state.taskId || "").trim();
  const tasksToRender = taskId
    ? tasks.filter((task) => String(task?.id || "").trim() === taskId)
    : tasks;

  if (!tasksToRender.length) {
    contentContainer.append(
      createEl("div", "rounded-2xl border border-rose/30 bg-rose/10 p-4 text-sm text-rose", "Die ausgewählte Schreiben-Aufgabe wurde nicht gefunden.")
    );
    return;
  }

  tasksToRender.forEach((task) => {
    contentContainer.append(renderTask(task));
  });
  refreshIcons();
}

function applyHeaderInfo() {
  if (levelPill) {
    levelPill.textContent = (state.levelKey || "B2").toUpperCase();
  }
  if (themeTitle) {
    themeTitle.textContent = `Shreiben (${state.levelKey?.toUpperCase() || "B2"})`;
  }
}

if (returnBtn) {
  returnBtn.addEventListener("click", () => {
    window.location.href = `index.html?level=${state.levelKey}`;
  });
}

if (settingsBtn && settingsPanel) {
  settingsBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    settingsPanel.classList.toggle("hidden", !settingsPanel.classList.contains("hidden"));
  });
  settingsPanel.addEventListener("click", (event) => {
    event.stopPropagation();
  });
  document.addEventListener("click", () => {
    settingsPanel.classList.add("hidden");
  });
}

if (fontSizeInput) {
  fontSizeInput.addEventListener("input", () => {
    applyEditorFontSize(fontSizeInput.value);
    persistEditorFontSize(state.editorFontSize);
  });
}

async function init() {
  if (typeof setupCommunityWidgets === "function") {
    setupCommunityWidgets();
  }
  state.data = await loadShreibenDatabase();
  if (!state.data) {
    contentContainer.innerHTML = "";
    contentContainer.append(
      createEl(
        "div",
        "rounded-2xl border border-rose/30 bg-rose/10 p-4 text-sm text-rose",
        "database/shreiben.json wurde nicht gefunden."
      )
    );
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const requestedLevel = params.get("level");
  const availableLevels = Object.keys(state.data.levels || {});
  if (availableLevels.includes(requestedLevel)) {
    state.levelKey = requestedLevel;
  } else if (availableLevels.length) {
    state.levelKey = availableLevels.includes("b2") ? "b2" : availableLevels[0];
  }

  const levelEntry = getLevelEntry();
  const requestedPart = params.get("part");
  if (requestedPart && levelEntry?.partOrder?.includes(requestedPart)) {
    state.partKey = requestedPart;
  } else if (levelEntry?.partOrder?.length) {
    state.partKey = levelEntry.partOrder[0];
  }

  const requestedTask = String(params.get("task") || "").trim();
  if (requestedTask && partHasTask(state.partKey, requestedTask)) {
    state.taskId = requestedTask;
  }

  applyEditorFontSize(getStoredEditorFontSize());
  applyHeaderInfo();
  renderPartList();
  renderActivePart();
  refreshIcons();
}

init();
