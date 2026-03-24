const levelPill = document.getElementById("level-pill");
const levelList = document.getElementById("level-list");
const moduleList = document.getElementById("module-list");
const partList = document.getElementById("exam-part-list");
const themeGrid = document.getElementById("theme-grid");
const themeSearchInput = document.getElementById("theme-search");
const themeSearchScope = document.getElementById("theme-search-scope");
const selectionSummary = document.getElementById("selection-summary");
const openFormBtn = document.getElementById("open-form-btn");
const emailState = document.getElementById("email-state");
const changeEmailBtn = document.getElementById("change-email-btn");
const emailModal = document.getElementById("email-modal");
const emailInput = document.getElementById("email-input");
const emailError = document.getElementById("email-error");
const emailSaveBtn = document.getElementById("email-save-btn");
const emailCancelBtn = document.getElementById("email-cancel-btn");
const statsModal = document.getElementById("stats-modal");
const statsModalTitle = document.getElementById("stats-modal-title");
const statsModalMeta = document.getElementById("stats-modal-meta");
const statsModalBody = document.getElementById("stats-modal-body");
const statsModalCloseBtn = document.getElementById("stats-modal-close-btn");

const EMAIL_STORAGE_KEY = "zdeutsch.corrections.email.v1";
const SECTION_KEYS = ["lesen", "horen", "shreiben"];

const SECTION_LABELS = {
  lesen: "LESEN",
  horen: "HÖREN",
  shreiben: "SHREIBEN"
};

const PART_OPTIONS = [
  { key: "teil-1", label: "Teil 1" },
  { key: "teil-2", label: "Teil 2" },
  { key: "teil-3", label: "Teil 3" },
  { key: "sprachbausteine-1", label: "Sprach 1" },
  { key: "sprachbausteine-2", label: "Sprach 2" }
];

const PART_KEY_ALIASES = {
  "teil-1": ["teil-1", "teil1", "teil 1", "lesen teil 1", "lesen-teil-1", "part1", "part-1"],
  "teil-2": ["teil-2", "teil2", "teil 2", "lesen teil 2", "lesen-teil-2", "part2", "part-2"],
  "teil-3": ["teil-3", "teil3", "teil 3", "lesen teil 3", "lesen-teil-3", "part3", "part-3"],
  "sprachbausteine-1": ["sprachbausteine-1", "sprachbausteine 1", "sprach-1", "sprach 1", "sprach1", "sb1"],
  "sprachbausteine-2": ["sprachbausteine-2", "sprachbausteine 2", "sprach-2", "sprach 2", "sprach2", "sb2"]
};

const COMMUNITY_SHEET_ID_DEFAULT = "14LMJKrPsc1JQErmCfHv5K4xoN4miykVeTjmN1ZNFs_I";
const COMMUNITY_GID_BY_PART = {
  "teil-1": 1925401969,
  "teil-2": 178354616,
  "teil-3": 398836266,
  "sprachbausteine-1": 434381124,
  "sprachbausteine-2": 1556604816
};

