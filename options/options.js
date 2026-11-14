// options.js - ASCII only, no async/await. Loads i18n from i18n.json.

var api = (typeof browser !== "undefined") ? browser : chrome;

var SOURCE_LANG_CODES = ["auto","bg","cs","da","de","el","en","es","et","fi","fr","hu","id","it","ja","ko","lt","lv","nb","nl","pl","pt","ro","ru","sk","sl","sv","tr","uk","zh"];
var TARGET_LANG_CODES = ["bg","cs","da","de","el","en-gb","en-us","es","et","fi","fr","hu","id","it","ja","ko","lt","lv","nb","nl","pl","pt-br","pt-pt","ro","ru","sk","sl","sv","tr","uk","zh-hans","zh-hant"];
var PROVIDER_CODES    = ["google","deepl","deepl-pro","libretranslate","custom"];

// UI languages: DeepL supported languages (main codes only, no regional variants)
// Sorted: en first, ru second, be third, then alphabetically
var UI_LANG_CODES = ["en","ru","be","bg","cs","da","de","el","es","et","fi","fr","hu","id","it","ja","ko","lt","lv","nb","nl","pl","pt","ro","sk","sl","sv","tr","uk","zh"];

// Native language names (each language in its own script/language)
var NATIVE_LANG_NAMES = {
  "en": "English",
  "ru": "Русский",
  "be": "Беларуская",
  "bg": "Български",
  "cs": "Čeština",
  "da": "Dansk",
  "de": "Deutsch",
  "el": "Ελληνικά",
  "es": "Español",
  "et": "Eesti",
  "fi": "Suomi",
  "fr": "Français",
  "hu": "Magyar",
  "id": "Bahasa Indonesia",
  "it": "Italiano",
  "ja": "日本語",
  "ko": "한국어",
  "lt": "Lietuvių",
  "lv": "Latviešu",
  "nb": "Norsk (Bokmål)",
  "nl": "Nederlands",
  "pl": "Polski",
  "pt": "Português",
  "ro": "Română",
  "sk": "Slovenčina",
  "sl": "Slovenščina",
  "sv": "Svenska",
  "tr": "Türkçe",
  "uk": "Українська",
  "zh": "中文"
};

// Flag emoji mapping for each language code
var LANG_FLAGS = {
  "en": "🇺🇸", "ru": "🇷🇺", "be": "🇧🇾", "bg": "🇧🇬", "cs": "🇨🇿", "da": "🇩🇰", "de": "🇩🇪",
  "el": "🇬🇷", "es": "🇪🇸", "et": "🇪🇪", "fi": "🇫🇮", "fr": "🇫🇷", "hu": "🇭🇺",
  "id": "🇮🇩", "it": "🇮🇹", "ja": "🇯🇵", "ko": "🇰🇷", "lt": "🇱🇹", "lv": "🇱🇻",
  "nb": "🇳🇴", "nl": "🇳🇱", "pl": "🇵🇱", "pt": "🇵🇹", "ro": "🇷🇴", "sk": "🇸🇰",
  "sl": "🇸🇮", "sv": "🇸🇪", "tr": "🇹🇷", "uk": "🇺🇦", "zh": "🇨🇳"
};

var DEFAULT_SETTINGS = {
  sourceLang: "auto",
  targetLang: "ru",
  provider: "google",
  apiKey: "",
  customEndpoint: "",
  uiLang: "en",
  theme: "system"
};

var currentLang = "en";
var I18N = {};
var langListOpen = false;

