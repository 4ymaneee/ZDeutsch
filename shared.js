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
  homepagePromo: {
    enabled: true
  },
  ads: {
    top: {
      enabled: false,
      desktopImage: "",
      mobileImage: "",
      clickUrl: ""
    },
    bottom: {
      enabled: false,
      desktopImage: "",
      mobileImage: "",
      clickUrl: "",
      displayIntervalHours: 3
    }
  },
  modules: [DEFAULT_MODULE],
  defaultModule: DEFAULT_MODULE.name,
  timer: DEFAULT_MODULE.timer,
  scoreConfig: DEFAULT_MODULE.scoreConfig,
  dataFile: DEFAULT_MODULE.dataFile
};

const COMMUNITY_WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/CwFPqDeRbmqL5Rtx02NOCP?mode=hq1tswi";
const COMMUNITY_WHATSAPP_COMPOSE_URL = "https://wa.me/?text=";
const LESEN_PROGRESS_STORAGE_KEY = "zdeutsch.lesen.progress.v1";
const BOTTOM_BANNER_DISMISS_KEY = "zdeutsch.ads.bottom.dismissed.v1";
const DEFAULT_BOTTOM_BANNER_INTERVAL_HOURS = 3;
const LEGACY_PROMO_PATH_PREFIX = "assets/ads/banners/";
const PUBLIC_PROMO_PATH_PREFIX = "assets/highlights/slots/";

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

function normalizeIntervalHours(value, fallback = DEFAULT_BOTTOM_BANNER_INTERVAL_HOURS) {
  const raw = String(value ?? "").trim();
  const candidate = raw === "" ? Number.NaN : Number(raw);
  if (Number.isFinite(candidate) && candidate >= 0) {
    return candidate;
  }
  const base = Number(fallback);
  if (Number.isFinite(base) && base >= 0) {
    return base;
  }
  return DEFAULT_BOTTOM_BANNER_INTERVAL_HOURS;
}

function normalizeBannerSlot(slotKey, slot, fallback = {}) {
  const source = slot && typeof slot === "object" && !Array.isArray(slot) ? slot : {};
  const base = fallback && typeof fallback === "object" && !Array.isArray(fallback) ? fallback : {};
  const normalized = {
    enabled: typeof source.enabled === "boolean" ? source.enabled : Boolean(base.enabled),
    desktopImage: typeof source.desktopImage === "string" ? source.desktopImage.trim() : String(base.desktopImage || "").trim(),
    mobileImage: typeof source.mobileImage === "string" ? source.mobileImage.trim() : String(base.mobileImage || "").trim(),
    clickUrl: typeof source.clickUrl === "string" ? source.clickUrl.trim() : String(base.clickUrl || "").trim()
  };
  if (slotKey === "bottom") {
    normalized.displayIntervalHours = normalizeIntervalHours(source.displayIntervalHours, base.displayIntervalHours);
  }
  return normalized;
}

function normalizeAdsConfig(ads) {
  const source = ads && typeof ads === "object" && !Array.isArray(ads) ? ads : {};
  return {
    top: normalizeBannerSlot("top", source.top, DEFAULT_CONFIG.ads.top),
    bottom: normalizeBannerSlot("bottom", source.bottom, DEFAULT_CONFIG.ads.bottom)
  };
}

function normalizeHomepagePromoConfig(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    enabled: typeof source.enabled === "boolean"
      ? source.enabled
      : Boolean(DEFAULT_CONFIG.homepagePromo.enabled)
  };
}