const FORM_INTEGRATION = {
  settings: {
    allowMultipleSubmissionsPerUser: true,
    requireGoogleSignIn: true,
    limitOneResponsePerForm: false
  },
  forms: {
    "teil-1": {
      partKey: "teil-1",
      partLabel: "Lesen Teil 1",
      formPublicUrl: "https://docs.google.com/forms/d/e/1FAIpQLSc4WcBFOL2OFmRBe0lSSH8GjOvSvg_R3U6FEUPRBBMj4i_AIg/viewform",
      prefillTemplate: "https://docs.google.com/forms/d/e/1FAIpQLSc4WcBFOL2OFmRBe0lSSH8GjOvSvg_R3U6FEUPRBBMj4i_AIg/viewform?usp=pp_url&entry.878841953={{a1}}&entry.1526507343={{a2}}&entry.1066080120={{a3}}&entry.1053795566={{a4}}&entry.341962498={{a5}}&entry.788625648={{reason}}&entry.1039785540={{context}}",
      itemNumbers: ["1", "2", "3", "4", "5"],
      answerParamKeys: ["a1", "a2", "a3", "a4", "a5"],
      entryIds: {
        answers: {
          "1": 608169195,
          "2": 486631907,
          "3": 255875646,
          "4": 680311433,
          "5": 1559916900
        },
        reason: 1146294854,
        context: 1294619841
      }
    },
    "teil-2": {
      partKey: "teil-2",
      partLabel: "Lesen Teil 2",
      formPublicUrl: "https://docs.google.com/forms/d/e/1FAIpQLSed1Xxo_zfG0ozKtLQ2GGX325r3WxeZ7feL8LOAPW3M_wNqZw/viewform",
      prefillTemplate: "https://docs.google.com/forms/d/e/1FAIpQLSed1Xxo_zfG0ozKtLQ2GGX325r3WxeZ7feL8LOAPW3M_wNqZw/viewform?usp=pp_url&entry.770118970={{a6}}&entry.1685423644={{a7}}&entry.1534112105={{a8}}&entry.840345885={{a9}}&entry.1474964770={{a10}}&entry.1906932350={{reason}}&entry.1400713090={{context}}",
      itemNumbers: ["6", "7", "8", "9", "10"],
      answerParamKeys: ["a6", "a7", "a8", "a9", "a10"],
      entryIds: {
        answers: {
          "6": 1942309452,
          "7": 48384739,
          "8": 1277328977,
          "9": 1990280893,
          "10": 456499565
        },
        reason: 1537699883,
        context: 323789999
      }
    },
    "teil-3": {
      partKey: "teil-3",
      partLabel: "Lesen Teil 3",
      formPublicUrl: "https://docs.google.com/forms/d/e/1FAIpQLSdu1eywCJ14MYRcZb1mLrn5w4d3C6Ow60rDKZzhLor5vjzpHw/viewform",
      prefillTemplate: "https://docs.google.com/forms/d/e/1FAIpQLSdu1eywCJ14MYRcZb1mLrn5w4d3C6Ow60rDKZzhLor5vjzpHw/viewform?usp=pp_url&entry.1567314852={{a11}}&entry.505594553={{a12}}&entry.1255885633={{a13}}&entry.873705885={{a14}}&entry.1773043973={{a15}}&entry.563625754={{a16}}&entry.2035018531={{a17}}&entry.632699273={{a18}}&entry.1939797335={{a19}}&entry.1437372959={{a20}}&entry.1950209736={{reason}}&entry.809676753={{context}}",
      itemNumbers: ["11", "12", "13", "14", "15", "16", "17", "18", "19", "20"],
      answerParamKeys: ["a11", "a12", "a13", "a14", "a15", "a16", "a17", "a18", "a19", "a20"],
      entryIds: {
        answers: {
          "11": 193826433,
          "12": 2133238239,
          "13": 2111176029,
          "14": 912302831,
          "15": 1058223429,
          "16": 739494426,
          "17": 1163581501,
          "18": 1132441893,
          "19": 1879637878,
          "20": 405416558
        },
        reason: 994223364,
        context: 152745191
      }
    },
    "sprachbausteine-1": {
      partKey: "sprachbausteine-1",
      partLabel: "Sprachbausteine 1",
      formPublicUrl: "https://docs.google.com/forms/d/e/1FAIpQLSc3aLwNw_G9n22SjBAzBO2uALpM-PJQslKb7Bu7gE6DT0Alzw/viewform",
      prefillTemplate: "https://docs.google.com/forms/d/e/1FAIpQLSc3aLwNw_G9n22SjBAzBO2uALpM-PJQslKb7Bu7gE6DT0Alzw/viewform?usp=pp_url&entry.1878385353={{a21}}&entry.860749585={{a22}}&entry.1320746617={{a23}}&entry.723040219={{a24}}&entry.155831682={{a25}}&entry.1062567841={{a26}}&entry.389740607={{a27}}&entry.2110243740={{a28}}&entry.697870261={{a29}}&entry.122407696={{a30}}&entry.1057564226={{reason}}&entry.1242602246={{context}}",
      itemNumbers: ["21", "22", "23", "24", "25", "26", "27", "28", "29", "30"],
      answerParamKeys: ["a21", "a22", "a23", "a24", "a25", "a26", "a27", "a28", "a29", "a30"],
      entryIds: {
        answers: {
          "21": 278258345,
          "22": 1943007061,
          "23": 680678314,
          "24": 443488925,
          "25": 1567659002,
          "26": 1735232479,
          "27": 754200758,
          "28": 1920675639,
          "29": 1949677206,
          "30": 353647433
        },
        reason: 805332884,
        context: 1339229360
      }
    },
    "sprachbausteine-2": {
      partKey: "sprachbausteine-2",
      partLabel: "Sprachbausteine 2",
      formPublicUrl: "https://docs.google.com/forms/d/e/1FAIpQLSdpaDGeFsAgysCYh-Sv-V8rGHtnCJDMKgx0lgn0BLBU-OpnWA/viewform",
      prefillTemplate: "https://docs.google.com/forms/d/e/1FAIpQLSdpaDGeFsAgysCYh-Sv-V8rGHtnCJDMKgx0lgn0BLBU-OpnWA/viewform?usp=pp_url&entry.2142521528={{a31}}&entry.506607639={{a32}}&entry.650076032={{a33}}&entry.923056265={{a34}}&entry.1271474704={{a35}}&entry.1363961297={{a36}}&entry.256489262={{a37}}&entry.627362661={{a38}}&entry.1159329735={{a39}}&entry.1292233957={{a40}}&entry.1457893583={{reason}}&entry.1223585252={{context}}",
      itemNumbers: ["31", "32", "33", "34", "35", "36", "37", "38", "39", "40"],
      answerParamKeys: ["a31", "a32", "a33", "a34", "a35", "a36", "a37", "a38", "a39", "a40"],
      entryIds: {
        answers: {
          "31": 642780204,
          "32": 1634073346,
          "33": 759616188,
          "34": 508037502,
          "35": 20789561,
          "36": 2077713554,
          "37": 1002917196,
          "38": 713566520,
          "39": 1652072552,
          "40": 1988182962
        },
        reason: 1316167128,
        context: 1485658245
      }
    }
  }
};

