const examView = document.getElementById("exam-view");
const footer = document.getElementById("footer");
const backBtn = document.getElementById("back-btn");
const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const fontSizeInput = document.getElementById("font-size-input");
const fontSizeValue = document.getElementById("font-size-value");
const partCards = document.getElementById("part-cards");
const timerDisplay = document.getElementById("timer-display");
const timerValue = document.getElementById("timer-value");
const timerToggle = document.getElementById("timer-toggle");
const resultView = document.getElementById("result-view");
const resultTitle = document.getElementById("result-title");
const resultSubtitle = document.getElementById("result-subtitle");
const resultSummary = document.getElementById("result-summary");
const resultBreakdown = document.getElementById("result-breakdown");
const resultRetryBtn = document.getElementById("result-retry-btn");
const resultHomeBtn = document.getElementById("result-home-btn");

const leftPanel = document.getElementById("left-panel");
const rightPanel = document.getElementById("right-panel");

const themeTitle = document.getElementById("theme-title");
const levelPill = document.getElementById("level-pill");
const brandLogo = document.getElementById("brand-logo");
const headerTitle = document.getElementById("header-title");
const headerDivider = document.getElementById("header-divider");
const returnLabel = document.getElementById("return-label");
const progressDots = document.getElementById("progress-dots");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const asideToggle = document.getElementById("aside-toggle");
const asideOverlay = document.getElementById("aside-overlay");

// initialize ARIA state
if (asideToggle) {
  asideToggle.setAttribute("aria-expanded", "false");
}

const PART_LABELS = {
  "teil-1": "Lesen Teil 1",
  "teil-2": "Lesen Teil 2",
  "teil-3": "Lesen Teil 3",
  "sprachbausteine-1": "Sprachbausteine 1",
  "sprachbausteine-2": "Sprachbausteine 2"
};

const state = {
  db: null,
  config: null,
  level: null,
  theme: null,
  version: null,
  part: null,
  responses: {},
  submitted: {},
  active: {},
  view: "exam",
  asideOpen: false,
  resultSavedFingerprint: null,
  timer: {
    enabled: true,
    durationMs: 0,
    endAt: null,
    intervalId: null
  }
};

let partTransitionBusy = false;
const DESKTOP_ASIDE_QUERY = "(min-width: 768px)";

const selectionGuard = {
  pointerDown: false,
  startX: 0,
  startY: 0,
  suppressNextClick: false
};

function isDesktopViewport() {
  return window.matchMedia(DESKTOP_ASIDE_QUERY).matches;
}

function syncAsideLayout({ open = state.asideOpen, focusPanel = false, restoreFocus = false } = {}) {
  if (!rightPanel) {
    return;
  }

  const desktop = isDesktopViewport();
  const shouldOpen = !desktop && Boolean(open);
  state.asideOpen = shouldOpen;
  rightPanel.setAttribute("tabindex", "-1");

  if (desktop) {
    rightPanel.classList.remove("hidden", "mobile-aside-open");
    rightPanel.setAttribute("aria-hidden", "false");
    if (asideOverlay) {
      asideOverlay.classList.add("hidden");
    }
    if (asideToggle) {
      asideToggle.setAttribute("aria-expanded", "false");
    }
    return;
  }

  rightPanel.classList.toggle("hidden", !shouldOpen);
  rightPanel.classList.toggle("mobile-aside-open", shouldOpen);
  rightPanel.setAttribute("aria-hidden", shouldOpen ? "false" : "true");
  if (asideOverlay) {
    asideOverlay.classList.toggle("hidden", !shouldOpen);
  }
  if (asideToggle) {
    asideToggle.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
  }

  if (shouldOpen && focusPanel) {
    try {
      rightPanel.focus();
    } catch (error) {
      // no-op
    }
  } else if (!shouldOpen && restoreFocus && asideToggle) {
    try {
      asideToggle.focus();
    } catch (error) {
      // no-op
    }
  }
}

function isInExamPanels(target) {
  if (!(target instanceof Node)) {
    return false;
  }
  return Boolean((leftPanel && leftPanel.contains(target)) || (rightPanel && rightPanel.contains(target)));
}

function hasSelectedText() {
  const selection = window.getSelection?.();
  return Boolean(selection && selection.toString().trim());
}

function handleExamPointerDown(event) {
  if (state.view !== "exam" || event.button !== 0 || !isInExamPanels(event.target)) {
    return;
  }
  selectionGuard.pointerDown = true;
  selectionGuard.startX = event.clientX;
  selectionGuard.startY = event.clientY;
  selectionGuard.suppressNextClick = false;
}

function handleExamPointerUp(event) {
  if (!selectionGuard.pointerDown) {
    return;
  }
  selectionGuard.pointerDown = false;
  if (!isInExamPanels(event.target)) {
    return;
  }
  const moved = Math.abs(event.clientX - selectionGuard.startX) > 3
    || Math.abs(event.clientY - selectionGuard.startY) > 3;
  selectionGuard.suppressNextClick = moved && hasSelectedText();
}

function suppressClickAfterSelection(event) {
  if (!selectionGuard.suppressNextClick || !isInExamPanels(event.target)) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  selectionGuard.suppressNextClick = false;
}

function applyFontScale(scale) {
  const safeScale = Number.isFinite(scale) ? scale : DEFAULT_CONFIG.fontScale;
  document.documentElement.style.setProperty("--font-scale", String(safeScale));
  if (fontSizeValue) {
    fontSizeValue.textContent = `${Math.round(safeScale * 100)}%`;
  }
}

function applyAsideWidth(value) {
  if (!value) {
    return;
  }
  if (typeof value === "number") {
    if (value > 1) {
      document.documentElement.style.setProperty("--aside-width", `${value}%`);
      return;
    }
    if (value > 0) {
      document.documentElement.style.setProperty("--aside-width", `${Math.round(value * 100)}%`);
      return;
    }
    return;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.endsWith("%")) {
      document.documentElement.style.setProperty("--aside-width", trimmed);
      return;
    }
    const numeric = Number.parseFloat(trimmed);
    if (Number.isFinite(numeric)) {
      const percent = numeric > 1 ? numeric : numeric * 100;
      document.documentElement.style.setProperty("--aside-width", `${Math.round(percent)}%`);
    }
  }
}

function getStoredTimerEnabled() {
  const raw = window.localStorage.getItem("timerEnabled");
  if (raw === null) {
    return null;
  }
  return raw === "true";
}

function getTimerConfig() {
  const fallback = DEFAULT_CONFIG.timer;
  const config = state.config?.timer || {};
  const stored = getStoredTimerEnabled();
  const enabled = typeof stored === "boolean"
    ? stored
    : typeof config.enabled === "boolean"
      ? config.enabled
      : fallback.enabled;
  const durationMinutes = Number.isFinite(config.durationMinutes)
    ? config.durationMinutes
    : fallback.durationMinutes;
  return {
    enabled,
    durationMs: Math.max(0, durationMinutes) * 60 * 1000
  };
}

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateTimerDisplay(remainingMs) {
  if (!timerDisplay || !timerValue) {
    return;
  }
  const show = state.view === "exam" && state.timer.enabled;
  timerDisplay.classList.toggle("hidden", !show);
  if (!show) {
    return;
  }
  const value = Number.isFinite(remainingMs) ? remainingMs : state.timer.durationMs;
  timerValue.textContent = formatTime(value);
}

function stopExamTimer() {
  if (state.timer.intervalId) {
    window.clearInterval(state.timer.intervalId);
    state.timer.intervalId = null;
  }
  state.timer.endAt = null;
}

