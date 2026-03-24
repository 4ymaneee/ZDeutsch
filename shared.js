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
const WHATSAPP_WELCOME_GATE_ACCEPTED_KEY = "zdeutsch.whatsappWelcomeGate.accepted.v1";
const WHATSAPP_WELCOME_GATE_COUNTDOWN_SECONDS = 20;
const WHATSAPP_WELCOME_MESSAGES_FILE = "whatsapp-welcome-messages.json";
// Keep this file in sync with your uploaded portrait.
const WHATSAPP_WELCOME_MAIN_AVATAR = "assets/admin.png";
const WHATSAPP_WELCOME_MAIN_AUTHOR = "zadelkhair";
const WHATSAPP_WELCOME_MAIN_ROLE = "Admin";
const WHATSAPP_WELCOME_PROFILE_TAGLINE = "Moroccan IT engeneer";
const WHATSAPP_WELCOME_CONTACT_URL = "https://wa.me/212680096104";
const DEFAULT_WHATSAPP_WELCOME_MESSAGES = Object.freeze([
  {
    userName: WHATSAPP_WELCOME_MAIN_AUTHOR,
    imageType: "outgoing",
    direction: "rtl",
    messageContent: "مرحبا بك في مجتمع ZDeutsch على واتساب. شارك أي ملاحظة أو تصحيح.",
    avatar: WHATSAPP_WELCOME_MAIN_AVATAR,
    role: WHATSAPP_WELCOME_MAIN_ROLE,
    reactionCount: "72",
    reactions: ["👍", "❤️"]
  },
  {
    userName: "Member",
    imageType: "incoming",
    direction: "rtl",
    messageContent: "شكرا على المجهود 🙏"
  }
]);
const DEFAULT_WHATSAPP_OUTGOING_MESSAGE = DEFAULT_WHATSAPP_WELCOME_MESSAGES.find((entry) => entry.imageType === "outgoing")
  || DEFAULT_WHATSAPP_WELCOME_MESSAGES[0];
const DEFAULT_WHATSAPP_INCOMING_REPLIES = DEFAULT_WHATSAPP_WELCOME_MESSAGES
  .filter((entry) => entry.imageType !== "outgoing")
  .map((entry) => entry.messageContent)
  .filter(Boolean);
const WHATSAPP_CONTENT = {
  title: "مرحبا بك",
  // subtitle: "اقرأ الرسائل ثم ابدأ التدريب",
  bottomTitle: "مجتمع واتساب",
  // bottomSubtitle: "نفس الرسائل، نفس الستايل، ونفس طريقة التواصل.",
  avatar: DEFAULT_WHATSAPP_OUTGOING_MESSAGE?.avatar || WHATSAPP_WELCOME_MAIN_AVATAR,
  author: DEFAULT_WHATSAPP_OUTGOING_MESSAGE?.userName || WHATSAPP_WELCOME_MAIN_AUTHOR,
  role: DEFAULT_WHATSAPP_OUTGOING_MESSAGE?.role || WHATSAPP_WELCOME_MAIN_ROLE,
  message: DEFAULT_WHATSAPP_OUTGOING_MESSAGE?.messageContent || "",
  reactionCount: DEFAULT_WHATSAPP_OUTGOING_MESSAGE?.reactionCount || "",
  reactions: Array.isArray(DEFAULT_WHATSAPP_OUTGOING_MESSAGE?.reactions)
    ? [...DEFAULT_WHATSAPP_OUTGOING_MESSAGE.reactions]
    : [],
  replies: DEFAULT_WHATSAPP_INCOMING_REPLIES,
  messages: DEFAULT_WHATSAPP_WELCOME_MESSAGES.map((entry) => ({ ...entry })),
  composerPlaceholder: "اكتب رسالتك ثم أرسلها إلى مجموعة واتساب",
  composerEmptyError: "اكتب الرسالة أولاً.",
  joinLabel: "انضم إلى WhatsApp",
  acceptCountdownLabel: (seconds) => `انتظر ${seconds} ثانية`,
  acceptReadyLabel: "موافق، الدخول إلى الموقع",
  countdownLabel: (seconds) => `يمكنك المتابعة بعد ${seconds} ثانية`,
  countdownReadyLabel: "يمكنك الآن الدخول إلى الموقع.",
  profileLabel: "عرض صورة المدير",
  profileTagline: WHATSAPP_WELCOME_PROFILE_TAGLINE,
  profileContactLabel: "Contact me on WhatsApp",
  profileContactUrl: WHATSAPP_WELCOME_CONTACT_URL
};
const DEFAULT_BOTTOM_BANNER_INTERVAL_HOURS = 3;
const LEGACY_PROMO_PATH_PREFIX = "assets/ads/banners/";
const PUBLIC_PROMO_PATH_PREFIX = "assets/highlights/slots/";