var els = {
  title:          document.getElementById("txt-title"),
  sectionLangs:   document.getElementById("txt-section-langs"),
  sourceLangLbl:  document.getElementById("txt-source-lang"),
  sourceLangHint: document.getElementById("txt-source-lang-hint"),
  targetLangLbl:  document.getElementById("txt-target-lang"),
  sectionProv:    document.getElementById("txt-section-provider"),
  providerLbl:    document.getElementById("txt-provider-label"),
  apikeyLbl:      document.getElementById("txt-apikey-label"),
  apikeyHint:     document.getElementById("txt-apikey-hint"),
  endpointLbl:    document.getElementById("txt-endpoint-label"),
  endpointHint:   document.getElementById("txt-endpoint-hint"),
  sourceLang:     document.getElementById("sourceLang"),
  targetLang:     document.getElementById("targetLang"),
  provider:       document.getElementById("provider"),
  apiKey:         document.getElementById("apiKey"),
  customEndpoint: document.getElementById("customEndpoint"),
  apiKeyField:    document.getElementById("apiKeyField"),
  endpointField:  document.getElementById("endpointField"),
  testBtn:        document.getElementById("testBtn"),
  statusMsg:      document.getElementById("statusMsg"),
  langBtn:        document.getElementById("langBtn"),
  langList:       document.getElementById("langList"),
  langFlag:       document.getElementById("langFlag"),
  themeBtn:       document.getElementById("themeBtn"),
  themeIcon:      document.getElementById("themeIcon")
};

function rebuildSelect(selectEl, codes, namesMap, savedValue) {
  selectEl.innerHTML = "";
  for (var i = 0; i < codes.length; i++) {
    var code = codes[i];
    var opt = document.createElement("option");
    opt.value = code;
    opt.textContent = (namesMap && namesMap[code]) ? namesMap[code] : code;
    selectEl.appendChild(opt);
  }
  var valueToUse = savedValue !== undefined ? savedValue : selectEl.value;
  if (codes.indexOf(valueToUse) !== -1) {
    selectEl.value = valueToUse;
  } else {
    selectEl.value = codes[0];
  }
}

function applyLang(lang) {
  if (!I18N[lang]) { return; }
  currentLang = lang;
  var t = I18N[lang];

  // Preserve current select values before rebuilding
  var savedSourceLang = els.sourceLang.value;
  var savedTargetLang = els.targetLang.value;
  var savedProvider = els.provider.value;

  els.title.textContent          = t.title;
  els.sectionLangs.textContent   = t.sectionLangs;
  els.sourceLangLbl.textContent  = t.sourceLang;
  els.sourceLangHint.textContent = t.sourceLangHint;
  els.targetLangLbl.textContent  = t.targetLang;
  els.sectionProv.textContent    = t.sectionProvider;
  els.providerLbl.textContent    = t.providerLabel;
  els.apikeyLbl.textContent      = t.apikeyLabel;
  els.apikeyHint.textContent     = t.apikeyHint;
  els.apiKey.placeholder         = t.apikeyPlaceholder;
  els.endpointLbl.textContent    = t.endpointLabel;
  els.testBtn.textContent        = t.testLabel;
  document.documentElement.lang  = lang;

  rebuildSelect(els.sourceLang, SOURCE_LANG_CODES, t.langNames, savedSourceLang);
  rebuildSelect(els.targetLang, TARGET_LANG_CODES, t.langNames, savedTargetLang);
  rebuildSelect(els.provider,   PROVIDER_CODES,    t.providerNames, savedProvider);

  // Update language dropdown button flag
  els.langFlag.textContent = LANG_FLAGS[lang] || "🏳️";
}

function applyTheme(theme) {
  var root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
    els.themeIcon.textContent = "🖥";
  } else {
    root.setAttribute("data-theme", theme);
    els.themeIcon.textContent = theme === "dark" ? "🌙" : "☀";
  }
}

function nudgePopupResize() {
  var root = document.documentElement;
  var prev = root.style.display;
  root.style.display = "none";
  void root.offsetHeight;
  root.style.display = prev;
  // Also trigger on body for browsers that need it
  var body = document.body;
  var prevBody = body.style.display;
  body.style.display = "none";
  void body.offsetHeight;
  body.style.display = prevBody;
}