function startExamTimer() {
  stopExamTimer();
  const timerConfig = getTimerConfig();
  state.timer.enabled = timerConfig.enabled;
  state.timer.durationMs = timerConfig.durationMs;
  if (!timerConfig.enabled || timerConfig.durationMs <= 0) {
    updateTimerDisplay(timerConfig.durationMs);
    return;
  }
  state.timer.endAt = Date.now() + timerConfig.durationMs;
  updateTimerDisplay(timerConfig.durationMs);
  state.timer.intervalId = window.setInterval(() => {
    if (!state.timer.endAt || state.view !== "exam") {
      stopExamTimer();
      updateTimerDisplay();
      return;
    }
    const remaining = state.timer.endAt - Date.now();
    if (remaining <= 0) {
      stopExamTimer();
      setView("results");
      renderResults();
      return;
    }
    updateTimerDisplay(remaining);
  }, 1000);
}

function setTimerEnabled(enabled) {
  state.timer.enabled = Boolean(enabled);
  window.localStorage.setItem("timerEnabled", state.timer.enabled ? "true" : "false");
  if (!state.timer.enabled) {
    stopExamTimer();
    updateTimerDisplay();
    return;
  }
  if (state.view === "exam") {
    startExamTimer();
  } else {
    updateTimerDisplay();
  }
}

async function navigateToPart(nextPartKey) {
  if (!nextPartKey || nextPartKey === state.part || partTransitionBusy) {
    return;
  }
  partTransitionBusy = true;
  try {
    state.part = nextPartKey;
    renderCurrentPart();
  } finally {
    partTransitionBusy = false;
  }
}

function applyTimerConfig() {
  const timerConfig = getTimerConfig();
  state.timer.enabled = timerConfig.enabled;
  state.timer.durationMs = timerConfig.durationMs;
  if (timerToggle) {
    timerToggle.checked = timerConfig.enabled;
  }
  updateTimerDisplay(timerConfig.durationMs);
}

function getScoreConfig() {
  const fallback = DEFAULT_CONFIG.scoreConfig;
  const config = state.config?.scoreConfig || {};
  const parts = { ...fallback.parts, ...(config.parts || {}) };
  const passPercent = Number.isFinite(config.passPercent)
    ? config.passPercent
    : fallback.passPercent;
  return { passPercent, parts };
}

function getStoredFontScale() {
  const raw = window.localStorage.getItem("fontScale");
  const parsed = raw ? Number.parseFloat(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function formatPoints(value) {
  if (!Number.isFinite(value)) {
    return "0";
  }
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function shuffleList(items) {
  const list = Array.isArray(items) ? [...items] : [];
  for (let index = list.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [list[index], list[randomIndex]] = [list[randomIndex], list[index]];
  }
  return list;
}

function ensurePartState(partKey) {
  const versionKey = getActiveVersionKey();
  const key = [state.level, state.theme, versionKey, partKey].join("|");
  if (!Object.prototype.hasOwnProperty.call(state.responses, key)) {
    state.responses[key] = {};
  }
  if (!Object.prototype.hasOwnProperty.call(state.submitted, key)) {
    state.submitted[key] = false;
  }
  if (!Object.prototype.hasOwnProperty.call(state.active, key)) {
    state.active[key] = {};
  }
  return {
    key,
    responses: state.responses[key],
    submitted: state.submitted[key],
    active: state.active[key]
  };
}

function setView(view) {
  if (view !== "exam") {
    stopExamTimer();
  }
  if (view !== "exam" && settingsPanel) {
    settingsPanel.classList.add("hidden");
  }
  state.view = view;
  if (view === "results") {
    examView.classList.add("hidden");
    resultView?.classList.remove("hidden");
    footer.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
    if (settingsBtn) {
      settingsBtn.classList.add("hidden");
    }
  } else {
    examView.classList.remove("hidden");
    resultView?.classList.add("hidden");
    footer.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
    if (settingsBtn) {
      settingsBtn.classList.remove("hidden");
    }
  }
  if (headerTitle) {
    headerTitle.classList.remove("hidden");
  }
  if (returnLabel) {
    returnLabel.classList.remove("hidden");
  }
  if (headerDivider) {
    headerDivider.classList.remove("hidden");
  }
  if (brandLogo) {
    brandLogo.classList.add("hidden");
  }
  syncAsideLayout({ open: view === "exam" ? state.asideOpen : false });
  renderPartCards();
  updateTimerDisplay();
}

function getThemeEntry() {
  return state.db?.levels?.[state.level]?.themes?.[state.theme] || null;
}

function getActiveVersionKey() {
  if (state.version) {
    return state.version;
  }
  const themeEntry = getThemeEntry();
  if (themeEntry?.defaultVersion) {
    return themeEntry.defaultVersion;
  }
  const order = themeEntry?.versionOrder || [];
  if (order.length) {
    return order[0];
  }
  return "default";
}

function getThemeVersionEntry(themeEntry) {
  if (!themeEntry) {
    return null;
  }
  const key = getActiveVersionKey();
  return themeEntry.versions?.[key] || null;
}

function getActiveLesen(themeEntry) {
  const versionEntry = getThemeVersionEntry(themeEntry);
  return versionEntry?.lesen || themeEntry?.lesen || null;
}

function setHeader(meta) {
  if (themeTitle) {
    themeTitle.textContent = meta?.title || "Theme";
  }
  if (levelPill) {
    levelPill.textContent = (meta?.level || state.level || "").toUpperCase();
  }
}

function renderProgress(order) {
  if (!progressDots) {
    return;
  }
  progressDots.innerHTML = "";
  order.forEach((partKey) => {
    const dot = createEl("span", "h-2 w-2 rounded-full bg-stone-300");
    if (partKey === state.part) {
      dot.classList.add("bg-azure");
    }
    progressDots.append(dot);
  });
}

function getAnsweredCounts(partKey, partData) {
  const { responses } = ensurePartState(partKey);
  if (partKey === "teil-1") {
    return countAnsweredTeil1(partData.content || {}, responses);
  }
  if (partKey === "teil-2") {
    return countAnsweredTeil2(partData.content || {}, responses);
  }
  if (partKey === "teil-3") {
    return countAnsweredTeil3(partData.content || {}, responses);
  }
  if (partKey === "sprachbausteine-1" || partKey === "sprachbausteine-2") {
    return countAnsweredSprach(partData.content || {}, responses);
  }
  return { answered: 0, total: 0 };
}

function renderPartCards() {
  if (!partCards) {
    return;
  }
  const themeEntry = getThemeEntry();
  const show = state.view === "exam" && themeEntry;
  partCards.classList.toggle("hidden", !show);
  partCards.innerHTML = "";
  if (!show) {
    return;
  }
  const lesenEntry = getActiveLesen(themeEntry);
  const order = lesenEntry?.partOrder || [];
  order.forEach((partKey) => {
    const partData = lesenEntry?.parts?.[partKey];
    if (!partData) {
      return;
    }
    const counts = getAnsweredCounts(partKey, partData);
    const isComplete = counts.total > 0 && counts.answered === counts.total;
    const isActive = partKey === state.part;
    const card = createEl(
      "button",
      classNames(
        "flex items-center justify-center gap-2 rounded-xl border px-2 py-2.5 h-10 min-w-[110px] text-[9px] font-display uppercase tracking-[0.2em] transition-colors",
        isActive
          ? "border-azure/60 bg-azure/10 text-azure ring-2 ring-azure/30"
          : "border-stone-300 bg-white/80 text-slate hover:border-stone-300"
      ),
      partData.meta?.partLabel || PART_LABELS[partKey] || partKey
    );
    card.type = "button";
    if (isComplete) {
      card.append(makeCheckBadge());
    }
    card.addEventListener("click", () => {
      if (state.view !== "exam") {
        setView("exam");
      }
      void navigateToPart(partKey);
    });
    partCards.append(card);
  });
  refreshIcons();
}

function renderMessage(text) {
  leftPanel.innerHTML = "";
  rightPanel.innerHTML = "";
  leftPanel.append(
    createEl(
      "div",
      "rounded-2xl border border-stone-200 bg-stone-50 px-4 py-6 text-center text-sm text-slate",
      text
    )
  );
}

function renderInstruction(text) {
  if (!text) {
    return null;
  }
  const card = createEl("div", "rounded-2xl border border-stone-200 bg-stone-50 p-4 mb-6");
  card.append(
    createEl("div", "font-display text-xs uppercase tracking-[0.2em] text-slate", "Aufgabe"),
    createEl("p", "mt-2 text-sm text-ink", text)
  );
  return card;
}

function makePill(label, variant) {
  const base = "rounded-full px-2 py-0.5 text-[10px] font-display uppercase tracking-[0.2em]";
  if (variant === "correct") {
    return createEl("span", `${base} bg-mint/20 text-mint border border-mint/40`, label);
  }
  if (variant === "wrong") {
    return createEl("span", `${base} bg-rose/15 text-rose border border-rose/40`, label);
  }
  return createEl("span", `${base} bg-azure/10 text-azure border border-azure/40`, label);
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

function makeCheckBadge() {
  const badge = createEl(
    "span",
    "h-4 w-4 rounded-full border border-mint/40 bg-mint/20 text-mint flex items-center justify-center"
  );
  badge.append(makeLucideIcon("check", "h-3 w-3"));
  return badge;
}

function countCorrectTeil1(content, responses) {
  const answers = content.answers || [];
  let correct = 0;
  answers.forEach((item) => {
    const selected = responses[item.textId];
    if (selected && normalize(selected) === normalize(item.headlineId)) {
      correct += 1;
    }
  });
  const total = answers.length || (content.texts || []).length;
  return { correct, total };
}

function countCorrectTeil2(content, responses) {
  const questions = content.questions || [];
  let correct = 0;
  questions.forEach((question) => {
    const selected = responses[question.id];
    if (selected && normalize(selected) === normalize(question.answerId)) {
      correct += 1;
    }
  });
  return { correct, total: questions.length };
}

function countCorrectTeil3(content, responses) {
  const answers = content.answers || [];
  let correct = 0;
  answers.forEach((item) => {
    const selected = responses[item.situationId];
    if (selected && normalize(selected) === normalize(item.adId)) {
      correct += 1;
    }
  });
  const total = answers.length || (content.situations || []).length;
  return { correct, total };
}

function getSprachAnswerMap(content) {
  const answers = (content.answers && content.answers.length) ? content.answers : (content.blanks || []);
  return new Map((answers || []).map((item) => [String(item.id), item.answer || item.text || ""]));
}

function parseSprachTextTemplate(value) {
  const template = String(value || "");
  const tokens = [];
  const matcher = /\[\[\s*([^\]]+)\s*\]\]/g;
  let lastIndex = 0;
  let match = null;

  while ((match = matcher.exec(template)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: "text",
        value: template.slice(lastIndex, match.index)
      });
    }
    tokens.push({
      type: "blank",
      id: String(match[1] || "").trim()
    });
    lastIndex = matcher.lastIndex;
  }

  if (lastIndex < template.length) {
    tokens.push({
      type: "text",
      value: template.slice(lastIndex)
    });
  }

  return tokens;
}

function getTemplateBlankIds(tokens) {
  const ids = [];
  (tokens || []).forEach((token) => {
    if (token?.type !== "blank") {
      return;
    }
    const id = String(token.id || "").trim();
    if (id && !ids.includes(id)) {
      ids.push(id);
    }
  });
  return ids;
}

function createTranslationToggle(translatedText) {
  const text = String(translatedText || "").trim();
  if (!text) {
    return null;
  }

  const wrapper = createEl("div", "mt-2");
  const showBtn = createEl(
    "button",
    "rounded-full border border-amber/40 bg-amber/10 px-3 py-1 text-[10px] font-display uppercase tracking-[0.2em] text-amber",
    "Arabic Translation"
  );
  showBtn.type = "button";

  const panel = createEl("div", "mt-2 hidden rounded-xl border border-amber/40 bg-amber/10 p-3");
  const header = createEl("div", "flex items-center justify-between gap-2");
  const title = createEl("div", "text-[10px] font-display uppercase tracking-[0.2em] text-amber", "Arabic");
  const closeBtn = createEl(
    "button",
    "h-6 w-6 rounded-lg border border-amber/40 bg-white text-amber flex items-center justify-center",
    "×"
  );
  closeBtn.type = "button";
  const body = createEl("p", "mt-2 text-sm leading-relaxed whitespace-pre-wrap text-ink", text);
  body.setAttribute("dir", "rtl");
  panel.append(header, body);
  header.append(title, closeBtn);

  showBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    panel.classList.remove("hidden");
    showBtn.classList.add("hidden");
  });

  closeBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    panel.classList.add("hidden");
    showBtn.classList.remove("hidden");
  });

  wrapper.append(showBtn, panel);
  return wrapper;
}