const state = {
  db: null,
  level: null,
  section: "lesen",
  search: "",
  theme: null,
  part: "teil-1",
  pendingRedirect: false,
  community: {
    loading: false,
    map: null,
    source: null,
    contributed: {}
  }
};

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
  return String(value || "").toLowerCase().trim();
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function getCommunitySheetId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("communitySheetId")
    || window.__COMMUNITY_SHEET_ID__
    || COMMUNITY_SHEET_ID_DEFAULT;
}

async function loadLesenDatabase() {
  const paths = ["database/lesen.json", "../database/lesen.json"];
  for (const path of paths) {
    try {
      const response = await fetch(path);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      // try next path
    }
  }
  return null;
}

function summarizeCounts(counts) {
  const entries = Object.entries(counts || {});
  if (!entries.length) {
    return null;
  }
  let topAnswer = "";
  let topCount = -1;
  let total = 0;
  entries.forEach(([answer, count]) => {
    total += count;
    if (count > topCount) {
      topCount = count;
      topAnswer = answer;
    }
  });
  const percent = total > 0 ? Math.round((topCount / total) * 100) : null;
  return {
    answer: topAnswer,
    count: topCount,
    total,
    percent
  };
}

function safeDecode(value) {
  const text = String(value || "");
  try {
    return decodeURIComponent(text.replace(/\+/g, "%20"));
  } catch (error) {
    return text;
  }
}

function parseCsvRows(text) {
  const input = String(text || "");
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];

    if (inQuotes) {
      if (ch === "\"") {
        if (input[i + 1] === "\"") {
          value += "\"";
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        value += ch;
      }
      continue;
    }

    if (ch === "\"") {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(value);
      value = "";
      continue;
    }
    if (ch === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }
    if (ch === "\r") {
      continue;
    }
    value += ch;
  }

  if (value.length || row.length) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

async function fetchCsvTab(sheetId, gid, partKey) {
  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/export?format=csv&gid=${encodeURIComponent(gid)}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`CSV request failed for ${partKey}: ${response.status}`);
  }
  const text = await response.text();
  const csvRows = parseCsvRows(text);
  const headers = (csvRows[0] || []).map((value, index) => {
    const raw = String(value || "");
    return (index === 0 ? raw.replace(/^\uFEFF/, "") : raw).trim();
  });
  const rows = csvRows
    .slice(1)
    .filter((row) => row.some((cell) => String(cell || "").trim() !== ""));
  return {
    partKey,
    gid,
    headers,
    rows
  };
}

function normalizePartKey(value, fallbackPartKey = "") {
  const raw = normalize(value);
  if (!raw) {
    return fallbackPartKey || "";
  }
  const found = Object.keys(PART_KEY_ALIASES).find((candidate) => {
    return PART_KEY_ALIASES[candidate].some((alias) => normalize(alias) === raw);
  });
  return found || fallbackPartKey || "";
}

function parseLegacyContext(rawContext, fallbackPartKey) {
  const text = safeDecode(rawContext);
  if (!text) {
    return null;
  }

  const getField = (field) => {
    const match = text.match(new RegExp(`(?:^|[|;,\\s])${field}\\s*[:=]\\s*([^|;,\\s]+)`, "i"));
    return match ? match[1] : "";
  };

  const level = normalize(getField("level"));
  const theme = String(getField("theme") || "").trim();
  const part = normalizePartKey(getField("part"), fallbackPartKey);
  if (!level || !theme) {
    return null;
  }
  return { level, theme, part: part || fallbackPartKey };
}

function parseTokenContext(rawContext, fallbackPartKey) {
  const text = safeDecode(rawContext);
  if (!text || !text.startsWith("ctx_")) {
    return null;
  }
  const body = text.slice(4);
  const sortedPartKeys = PART_OPTIONS.map((part) => part.key).sort((a, b) => b.length - a.length);
  const foundPart = sortedPartKeys.find((partKey) => body.includes(`_${partKey}_`));
  if (!foundPart) {
    return null;
  }

  const partMarker = `_${foundPart}_`;
  const prefix = body.split(partMarker)[0] || "";
  const tokens = prefix.split("_").filter(Boolean);
  if (tokens.length < 3) {
    return null;
  }

  const level = normalize(tokens[0]);
  const theme = tokens.slice(1, -1).join("_");
  if (!level || !theme) {
    return null;
  }
  return {
    level,
    theme,
    part: normalizePartKey(foundPart, fallbackPartKey)
  };
}

function parseContextMeta(rawContext, fallbackPartKey) {
  return parseLegacyContext(rawContext, fallbackPartKey)
    || parseTokenContext(rawContext, fallbackPartKey)
    || null;
}

function resolveThemeKey(levelKey, rawTheme) {
  const levelEntry = state.db?.levels?.[levelKey];
  if (!levelEntry?.themes) {
    return null;
  }
  if (levelEntry.themes[rawTheme]) {
    return rawTheme;
  }

  const wanted = normalize(rawTheme);
  const found = Object.keys(levelEntry.themes).find((themeKey) => {
    const themeTitle = levelEntry.themes?.[themeKey]?.title || "";
    return normalize(themeKey) === wanted || normalize(themeTitle) === wanted;
  });
  return found || null;
}