const SHARED_SCRIPT_BASE_URL = (() => {
  if (document.currentScript?.src) {
    try {
      return new URL(".", document.currentScript.src);
    } catch (error) {
      // fall through to static lookup
    }
  }

  const linkedScript = document.querySelector('script[src*="shared.js"]');
  if (linkedScript?.src) {
    try {
      return new URL(".", linkedScript.src);
    } catch (error) {
      // fall through to location fallback
    }
  }

  return new URL(".", window.location.href);
})();

function buildDatabaseCandidatePaths(fileName) {
  const cleanFileName = String(fileName || "").replace(/^\/+/, "");
  if (!cleanFileName) {
    return [];
  }

  const paths = [
    new URL(`database/${cleanFileName}`, SHARED_SCRIPT_BASE_URL).toString(),
    `database/${cleanFileName}`,
    `../database/${cleanFileName}`
  ];

  const seen = new Set();
  return paths.filter((path) => {
    const key = String(path || "").trim();
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function normalizeWhatsAppMessageType(value) {
  const raw = normalize(value);
  if (raw === "outgoing" || raw === "admin") {
    return "outgoing";
  }
  return "incoming";
}

function normalizeWhatsAppMessageDirection(value) {
  const raw = normalize(value);
  if (raw === "rtl" || raw === "ltr") {
    return raw;
  }
  return "auto";
}

function sanitizeWhatsAppMessageEntry(entry, fallbackOutgoing) {
  if (!entry || typeof entry !== "object") {
    return null;
  }
  const messageContent = String(entry.messageContent || entry.message || "").trim();
  if (!messageContent) {
    return null;
  }
  const imageType = normalizeWhatsAppMessageType(entry.imageType || entry.type);
  const direction = normalizeWhatsAppMessageDirection(entry.direction || entry.dir);
  const userName = String(
    entry.userName
    || entry.author
    || (imageType === "outgoing" ? fallbackOutgoing?.userName : "Member")
    || ""
  ).trim();
  const avatar = String(entry.avatar || fallbackOutgoing?.avatar || WHATSAPP_WELCOME_MAIN_AVATAR).trim();
  const role = String(entry.role || fallbackOutgoing?.role || WHATSAPP_WELCOME_MAIN_ROLE).trim();
  const reactionCount = String(entry.reactionCount || "").trim();
  const reactions = Array.isArray(entry.reactions)
    ? entry.reactions.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  return {
    userName,
    imageType,
    direction,
    messageContent,
    avatar,
    role,
    reactionCount,
    reactions
  };
}

function getDefaultWhatsAppWelcomeMessages() {
  return DEFAULT_WHATSAPP_WELCOME_MESSAGES.map((entry) => ({
    ...entry,
    reactions: Array.isArray(entry.reactions) ? [...entry.reactions] : []
  }));
}

function extractWhatsAppMessagesFromPayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === "object" && Array.isArray(payload.messages)) {
    return payload.messages;
  }
  return [];
}

function getWhatsAppChatMessages(content) {
  const fallbackDefaults = getDefaultWhatsAppWelcomeMessages();
  const fallbackOutgoing = fallbackDefaults.find((entry) => entry.imageType === "outgoing") || fallbackDefaults[0];
  const fromContent = Array.isArray(content?.messages)
    ? content.messages
    : [
      {
        userName: content?.author,
        imageType: "outgoing",
        messageContent: content?.message,
        avatar: content?.avatar,
        role: content?.role,
        reactionCount: content?.reactionCount,
        reactions: content?.reactions
      },
      ...((content?.replies || []).map((replyText) => ({
        userName: "Member",
        imageType: "incoming",
        messageContent: replyText
      })))
    ];

  const sanitized = fromContent
    .map((entry) => sanitizeWhatsAppMessageEntry(entry, fallbackOutgoing))
    .filter(Boolean);

  return sanitized.length ? sanitized : fallbackDefaults;
}

async function loadWhatsAppWelcomeMessages() {
  const paths = buildDatabaseCandidatePaths(WHATSAPP_WELCOME_MESSAGES_FILE);
  const fallbackDefaults = getDefaultWhatsAppWelcomeMessages();
  const fallbackOutgoing = fallbackDefaults.find((entry) => entry.imageType === "outgoing") || fallbackDefaults[0];

  for (const path of paths) {
    try {
      const response = await fetch(path, { cache: "no-store" });
      if (!response.ok) {
        continue;
      }
      const payload = await response.json();
      const rawMessages = extractWhatsAppMessagesFromPayload(payload);
      const messages = rawMessages
        .map((entry) => sanitizeWhatsAppMessageEntry(entry, fallbackOutgoing))
        .filter(Boolean);
      if (messages.length) {
        return messages;
      }
    } catch (error) {
      // Ignore malformed JSON/path errors and try next candidate.
    }
  }

  return fallbackDefaults;
}

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
  const paths = buildDatabaseCandidatePaths("config.json");
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

window.loadConfig = loadConfig;

async function loadDatabase(config) {
  const resolvedConfig = config || DEFAULT_CONFIG;
  const dataFile = resolvedConfig.dataFile || DEFAULT_CONFIG.dataFile;
  const paths = buildDatabaseCandidatePaths(dataFile);
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

function buildWhatsAppGroupSuggestionMessage(message) {
  const trimmedMessage = String(message || "").trim();
  return trimmedMessage
    ? `${trimmedMessage}\n\nالمجموعة: ${COMMUNITY_WHATSAPP_GROUP_URL}`
    : COMMUNITY_WHATSAPP_GROUP_URL;
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

function hasAcceptedWhatsAppWelcomeGate() {
  try {
    return window.localStorage.getItem(WHATSAPP_WELCOME_GATE_ACCEPTED_KEY) === "true";
  } catch (error) {
    return false;
  }
}

function markWhatsAppWelcomeGateAccepted() {
  try {
    window.localStorage.setItem(WHATSAPP_WELCOME_GATE_ACCEPTED_KEY, "true");
  } catch (error) {
    // ignore storage failures
  }
}

function closeWhatsAppWelcomeGate() {
  const gate = document.getElementById("whatsapp-welcome-gate");
  if (gate) {
    gate.remove();
  }
  document.documentElement.classList.remove("whatsapp-welcome-open");
  document.body.classList.remove("whatsapp-welcome-open");
}

function createWhatsAppChatThread(content) {
  const chat = createEl("div", "whatsapp-welcome-gate__chat");
  const buildIncomingRow = (text, direction = "auto") => {
    const incomingRow = createEl("div", "whatsapp-welcome-gate__message-row is-incoming");
    const incomingBubble = createEl("div", "whatsapp-welcome-gate__bubble is-received");
    incomingBubble.setAttribute("dir", direction);
    incomingBubble.append(createEl("p", "whatsapp-welcome-gate__bubble-text", text));
    incomingRow.append(incomingBubble);
    return incomingRow;
  };
  const profileTargets = [];
  const messages = getWhatsAppChatMessages(content);

  messages.forEach((messageEntry) => {
    if (messageEntry.imageType !== "outgoing") {
      chat.append(buildIncomingRow(messageEntry.messageContent, messageEntry.direction));
      return;
    }

    const outgoingRow = createEl("div", "whatsapp-welcome-gate__message-row is-outgoing");
    const outgoingWrap = createEl("div", "whatsapp-welcome-gate__message-wrap");
    const outgoingMeta = createEl("div", "whatsapp-welcome-gate__message-meta");
    const outgoingAvatar = createEl("img", "whatsapp-welcome-gate__avatar");
    outgoingAvatar.src = messageEntry.avatar || content.avatar;
    outgoingAvatar.alt = messageEntry.userName || content.author;
    outgoingAvatar.loading = "lazy";
    outgoingAvatar.decoding = "async";
    outgoingAvatar.addEventListener("error", () => {
      outgoingAvatar.classList.add("is-hidden");
    }, { once: true });
    outgoingAvatar.setAttribute("role", "button");
    outgoingAvatar.setAttribute("tabindex", "0");
    outgoingAvatar.setAttribute("aria-label", content.profileLabel);

    const outgoingAuthor = createEl("span", "whatsapp-welcome-gate__author", messageEntry.userName || content.author);
    outgoingAuthor.setAttribute("role", "button");
    outgoingAuthor.setAttribute("tabindex", "0");
    outgoingAuthor.setAttribute("aria-label", content.profileLabel);

    outgoingMeta.append(outgoingAvatar, outgoingAuthor);
    if (messageEntry.role) {
      outgoingMeta.append(createEl("span", "whatsapp-welcome-gate__admin-label", messageEntry.role));
    }

    const outgoingBubble = createEl("div", "whatsapp-welcome-gate__bubble is-outgoing");
    outgoingBubble.setAttribute("dir", messageEntry.direction || "auto");
    outgoingBubble.append(createEl("p", "whatsapp-welcome-gate__bubble-text", messageEntry.messageContent));

    const hasReactions = Boolean(messageEntry.reactionCount) || Boolean(messageEntry.reactions?.length);
    if (hasReactions) {
      const outgoingReactions = createEl("div", "whatsapp-welcome-gate__reactions");
      if (messageEntry.reactionCount) {
        outgoingReactions.append(createEl("span", "whatsapp-welcome-gate__reactions-count", messageEntry.reactionCount));
      }
      (messageEntry.reactions || []).forEach((emoji) => {
        outgoingReactions.append(createEl("span", "whatsapp-welcome-gate__reactions-emoji", emoji));
      });
      outgoingWrap.append(outgoingMeta, outgoingReactions, outgoingBubble);
    } else {
      outgoingWrap.append(outgoingMeta, outgoingBubble);
    }

    outgoingRow.append(outgoingWrap);
    chat.append(outgoingRow);
    profileTargets.push(outgoingAvatar, outgoingAuthor);
  });

  return {
    chat,
    profileTargets
  };
}

function createWhatsAppProfileModal(content) {
  const primaryOutgoing = getWhatsAppChatMessages(content).find((entry) => entry.imageType === "outgoing") || null;
  const profileAvatar = primaryOutgoing?.avatar || content.avatar;
  const profileAuthor = primaryOutgoing?.userName || content.author;
  const profileModal = createEl("div", "whatsapp-welcome-gate__profile-modal is-hidden");
  profileModal.setAttribute("role", "dialog");
  profileModal.setAttribute("aria-modal", "true");
  profileModal.setAttribute("aria-label", "صورة المدير");
  const profileModalBackdrop = createEl("button", "whatsapp-welcome-gate__profile-modal-backdrop");
  profileModalBackdrop.type = "button";
  profileModalBackdrop.setAttribute("aria-label", "إغلاق الصورة");
  const profileModalCard = createEl("div", "whatsapp-welcome-gate__profile-modal-card");
  const profileModalClose = createEl("button", "whatsapp-welcome-gate__profile-modal-close", "×");
  profileModalClose.type = "button";
  profileModalClose.setAttribute("aria-label", "إغلاق");
  const profileModalImage = createEl("img", "whatsapp-welcome-gate__profile-modal-image");
  profileModalImage.src = profileAvatar;
  profileModalImage.alt = profileAuthor;
  const profileModalFooter = createEl("div", "whatsapp-welcome-gate__profile-modal-footer");
  const profileModalTagline = createEl("p", "whatsapp-welcome-gate__profile-modal-tagline", content.profileTagline);
  const profileModalContact = createEl("a", "whatsapp-welcome-gate__profile-modal-contact", content.profileContactLabel);
  profileModalContact.href = content.profileContactUrl;
  profileModalContact.target = "_blank";
  profileModalContact.rel = "noopener noreferrer";
  profileModalFooter.append(profileModalTagline, profileModalContact);
  profileModalCard.append(profileModalClose, profileModalImage, profileModalFooter);
  profileModal.append(profileModalBackdrop, profileModalCard);

  return {
    profileModal,
    openProfileModal() {
      profileModal.classList.remove("is-hidden");
    },
    closeProfileModal() {
      profileModal.classList.add("is-hidden");
    },
    profileModalBackdrop,
    profileModalClose
  };
}

function bindWhatsAppProfileModal(profileTargets, profileModalState) {
  profileTargets.forEach((target) => {
    target.addEventListener("click", profileModalState.openProfileModal);
    target.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        profileModalState.openProfileModal();
      }
    });
  });

  profileModalState.profileModalBackdrop.addEventListener("click", profileModalState.closeProfileModal);
  profileModalState.profileModalClose.addEventListener("click", profileModalState.closeProfileModal);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      profileModalState.closeProfileModal();
    }
  });
}