function countCorrectSprach(content, responses) {
  const answerMap = getSprachAnswerMap(content);
  let correct = 0;
  answerMap.forEach((answer, id) => {
    const selected = responses[id];
    if (selected && normalize(selected) === normalize(answer)) {
      correct += 1;
    }
  });
  const total = answerMap.size;
  return { correct, total };
}

function hasResponseValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function countAnsweredTeil1(content, responses) {
  const texts = content.texts || [];
  const total = texts.length || (content.answers || []).length;
  let answered = 0;
  texts.forEach((item) => {
    if (hasResponseValue(responses[item.id])) {
      answered += 1;
    }
  });
  return { answered, total };
}

function countAnsweredTeil2(content, responses) {
  const questions = content.questions || [];
  let answered = 0;
  questions.forEach((question) => {
    if (hasResponseValue(responses[question.id])) {
      answered += 1;
    }
  });
  return { answered, total: questions.length };
}

function countAnsweredTeil3(content, responses) {
  const situations = content.situations || [];
  const total = situations.length || (content.answers || []).length;
  let answered = 0;
  situations.forEach((item) => {
    if (hasResponseValue(responses[item.id])) {
      answered += 1;
    }
  });
  return { answered, total };
}

function countAnsweredSprach(content, responses) {
  const blanks = (content.answers && content.answers.length) ? content.answers : (content.blanks || []);
  let answered = 0;
  blanks.forEach((blank) => {
    if (hasResponseValue(responses[blank.id])) {
      answered += 1;
    }
  });
  return { answered, total: blanks.length };
}

function computePartScore(partKey, partData) {
  const { responses } = ensurePartState(partKey);
  const scoreConfig = getScoreConfig();
  const pointsPerQuestion = Number(scoreConfig.parts?.[partKey]?.pointsPerQuestion || 0);

  let counts = { correct: 0, total: 0 };
  if (partKey === "teil-1") {
    counts = countCorrectTeil1(partData.content || {}, responses);
  } else if (partKey === "teil-2") {
    counts = countCorrectTeil2(partData.content || {}, responses);
  } else if (partKey === "teil-3") {
    counts = countCorrectTeil3(partData.content || {}, responses);
  } else if (partKey === "sprachbausteine-1" || partKey === "sprachbausteine-2") {
    counts = countCorrectSprach(partData.content || {}, responses);
  }

  const maxPoints = counts.total * pointsPerQuestion;
  const earnedPoints = counts.correct * pointsPerQuestion;
  return {
    partKey,
    label: PART_LABELS[partKey] || partKey,
    correct: counts.correct,
    total: counts.total,
    pointsPerQuestion,
    maxPoints,
    earnedPoints
  };
}