function ensureCommunityRawBucket(root, levelKey, themeKey, partKey, itemNumbers) {
  if (!root[levelKey]) {
    root[levelKey] = {};
  }
  if (!root[levelKey][themeKey]) {
    root[levelKey][themeKey] = {};
  }
  if (!root[levelKey][themeKey][partKey]) {
    const itemCounts = {};
    itemNumbers.forEach((itemNumber) => {
      itemCounts[String(itemNumber)] = {};
    });
    root[levelKey][themeKey][partKey] = {
      votes: 0,
      itemCounts
    };
  }
  return root[levelKey][themeKey][partKey];
}

function getHeaderIndex(headers, patternList) {
  const normalizedHeaders = (headers || []).map((header) => normalize(header));
  for (const pattern of patternList) {
    const wanted = normalize(pattern);
    const idx = normalizedHeaders.findIndex((header) => header === wanted);
    if (idx >= 0) {
      return idx;
    }
  }
  return -1;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function ensureContributedPartSet(root, levelKey, themeKey, partKey) {
  if (!root[levelKey]) {
    root[levelKey] = {};
  }
  if (!root[levelKey][themeKey]) {
    root[levelKey][themeKey] = {};
  }
  if (!root[levelKey][themeKey][partKey]) {
    root[levelKey][themeKey][partKey] = new Set();
  }
  return root[levelKey][themeKey][partKey];
}

function finalizeCommunityMap(rawMap) {
  const result = {};
  Object.entries(rawMap).forEach(([levelKey, levelData]) => {
    const themeOut = {};
    Object.entries(levelData || {}).forEach(([themeKey, themeData]) => {
      const partOut = {};
      Object.entries(themeData || {}).forEach(([partKey, partData]) => {
        const itemSummaries = Object.entries(partData.itemCounts || {})
          .map(([itemNumber, counts]) => {
            const summary = summarizeCounts(counts);
            if (!summary) {
              return null;
            }
            const distribution = Object.entries(counts || {})
              .map(([answer, count]) => ({
                answer,
                count,
                percent: summary.total ? Math.round((count / summary.total) * 100) : 0
              }))
              .sort((a, b) => b.count - a.count);
            return {
              item: String(itemNumber),
              answer: summary.answer,
              percent: summary.percent,
              count: summary.count,
              total: summary.total,
              distribution
            };
          })
          .filter(Boolean)
          .sort((a, b) => Number(a.item) - Number(b.item));

        partOut[partKey] = {
          votes: partData.votes || 0,
          items: itemSummaries
        };
      });
      if (Object.keys(partOut).length) {
        themeOut[themeKey] = partOut;
      }
    });
    if (Object.keys(themeOut).length) {
      result[levelKey] = themeOut;
    }
  });
  return result;
}

function aggregateCommunityRows(tables) {
  const rawMap = {};
  const contributed = {};

  tables.forEach((table) => {
    const partKey = table.partKey;
    const formConfig = FORM_INTEGRATION.forms[partKey];
    if (!formConfig) {
      return;
    }

    const headers = table.headers || [];
    const itemNumbers = formConfig.itemNumbers || [];
    const emailIndex = getHeaderIndex(headers, ["Email Address", "Email", "E-mail"]);
    const timestampIndex = getHeaderIndex(headers, ["Timestamp", "Zeitstempel", "Submitted at", "Submission time"]);
    const contextIndex = getHeaderIndex(headers, ["Context (auto-filled)", "Context"]);
    const reasonIndex = getHeaderIndex(headers, ["Reason/Comment (optional)", "Reason", "Comment"]);

    const prefix = partKey === "teil-1"
      ? "Text"
      : partKey === "teil-2"
        ? "Frage"
        : partKey === "teil-3"
          ? "Situation"
          : "Luecke";

    const itemIndexes = {};
    itemNumbers.forEach((itemNumber) => {
      const patterns = [`${prefix} ${itemNumber}`, String(itemNumber)];
      itemIndexes[String(itemNumber)] = getHeaderIndex(headers, patterns);
    });

    const dedupedByEmailPartTheme = new Map();
    const anonymousSubmissions = [];

    (table.rows || []).forEach((row, rowIndex) => {
      const rawContext = contextIndex >= 0 ? row[contextIndex] : "";
      const rawReason = reasonIndex >= 0 ? row[reasonIndex] : "";
      const meta = parseContextMeta(rawContext, partKey) || parseContextMeta(rawReason, partKey);
      if (!meta?.level || !meta?.theme) {
        return;
      }

      const levelKey = normalize(meta.level);
      const themeKey = resolveThemeKey(levelKey, meta.theme);
      const resolvedPartKey = normalizePartKey(meta.part, partKey);
      if (!themeKey || !resolvedPartKey) {
        return;
      }

      const submittedEmail = normalizeEmail(emailIndex >= 0 ? row[emailIndex] : "");
      const answerValues = {};
      itemNumbers.forEach((itemNumber) => {
        const idx = itemIndexes[String(itemNumber)];
        if (idx < 0) {
          return;
        }
        const value = normalizePrefillValue(resolvedPartKey, row[idx] || "");
        if (value) {
          answerValues[String(itemNumber)] = value;
        }
      });

      const rawTimestamp = timestampIndex >= 0 ? String(row[timestampIndex] || "").trim() : "";
      const parsedTimestamp = rawTimestamp ? Date.parse(rawTimestamp) : NaN;
      const submissionOrder = Number.isFinite(parsedTimestamp) ? parsedTimestamp : rowIndex;

      const submission = {
        levelKey,
        themeKey,
        partKey: resolvedPartKey,
        email: submittedEmail,
        answerValues,
        submissionOrder
      };

      if (submittedEmail) {
        // Keep only one submission per user for the same part/theme.
        // If a user submits multiple times, the latest submission wins.
        const dedupeKey = `${submittedEmail}::${resolvedPartKey}::${levelKey}::${themeKey}`;
        const existing = dedupedByEmailPartTheme.get(dedupeKey);
        if (!existing || submission.submissionOrder >= existing.submissionOrder) {
          dedupedByEmailPartTheme.set(dedupeKey, submission);
        }
      } else {
        anonymousSubmissions.push(submission);
      }
    });

    const submissions = [
      ...dedupedByEmailPartTheme.values(),
      ...anonymousSubmissions
    ];

    submissions.forEach((submission) => {
      if (submission.email) {
        ensureContributedPartSet(
          contributed,
          submission.levelKey,
          submission.themeKey,
          submission.partKey
        ).add(submission.email);
      }

      const bucket = ensureCommunityRawBucket(
        rawMap,
        submission.levelKey,
        submission.themeKey,
        submission.partKey,
        itemNumbers
      );
      bucket.votes += 1;

      Object.entries(submission.answerValues || {}).forEach(([itemNumber, value]) => {
        const counts = bucket.itemCounts[String(itemNumber)];
        if (!counts) {
          return;
        }
        counts[value] = (counts[value] || 0) + 1;
      });
    });
  });

  return {
    summaryMap: finalizeCommunityMap(rawMap),
    contributed
  };
}

async function loadCommunityStats() {
  state.community.loading = true;
  state.community.map = null;
  state.community.source = null;
  state.community.contributed = {};

  const sheetId = getCommunitySheetId();
  const partEntries = Object.entries(COMMUNITY_GID_BY_PART);

  try {
    const tables = await Promise.all(partEntries.map(([partKey, gid]) => fetchCsvTab(sheetId, gid, partKey)));
    const aggregated = aggregateCommunityRows(tables);
    state.community.map = aggregated.summaryMap;
    state.community.contributed = aggregated.contributed || {};
    state.community.source = `sheet:${sheetId}`;
    state.community.loading = false;
    return aggregated.summaryMap;
  } catch (error) {
    state.community.loading = false;
    return null;
  }
}

function getCommunityThemeSummary(levelKey, themeKey, partKey) {
  const partData = state.community.map?.[levelKey]?.[themeKey]?.[partKey];
  if (!partData) {
    return null;
  }
  const items = (partData.items || []).filter((item) => Number.isFinite(item.percent));
  if (!items.length) {
    return {
      votes: partData.votes || 0,
      percent: null,
      preview: "",
      items: []
    };
  }
  const percent = Math.round(items.reduce((sum, item) => sum + item.percent, 0) / items.length);
  const preview = items.slice(0, 3).map((item) => `${item.item}:${item.answer} ${item.percent}%`).join(" · ");
  return {
    votes: partData.votes || 0,
    percent,
    preview,
    items
  };
}

function getPartLabel(partKey) {
  return PART_OPTIONS.find((part) => part.key === partKey)?.label || partKey;
}

function closeStatsModal() {
  if (!statsModal) {
    return;
  }
  statsModal.classList.add("hidden");
}

function buildDistributionText(item) {
  const distribution = item?.distribution || [];
  if (!distribution.length) {
    return "No distribution data.";
  }
  return distribution
    .map((entry) => `${entry.answer}: ${entry.percent}% (${entry.count})`)
    .join(" · ");
}

function openStatsModal(themeKey) {
  if (!statsModal || !statsModalTitle || !statsModalMeta || !statsModalBody) {
    return;
  }
  const themeEntry = state.db?.levels?.[state.level]?.themes?.[themeKey];
  const themeLabel = themeEntry?.title || themeKey;
  const partLabel = getPartLabel(state.part);
  const summary = getCommunityThemeSummary(state.level, themeKey, state.part);
  const partData = state.community.map?.[state.level]?.[themeKey]?.[state.part];

  statsModalTitle.textContent = `${themeLabel} · ${partLabel}`;
  statsModalMeta.textContent = "";
  statsModalBody.innerHTML = "";

  if (state.community.loading) {
    statsModalMeta.textContent = "Loading community stats...";
    statsModalBody.textContent = "Please wait a moment.";
    statsModal.classList.remove("hidden");
    return;
  }

  if (!partData || !partData.votes) {
    statsModalMeta.textContent = "No submissions yet.";
    statsModalBody.textContent = "Submit corrections to see detailed percentages here.";
    statsModal.classList.remove("hidden");
    return;
  }

  statsModalMeta.textContent = `Submissions: ${partData.votes} | Consensus: ${summary?.percent ?? "-"}%`;

  const list = createEl("div", "correction-stats-list");
  (partData.items || []).forEach((item) => {
    const row = createEl("div", "correction-stats-item");
    row.append(
      createEl("div", "correction-stats-item-title", `Item ${item.item}`),
      createEl(
        "div",
        "correction-stats-item-main",
        `Top answer: ${item.answer || "-"} (${item.percent ?? "-"}%) | Votes: ${item.count || 0}/${item.total || 0}`
      ),
      createEl("div", "correction-stats-item-detail", buildDistributionText(item))
    );
    list.append(row);
  });

  if (!list.childElementCount) {
    statsModalBody.textContent = "No answer distribution found for this part yet.";
  } else {
    statsModalBody.append(list);
  }
  statsModal.classList.remove("hidden");
}

function resolveInitialLevel() {
  const levels = Object.keys(state.db?.levels || {});
  if (!levels.length) {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  const fromUrl = normalize(params.get("level"));
  if (fromUrl && levels.includes(fromUrl)) {
    return fromUrl;
  }
  const stored = normalize(window.localStorage.getItem("lastLevel"));
  if (stored && levels.includes(stored)) {
    return stored;
  }
  return levels[0];
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

function updateHeader() {
  if (levelPill) {
    levelPill.textContent = (state.level || "").toUpperCase();
  }
}

function updateSearchContext() {
  const levelLabel = (state.level || "").toUpperCase();
  const sectionLabel = SECTION_LABELS[state.section] || state.section.toUpperCase();
  if (themeSearchScope) {
    themeSearchScope.textContent = `${levelLabel} · ${sectionLabel}`;
  }
}

function renderLevelButtons() {
  const levels = Object.keys(state.db?.levels || {});
  levelList.innerHTML = "";
  levels.forEach((levelKey) => {
    const button = renderChoiceButton(levelKey.toUpperCase(), levelKey === state.level);
    button.type = "button";
    button.addEventListener("click", () => {
      if (state.level === levelKey) {
        return;
      }
      state.level = levelKey;
      state.theme = null;
      state.search = "";
      themeSearchInput.value = "";
      window.localStorage.setItem("lastLevel", levelKey);
      renderAll();
    });
    levelList.append(button);
  });
}

function renderModuleButtons() {
  moduleList.innerHTML = "";
  SECTION_KEYS.forEach((sectionKey) => {
    const label = SECTION_LABELS[sectionKey] || sectionKey.toUpperCase();
    const active = sectionKey === state.section;
    const disabled = sectionKey !== "lesen";
    const button = renderChoiceButton(label, active);
    button.type = "button";
    if (disabled) {
      button.disabled = true;
      button.classList.add("correction-disabled-btn");
    } else {
      button.addEventListener("click", () => {
        if (state.section !== sectionKey) {
          state.section = sectionKey;
          renderAll();
        }
      });
    }
    moduleList.append(button);
  });
}

function renderPartButtons() {
  partList.innerHTML = "";
  const email = getStoredEmail();
  PART_OPTIONS.forEach((part) => {
    const active = part.key === state.part;
    const contributed = hasUserContributedToPart(state.level, state.theme, part.key, email);
    const label = contributed ? `${part.label} ✓` : part.label;
    const button = renderChoiceButton(label, active);
    button.type = "button";
    if (contributed) {
      button.classList.add("correction-part-contributed");
    }
    button.addEventListener("click", () => {
      if (state.part === part.key) {
        return;
      }
      state.part = part.key;
      renderPartButtons();
      renderThemeCards();
      updateSummary();
      updateOpenButtonState();
    });
    partList.append(button);
  });
}

function renderThemeEmpty(message) {
  const box = createEl(
    "div",
    "rounded-2xl border border-stone-200 bg-stone-50 p-6 text-sm text-slate",
    message
  );
  themeGrid.append(box);
}

function renderThemeCards() {
  themeGrid.innerHTML = "";
  const levelEntry = state.db?.levels?.[state.level];
  if (!levelEntry) {
    renderThemeEmpty("No level data found.");
    return;
  }

  const allThemes = levelEntry.themeOrder?.length
    ? levelEntry.themeOrder
    : Object.keys(levelEntry.themes || {});

  const query = normalize(state.search);
  const filtered = allThemes.filter((themeKey) => {
    const themeEntry = levelEntry.themes?.[themeKey];
    const title = themeEntry?.title || themeKey;
    return !query
      || normalize(themeKey).includes(query)
      || normalize(title).includes(query);
  });

  if (state.theme && !filtered.includes(state.theme)) {
    state.theme = null;
  }
  if (!state.theme && filtered.length) {
    state.theme = filtered[0];
  }
  const userEmail = getStoredEmail();

  filtered.forEach((themeKey) => {
    const themeEntry = levelEntry.themes?.[themeKey];
    if (!themeEntry) {
      return;
    }
    const communitySummary = getCommunityThemeSummary(state.level, themeKey, state.part);
    const contributed = hasUserContributedToPart(state.level, themeKey, state.part, userEmail);
    const active = state.theme === themeKey;
    const card = createEl(
      "div",
      classNames("theme-card", "theme-card-clickable", active ? "theme-card-active" : "")
    );
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    const statsButton = createEl(
      "button",
      "community-btn community-btn-secondary correction-stats-btn",
      state.community.loading
        ? "Stats loading..."
        : `View stats (${communitySummary?.votes || 0})`
    );
    statsButton.type = "button";
    const title = createEl("div", "theme-card-title", themeEntry.title || themeKey);
    const subtitle = createEl("div", "theme-card-subtitle", "Lesen theme");
    card.append(title, subtitle);
    if (contributed) {
      card.append(
        createEl("div", "correction-theme-contributed-badge", "✓ You already contributed")
      );
    }
    card.append(statsButton);
    const selectAndOpen = () => {
      state.theme = themeKey;
      updateSummary();
      updateOpenButtonState();
      renderPartButtons();
      renderThemeCards();
      if (state.part) {
        handleOpenForm();
      }
    };
    card.addEventListener("click", selectAndOpen);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectAndOpen();
      }
    });
    statsButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      state.theme = themeKey;
      updateSummary();
      updateOpenButtonState();
      renderPartButtons();
      renderThemeCards();
      openStatsModal(themeKey);
    });
    themeGrid.append(card);
  });

  if (!filtered.length) {
    renderThemeEmpty(`No LESEN themes found in ${(state.level || "").toUpperCase()}.`);
  }
}