function createWhatsAppComposer(content) {
  const composer = createEl("form", "whatsapp-welcome-gate__composer");
  const composerInput = document.createElement("input");
  composerInput.type = "text";
  composerInput.className = "whatsapp-welcome-gate__composer-input";
  composerInput.placeholder = content.composerPlaceholder;
  composerInput.maxLength = 700;
  composerInput.autocomplete = "off";
  const composerSend = createEl("button", "whatsapp-welcome-gate__composer-send", "إرسال");
  composerSend.type = "submit";
  composer.append(composerInput, composerSend);
  const composerStatus = createEl("p", "whatsapp-welcome-gate__composer-status", "");
  return { composer, composerInput, composerStatus };
}

function bindWhatsAppComposerSubmit(composer, composerInput, composerStatus, content) {
  composer.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = composerInput.value.trim();
    if (!message) {
      composerStatus.textContent = content.composerEmptyError;
      composerInput.focus();
      return;
    }
    const payload = buildWhatsAppGroupSuggestionMessage(message);
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(payload);
      } catch (error) {
        copyTextFallback(payload);
      }
    } else {
      copyTextFallback(payload);
    }
    composerStatus.textContent = "";
    window.location.assign(COMMUNITY_WHATSAPP_GROUP_URL);
  });
}

function buildWhatsAppHeader(titleText, subtitleText, titleId) {
  const header = createEl("div", "whatsapp-welcome-gate__header");
  const title = createEl("h2", "whatsapp-welcome-gate__title", titleText);
  if (titleId) {
    title.id = titleId;
  }
  header.append(title);
  if (subtitleText) {
    header.append(createEl("p", "whatsapp-welcome-gate__subtitle", subtitleText));
  }
  return header;
}