function saveResultProgress({ percent, totalEarned, totalMax, passed, scores }) {
  if (typeof saveLesenProgressResult !== "function") {
    return;
  }
  const fingerprint = [
    state.level || "",
    state.theme || "",
    getActiveVersionKey(),
    percent,
    formatPoints(totalEarned),
    formatPoints(totalMax),
    (scores || []).map((score) => `${score.partKey}:${score.correct}/${score.total}`).join(";")
  ].join("|");
  if (state.resultSavedFingerprint === fingerprint) {
    return;
  }
  saveLesenProgressResult({
    levelKey: state.level || "",
    themeKey: state.theme || "",
    versionKey: getActiveVersionKey(),
    percent,
    earnedPoints: totalEarned,
    maxPoints: totalMax,
    passed
  });
  state.resultSavedFingerprint = fingerprint;
}

function renderResults() {
  if (!resultView) {
    return;
  }

  const themeEntry = getThemeEntry();
  if (!themeEntry) {
    resultTitle.textContent = "No results available.";
    resultSubtitle.textContent = "Please select a theme first.";
    resultSummary.innerHTML = "";
    resultBreakdown.innerHTML = "";
    return;
  }

  const scoreConfig = getScoreConfig();
  const lesenEntry = getActiveLesen(themeEntry);
  const order = lesenEntry?.partOrder || [];
  const scores = order
    .map((partKey) => {
      const partData = lesenEntry?.parts?.[partKey];
      if (!partData) {
        return null;
      }
      return computePartScore(partKey, partData);
    })
    .filter(Boolean);

  const totalMax = scores.reduce((sum, item) => sum + item.maxPoints, 0);
  const totalEarned = scores.reduce((sum, item) => sum + item.earnedPoints, 0);
  const percent = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;
  const passed = percent >= scoreConfig.passPercent;
  saveResultProgress({ percent, totalEarned, totalMax, passed, scores });

  const versionEntry = getThemeVersionEntry(themeEntry);
  if (themeTitle) {
    themeTitle.textContent = versionEntry?.title || themeEntry.title || "Results";
  }
  resultTitle.textContent = passed ? "Well done." : "Keep practicing.";
  resultSubtitle.textContent = `You reached ${percent}% (pass mark ${scoreConfig.passPercent}%).`;

  resultSummary.innerHTML = "";
  const summaryGrid = createEl("div", "grid gap-4 sm:grid-cols-3");
  const totalCard = createEl("div", "rounded-2xl border border-stone-200 bg-stone-50 p-4");
  totalCard.append(
    createEl("div", "text-xs uppercase tracking-[0.2em] text-slate font-display", "Total points"),
    createEl("div", "mt-2 text-2xl font-display text-ink", `${formatPoints(totalEarned)} / ${formatPoints(totalMax)}`)
  );
  const percentCard = createEl("div", "rounded-2xl border border-stone-200 bg-stone-50 p-4");
  percentCard.append(
    createEl("div", "text-xs uppercase tracking-[0.2em] text-slate font-display", "Percent"),
    createEl("div", "mt-2 text-2xl font-display text-ink", `${percent}%`)
  );
  const statusCard = createEl("div", "rounded-2xl border border-stone-200 bg-stone-50 p-4");
  statusCard.append(
    createEl("div", "text-xs uppercase tracking-[0.2em] text-slate font-display", "Result"),
    createEl("div", classNames("mt-2 text-2xl font-display", passed ? "text-mint" : "text-rose"), passed ? "Passed" : "Not passed")
  );
  summaryGrid.append(totalCard, percentCard, statusCard);
  resultSummary.append(summaryGrid);

  resultBreakdown.innerHTML = "";
  scores.forEach((score) => {
    const row = createEl("div", "rounded-2xl border border-stone-200 bg-white/90 p-4 space-y-3");
    const header = createEl("div", "flex items-center justify-between gap-3");
    const left = createEl("div", "space-y-1");
    left.append(
      createEl("div", "text-sm font-display text-ink", score.label),
      createEl("div", "text-xs text-slate", `Correct answers: ${score.correct} / ${score.total}`)
    );
    const right = createEl("div", "text-sm font-display text-ink");
    right.textContent = `${formatPoints(score.earnedPoints)} / ${formatPoints(score.maxPoints)}`;
    header.append(left, right);
    const bar = createEl("div", "h-2 w-full rounded-full bg-stone-200 overflow-hidden");
    const fill = createEl("div", "h-full bg-azure");
    const width = score.maxPoints > 0 ? Math.round((score.earnedPoints / score.maxPoints) * 100) : 0;
    fill.style.width = `${width}%`;
    bar.append(fill);
    row.append(header, bar);
    resultBreakdown.append(row);
  });
}

function renderActionBar(partKey) {
  const { key, submitted } = ensurePartState(partKey);
  const wrapper = createEl("div", "exam-action-bar sticky bottom-0 left-0 right-0 pt-4");
  const bar = createEl("div", "exam-action-bar-inner flex items-center justify-between gap-2");
  const button = createEl(
    "button",
    classNames(
      "w-full rounded-xl px-4 py-2 text-sm font-display",
      submitted
        ? "border border-stone-300 bg-stone-50 text-slate"
        : "bg-azure text-white shadow-lg ring-2 ring-azure/20"
    ),
    submitted ? "Retry" : "Check Answers"
  );

  button.type = "button";
  button.addEventListener("click", () => {
    if (submitted) {
      state.responses[key] = {};
      state.submitted[key] = false;
    } else {
      state.submitted[key] = true;
    }
    renderCurrentPart();
  });

  bar.append(button);
  wrapper.append(bar);
  return wrapper;
}

