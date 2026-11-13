// options.js - ASCII only, no async/await. Loads i18n from i18n.json.

var api = (typeof browser !== "undefined") ? browser : chrome;

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
  testBtn:        document.getElementById("testBtn"),
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
  els.testBtn.textContent        = t.testLabel;
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

// ---------- Status messages ----------

var statusTimer = null;

// hold=true keeps a status (e.g. "Testing...") until a terminal status replaces it.
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
  api.storage.sync.set(s).then(function() {
    var t = I18N[currentLang];
    showStatus(t ? t.saved : "Saved!", false);
  });
}

var saveDebounceTimer = null;
function persistSettingsDebounced() {
  if (saveDebounceTimer) { clearTimeout(saveDebounceTimer); }
  saveDebounceTimer = setTimeout(persistSettings, 500);
}

// Cancel a pending debounced save so its "Saved!" status cannot overwrite
// a test result or permission error shown later by the same user edit.
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

// Must be called from a user-gesture handler (click / change).
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

// Returns false and shows a localized status when the endpoint is malformed.
function validateEndpointInput() {
  var ep = els.customEndpoint.value.trim();
  if (ep && !endpointOrigin(ep)) {
    var t = I18N[currentLang];
    showStatus((t && t.invalidEndpoint) || "Invalid endpoint URL.", true);
    return false;
  }
  return true;
}

// Map background error codes to localized status text.
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
    tryEndpointPermission();
  });
  els.apiKey.addEventListener("input", persistSettingsDebounced);
  els.customEndpoint.addEventListener("input", persistSettingsDebounced);
  els.customEndpoint.addEventListener("change", function() {
    persistSettings();
    tryEndpointPermission();
  });

  els.testBtn.addEventListener("click", runTest);

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
fetch(api.runtime.getURL("options/i18n.json"))
  .then(function(r) { return r.json(); })
  .then(function(data) {
    I18N = data;
    return api.storage.sync.get(DEFAULT_SETTINGS);
  })
  .then(function(stored) {
    init(Object.assign({}, DEFAULT_SETTINGS, stored));
  });
