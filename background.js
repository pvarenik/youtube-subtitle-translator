// background.js - Firefox/Chrome MV3 service worker, ASCII only, no async/await

var api = (typeof browser !== "undefined") ? browser : chrome;

if (typeof AbortSignal.timeout !== "function") {
  AbortSignal.timeout = function(ms) {
    var controller = new AbortController();
    setTimeout(function() { controller.abort(); }, ms);
    return controller.signal;
  };
}

var DEFAULT_SETTINGS = {
  sourceLang: "auto",
  targetLang: "ru",
  provider: "google",
  apiKey: "",
  customEndpoint: ""
};

var FETCH_TIMEOUT_MS = 15000;
var CACHE_LIMIT = 500;
var cache = new Map();

function getSettings() {
  return api.storage.sync.get(DEFAULT_SETTINGS).then(function(stored) {
    return Object.assign({}, DEFAULT_SETTINGS, stored);
  });
}

// ---------- Translation cache (LRU, lives while the worker is alive) ----------

function cacheKey(settings, text) {
  return settings.provider + "|" + settings.sourceLang + "|" +
         settings.targetLang + "|" + settings.customEndpoint + "|" +
         settings.apiKey + "|" + text;
}

function cacheGet(key) {
  if (!cache.has(key)) { return null; }
  var value = cache.get(key);
  cache.delete(key);   // refresh recency
  cache.set(key, value);
  return value;
}

function cachePut(key, value) {
  if (cache.has(key)) { cache.delete(key); }
  cache.set(key, value);
  if (cache.size > CACHE_LIMIT) {
    var oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
}

api.storage.onChanged.addListener(function(changes, area) {
  if (area === "sync") { cache.clear(); }
});

// ---------- Fetch with timeout ----------

function fetchWithTimeout(url, options) {
  var opts = Object.assign({}, options || {}, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  return fetch(url, opts).catch(function(err) {
    if (err && (err.name === "TimeoutError" || err.name === "AbortError")) {
      throw new Error("request timed out after " + (FETCH_TIMEOUT_MS / 1000) + "s");
    }
    throw err;
  });
}

// ---------- Providers ----------

function translateGoogle(text, sourceLang, targetLang) {
  var sl = sourceLang === "auto" ? "auto" : sourceLang;
  var url = "https://translate.googleapis.com/translate_a/single"
    + "?client=gtx"
    + "&sl=" + encodeURIComponent(sl)
    + "&tl=" + encodeURIComponent(targetLang)
    + "&dt=t"
    + "&q=" + encodeURIComponent(text);

  return fetchWithTimeout(url).then(function(resp) {
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

  return fetchWithTimeout(base, {
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

  return fetchWithTimeout(url, {
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

function isHttpUrl(u) {
  return /^https?:\/\//i.test(u);
}

function endpointError(code, msg) {
  var e = new Error(msg);
  e.code = code;
  return e;
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
  if (p === "libretranslate"){
    if (ep && !isHttpUrl(ep)) {
      return Promise.reject(endpointError("INVALID_ENDPOINT", "invalid endpoint URL"));
    }
    return translateLibre(text, sl, tl, ep, key);
  }
  if (p === "custom") {
    if (!ep) { return Promise.reject(endpointError("CUSTOM_NOT_SET", "custom endpoint not set")); }
    if (!isHttpUrl(ep)) {
      return Promise.reject(endpointError("INVALID_ENDPOINT", "invalid endpoint URL"));
    }
    return translateLibre(text, sl, tl, ep, key);
  }
  return Promise.reject(new Error("Unknown provider: " + p));
}

// ---------- Messaging ----------

api.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (!message || message.type !== "TRANSLATE_WORD") { return undefined; }

  getSettings().then(function(settings) {
    var key = cacheKey(settings, message.text);
    var hit = cacheGet(key);
    var work = hit
      ? Promise.resolve(hit)
      : translateText(message.text, settings).then(function(result) {
          cachePut(key, result);
          return result;
        });

    return work.then(function(result) {
      var response = { ok: true, translatedText: result.translatedText };
      if (settings.sourceLang === "auto" && result.detectedLang) {
        response.detectedLang = result.detectedLang;
        response.targetLang = settings.targetLang;
      }
      sendResponse(response);
    });
  }).catch(function(err) {
    sendResponse({ ok: false, error: err.message || String(err), code: err.code || "" });
  });

  return true;
});