function renderLesenTeil1(content) {
  const partKey = "teil-1";
  const { responses, submitted, active } = ensurePartState(partKey);
  leftPanel.innerHTML = "";
  rightPanel.innerHTML = "";

  const instruction = renderInstruction(content.instruction);
  if (instruction) {
    leftPanel.append(instruction);
  }

  const correctMap = new Map((content.answers || []).map((item) => [item.textId, item.headlineId]));
  const texts = content.texts || [];
  if (!active.textId && texts.length) {
    active.textId = texts[0].id;
  }

  const list = createEl("div", "space-y-4");
  texts.forEach((item) => {
    const selected = responses[item.id];
    const correct = correctMap.get(item.id);
    const isCorrect = selected && selected === correct;

    const card = createEl(
      "button",
      classNames(
        "w-full text-left rounded-2xl border border-stone-300 bg-white/90 p-4 transition-shadow",
        item.id === active.textId
          ? "border-azure/60 bg-azure/10 shadow-panel ring-2 ring-azure/20"
          : "hover:border-stone-300"
      )
    );
    card.type = "button";
    card.addEventListener("click", () => {
      if (active.headlineId && assignHeadline(item.id, active.headlineId)) {
        renderCurrentPart();
        return;
      }
      active.textId = item.id;
      renderCurrentPart();
    });
    card.addEventListener("dblclick", () => {
      if (responses[item.id]) {
        delete responses[item.id];
        renderCurrentPart();
      }
    });
    card.addEventListener("dragover", (event) => {
      event.preventDefault();
    });
    card.addEventListener("drop", (event) => {
      event.preventDefault();
      const headlineId = event.dataTransfer?.getData("text/plain");
      if (!headlineId) {
        return;
      }
      if (assignHeadline(item.id, headlineId)) {
        renderCurrentPart();
      }
    });

    const pills = createEl("div", "mb-2 flex flex-wrap gap-2");
    if (submitted) {
      if (selected) {
        pills.append(makePill(`Your: ${selected}`, isCorrect ? "correct" : "wrong"));
      }
      if (!isCorrect && correct) {
        pills.append(makePill(`Correct: ${correct}`, "correct"));
      }
    } else if (selected) {
      pills.append(makePill(`Selected: ${selected}`, "selected"));
    }

    if (pills.childNodes.length) {
      card.append(pills);
    }

    card.append(createEl("div", "h-8 w-8 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-center text-sm font-display text-slate", item.id));

    card.append(createEl("p", "mt-3 text-sm text-ink", item.text));

    const cardWrap = createEl("div", "rounded-2xl");
    cardWrap.append(card);
    const translationToggle = createTranslationToggle(item.translated);
    if (translationToggle) {
      cardWrap.append(translationToggle);
    }

    list.append(cardWrap);
  });
  leftPanel.append(list);

  const header = createEl("div", "space-y-1");
  header.append(
    createEl("h2", "font-display text-lg", "Überschriften"),
    createEl("p", "text-xs uppercase tracking-[0.2em] text-slate font-display", `Für Text ${active.textId || ""}`)
  );
  rightPanel.append(header);

  const usedHeadlines = new Map();
  Object.entries(responses).forEach(([textId, headlineId]) => {
    if (headlineId) {
      usedHeadlines.set(headlineId, Number.parseInt(textId, 10));
    }
  });

  const assignHeadline = (textId, headlineId) => {
    const usedBy = usedHeadlines.get(headlineId);
    if (usedBy && usedBy !== textId) {
      return false;
    }
    responses[textId] = headlineId;
    active.textId = textId;
    active.headlineId = null;
    return true;
  };

  const options = createEl("div", "mt-4 space-y-3");
  const correct = correctMap.get(active.textId);
  (content.headlines || []).forEach((headline) => {
    const selected = responses[active.textId];
    const isSelected = selected === headline.id;
    const isCorrect = submitted && headline.id === correct;
    const isWrong = submitted && isSelected && headline.id !== correct;
    const usedBy = usedHeadlines.get(headline.id);
    const isUsedByOther = !submitted && usedBy && usedBy !== active.textId;
    const isChoiceActive = normalize(active.headlineId) === normalize(headline.id);

    const option = createEl(
      "button",
      classNames(
        "w-full rounded-xl border px-3 py-3 text-left text-sm font-display flex items-center gap-3 transition-colors",
        isCorrect ? "border-mint/60 bg-mint/20 text-mint" :
        isWrong ? "border-rose/50 bg-rose/15 text-rose" :
        isSelected ? "border-azure/60 bg-azure/10 text-azure" :
        isUsedByOther ? "border-stone-200 bg-stone-50 text-slate opacity-50 cursor-not-allowed" :
        "border-stone-300 bg-white text-ink hover:border-stone-300"
      )
    );
    option.type = "button";
    option.draggable = false;
    option.style.userSelect = "text";
    option.style.webkitUserSelect = "text";
    option.append(createEl("span", "h-6 w-6 rounded-lg border border-black/10 bg-white flex items-center justify-center text-xs", headline.id));
    option.append(createEl("span", "text-sm", headline.text));
    if (isChoiceActive) {
      option.classList.add("ring-2", "ring-azure/30");
    }

    option.addEventListener("click", () => {
      if (active.textId && assignHeadline(active.textId, headline.id)) {
        renderCurrentPart();
        return;
      }
      if (isUsedByOther) {
        return;
      }
      active.headlineId = headline.id;
      renderCurrentPart();
    });

    option.addEventListener("dblclick", () => {
      if (usedBy) {
        delete responses[usedBy];
        active.headlineId = null;
        renderCurrentPart();
      }
    });

    const optionWrap = createEl("div", "space-y-2");
    optionWrap.append(option);
    const translationToggle = createTranslationToggle(headline.translated);
    if (translationToggle) {
      optionWrap.append(translationToggle);
    }

    options.append(optionWrap);
  });
  rightPanel.append(options, renderActionBar(partKey));
}

function renderLesenTeil2(content) {
  const partKey = "teil-2";
  const { responses, submitted } = ensurePartState(partKey);
  leftPanel.innerHTML = "";
  rightPanel.innerHTML = "";

  leftPanel.append(createEl("span", "inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate font-display", "Lesetext"));
  leftPanel.append(createEl("h2", "mt-4 text-2xl font-display", content.passage?.title || ""));

  const translatedParagraphs = Array.isArray(content.passage?.translated) ? content.passage.translated : [];
  (content.passage?.paragraphs || []).forEach((para, index) => {
    const block = createEl("div", "mt-4");
    block.append(createEl("p", "text-sm text-ink leading-relaxed", para));
    const translationToggle = createTranslationToggle(translatedParagraphs[index]);
    if (translationToggle) {
      block.append(translationToggle);
    }
    leftPanel.append(block);
  });

  const header = createEl("div", "space-y-1");
  header.append(
    createEl("h2", "font-display text-lg", "Aufgaben"),
    createEl("p", "text-xs uppercase tracking-[0.2em] text-slate font-display", "Wählen Sie die richtige Lösung")
  );
  rightPanel.append(header);

  (content.questions || []).forEach((question) => {
    const block = createEl("div", "mt-4 rounded-2xl border border-stone-300 bg-stone-50 p-4");
    const qHeader = createEl("div", "flex items-start gap-2 text-sm font-display");
    qHeader.append(createEl("span", "text-azure", `${question.id}.`), createEl("span", "text-ink", question.prompt));
    block.append(qHeader);

    const list = createEl("div", "mt-3 space-y-2");
    (question.options || []).forEach((option) => {
      const selected = responses[question.id];
      const isSelected = selected === option.id;
      const isCorrect = submitted && option.id === question.answerId;
      const isWrong = submitted && isSelected && option.id !== question.answerId;

      const item = createEl(
        "button",
        classNames(
          "w-full rounded-xl border px-3 py-2 text-left text-sm font-display flex items-center gap-2 transition-colors",
          isCorrect ? "border-mint/60 bg-mint/20 text-mint" :
          isWrong ? "border-rose/50 bg-rose/15 text-rose" :
          isSelected ? "border-azure/60 bg-azure/10 text-azure" :
          "border-stone-300 bg-white text-ink hover:border-stone-300"
        )
      );
      item.type = "button";
      item.append(createEl("span", "text-xs", `${option.id.toUpperCase()})`));
      item.append(createEl("span", "text-sm", option.text));
      item.addEventListener("click", () => {
        responses[question.id] = option.id;
        renderCurrentPart();
      });
      list.append(item);
    });
    block.append(list);
    rightPanel.append(block);
  });

  rightPanel.append(renderActionBar(partKey));
}

