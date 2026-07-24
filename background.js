// background.js - Firefox MV2, ASCII only, no async/await

var DEFAULT_SETTINGS = {
  sourceLang: "auto",
  targetLang: "ru",
  provider: "google",
  apiKey: "",
  customEndpoint: ""
};

function getSettings() {
  return browser.storage.sync.get(DEFAULT_SETTINGS).then(function(stored) {
    return Object.assign({}, DEFAULT_SETTINGS, stored);
  });
}

function translateGoogle(text, sourceLang, targetLang) {
  var sl = sourceLang === "auto" ? "auto" : sourceLang;
  var url = "https://translate.googleapis.com/translate_a/single"
    + "?client=gtx"
    + "&sl=" + encodeURIComponent(sl)
    + "&tl=" + encodeURIComponent(targetLang)
    + "&dt=t"
    + "&q=" + encodeURIComponent(text);

  return fetch(url).then(function(resp) {
    if (!resp.ok) { throw new Error("Google HTTP " + resp.status); }
    return resp.json();
  }).then(function(data) {
    var chunks = data[0] || [];
    var translated = chunks.map(function(c) { return c[0] || ""; }).join("");
    return { translatedText: translated, detectedLang: data[2] || sourceLang };
  });
}

function translateDeepL(text, sourceLang, targetLang, apiKey, isFree) {
  if (!apiKey) { return Promise.reject(new Error("DeepL: no API key")); }
  var base = isFree
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";

  var params = new URLSearchParams();
  params.append("text", text);
  params.append("target_lang", targetLang.toUpperCase());
  if (sourceLang !== "auto") {
    params.append("source_lang", sourceLang.toUpperCase());
  }

  return fetch(base, {
    method: "POST",
    headers: {
      "Authorization": "DeepL-Auth-Key " + apiKey,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  }).then(function(resp) {
    if (!resp.ok) {
      return resp.text().then(function(t) { throw new Error("DeepL HTTP " + resp.status + ": " + t); });
    }
    return resp.json();
  }).then(function(data) {
    var t = data.translations && data.translations[0];
    if (!t) { throw new Error("DeepL: empty response"); }
    return {
      translatedText: t.text,
      detectedLang: (t.detected_source_language || sourceLang || "").toLowerCase()
    };
  });
}

function translateLibre(text, sourceLang, targetLang, endpoint, apiKey) {
  var url = (endpoint || "https://libretranslate.com/translate").replace(/\/+$/, "");
  var body = {
    q: text,
    source: sourceLang === "auto" ? "auto" : sourceLang,
    target: targetLang,
    format: "text"
  };
  if (apiKey) { body.api_key = apiKey; }

  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }).then(function(resp) {
    if (!resp.ok) {
      return resp.text().then(function(t) { throw new Error("LibreTranslate HTTP " + resp.status + ": " + t); });
    }
    return resp.json();
  }).then(function(data) {
    if (!data.translatedText) { throw new Error("LibreTranslate: empty response"); }
    return {
      translatedText: data.translatedText,
      detectedLang: (data.detectedLanguage && data.detectedLanguage.language) || sourceLang
    };
  });
}

function translateText(text, settings) {
  var p = settings.provider;
  var sl = settings.sourceLang;
  var tl = settings.targetLang;
  var key = settings.apiKey;
  var ep = settings.customEndpoint;

  if (p === "google")        { return translateGoogle(text, sl, tl); }
  if (p === "deepl")         { return translateDeepL(text, sl, tl, key, true); }
  if (p === "deepl-pro")     { return translateDeepL(text, sl, tl, key, false); }
  if (p === "libretranslate"){ return translateLibre(text, sl, tl, ep, key); }
  if (p === "custom")        { return translateLibre(text, sl, tl, ep, key); }
  return Promise.reject(new Error("Unknown provider: " + p));
}

browser.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (!message || message.type !== "TRANSLATE_WORD") { return undefined; }

  getSettings()
    .then(function(settings) { return translateText(message.text, settings); })
    .then(function(result) {
      sendResponse({ ok: true, translatedText: result.translatedText, detectedLang: result.detectedLang });
    })
    .catch(function(err) {
      sendResponse({ ok: false, error: err.message || String(err) });
    });

  return true;
});
