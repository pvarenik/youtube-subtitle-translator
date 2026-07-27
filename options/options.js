// options.js - ASCII only, no async/await. Loads i18n from i18n.json.

var SOURCE_LANG_CODES = ["auto","en","ru","de","fr","es","it","pt","pl","uk","tr","zh","ja","ko","ar"];
var TARGET_LANG_CODES = ["en","ru","de","fr","es","it","pt","pl","uk","tr","zh","ja","ko","ar"];
var PROVIDER_CODES    = ["google","deepl","deepl-pro","libretranslate","custom"];

var DEFAULT_SETTINGS = {
  sourceLang: "auto",
  targetLang: "ru",
  provider: "google",
  apiKey: "",
  customEndpoint: "",
  uiLang: "en"
};

var currentLang = "en";
var I18N = {};

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
  statusMsg:      document.getElementById("statusMsg"),
  langBtns:       document.querySelectorAll(".lang-btn")
};

function rebuildSelect(selectEl, codes, namesMap) {
  var saved = selectEl.value;
  selectEl.innerHTML = "";
  for (var i = 0; i < codes.length; i++) {
    var code = codes[i];
    var opt = document.createElement("option");
    opt.value = code;
    opt.textContent = (namesMap && namesMap[code]) ? namesMap[code] : code;
    selectEl.appendChild(opt);
  }
  selectEl.value = saved;
}

function applyLang(lang) {
  if (!I18N[lang]) { return; }
  currentLang = lang;
  var t = I18N[lang];

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
  els.endpointHint.textContent   = t.endpointHint;
  document.documentElement.lang  = lang;

  rebuildSelect(els.sourceLang, SOURCE_LANG_CODES, t.langNames);
  rebuildSelect(els.targetLang, TARGET_LANG_CODES, t.langNames);
  rebuildSelect(els.provider,   PROVIDER_CODES,    t.providerNames);

  for (var b = 0; b < els.langBtns.length; b++) {
    var btn = els.langBtns[b];
    if (btn.getAttribute("data-lang") === lang) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  }
}

function nudgePopupResize() {
  // Chrome's toolbar popup only measures its content once, at first paint;
  // later DOM changes (like the API-key field appearing/disappearing)
  // don't trigger a resize on their own. Forcing a reflow here makes the
  // popup window grow/shrink to match. Harmless no-op cost in Firefox,
  // which already tracks this live.
  var root = document.documentElement;
  var prev = root.style.display;
  root.style.display = "none";
  void root.offsetHeight; // force layout recalculation
  root.style.display = prev;
}

function updateVisibility() {
  var p = els.provider.value;
  var showKey = (p === "deepl" || p === "deepl-pro" || p === "libretranslate" || p === "custom");
  var showEp  = (p === "custom");
  els.apiKeyField.style.display   = showKey ? "" : "none";
  els.endpointField.style.display = showEp  ? "" : "none";
  nudgePopupResize();
}

function showSavedStatus() {
  var t = I18N[currentLang];
  els.statusMsg.textContent = t ? t.saved : "Saved!";
  setTimeout(function() { els.statusMsg.textContent = ""; }, 2000);
}

function persistSettings() {
  var s = {
    sourceLang:     els.sourceLang.value,
    targetLang:     els.targetLang.value,
    provider:       els.provider.value,
    apiKey:         els.apiKey.value.trim(),
    customEndpoint: els.customEndpoint.value.trim(),
    uiLang:         currentLang
  };
  browser.storage.sync.set(s).then(showSavedStatus);
}

var saveDebounceTimer = null;
function persistSettingsDebounced() {
  if (saveDebounceTimer) { clearTimeout(saveDebounceTimer); }
  saveDebounceTimer = setTimeout(persistSettings, 500);
}

function init(settings) {
  els.sourceLang.value     = settings.sourceLang;
  els.targetLang.value     = settings.targetLang;
  els.provider.value       = settings.provider;
  els.apiKey.value         = settings.apiKey;
  els.customEndpoint.value = settings.customEndpoint;

  applyLang(settings.uiLang || "en");
  updateVisibility();

  // Settings save automatically as they change - selects save right away,
  // text inputs are debounced so we don't hit storage on every keystroke.
  els.sourceLang.addEventListener("change", persistSettings);
  els.targetLang.addEventListener("change", persistSettings);
  els.provider.addEventListener("change", function() {
    updateVisibility();
    persistSettings();
  });
  els.apiKey.addEventListener("input", persistSettingsDebounced);
  els.customEndpoint.addEventListener("input", persistSettingsDebounced);

  for (var i = 0; i < els.langBtns.length; i++) {
    (function(btn) {
      btn.addEventListener("click", function() {
        applyLang(btn.getAttribute("data-lang"));
        updateVisibility();
        persistSettings();
      });
    })(els.langBtns[i]);
  }
}

// Load i18n first, then settings
fetch(browser.runtime.getURL("options/i18n.json"))
  .then(function(r) { return r.json(); })
  .then(function(data) {
    I18N = data;
    return browser.storage.sync.get(DEFAULT_SETTINGS);
  })
  .then(function(stored) {
    init(Object.assign({}, DEFAULT_SETTINGS, stored));
  });