function renderLesenTeil3(content) {
  const partKey = "teil-3";
  const { responses, submitted, active } = ensurePartState(partKey);
  leftPanel.innerHTML = "";
  rightPanel.innerHTML = "";

  const situations = content.situations || [];
  if (!active.situationId && situations.length) {
    active.situationId = situations[0].id;
  }

  const correctMap = new Map((content.answers || []).map((item) => [item.situationId, item.adId]));
  const usedAds = new Map();
  Object.entries(responses).forEach(([situationId, adId]) => {
    if (adId && adId !== "X") {
      usedAds.set(adId, Number.parseInt(situationId, 10));
    }
  });

  leftPanel.append(createEl("h2", "font-display text-lg", "Anzeigen"));
  const adsGrid = createEl("div", "mt-4 grid grid-cols-1 md:grid-cols-2 gap-3");
  (content.ads || []).forEach((ad) => {
    const selected = responses[active.situationId];
    const correct = correctMap.get(active.situationId);
    const isSelected = selected === ad.id;
    const isCorrect = submitted && ad.id === correct;
    const isWrong = submitted && isSelected && ad.id !== correct;
    const usedBy = usedAds.get(ad.id);
    const isNoAnzeige = ad.id === "X";
    const isUsedByOther = !submitted && !isNoAnzeige && usedBy && usedBy !== active.situationId;
    const isChoiceActive = normalize(active.adId) === normalize(ad.id);

    const item = createEl(
      "button",
      classNames(
        "w-full rounded-2xl border px-4 py-3 text-left text-sm transition-colors flex flex-col items-start justify-start",
        isCorrect ? "border-mint/60 bg-mint/20 text-mint" :
        isWrong ? "border-rose/50 bg-rose/15 text-rose" :
        isSelected ? "border-azure/60 bg-azure/10 text-azure" :
        isUsedByOther ? "border-stone-200 bg-stone-50 text-slate opacity-50 cursor-not-allowed" :
        "border-stone-300 bg-white text-ink hover:border-stone-300"
      )
    );
    item.type = "button";
    item.draggable = true;
    item.append(createEl("div", "h-7 w-7 rounded-lg border border-stone-300 bg-white flex items-center justify-center text-xs font-display text-slate", ad.id));
    item.append(createEl("p", "mt-2 text-sm whitespace-pre-wrap", ad.text));
    if (isChoiceActive) {
      item.classList.add("ring-2", "ring-azure/30");
    }

    item.addEventListener("click", () => {
      if (active.situationId && (!isUsedByOther || usedBy === active.situationId || isNoAnzeige)) {
        responses[active.situationId] = ad.id;
        active.adId = null;
        renderCurrentPart();
        return;
      }
      if (isUsedByOther) {
        return;
      }
      active.adId = ad.id;
      renderCurrentPart();
    });

    item.addEventListener("dblclick", () => {
      if (usedBy) {
        delete responses[usedBy];
        active.adId = null;
        renderCurrentPart();
      }
    });

    item.addEventListener("dragstart", (event) => {
      event.dataTransfer?.setData("text/plain", ad.id);
    });

    const adWrap = createEl("div", "space-y-2");
    adWrap.append(item);
    const adTranslationToggle = createTranslationToggle(ad.translated);
    if (adTranslationToggle) {
      adWrap.append(adTranslationToggle);
    }
    adsGrid.append(adWrap);
  });
  leftPanel.append(adsGrid);

  rightPanel.append(createEl("h2", "font-display text-lg", "Situationen"));
  const list = createEl("div", "mt-4 space-y-3");

  situations.forEach((item) => {
    const selected = responses[item.id];
    const correct = correctMap.get(item.id);
    const isCorrect = selected && selected === correct;

    const card = createEl(
      "button",
      classNames(
        "w-full text-left rounded-2xl border border-stone-300 bg-white/90 p-4 transition-shadow",
        item.id === active.situationId
          ? "border-azure/60 bg-azure/10 shadow-panel ring-2 ring-azure/20"
          : "hover:border-stone-300"
      )
    );
    card.type = "button";
    card.addEventListener("click", () => {
      if (active.adId && (!usedAds.get(active.adId) || usedAds.get(active.adId) === item.id)) {
        responses[item.id] = active.adId;
        active.situationId = item.id;
        active.adId = null;
        renderCurrentPart();
        return;
      }
      active.situationId = item.id;
      renderCurrentPart();
    });
    card.addEventListener("dblclick", () => {
      if (responses[item.id]) {
        delete responses[item.id];
        renderCurrentPart();
      }
    });
    card.addEventListener("dragover", (event) => {
      event.preventDefault();
    });
    card.addEventListener("drop", (event) => {
      event.preventDefault();
      const adId = event.dataTransfer?.getData("text/plain");
      if (!adId) {
        return;
      }
      if (adId !== "X" && usedAds.get(adId) && usedAds.get(adId) !== item.id) {
        return;
      }
      responses[item.id] = adId;
      active.situationId = item.id;
      active.adId = null;
      renderCurrentPart();
    });

    const pills = createEl("div", "mb-2 flex flex-wrap gap-2");
    if (submitted) {
      if (selected) {
        pills.append(makePill(`Your: ${selected}`, isCorrect ? "correct" : "wrong"));
      }
      if (!isCorrect && correct) {
        pills.append(makePill(`Correct: ${correct}`, "correct"));
      }
    } else if (selected) {
      pills.append(makePill(`Selected: ${selected}`, "selected"));
    }

    if (pills.childNodes.length) {
      card.append(pills);
    }

    card.append(createEl("p", "text-xs uppercase tracking-[0.2em] text-slate font-display", `Situation ${item.id}`));

    card.append(createEl("p", "mt-2 text-sm whitespace-pre-wrap", item.text));

    const cardWrap = createEl("div", "space-y-2");
    cardWrap.append(card);
    const translationToggle = createTranslationToggle(item.translated);
    if (translationToggle) {
      cardWrap.append(translationToggle);
    }

    list.append(cardWrap);
  });
  rightPanel.append(list, renderActionBar(partKey));
}

function renderSprachbausteine1(content) {
  const partKey = "sprachbausteine-1";
  const { responses, submitted, active } = ensurePartState(partKey);
  leftPanel.innerHTML = "";
  rightPanel.innerHTML = "";

  leftPanel.append(createEl("h2", "font-display text-xl", content.title || "Sprachbausteine"));
  leftPanel.append(createEl("p", "mt-2 text-sm text-slate", content.instruction || ""));

  const blanks = Array.isArray(content.blanks) ? content.blanks : [];
  const answers = Array.isArray(content.answers) ? content.answers : [];
  const answerMap = new Map((answers || []).map((item) => [String(item.id), item.answer || item.text || ""]));
  const templateTokens = parseSprachTextTemplate(content.text || "");
  const templateBlankIds = getTemplateBlankIds(templateTokens);
  const blankOrder = blanks.length
    ? blanks.map((blank) => String(blank.id))
    : templateBlankIds;
  const blankIds = Array.from(new Set([...templateBlankIds, ...blankOrder]));

  if ((!active.blankId || !blankIds.includes(String(active.blankId))) && blankIds.length) {
    active.blankId = blankIds[0];
  }

  const textBlock = createEl("p", "mt-6 text-sm leading-relaxed whitespace-pre-wrap");

  templateTokens.forEach((token) => {
    if (token.type === "text") {
      textBlock.append(document.createTextNode(token.value));
      return;
    }

    const blankId = String(token.id || "").trim();
    if (!blankId) {
      return;
    }

    const selected = responses[blankId];
    const correct = answerMap.get(blankId) || "";
    const isCorrect = submitted && selected && normalize(selected) === normalize(correct);
    const isWrong = submitted && selected && normalize(selected) !== normalize(correct);
    const isActive = blankId === String(active.blankId);

    const blank = createEl(
      "button",
      classNames(
        "mx-1 inline-flex min-w-[52px] items-center justify-center rounded-xl border px-2 py-1 text-xs font-display",
        isCorrect ? "border-mint/60 bg-mint/20 text-mint" :
        isWrong ? "border-rose/50 bg-rose/15 text-rose" :
        selected ? "border-azure/60 bg-azure/10 text-azure" :
        "border-stone-300 bg-stone-50 text-slate",
        isActive ? "ring-2 ring-azure/20" : ""
      ),
      selected || `(${blankId})`
    );
    blank.type = "button";
    blank.addEventListener("click", () => {
      active.blankId = blankId;
      renderCurrentPart();
    });
    textBlock.append(blank);
  });
  leftPanel.append(textBlock);
  const textTranslationToggle = createTranslationToggle(content.translated);
  if (textTranslationToggle) {
    leftPanel.append(textTranslationToggle);
  }

  const header = createEl("div", "space-y-1");
  header.append(
    createEl("h2", "font-display text-lg", "Antworten"),
    createEl("p", "text-xs uppercase tracking-[0.2em] text-slate font-display", "Wählen Sie für jede Lücke die passende Option")
  );
  rightPanel.append(header);

  const list = createEl("div", "mt-4 space-y-4");
  blankOrder.forEach((id) => {
    const blankId = String(id);
    const blank = blanks.find((item) => String(item.id) === blankId) || { id: blankId, options: [] };
    const selected = responses[blankId];
    const correct = answerMap.get(blankId) || "";
    const card = createEl(
      "div",
      classNames(
        "rounded-2xl border p-3",
        blankId === String(active.blankId) ? "border-azure/50 bg-azure/10" : "border-stone-200 bg-white"
      )
    );

    const heading = createEl("div", "flex items-center justify-between gap-2");
    heading.append(
      createEl("div", "text-xs uppercase tracking-[0.2em] text-slate font-display", `Lücke ${blankId}`)
    );
    card.append(heading);

    const options = createEl("div", "mt-2 space-y-2");
    (blank.options || []).forEach((optionText) => {
      const isSelected = normalize(optionText) === normalize(selected);
      const isCorrect = submitted && normalize(optionText) === normalize(correct);
      const isWrong = submitted && isSelected && normalize(optionText) !== normalize(correct);

      const option = createEl(
        "button",
        classNames(
          "w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors",
          isCorrect ? "border-mint/60 bg-mint/20 text-mint" :
          isWrong ? "border-rose/50 bg-rose/15 text-rose" :
          isSelected ? "border-azure/60 bg-azure/10 text-azure" :
          "border-stone-300 bg-white text-ink hover:border-stone-300"
        ),
        optionText
      );
      option.type = "button";
      option.addEventListener("click", () => {
        active.blankId = blankId;
        responses[blankId] = optionText;
        renderCurrentPart();
      });
      options.append(option);
    });

    card.append(options);
    list.append(card);
  });

  rightPanel.append(list, renderActionBar(partKey));
}