function normalizeConfig(config) {
  const merged = { ...DEFAULT_CONFIG, ...(config || {}) };
  const entries = Array.isArray(config?.modules) && config.modules.length
    ? config.modules
    : [{ name: config?.name || merged.defaultModule, dataFile: config?.dataFile, timer: config?.timer, scoreConfig: config?.scoreConfig }];
  const modules = entries.map((entry) => buildModuleConfig(entry));
  const defaultModuleName = config?.defaultModule || modules[0].name;
  const activeModule = modules.find((module) => module.name === defaultModuleName) || modules[0];
  return {
    ...merged,
    homepagePromo: normalizeHomepagePromoConfig(config?.homepagePromo),
    ads: normalizeAdsConfig(config?.ads),
    modules,
    defaultModule: defaultModuleName,
    dataFile: activeModule.dataFile,
    timer: activeModule.timer,
    scoreConfig: activeModule.scoreConfig,
    activeModuleName: activeModule.name
  };
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

function resolveBannerImagePath(value) {
  const source = String(value || "").trim();
  if (!source) {
    return "";
  }
  if (/^(https?:)?\/\//i.test(source) || source.startsWith("data:")) {
    return source;
  }
  const hasLeadingSlash = source.startsWith("/");
  const normalizedSource = source.replace(/^\/+/, "");
  const remappedPath = normalizedSource.startsWith(LEGACY_PROMO_PATH_PREFIX)
    ? `${PUBLIC_PROMO_PATH_PREFIX}${normalizedSource.slice(LEGACY_PROMO_PATH_PREFIX.length)}`
    : normalizedSource;

  if (hasLeadingSlash) {
    const cleanPath = remappedPath;
    const segments = String(window.location.pathname || "/")
      .split("/")
      .filter(Boolean);
    if (segments.length && /\.[a-z0-9]+$/i.test(segments[segments.length - 1])) {
      segments.pop();
    }
    const basePath = segments.length ? `/${segments.join("/")}/` : "/";
    return `${basePath}${cleanPath}`;
  }
  return remappedPath;
}

function resolveBannerClickPath(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  if (raw.startsWith("/") || raw.startsWith("#") || raw.startsWith("?")) {
    return raw;
  }
  if (/^(https?:)?\/\//i.test(raw) || /^mailto:/i.test(raw) || /^tel:/i.test(raw)) {
    return raw;
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) {
    return "";
  }
  return `https://${raw}`;
}

function isExternalBannerLink(href) {
  return /^(https?:)?\/\//i.test(String(href || ""));
}

function createBannerPicture(slotConfig, altText) {
  const desktopSrc = resolveBannerImagePath(slotConfig?.desktopImage);
  const mobileSrc = resolveBannerImagePath(slotConfig?.mobileImage);
  if (!desktopSrc && !mobileSrc) {
    return null;
  }

  const picture = document.createElement("picture");
  if (mobileSrc) {
    const mobileSource = document.createElement("source");
    mobileSource.media = "(max-width: 767px)";
    mobileSource.srcset = mobileSrc;
    picture.append(mobileSource);
  }

  const img = document.createElement("img");
  img.className = "site-promo-image";
  img.src = desktopSrc || mobileSrc;
  img.alt = altText;
  img.loading = "lazy";
  img.decoding = "async";
  picture.append(img);
  return picture;
}

function createBannerMedia(slotConfig, altText) {
  const picture = createBannerPicture(slotConfig, altText);
  if (!picture) {
    return null;
  }

  const href = resolveBannerClickPath(slotConfig?.clickUrl);
  if (!href) {
    return picture;
  }

  const link = createEl("a", "site-promo-link");
  link.href = href;
  link.setAttribute("aria-label", altText);
  if (isExternalBannerLink(href)) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }
  link.append(picture);
  return link;
}

function getTopBannerHost() {
  return document.getElementById("home-view");
}

function renderHomepagePromo(homepagePromoConfig) {
  const section = document.getElementById("homepage-promo-section");
  if (!section) {
    return;
  }
  section.classList.toggle("hidden", !homepagePromoConfig?.enabled);
}

function renderTopBanner(topConfig) {
  const existing = document.getElementById("site-top-promo");
  if (existing) {
    existing.remove();
  }

  if (!topConfig?.enabled) {
    return;
  }

  const media = createBannerMedia(topConfig, "Top advertisement banner");
  if (!media) {
    return;
  }

  const host = getTopBannerHost();
  if (!host) {
    return;
  }

  const section = createEl("section", "site-promo-top-wrap");
  section.id = "site-top-promo";
  const inner = createEl("div", "site-promo-inner");
  inner.append(media);
  section.append(inner);
  host.prepend(section);
}

function getBottomBannerFingerprint(bottomConfig) {
  const desktop = String(bottomConfig?.desktopImage || "").trim();
  const mobile = String(bottomConfig?.mobileImage || "").trim();
  const clickUrl = String(bottomConfig?.clickUrl || "").trim();
  return `${desktop}|${mobile}|${clickUrl}`;
}

function readBottomBannerDismissState() {
  const raw = window.localStorage.getItem(BOTTOM_BANNER_DISMISS_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    // backwards compatibility for old string format
  }
  if (typeof raw === "string" && raw.trim()) {
    return {
      fingerprint: raw.trim(),
      dismissedAt: 0
    };
  }
  return null;
}