function setupWhatsAppWelcomeGate() {
  if (hasAcceptedWhatsAppWelcomeGate()) {
    return;
  }

  if (document.getElementById("whatsapp-welcome-gate")) {
    return;
  }

  const overlay = createEl("div", "whatsapp-welcome-gate");
  overlay.id = "whatsapp-welcome-gate";
  overlay.setAttribute("dir", "rtl");
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "whatsapp-welcome-title");

  const panel = createEl("section", "whatsapp-welcome-gate__panel");
  const header = buildWhatsAppHeader(WHATSAPP_CONTENT.title, WHATSAPP_CONTENT.subtitle, "whatsapp-welcome-title");
  const { chat, profileTargets } = createWhatsAppChatThread(WHATSAPP_CONTENT);
  const { composer, composerInput, composerStatus } = createWhatsAppComposer(WHATSAPP_CONTENT);
  const countdownNote = createEl("p", "whatsapp-welcome-gate__countdown", "");

  const actions = createEl("div", "whatsapp-welcome-gate__actions");
  const joinButton = createEl("a", "whatsapp-welcome-gate__button whatsapp-welcome-gate__button--join", WHATSAPP_CONTENT.joinLabel);
  joinButton.href = COMMUNITY_WHATSAPP_GROUP_URL;
  joinButton.target = "_blank";
  joinButton.rel = "noopener noreferrer";

  const acceptButton = createEl("button", "whatsapp-welcome-gate__button whatsapp-welcome-gate__button--accept", "");
  acceptButton.type = "button";
  acceptButton.disabled = true;
  actions.append(joinButton, acceptButton);

  const profileModalState = createWhatsAppProfileModal(WHATSAPP_CONTENT);
  panel.append(header, chat, composerStatus, composer, actions);
  overlay.append(panel, profileModalState.profileModal);
  document.body.append(overlay);

  document.documentElement.classList.add("whatsapp-welcome-open");
  document.body.classList.add("whatsapp-welcome-open");

  let secondsLeft = WHATSAPP_WELCOME_GATE_COUNTDOWN_SECONDS;
  const renderCountdown = () => {
    if (secondsLeft > 0) {
      countdownNote.textContent = WHATSAPP_CONTENT.countdownLabel(secondsLeft);
      acceptButton.textContent = WHATSAPP_CONTENT.acceptCountdownLabel(secondsLeft);
      acceptButton.disabled = true;
      return;
    }
    countdownNote.textContent = WHATSAPP_CONTENT.countdownReadyLabel;
    acceptButton.textContent = WHATSAPP_CONTENT.acceptReadyLabel;
    acceptButton.disabled = false;
  };

  renderCountdown();
  const timerId = window.setInterval(() => {
    secondsLeft -= 1;
    if (secondsLeft <= 0) {
      secondsLeft = 0;
      window.clearInterval(timerId);
    }
    renderCountdown();
  }, 1000);

  acceptButton.addEventListener("click", () => {
    markWhatsAppWelcomeGateAccepted();
    closeWhatsAppWelcomeGate();
  });

  bindWhatsAppProfileModal(profileTargets, profileModalState);
  bindWhatsAppComposerSubmit(composer, composerInput, composerStatus, WHATSAPP_CONTENT);
}