function updateVisibility() {
  var p = els.provider.value;
  var t = I18N[currentLang];
  var showKey = (p === "deepl" || p === "deepl-pro" || p === "libretranslate" || p === "custom");
  var showEp  = (p === "custom" || p === "libretranslate");
  els.apiKeyField.style.display   = showKey ? "" : "none";
  els.endpointField.style.display = showEp  ? "" : "none";
  if (t) {
    els.endpointHint.textContent = (p === "libretranslate") ? t.endpointHintLibre : t.endpointHint;
  }
  nudgePopupResize();
}

// ---------- Language dropdown ----------

function buildLangList() {
  els.langList.innerHTML = "";
  for (var i = 0; i < UI_LANG_CODES.length; i++) {
    var code = UI_LANG_CODES[i];
    var name = NATIVE_LANG_NAMES[code] || code;
    var flag = LANG_FLAGS[code] || "🏳️";

    var li = document.createElement("li");
    li.setAttribute("role", "option");
    li.setAttribute("data-lang", code);
    li.tabIndex = -1;

    var flagSpan = document.createElement("span");
    flagSpan.className = "flag";
    flagSpan.textContent = flag;
    li.appendChild(flagSpan);

    var nameSpan = document.createElement("span");
    nameSpan.className = "lang-name";
    nameSpan.textContent = name;
    li.appendChild(nameSpan);

    if (code === currentLang) {
      li.classList.add("active");
      li.setAttribute("aria-selected", "true");
    }
    els.langList.appendChild(li);
  }
}

function toggleLangList(open) {
  if (typeof open === "boolean") {
    langListOpen = open;
  } else {
    langListOpen = !langListOpen;
  }
  els.langList.hidden = !langListOpen;
  els.langBtn.setAttribute("aria-expanded", langListOpen);
  if (langListOpen) {
    buildLangList();
    // Focus the active item
    var active = els.langList.querySelector(".active");
    if (active) { active.focus(); }
  }
}

function selectLang(code) {
  applyLang(code);
  toggleLangList(false);
  updateVisibility();
  persistSettings();
}

// ---------- Status messages ----------

var statusTimer = null;

function showStatus(text, isError, hold) {
  if (statusTimer) { clearTimeout(statusTimer); statusTimer = null; }
  els.statusMsg.textContent = text;
  els.statusMsg.classList.toggle("status-error", !!isError);
  if (text && !hold) {
    statusTimer = setTimeout(function() {
      els.statusMsg.textContent = "";
      els.statusMsg.classList.remove("status-error");
      statusTimer = null;
    }, isError ? 8000 : 3000);
  }
}

// ---------- Settings ----------

function collectSettings() {
  return {
    sourceLang:     els.sourceLang.value,
    targetLang:     els.targetLang.value,
    provider:       els.provider.value,
    apiKey:         els.apiKey.value.trim(),
    customEndpoint: els.customEndpoint.value.trim()
  };
}

function persistSettings() {
  var s = collectSettings();
  s.uiLang = currentLang;
  var root = document.documentElement;
  var theme = root.getAttribute("data-theme") || "system";
  s.theme = theme;
  
  // Save critical settings to localStorage and sessionStorage immediately for instant persistence
  try {
    localStorage.setItem("ytst_targetLang", s.targetLang);
    localStorage.setItem("ytst_sourceLang", s.sourceLang);
    localStorage.setItem("ytst_provider", s.provider);
    sessionStorage.setItem("ytst_targetLang", s.targetLang);
    sessionStorage.setItem("ytst_sourceLang", s.sourceLang);
    sessionStorage.setItem("ytst_provider", s.provider);
  } catch (e) {}

  return api.storage.sync.set(s).then(function() {
    var t = I18N[currentLang];
    var langName = (t && t.langNames && t.langNames[s.targetLang]) ? t.langNames[s.targetLang] : s.targetLang;
    showStatus((t ? t.saved : "Saved!") + " — " + langName, false);
  });
}