function getBottomBannerDismissIntervalMs(bottomConfig) {
  const hours = normalizeIntervalHours(
    bottomConfig?.displayIntervalHours,
    DEFAULT_BOTTOM_BANNER_INTERVAL_HOURS
  );
  return hours * 60 * 60 * 1000;
}

function getBottomBannerDismissRemainingMs(bottomConfig) {
  const fingerprint = getBottomBannerFingerprint(bottomConfig);
  if (!fingerprint) {
    return 0;
  }
  const state = readBottomBannerDismissState();
  if (!state || String(state.fingerprint || "") !== fingerprint) {
    return 0;
  }
  const intervalMs = getBottomBannerDismissIntervalMs(bottomConfig);
  if (!intervalMs) {
    return 0;
  }
  const dismissedAt = Number(state.dismissedAt);
  if (!Number.isFinite(dismissedAt) || dismissedAt <= 0) {
    return 0;
  }
  return Math.max(0, intervalMs - (Date.now() - dismissedAt));
}

function dismissBottomBanner(bottomConfig) {
  const fingerprint = getBottomBannerFingerprint(bottomConfig);
  if (!fingerprint) {
    return;
  }
  const state = {
    fingerprint,
    dismissedAt: Date.now()
  };
  window.localStorage.setItem(BOTTOM_BANNER_DISMISS_KEY, JSON.stringify(state));
}

function getFixedFooterOffset() {
  const candidates = [
    document.getElementById("footer"),
    document.getElementById("horen-footer")
  ].filter(Boolean);

  let maxHeight = 0;
  candidates.forEach((element) => {
    if (!element) {
      return;
    }
    const styles = window.getComputedStyle(element);
    if (styles.position !== "fixed" || styles.display === "none" || styles.visibility === "hidden") {
      return;
    }
    maxHeight = Math.max(maxHeight, element.offsetHeight || 0);
  });
  return maxHeight;
}

let bottomBannerResizeHandler = null;
let bottomBannerRetryTimer = null;

function renderBottomBanner(bottomConfig) {
  const existing = document.getElementById("site-bottom-promo");
  if (existing) {
    existing.remove();
  }

  if (bottomBannerResizeHandler) {
    window.removeEventListener("resize", bottomBannerResizeHandler);
    bottomBannerResizeHandler = null;
  }
  if (bottomBannerRetryTimer) {
    window.clearTimeout(bottomBannerRetryTimer);
    bottomBannerRetryTimer = null;
  }

  if (!bottomConfig?.enabled) {
    return;
  }

  const dismissedForMs = getBottomBannerDismissRemainingMs(bottomConfig);
  if (dismissedForMs > 0) {
    bottomBannerRetryTimer = window.setTimeout(() => {
      renderBottomBanner(bottomConfig);
    }, dismissedForMs + 120);
    return;
  }

  const media = createBannerMedia(bottomConfig, "Bottom advertisement banner");
  if (!media) {
    return;
  }

  const banner = createEl("div", "site-bottom-promo");
  banner.id = "site-bottom-promo";

  const inner = createEl("div", "site-promo-inner site-promo-bottom-inner");
  const closeBtn = createEl("button", "site-bottom-promo-close", "Close");
  closeBtn.type = "button";
  closeBtn.addEventListener("click", () => {
    dismissBottomBanner(bottomConfig);
    banner.remove();
    if (bottomBannerResizeHandler) {
      window.removeEventListener("resize", bottomBannerResizeHandler);
      bottomBannerResizeHandler = null;
    }
    const retryInMs = getBottomBannerDismissRemainingMs(bottomConfig);
    if (retryInMs > 0) {
      bottomBannerRetryTimer = window.setTimeout(() => {
        renderBottomBanner(bottomConfig);
      }, retryInMs + 120);
    }
  });

  inner.append(media, closeBtn);
  banner.append(inner);
  document.body.append(banner);

  const applyOffset = () => {
    const offset = getFixedFooterOffset();
    banner.style.bottom = `${offset > 0 ? offset + 12 : 12}px`;
  };

  bottomBannerResizeHandler = applyOffset;
  window.addEventListener("resize", applyOffset);
  applyOffset();
}

async function setupSiteBanners(config) {
  const activeConfig = config ? normalizeConfig(config) : await loadConfig();
  renderHomepagePromo(activeConfig.homepagePromo);
  const ads = activeConfig?.ads || DEFAULT_CONFIG.ads;
  renderTopBanner(ads.top);
  renderBottomBanner(ads.bottom);
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

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    void setupSiteBanners();
  }, { once: true });
} else {
  void setupSiteBanners();
}