function setupWhatsAppBottomSection() {
  const currentPage = String(window.location.pathname || "").split("/").pop().toLowerCase();
  if (currentPage === "horen.html" || currentPage === "shreiben.html") {
    return;
  }

  if (document.getElementById("whatsapp-bottom-section")) {
    return;
  }

  const section = createEl("section", "whatsapp-bottom-section");
  section.id = "whatsapp-bottom-section";
  section.setAttribute("dir", "rtl");

  const panel = createEl("section", "whatsapp-welcome-gate__panel");
  const header = buildWhatsAppHeader(WHATSAPP_CONTENT.bottomTitle, WHATSAPP_CONTENT.bottomSubtitle);
  const { chat, profileTargets } = createWhatsAppChatThread(WHATSAPP_CONTENT);
  const { composer, composerInput, composerStatus } = createWhatsAppComposer(WHATSAPP_CONTENT);

  const actions = createEl("div", "whatsapp-welcome-gate__actions");
  const joinButton = createEl("a", "whatsapp-welcome-gate__button whatsapp-welcome-gate__button--join", WHATSAPP_CONTENT.joinLabel);
  joinButton.href = COMMUNITY_WHATSAPP_GROUP_URL;
  joinButton.target = "_blank";
  joinButton.rel = "noopener noreferrer";
  const contactButton = createEl("a", "whatsapp-welcome-gate__button whatsapp-welcome-gate__button--accept", WHATSAPP_CONTENT.profileContactLabel);
  contactButton.href = WHATSAPP_CONTENT.profileContactUrl;
  contactButton.target = "_blank";
  contactButton.rel = "noopener noreferrer";
  actions.append(joinButton, contactButton);

  const profileModalState = createWhatsAppProfileModal(WHATSAPP_CONTENT);
  panel.append(header, chat, composerStatus, composer, actions);
  section.append(panel, profileModalState.profileModal);
  document.body.append(section);

  bindWhatsAppProfileModal(profileTargets, profileModalState);
  bindWhatsAppComposerSubmit(composer, composerInput, composerStatus, WHATSAPP_CONTENT);
}

