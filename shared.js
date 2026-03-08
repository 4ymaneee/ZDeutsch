const DEFAULT_MODULE = {
  name: "lesen",
  dataFile: "lesen.json",
  timer: {
    enabled: true,
    durationMinutes: 90
  },
  scoreConfig: {
    passPercent: 60,
    parts: {
      "teil-1": { pointsPerQuestion: 5 },
      "teil-2": { pointsPerQuestion: 5 },
      "teil-3": { pointsPerQuestion: 2.5 },
      "sprachbausteine-1": { pointsPerQuestion: 1.5 },
      "sprachbausteine-2": { pointsPerQuestion: 1.5 }
    }
  }
};

const DEFAULT_CONFIG = {
  fontScale: 1,
  asideWidth: "40%",
  showMeinLangAd: true,
  modules: [DEFAULT_MODULE],
  defaultModule: DEFAULT_MODULE.name,
  timer: DEFAULT_MODULE.timer,
  scoreConfig: DEFAULT_MODULE.scoreConfig,
  dataFile: DEFAULT_MODULE.dataFile
};

const COMMUNITY_WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/CwFPqDeRbmqL5Rtx02NOCP?mode=hq1tswi";
const COMMUNITY_WHATSAPP_COMPOSE_URL = "https://wa.me/?text=";
const LESEN_PROGRESS_STORAGE_KEY = "zdeutsch.lesen.progress.v1";

function classNames(...items) {
  return items.filter(Boolean).join(" ");
}

function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) {
    el.className = className;
  }
  if (text !== undefined) {
    el.textContent = text;
  }
  return el;
}

function normalize(value) {
  return (value || "").toLowerCase().trim();
}

function buildModuleConfig(entry) {
  const target = entry || {};
  return {
    name: target.name || DEFAULT_MODULE.name,
    dataFile: target.dataFile || DEFAULT_MODULE.dataFile,
    timer: {
      ...DEFAULT_MODULE.timer,
      ...(target.timer || {})
    },
    scoreConfig: {
      passPercent: target.scoreConfig?.passPercent ?? DEFAULT_MODULE.scoreConfig.passPercent,
      parts: {
        ...DEFAULT_MODULE.scoreConfig.parts,
        ...(target.scoreConfig?.parts || {})
      }
    }
  };
}

function normalizeConfig(config) {
  const merged = { ...DEFAULT_CONFIG, ...(config || {}) };
  const showMeinLangAd = typeof config?.showMeinLangAd === "boolean"
    ? config.showMeinLangAd
    : DEFAULT_CONFIG.showMeinLangAd;
  const entries = Array.isArray(config?.modules) && config.modules.length
    ? config.modules
    : [{ name: config?.name || merged.defaultModule, dataFile: config?.dataFile, timer: config?.timer, scoreConfig: config?.scoreConfig }];
  const modules = entries.map((entry) => buildModuleConfig(entry));
  const defaultModuleName = config?.defaultModule || modules[0].name;
  const activeModule = modules.find((module) => module.name === defaultModuleName) || modules[0];
  return {
    ...merged,
    showMeinLangAd,
    modules,
    defaultModule: defaultModuleName,
    dataFile: activeModule.dataFile,
    timer: activeModule.timer,
    scoreConfig: activeModule.scoreConfig,
    activeModuleName: activeModule.name
  };
}

function isMeinLangAdEnabled(config) {
  if (typeof config?.showMeinLangAd === "boolean") {
    return config.showMeinLangAd;
  }
  return DEFAULT_CONFIG.showMeinLangAd;
}

async function loadConfig() {
  const paths = ["database/config.json", "../database/config.json"];
  for (const path of paths) {
    try {
      const response = await fetch(path);
      if (response.ok) {
        const config = await response.json();
        return normalizeConfig(config);
      }
    } catch (error) {
      // ignore and try next
    }
  }
  return normalizeConfig();
}