function getStoredEmail() {
  return String(window.localStorage.getItem(EMAIL_STORAGE_KEY) || "").trim();
}

function setStoredEmail(email) {
  window.localStorage.setItem(EMAIL_STORAGE_KEY, String(email || "").trim());
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function updateEmailState() {
  const email = getStoredEmail();
  if (!emailState) {
    return;
  }
  if (!email) {
    emailState.textContent = "No email saved yet.";
    return;
  }
  emailState.innerHTML = "";
  emailState.append(createEl("span", "text-ink", email));
}

function openEmailModal() {
  if (!emailModal || !emailInput || !emailError) {
    return;
  }
  emailError.classList.add("hidden");
  emailError.textContent = "";
  emailInput.value = getStoredEmail();
  emailModal.classList.remove("hidden");
  window.setTimeout(() => {
    emailInput.focus();
  }, 30);
}

function closeEmailModal() {
  if (!emailModal) {
    return;
  }
  emailModal.classList.add("hidden");
}

function showEmailError(message) {
  if (!emailError) {
    return;
  }
  emailError.textContent = message;
  emailError.classList.remove("hidden");
}

function hasUserContributedToPart(levelKey, themeKey, partKey, email) {
  const emailKey = normalizeEmail(email);
  if (!emailKey || !levelKey || !themeKey || !partKey) {
    return false;
  }
  const set = state.community.contributed?.[levelKey]?.[themeKey]?.[partKey];
  return Boolean(set && set.has(emailKey));
}

function buildContextValue(email) {
  const params = new URLSearchParams(window.location.search);
  const version = String(params.get("version") || "default").replace(/[^a-zA-Z0-9_-]/g, "");
  const level = String(state.level || "").replace(/[^a-zA-Z0-9_-]/g, "");
  const theme = String(state.theme || "").replace(/[^a-zA-Z0-9_-]/g, "");
  const part = String(state.part || "").replace(/[^a-zA-Z0-9_-]/g, "");
  const emailToken = String(email || "").replace(/[^a-zA-Z0-9_.@-]/g, "");
  const ts = Date.now();
  return `ctx_${level}_${theme}_${version}_${part}_${emailToken}_${ts}`;
}

function getThemeVersionEntry(levelKey, themeKey) {
  const themeEntry = state.db?.levels?.[levelKey]?.themes?.[themeKey];
  if (!themeEntry) {
    return null;
  }
  const versionKey = themeEntry.defaultVersion
    || themeEntry.versionOrder?.[0]
    || Object.keys(themeEntry.versions || {})[0]
    || "default";
  return themeEntry.versions?.[versionKey] || null;
}

function getAutoAnswersForSelection(partKey) {
  const versionEntry = getThemeVersionEntry(state.level, state.theme);
  const content = versionEntry?.lesen?.parts?.[partKey]?.content;
  const map = {};
  if (!content) {
    return map;
  }

  if (partKey === "teil-1") {
    (content.answers || []).forEach((item) => {
      const itemId = String(item?.textId || "").trim();
      const value = String(item?.headlineId || "").trim();
      if (itemId && value) {
        map[itemId] = value;
      }
    });
    return map;
  }

  if (partKey === "teil-2") {
    (content.questions || []).forEach((question) => {
      const itemId = String(question?.id || "").trim();
      const value = String(question?.answerId || "").trim();
      if (itemId && value) {
        map[itemId] = value;
      }
    });
    return map;
  }

  if (partKey === "teil-3") {
    (content.answers || []).forEach((item) => {
      const itemId = String(item?.situationId || "").trim();
      const value = String(item?.adId || "").trim();
      if (itemId && value) {
        map[itemId] = value;
      }
    });
    return map;
  }

  if (partKey === "sprachbausteine-1" || partKey === "sprachbausteine-2") {
    (content.answers || []).forEach((item) => {
      const itemId = String(item?.id || "").trim();
      const value = String(item?.answer || item?.text || "").trim();
      if (itemId && value) {
        map[itemId] = value;
      }
    });
  }

  return map;
}

function normalizePrefillValue(partKey, value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  if (partKey === "teil-1" || partKey === "teil-3") {
    return raw.toUpperCase();
  }
  if (partKey === "teil-2") {
    return raw.toLowerCase();
  }
  return raw;
}

function buildFromTemplate(template, values) {
  let filled = String(template || "");
  Object.entries(values || {}).forEach(([key, value]) => {
    filled = filled.replaceAll(`{{${key}}}`, encodeURIComponent(String(value || "")));
  });
  return filled.replace(/\{\{[^{}]+\}\}/g, "");
}

function sanitizeContextValue(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

function buildPrefilledFormUrl(formConfig, email) {
  const sourceParams = new URLSearchParams(window.location.search);
  const targetParams = new URLSearchParams();
  targetParams.set("usp", "pp_url");
  const autoAnswers = getAutoAnswersForSelection(formConfig.partKey);
  const templateValues = {};

  Object.entries(formConfig.entryIds.answers || {}).forEach(([itemNumber, entryId]) => {
    const rawValue = sourceParams.get(`a${itemNumber}`) || autoAnswers[itemNumber] || "";
    const value = normalizePrefillValue(formConfig.partKey, rawValue);
    templateValues[`a${itemNumber}`] = value;
    targetParams.set(`entry.${entryId}`, value);
  });

  const context = sanitizeContextValue(sourceParams.get("context") || buildContextValue(email));
  templateValues.context = context;
  targetParams.set(`entry.${formConfig.entryIds.context}`, context);

  const reason = sourceParams.get("reason") || "";
  const mergedReason = reason || context;
  templateValues.reason = mergedReason;
  targetParams.set(`entry.${formConfig.entryIds.reason}`, mergedReason);

  return `${formConfig.formPublicUrl}?${targetParams.toString()}`;
}

function buildLoginSafeRedirectUrl(prefilledUrl) {
  return prefilledUrl;
}

function updateSummary() {
  const level = (state.level || "").toUpperCase();
  const themeEntry = state.db?.levels?.[state.level]?.themes?.[state.theme];
  const themeLabel = themeEntry?.title || state.theme || "none";
  const partLabel = PART_OPTIONS.find((part) => part.key === state.part)?.label || state.part || "none";
  selectionSummary.textContent = `Level: ${level} | Theme: ${themeLabel} | Part: ${partLabel}`;
}

function updateOpenButtonState() {
  const ready = state.section === "lesen" && Boolean(state.level) && Boolean(state.theme) && Boolean(state.part);
  openFormBtn.disabled = !ready;
}

function handleOpenForm() {
  if (openFormBtn.disabled) {
    return;
  }
  const formConfig = FORM_INTEGRATION.forms[state.part];
  if (!formConfig) {
    window.alert("No Google Form mapping found for this part.");
    return;
  }
  const email = getStoredEmail();
  if (!isValidEmail(email)) {
    state.pendingRedirect = true;
    openEmailModal();
    return;
  }
  const prefilledUrl = buildPrefilledFormUrl(formConfig, email);
  if (new URLSearchParams(window.location.search).get("debugPrefill") === "1") {
    console.log("[Correction] Prefilled URL", prefilledUrl);
  }
  const redirectUrl = buildLoginSafeRedirectUrl(prefilledUrl);
  window.open(redirectUrl, "_blank", "noopener,noreferrer");
}

function renderAll() {
  updateHeader();
  renderLevelButtons();
  renderModuleButtons();
  updateSearchContext();
  renderThemeCards();
  renderPartButtons();
  updateEmailState();
  updateSummary();
  updateOpenButtonState();
}

async function init() {
  state.db = await loadLesenDatabase();
  if (!state.db) {
    renderThemeEmpty("database/lesen.json not found.");
    openFormBtn.disabled = true;
    return;
  }
  state.level = resolveInitialLevel();
  const communityPromise = loadCommunityStats();
  renderAll();
  await communityPromise;
  renderThemeCards();
  renderPartButtons();
}

themeSearchInput.addEventListener("input", () => {
  state.search = themeSearchInput.value || "";
  renderThemeCards();
  renderPartButtons();
  updateSummary();
  updateOpenButtonState();
});

openFormBtn.addEventListener("click", handleOpenForm);
if (changeEmailBtn) {
  changeEmailBtn.addEventListener("click", openEmailModal);
}

if (emailSaveBtn) {
  emailSaveBtn.addEventListener("click", () => {
    const email = String(emailInput?.value || "").trim();
    if (!isValidEmail(email)) {
      showEmailError("Please enter a valid email address.");
      return;
    }
    setStoredEmail(email);
    closeEmailModal();
    updateEmailState();
    renderPartButtons();
    if (state.pendingRedirect) {
      state.pendingRedirect = false;
      handleOpenForm();
    }
  });
}

if (emailCancelBtn) {
  emailCancelBtn.addEventListener("click", () => {
    state.pendingRedirect = false;
    closeEmailModal();
  });
}

if (emailModal) {
  emailModal.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    if (target.dataset.emailModalClose) {
      state.pendingRedirect = false;
      closeEmailModal();
    }
  });
}

if (statsModalCloseBtn) {
  statsModalCloseBtn.addEventListener("click", closeStatsModal);
}

if (statsModal) {
  statsModal.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    if (target.dataset.statsModalClose) {
      closeStatsModal();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }
  if (emailModal && !emailModal.classList.contains("hidden")) {
    state.pendingRedirect = false;
    closeEmailModal();
    return;
  }
  if (statsModal && !statsModal.classList.contains("hidden")) {
    closeStatsModal();
  }
});

init();