function setupCommunityWidgets() {
  if (document.getElementById("community-suggest-modal")) {
    return;
  }

  const promoTarget = document.getElementById("community-promo-target");
  if (promoTarget) {
    const promoCard = createEl("section", "community-promo");
    promoCard.setAttribute("dir", "rtl");
    const content = createEl("div", "community-promo-content");
    const title = createEl(
      "h3",
      "community-promo-title",
      "مجتمع واتساب الرسمي"
    );
    const line = createEl(
      "p",
      "community-promo-line",
      "انضم للمجموعة للتحديثات السريعة، الدعم، وتصحيح الأخطاء."
    );
    const actions = createEl("div", "community-promo-actions");
    const joinLink = createEl("a", "community-btn community-btn-primary", "انضم إلى واتساب");
    joinLink.href = COMMUNITY_WHATSAPP_GROUP_URL;
    joinLink.target = "_blank";
    joinLink.rel = "noopener noreferrer";
    const suggestBtn = createEl("button", "community-btn community-btn-secondary community-open-btn", "اقترح تعديلا");
    suggestBtn.type = "button";
    actions.append(joinLink);
    content.append(title, line);
    promoCard.append(content, actions);
    promoTarget.append(promoCard);
  }

  const floatingButton = createEl("button", "community-floating-btn community-open-btn", "اقتراحات واتساب");
  floatingButton.type = "button";
  floatingButton.id = "community-floating-btn";
  document.body.append(floatingButton);

  const modal = createEl("div", "community-modal hidden");
  modal.id = "community-suggest-modal";
  modal.setAttribute("dir", "rtl");
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
    "اقتراح تعديل أو موضوع جديد"
  );
  title.id = "community-modal-title";
  const textEn = createEl(
    "p",
    "community-modal-line",
    "اكتب اقتراحك بوضوح، ثم انسخه وافتح مجموعة واتساب لإرساله."
  );
  const textAr = createEl(
    "p",
    "community-modal-line",
    "كل الملاحظات مرحب بها: أخطاء تقنية، تعديلات، أو أفكار جديدة."
  );
  textAr.setAttribute("dir", "rtl");
  const textDe = createEl(
    "p",
    "community-modal-line",
    "مهم: اشرح المشكلة أو الفكرة باختصار وبشكل مباشر."
  );

  const textarea = document.createElement("textarea");
  textarea.id = "community-suggest-text";
  textarea.className = "community-modal-textarea";
  textarea.rows = 7;
  textarea.placeholder = "اكتب التفاصيل هنا...";

  const status = createEl("p", "community-modal-status", "");
  status.id = "community-copy-status";

  const actionRow = createEl("div", "community-modal-actions");
  const copyBtn = createEl("button", "community-btn community-btn-secondary", "نسخ الاقتراح");
  copyBtn.type = "button";
  copyBtn.id = "community-copy-btn";
  const openGroup = createEl("a", "community-btn community-btn-primary", "فتح مجموعة واتساب");
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
        status.textContent = "تم النسخ. افتح واتساب والصق الاقتراح.";
        return;
      } catch (error) {
        // ignore and fallback
      }
    }
    copyTextFallback(message);
    status.textContent = "تم النسخ. افتح واتساب والصق الاقتراح.";
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