function renderSprachbausteine2(content) {
  const partKey = "sprachbausteine-2";
  const { responses, submitted, active } = ensurePartState(partKey);
  leftPanel.innerHTML = "";
  rightPanel.innerHTML = "";

  leftPanel.append(createEl("h2", "font-display text-xl", content.title || "Sprachbausteine"));
  leftPanel.append(createEl("p", "mt-2 text-sm text-slate", content.instruction || ""));

  const answers = Array.isArray(content.answers) ? content.answers : [];
  const answerMap = new Map((answers || []).map((item) => [String(item.id), item.answer || item.text || ""]));
  const templateTokens = parseSprachTextTemplate(content.text || "");
  const templateBlankIds = getTemplateBlankIds(templateTokens);
  const answerIds = answers.map((item) => String(item.id));
  const blankIds = Array.from(new Set([...templateBlankIds, ...answerIds]));

  if ((!active.blankId || !blankIds.includes(String(active.blankId))) && blankIds.length) {
    active.blankId = blankIds[0];
  }

  const usedWords = new Map();
  Object.entries(responses).forEach(([blankId, selected]) => {
    if (selected) {
      usedWords.set(normalize(selected), String(blankId));
    }
  });
  const textBlock = createEl("p", "mt-6 text-sm leading-relaxed whitespace-pre-wrap");

  templateTokens.forEach((token) => {
    if (token.type === "text") {
      textBlock.append(document.createTextNode(token.value));
      return;
    }

    const blankId = String(token.id || "").trim();
    if (!blankId) {
      return;
    }

    const selected = responses[blankId];
    const correct = answerMap.get(blankId) || "";
    const isCorrect = submitted && selected && normalize(selected) === normalize(correct);
    const isWrong = submitted && selected && normalize(selected) !== normalize(correct);
    const isActive = blankId === String(active.blankId);

    const blank = createEl(
      "button",
      classNames(
        "mx-1 inline-flex min-w-[52px] items-center justify-center rounded-xl border px-2 py-1 text-xs font-display",
        isCorrect ? "border-mint/60 bg-mint/20 text-mint" :
        isWrong ? "border-rose/50 bg-rose/15 text-rose" :
        selected ? "border-azure/60 bg-azure/10 text-azure" :
        "border-stone-300 bg-stone-50 text-slate",
        isActive ? "ring-2 ring-azure/20" : ""
      ),
      selected || `(${blankId})`
    );
    blank.type = "button";
    blank.addEventListener("click", () => {
      if (active.wordText) {
        const usedBy = usedWords.get(normalize(active.wordText));
        if (!usedBy || usedBy === blankId) {
          responses[blankId] = active.wordText;
          active.blankId = blankId;
          active.wordText = null;
          renderCurrentPart();
          return;
        }
      }
      active.blankId = blankId;
      renderCurrentPart();
    });
    blank.addEventListener("dblclick", () => {
      if (responses[blankId]) {
        delete responses[blankId];
        renderCurrentPart();
      }
    });
    blank.addEventListener("dragover", (event) => {
      event.preventDefault();
    });
    blank.addEventListener("drop", (event) => {
      event.preventDefault();
      const wordText = event.dataTransfer?.getData("text/plain");
      if (!wordText) {
        return;
      }
      const usedBy = usedWords.get(normalize(wordText));
      if (usedBy && usedBy !== blankId) {
        return;
      }
      responses[blankId] = wordText;
      active.blankId = blankId;
      active.wordText = null;
      renderCurrentPart();
    });
    textBlock.append(blank);
  });
  leftPanel.append(textBlock);
  const textTranslationToggle = createTranslationToggle(content.translated);
  if (textTranslationToggle) {
    leftPanel.append(textTranslationToggle);
  }

  const header = createEl("div", "space-y-1");
  header.append(
    createEl("h2", "font-display text-lg", "Wörter"),
    createEl(
      "p",
      "text-xs uppercase tracking-[0.2em] text-slate font-display",
      "Wählen Sie ein Wort"
    )
  );
  rightPanel.append(header);

  const optionSource = Array.isArray(content.options) ? content.options : [];
  const uniqueOptions = Array.from(new Set(optionSource.map((text) => normalize(text))))
    .map((key) => optionSource.find((text) => normalize(text) === key))
    .filter(Boolean);

  const wordBankSignature = uniqueOptions
    .map((word) => normalize(word))
    .join("|");

  if (!Array.isArray(active.shuffledWordBank) || active.wordBankSignature !== wordBankSignature) {
    active.shuffledWordBank = shuffleList(uniqueOptions);
    active.wordBankSignature = wordBankSignature;
  }

  const wordBank = active.shuffledWordBank;

  if (!wordBank.length) {
    rightPanel.append(
      createEl("div", "mt-4 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-slate", "No words available. Re-extract this exam.")
    );
  } else {
    const grid = createEl("div", "mt-4 grid grid-cols-2 gap-2");
    wordBank.forEach((wordText) => {
      const selected = responses[active.blankId];
      const correct = answerMap.get(active.blankId) || "";
      const isSelected = normalize(wordText) === normalize(selected);
      const isCorrect = submitted && normalize(wordText) === normalize(correct);
      const isWrong = submitted && isSelected && normalize(wordText) !== normalize(correct);
      const usedBy = usedWords.get(normalize(wordText));
      const isUsedByOther = !submitted && usedBy && usedBy !== active.blankId;
      const isChoiceActive = normalize(active.wordText) === normalize(wordText);

      const card = createEl(
        "button",
        classNames(
          "rounded-xl border px-3 py-2 text-xs font-display transition-colors",
          isCorrect ? "border-mint/60 bg-mint/20 text-mint" :
          isWrong ? "border-rose/50 bg-rose/15 text-rose" :
          isSelected ? "border-azure/60 bg-azure/10 text-azure" :
          isUsedByOther ? "border-stone-200 bg-stone-50 text-slate opacity-50 cursor-not-allowed" :
          "border-stone-300 bg-white text-ink hover:border-stone-300"
        ),
        wordText
      );
      card.type = "button";
      card.draggable = true;
      if (isChoiceActive) {
        card.classList.add("ring-2", "ring-azure/30");
      }
      card.addEventListener("click", () => {
        if (active.blankId && (!isUsedByOther || usedBy === active.blankId)) {
          responses[active.blankId] = wordText;
          active.wordText = null;
          renderCurrentPart();
          return;
        }
        if (isUsedByOther) {
          return;
        }
        active.wordText = wordText;
        renderCurrentPart();
      });
      card.addEventListener("dblclick", () => {
        if (usedBy) {
          delete responses[usedBy];
          active.wordText = null;
          renderCurrentPart();
        }
      });
      card.addEventListener("dragstart", (event) => {
        event.dataTransfer?.setData("text/plain", wordText);
      });
      grid.append(card);
    });
    rightPanel.append(grid);
  }
  rightPanel.append(renderActionBar(partKey));
}