async function loadDatabase(config) {
  const resolvedConfig = config || DEFAULT_CONFIG;
  const dataFile = resolvedConfig.dataFile || DEFAULT_CONFIG.dataFile;
  const paths = [`database/${dataFile}`, `../database/${dataFile}`];
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

function getVersionKeys(themeEntry) {
  if (!themeEntry) {
    return [];
  }
  if (themeEntry.versionOrder?.length) {
    return themeEntry.versionOrder;
  }
  return Object.keys(themeEntry.versions || {});
}

function makeLesenProgressEntryKey(levelKey, themeKey, versionKey) {
  return [levelKey || "", themeKey || "", versionKey || "default"].join("|");
}

function loadLesenProgressStore() {
  try {
    const raw = window.localStorage.getItem(LESEN_PROGRESS_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    // ignore and fall back
  }
  return {};
}

function saveLesenProgressStore(store) {
  try {
    window.localStorage.setItem(LESEN_PROGRESS_STORAGE_KEY, JSON.stringify(store || {}));
  } catch (error) {
    // ignore storage failures
  }
}

function getLesenProgressEntry(levelKey, themeKey, versionKey) {
  const store = loadLesenProgressStore();
  const key = makeLesenProgressEntryKey(levelKey, themeKey, versionKey);
  const entry = store[key];
  if (!entry || typeof entry !== "object") {
    return null;
  }
  return entry;
}

function saveLesenProgressResult({
  levelKey,
  themeKey,
  versionKey,
  percent,
  earnedPoints,
  maxPoints,
  passed
}) {
  const key = makeLesenProgressEntryKey(levelKey, themeKey, versionKey);
  const store = loadLesenProgressStore();
  const current = store[key] && typeof store[key] === "object" ? store[key] : {};
  const safePercent = Number.isFinite(percent) ? Math.round(percent) : 0;
  const safeEarned = Number.isFinite(earnedPoints) ? earnedPoints : 0;
  const safeMax = Number.isFinite(maxPoints) ? maxPoints : 0;
  const attempts = Number.isFinite(current.attempts) ? current.attempts + 1 : 1;
  const passedAttempts = Number.isFinite(current.passedAttempts)
    ? current.passedAttempts + (passed ? 1 : 0)
    : (passed ? 1 : 0);

  store[key] = {
    levelKey: levelKey || "",
    themeKey: themeKey || "",
    versionKey: versionKey || "default",
    attempts,
    passedAttempts,
    lastPercent: safePercent,
    bestPercent: Math.max(Number.isFinite(current.bestPercent) ? current.bestPercent : 0, safePercent),
    lastEarnedPoints: safeEarned,
    lastMaxPoints: safeMax,
    lastPassed: Boolean(passed),
    lastAttemptAt: Date.now()
  };

  saveLesenProgressStore(store);
  return store[key];
}

function getCommunitySuggestionStaticLines() {
  return [
    "#suggestion",
    `الصفحة: ${window.location.href}`,
    "النوع: تعديل أو موضوع جديد"
  ];
}

function buildCommunitySuggestionMessage(details) {
  return [
    ...getCommunitySuggestionStaticLines(),
    "التفاصيل:",
    details.trim()
  ].join("\n");
}

function buildWhatsAppComposeUrl(message) {
  return `${COMMUNITY_WHATSAPP_COMPOSE_URL}${encodeURIComponent(message || "")}`;
}

function copyTextFallback(text) {
  const temp = document.createElement("textarea");
  temp.value = text;
  temp.setAttribute("readonly", "true");
  temp.style.position = "fixed";
  temp.style.opacity = "0";
  document.body.append(temp);
  temp.select();
  document.execCommand("copy");
  temp.remove();
}

function setupCommunityWidgets() {
  if (document.getElementById("community-suggest-modal")) {
    return;
  }

  const promoTarget = document.getElementById("community-promo-target");
  if (promoTarget) {
    const promoCard = createEl("section", "community-promo");
    const content = createEl("div", "community-promo-content");
    const title = createEl(
      "h3",
      "community-promo-title",
      "WhatsApp Community | مجتمع واتساب | WhatsApp Gemeinschaft"
    );
    const line = createEl(
      "p",
      "community-promo-line",
      "Suggest updates or new exam themes: EN | AR | DE"
    );
    const actions = createEl("div", "community-promo-actions");
    const joinLink = createEl("a", "community-btn community-btn-primary", "Join WhatsApp");
    joinLink.href = COMMUNITY_WHATSAPP_GROUP_URL;
    joinLink.target = "_blank";
    joinLink.rel = "noopener noreferrer";
    const suggestBtn = createEl("button", "community-btn community-btn-secondary community-open-btn", "Suggest a change");
    suggestBtn.type = "button";
    actions.append(joinLink, suggestBtn);
    content.append(title, line);
    promoCard.append(content, actions);
    promoTarget.append(promoCard);
  }

  const floatingButton = createEl("button", "community-floating-btn community-open-btn", "WhatsApp Suggestions");
  floatingButton.type = "button";
  floatingButton.id = "community-floating-btn";
  document.body.append(floatingButton);

  const modal = createEl("div", "community-modal hidden");
  modal.id = "community-suggest-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "community-modal-title");

  const backdrop = createEl("div", "community-modal-backdrop");
  backdrop.setAttribute("data-community-close", "true");
  const panel = createEl("div", "community-modal-panel");
  const closeBtn = createEl("button", "community-modal-close");
  closeBtn.type = "button";
  closeBtn.setAttribute("data-community-close", "true");
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.textContent = "×";
  const title = createEl(
    "h3",
    "community-modal-title",
    "Suggest Modifications / New Themes"
  );
  title.id = "community-modal-title";
  const textEn = createEl(
    "p",
    "community-modal-line",
    "EN: Write your idea, copy it, then open the WhatsApp group and paste it."
  );
  const textAr = createEl(
    "p",
    "community-modal-line",
    "AR: اكتب اقتراحك، انسخه، ثم افتح مجموعة واتساب وأرسله."
  );
  textAr.setAttribute("dir", "rtl");
  const textDe = createEl(
    "p",
    "community-modal-line",
    "DE: Schreibe deinen Vorschlag, kopiere ihn und sende ihn in der WhatsApp-Gruppe."
  );

  const textarea = document.createElement("textarea");
  textarea.id = "community-suggest-text";
  textarea.className = "community-modal-textarea";
  textarea.rows = 7;
  textarea.placeholder = "اكتب التفاصيل هنا...";

  const status = createEl("p", "community-modal-status", "");
  status.id = "community-copy-status";

  const actionRow = createEl("div", "community-modal-actions");
  const copyBtn = createEl("button", "community-btn community-btn-secondary", "Copy suggestion");
  copyBtn.type = "button";
  copyBtn.id = "community-copy-btn";
  const openGroup = createEl("a", "community-btn community-btn-primary", "Open WhatsApp (Prefilled)");
  openGroup.href = buildWhatsAppComposeUrl("");
  openGroup.target = "_blank";
  openGroup.rel = "noopener noreferrer";
  actionRow.append(copyBtn, openGroup);

  panel.append(closeBtn, title, textEn, textAr, textDe, textarea, status, actionRow);
  modal.append(backdrop, panel);
  document.body.append(modal);

  const modalOpenButtons = Array.from(document.querySelectorAll(".community-open-btn"));

  const closeModal = () => {
    modal.classList.add("hidden");
    document.body.classList.remove("community-modal-open");
  };

  const openModal = () => {
    status.textContent = "";
    modal.classList.remove("hidden");
    document.body.classList.add("community-modal-open");
    textarea.focus();
  };

  modalOpenButtons.forEach((button) => {
    button.addEventListener("click", openModal);
  });

  modal.addEventListener("click", (event) => {
    if (event.target instanceof HTMLElement && event.target.dataset.communityClose) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  });

  copyBtn.addEventListener("click", async () => {
    const details = textarea.value.trim();
    if (!details) {
      status.textContent = "يرجى كتابة التفاصيل أولاً.";
      return;
    }
    const message = buildCommunitySuggestionMessage(details);
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(message);
        status.textContent = "Copied. Open WhatsApp and paste your suggestion.";
        return;
      } catch (error) {
        // ignore and fallback
      }
    }
    copyTextFallback(message);
    status.textContent = "Copied. Open WhatsApp and paste your suggestion.";
  });

  openGroup.addEventListener("click", (event) => {
    const details = textarea.value.trim();
    if (!details) {
      status.textContent = "يرجى كتابة التفاصيل أولاً.";
      event.preventDefault();
      textarea.focus();
      return;
    }
    const message = buildCommunitySuggestionMessage(details);
    openGroup.href = buildWhatsAppComposeUrl(message);
    status.textContent = "";
  });
}