async function initSharedSiteFeatures() {
  WHATSAPP_CONTENT.messages = await loadWhatsAppWelcomeMessages();
  const primaryOutgoing = getWhatsAppChatMessages(WHATSAPP_CONTENT)
    .find((entry) => entry.imageType === "outgoing");
  if (primaryOutgoing) {
    WHATSAPP_CONTENT.avatar = primaryOutgoing.avatar || WHATSAPP_CONTENT.avatar;
    WHATSAPP_CONTENT.author = primaryOutgoing.userName || WHATSAPP_CONTENT.author;
    WHATSAPP_CONTENT.role = primaryOutgoing.role || WHATSAPP_CONTENT.role;
    WHATSAPP_CONTENT.message = primaryOutgoing.messageContent || WHATSAPP_CONTENT.message;
    WHATSAPP_CONTENT.reactionCount = primaryOutgoing.reactionCount || WHATSAPP_CONTENT.reactionCount;
    WHATSAPP_CONTENT.reactions = Array.isArray(primaryOutgoing.reactions) && primaryOutgoing.reactions.length
      ? [...primaryOutgoing.reactions]
      : WHATSAPP_CONTENT.reactions;
  }
  setupWhatsAppWelcomeGate();
  setupCommunityWidgets();
  setupWhatsAppBottomSection();
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {
        // Ignore registration issues on unsupported/local hosts.
      });
    }, { once: true });
  }
  const config = await loadConfig();
  void setupSiteBanners(config);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSharedSiteFeatures, { once: true });
} else {
  initSharedSiteFeatures();
}