function renderCurrentPart() {
  const themeEntry = getThemeEntry();
  if (!themeEntry) {
    renderMessage("Theme not found. Return to library.");
    return;
  }

  const lesenEntry = getActiveLesen(themeEntry);
  const partData = lesenEntry?.parts?.[state.part];
  if (!partData) {
    renderMessage("Part not available.");
    return;
  }

  setHeader(partData.meta);
  renderProgress(lesenEntry?.partOrder || []);

  if (state.part === "teil-1") {
    renderLesenTeil1(partData.content);
  } else if (state.part === "teil-2") {
    renderLesenTeil2(partData.content);
  } else if (state.part === "teil-3") {
    renderLesenTeil3(partData.content);
  } else if (state.part === "sprachbausteine-1") {
    renderSprachbausteine1(partData.content);
  } else if (state.part === "sprachbausteine-2") {
    renderSprachbausteine2(partData.content);
  }

  const order = lesenEntry?.partOrder || [];
  const index = order.indexOf(state.part);
  const atLastPart = index === order.length - 1;
  prevBtn.disabled = index <= 0;
  nextBtn.disabled = index === -1;
  nextBtn.textContent = atLastPart ? "Ergebnis" : "Weiter";
  prevBtn.classList.toggle("opacity-50", prevBtn.disabled);
  nextBtn.classList.toggle("opacity-50", nextBtn.disabled);
  renderPartCards();
}

function resetCurrentTheme() {
  const themeEntry = getThemeEntry();
  if (!themeEntry) {
    return;
  }
  const lesenEntry = getActiveLesen(themeEntry);
  const order = lesenEntry?.partOrder || [];
  order.forEach((partKey) => {
    const { key } = ensurePartState(partKey);
    state.responses[key] = {};
    state.submitted[key] = false;
    state.active[key] = {};
  });
  state.resultSavedFingerprint = null;
}

function toggleSettingsPanel(force) {
  if (!settingsPanel) {
    return;
  }
  const show = typeof force === "boolean" ? force : settingsPanel.classList.contains("hidden");
  settingsPanel.classList.toggle("hidden", !show);
}

function buildMainUrl() {
  const params = new URLSearchParams();
  if (state.level) {
    params.set("level", state.level);
  }
  const query = params.toString();
  return `index.html${query ? `?${query}` : ""}`;
}

function resolveLevel(levelKey) {
  const levels = Object.keys(state.db?.levels || {});
  if (!levels.length) {
    return null;
  }
  if (levelKey && levels.includes(levelKey)) {
    return levelKey;
  }
  return levels[0];
}

function resolveTheme(levelEntry, themeKey) {
  const orderedThemes = levelEntry?.themeOrder?.length
    ? levelEntry.themeOrder
    : Object.keys(levelEntry?.themes || {});
  if (!orderedThemes.length) {
    return null;
  }
  if (themeKey && orderedThemes.includes(themeKey)) {
    return themeKey;
  }
  return orderedThemes[0];
}

function resolveVersion(themeEntry, versionKey) {
  if (!versionKey) {
    return null;
  }
  const versionKeys = getVersionKeys(themeEntry);
  if (!versionKeys.length) {
    return versionKey;
  }
  return versionKeys.includes(versionKey) ? versionKey : null;
}

if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.location.href = buildMainUrl();
  });
}

if (settingsBtn && settingsPanel) {
  settingsBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleSettingsPanel();
  });

  settingsPanel.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  document.addEventListener("click", () => {
    toggleSettingsPanel(false);
  });
}

if (fontSizeInput) {
  fontSizeInput.addEventListener("input", () => {
    const value = Number.parseFloat(fontSizeInput.value);
    applyFontScale(value);
    window.localStorage.setItem("fontScale", String(value));
  });
}

if (timerToggle) {
  timerToggle.addEventListener("change", () => {
    setTimerEnabled(timerToggle.checked);
  });
}

prevBtn.addEventListener("click", () => {
  const themeEntry = getThemeEntry();
  const order = getActiveLesen(themeEntry)?.partOrder || [];
  const index = order.indexOf(state.part);
  if (index > 0) {
    void navigateToPart(order[index - 1]);
  }
});

nextBtn.addEventListener("click", () => {
  const themeEntry = getThemeEntry();
  const order = getActiveLesen(themeEntry)?.partOrder || [];
  const index = order.indexOf(state.part);
  if (index >= 0 && index < order.length - 1) {
    void navigateToPart(order[index + 1]);
    return;
  }
  if (index === order.length - 1) {
    setView("results");
    renderResults();
  }
});

if (resultRetryBtn) {
  resultRetryBtn.addEventListener("click", () => {
    resetCurrentTheme();
    const themeEntry = getThemeEntry();
    const order = getActiveLesen(themeEntry)?.partOrder || [];
    state.part = order[0] || null;
    setView("exam");
    startExamTimer();
    renderCurrentPart();
  });
}

if (resultHomeBtn) {
  resultHomeBtn.addEventListener("click", () => {
    window.location.href = buildMainUrl();
  });
}

// Aside (mobile) open/close helpers
function openAside() {
  syncAsideLayout({ open: true, focusPanel: true });
}

function closeAside({ restoreFocus = true } = {}) {
  syncAsideLayout({ open: false, restoreFocus });
}

function toggleAside() {
  if (state.asideOpen) {
    closeAside();
  } else {
    openAside();
  }
}

// Wire up aside toggle controls
if (asideToggle) {
  asideToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleAside();
  });
}

if (asideOverlay) {
  asideOverlay.addEventListener("click", () => {
    closeAside();
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeAside({ restoreFocus: false });
  }
});

document.addEventListener("mousedown", handleExamPointerDown, true);
document.addEventListener("mouseup", handleExamPointerUp, true);
document.addEventListener("click", suppressClickAfterSelection, true);

// Ensure state is correct on resize (desktop should show aside without overlay)
window.addEventListener("resize", () => {
  syncAsideLayout({ open: state.asideOpen });
});

syncAsideLayout({ open: false });

async function init() {
  if (typeof setupCommunityWidgets === "function") {
    setupCommunityWidgets();
  }
  state.config = await loadConfig();
  const storedScale = getStoredFontScale();
  const scale = storedScale ?? state.config.fontScale ?? DEFAULT_CONFIG.fontScale;
  applyFontScale(scale);
  if (fontSizeInput) {
    fontSizeInput.value = String(scale);
  }
  applyAsideWidth(state.config.asideWidth);
  applyTimerConfig();

  state.db = await loadDatabase(state.config);
  if (!state.db) {
    renderMessage("database/lesen.json not found. Run scripts/build_database.py");
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const levelKey = params.get("level");
  const themeKey = params.get("theme");
  const versionKey = params.get("version");

  state.level = resolveLevel(levelKey);
  if (state.level) {
    window.localStorage.setItem("lastLevel", state.level);
  }
  const levelEntry = state.db.levels?.[state.level] || null;
  state.theme = resolveTheme(levelEntry, themeKey);
  const themeEntry = getThemeEntry();
  if (!themeEntry) {
    renderMessage("Theme not found. Return to library.");
    return;
  }
  state.version = resolveVersion(themeEntry, versionKey);

  const lesenEntry = getActiveLesen(themeEntry);
  const order = lesenEntry?.partOrder || Object.keys(lesenEntry?.parts || {});
  state.part = order[0] || null;

  setView("exam");
  startExamTimer();
  renderCurrentPart();
}

init();