var saveDebounceTimer = null;
function persistSettingsDebounced() {
  if (saveDebounceTimer) { clearTimeout(saveDebounceTimer); }
  saveDebounceTimer = setTimeout(persistSettings, 500);
}

function cancelPendingSave() {
  if (saveDebounceTimer) { clearTimeout(saveDebounceTimer); saveDebounceTimer = null; }
}

// ---------- Optional host permission for self-hosted endpoints ----------

function endpointOrigin(urlStr) {
  var ep = (urlStr || "").trim();
  if (!ep || !/^https?:\/\//i.test(ep)) { return null; }
  try {
    var u = new URL(ep);
    return u.origin + "/*";
  } catch (e) {
    return null;
  }
}

function needsEndpointPermission(provider) {
  return provider === "libretranslate" || provider === "custom";
}

function ensureEndpointPermission(urlStr) {
  var origin = endpointOrigin(urlStr);
  if (!origin) { return Promise.resolve(true); }
  return api.permissions.contains({ origins: [origin] }).then(function(has) {
    if (has) { return true; }
    return api.permissions.request({ origins: [origin] });
  }).catch(function() {
    return false;
  });
}

function validateEndpointInput() {
  var ep = els.customEndpoint.value.trim();
  if (ep && !endpointOrigin(ep)) {
    var t = I18N[currentLang];
    showStatus((t && t.invalidEndpoint) || "Invalid endpoint URL.", true);
    return false;
  }
  return true;
}

function errorStatus(code, rawError) {
  var t = I18N[currentLang] || {};
  if (code === "INVALID_ENDPOINT") { showStatus(t.invalidEndpoint || "Invalid endpoint URL.", true); return; }
  if (code === "CUSTOM_NOT_SET")   { showStatus(t.customNotSet || "Custom endpoint is not configured.", true); return; }
  showStatus("Error: " + (rawError || "no response"), true);
}

function tryEndpointPermission() {
  if (!needsEndpointPermission(els.provider.value)) { return; }
  cancelPendingSave();
  if (!validateEndpointInput()) { return; }
  ensureEndpointPermission(els.customEndpoint.value.trim()).then(function(granted) {
    if (!granted) {
      var t = I18N[currentLang];
      showStatus(t ? t.permDenied : "Access was not granted.", true);
    }
  });
}

// ---------- Test connection ----------

function runTest() {
  var t = I18N[currentLang];
  cancelPendingSave();

  var s = collectSettings();
  s.uiLang = currentLang;

  if (needsEndpointPermission(s.provider) && !validateEndpointInput()) { return; }
  showStatus(t ? t.testing : "Testing...", false, true);

  var perm = needsEndpointPermission(s.provider)
    ? ensureEndpointPermission(s.customEndpoint)
    : Promise.resolve(true);

  perm
    .then(function(granted) {
      if (!granted) {
        showStatus(t ? t.permDenied : "Access was not granted.", true);
        return "denied";
      }
      return api.storage.sync.set(s).then(function() {
        return api.runtime.sendMessage({ type: "TRANSLATE_WORD", text: "hello world" });
      });
    })
    .then(function(response) {
      if (response === "denied") { return; }
      if (!response || !response.ok) {
        errorStatus((response && response.code) || "", (response && response.error) || "");
        return;
      }
      showStatus((t ? t.testOk + " " : "OK: ") + (response.translatedText || "(empty)"), false);
    })
    .catch(function(err) {
      showStatus("Error: " + (err.message || String(err)), true);
    });
}

// ---------- Init ----------

function init(settings) {
  // Ensure targetLang is valid (migrate from old 'en' to 'en-us')
  if (TARGET_LANG_CODES.indexOf(settings.targetLang) === -1) {
    settings.targetLang = "ru";
  }
  // Ensure sourceLang is valid
  if (SOURCE_LANG_CODES.indexOf(settings.sourceLang) === -1) {
    settings.sourceLang = "auto";
  }

  // PRIORITY: localStorage/sessionStorage over sync storage (instant persistence)
  var localTarget = null, localSource = null, localProvider = null;
  try {
    localTarget = localStorage.getItem("ytst_targetLang") || sessionStorage.getItem("ytst_targetLang");
    localSource = localStorage.getItem("ytst_sourceLang") || sessionStorage.getItem("ytst_sourceLang");
    localProvider = localStorage.getItem("ytst_provider") || sessionStorage.getItem("ytst_provider");
  } catch (e) {}

  // Use localStorage value if valid (overrides sync storage)
  if (localTarget && TARGET_LANG_CODES.indexOf(localTarget) !== -1) {
    settings.targetLang = localTarget;
  }
  if (localSource && SOURCE_LANG_CODES.indexOf(localSource) !== -1) {
    settings.sourceLang = localSource;
  }
  if (localProvider && PROVIDER_CODES.indexOf(localProvider) !== -1) {
    settings.provider = localProvider;
  }

  // Then validate (migrate old values)
  if (TARGET_LANG_CODES.indexOf(settings.targetLang) === -1) {
    settings.targetLang = "ru";
  }
  if (SOURCE_LANG_CODES.indexOf(settings.sourceLang) === -1) {
    settings.sourceLang = "auto";
  }

  els.sourceLang.value     = settings.sourceLang;
  els.targetLang.value     = settings.targetLang;
  els.provider.value       = settings.provider;
  els.apiKey.value         = settings.apiKey;
  els.customEndpoint.value = settings.customEndpoint;

  // Immediately sync to localStorage/sessionStorage to ensure instant persistence
  try {
    localStorage.setItem("ytst_sourceLang", settings.sourceLang);
    localStorage.setItem("ytst_targetLang", settings.targetLang);
    localStorage.setItem("ytst_provider", settings.provider);
    sessionStorage.setItem("ytst_sourceLang", settings.sourceLang);
    sessionStorage.setItem("ytst_targetLang", settings.targetLang);
    sessionStorage.setItem("ytst_provider", settings.provider);
  } catch (e) {}

  applyLang(settings.uiLang || "en");
  applyTheme(settings.theme || "system");
  updateVisibility();

  // Show loaded language confirmation
  if (localTarget) {
    var t = I18N[currentLang] || I18N.en;
    var langName = (t && t.langNames && t.langNames[settings.targetLang]) ? t.langNames[settings.targetLang] : settings.targetLang;
    setTimeout(function() { showStatus((t ? t.loaded : "Loaded") + ": " + langName, false); }, 100);
  }

  function saveToLocalStorageSync() {
    try {
      localStorage.setItem("ytst_targetLang", els.targetLang.value);
      localStorage.setItem("ytst_sourceLang", els.sourceLang.value);
      localStorage.setItem("ytst_provider", els.provider.value);
      sessionStorage.setItem("ytst_targetLang", els.targetLang.value);
      sessionStorage.setItem("ytst_sourceLang", els.sourceLang.value);
      sessionStorage.setItem("ytst_provider", els.provider.value);
    } catch (e) {}
  }

  // Periodic save as final safety net (every 2 seconds)
  setInterval(function() {
    saveToLocalStorageSync();
  }, 2000);

  // Force-save on unload - DIRECT synchronous localStorage writes (no async)
  window.addEventListener("pagehide", function() {
    saveToLocalStorageSync();
  });
  window.addEventListener("beforeunload", function() {
    saveToLocalStorageSync();
  });
  // Also save on visibility change (when popup loses focus)
  document.addEventListener("visibilitychange", function() {
    if (document.visibilityState === "hidden") {
      saveToLocalStorageSync();
    }
  });

  els.sourceLang.addEventListener("change", function() {
    persistSettings();
    try { localStorage.setItem("ytst_sourceLang", els.sourceLang.value); sessionStorage.setItem("ytst_sourceLang", els.sourceLang.value); } catch (e) {}
  });
  els.sourceLang.addEventListener("blur", function() {
    try { localStorage.setItem("ytst_sourceLang", els.sourceLang.value); sessionStorage.setItem("ytst_sourceLang", els.sourceLang.value); } catch (e) {}
  });
  els.targetLang.addEventListener("change", function() {
    persistSettings();
    try { localStorage.setItem("ytst_targetLang", els.targetLang.value); sessionStorage.setItem("ytst_targetLang", els.targetLang.value); } catch (e) {}
  });
  els.targetLang.addEventListener("blur", function() {
    try { localStorage.setItem("ytst_targetLang", els.targetLang.value); sessionStorage.setItem("ytst_targetLang", els.targetLang.value); } catch (e) {}
  });
  els.provider.addEventListener("input", function() {
    updateVisibility();
    persistSettings();
    try { localStorage.setItem("ytst_provider", els.provider.value); sessionStorage.setItem("ytst_provider", els.provider.value); } catch (e) {}
    tryEndpointPermission();
  });
  els.provider.addEventListener("blur", function() {
    try { localStorage.setItem("ytst_provider", els.provider.value); sessionStorage.setItem("ytst_provider", els.provider.value); } catch (e) {}
  });
  els.apiKey.addEventListener("input", persistSettingsDebounced);
  els.customEndpoint.addEventListener("input", persistSettingsDebounced);
  els.customEndpoint.addEventListener("change", function() {
    persistSettings();
    tryEndpointPermission();
  });

  els.testBtn.addEventListener("click", runTest);

  // Theme toggle
  els.themeBtn.addEventListener("click", function() {
    var root = document.documentElement;
    var current = root.getAttribute("data-theme") || "system";
    var next = current === "system" ? "light" : (current === "light" ? "dark" : "system");
    applyTheme(next);
    persistSettings();
    nudgePopupResize();
  });

  // Language dropdown
  els.langBtn.addEventListener("click", function() {
    toggleLangList();
  });

  els.langList.addEventListener("click", function(evt) {
    var li = evt.target.closest("li[data-lang]");
    if (li) { selectLang(li.getAttribute("data-lang")); }
  });

  els.langList.addEventListener("keydown", function(evt) {
    var items = Array.from(els.langList.querySelectorAll("li[data-lang]"));
    var activeIdx = items.findIndex(function(li) { return li.classList.contains("active"); });
    if (evt.key === "ArrowDown") {
      evt.preventDefault();
      var next = (activeIdx + 1) % items.length;
      items[next].focus();
      items[next].classList.add("active");
      if (activeIdx >= 0) { items[activeIdx].classList.remove("active"); }
    } else if (evt.key === "ArrowUp") {
      evt.preventDefault();
      var prev = (activeIdx - 1 + items.length) % items.length;
      items[prev].focus();
      items[prev].classList.add("active");
      if (activeIdx >= 0) { items[activeIdx].classList.remove("active"); }
    } else if (evt.key === "Enter" || evt.key === " ") {
      evt.preventDefault();
      var active = els.langList.querySelector(".active");
      if (active) { selectLang(active.getAttribute("data-lang")); }
    } else if (evt.key === "Escape") {
      toggleLangList(false);
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", function(evt) {
    if (langListOpen && !els.langBtn.contains(evt.target) && !els.langList.contains(evt.target)) {
      toggleLangList(false);
    }
  });
}

// Load i18n first, then settings
fetch(api.runtime.getURL("options/i18n.json"))
  .then(function(r) { return r.json(); })
  .then(function(data) {
    I18N = data;
    return api.storage.sync.get(DEFAULT_SETTINGS);
  })
  .then(function(stored) {
    init(Object.assign({}, DEFAULT_SETTINGS, stored));
  });