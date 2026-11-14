// content.js - Firefox/Chrome MV3 content script, ASCII only, no async/await

(function () {
  var api = (typeof browser !== "undefined") ? browser : chrome;

  var PROCESSED_ATTR = "data-ytst-processed";
  var AUTO_HIDE_MS = 12000;
  var PROCESS_DEBOUNCE_MS = 150;

  // Edge punctuation/quote chars stripped from a clicked word, in any script.
  // \p{M} keeps combining marks (Indic matras, harakat, Thai/Sinhala marks)
  // that attach to word edges.
  var EDGE_TRIM_RE = /^[^\p{L}\p{N}\p{M}]+|[^\p{L}\p{N}\p{M}]+$/gu;

// Ideographs and kana: each character becomes its own clickable word.
// Use Unicode Script property for comprehensive CJK coverage.
// Firefox 78+, Chrome 87+, Safari 14+ support \p{Script=...}
var CJK_RE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
var CJK_PUNCT_RE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{General_Category=Po}\p{General_Category=Pd}\p{General_Category=Ps}\p{General_Category=Pe}\p{General_Category=Pi}\p{General_Category=Pf}]/u;

  var tooltipEl = null;
  var currentRequestId = 0;
  var hideTimer = null;
  var processTimer = null;

  // ---------- Tooltip ----------

  function ensureTooltip() {
    if (tooltipEl && document.body.contains(tooltipEl)) { return tooltipEl; }
    tooltipEl = document.createElement("div");
    tooltipEl.id = "ytst-tooltip";
    tooltipEl.className = "ytst-tooltip ytst-hidden";
    document.body.appendChild(tooltipEl);
    return tooltipEl;
  }

  function clearAutoHide() {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  }

  function hideTooltip() {
    clearAutoHide();
    if (tooltipEl) { tooltipEl.classList.add("ytst-hidden"); }
  }

  function setAutoHide() {
    clearAutoHide();
    hideTimer = setTimeout(hideTooltip, AUTO_HIDE_MS);
  }

  function showTooltip(targetEl, text, isError, chip) {
    var tooltip = ensureTooltip();

    while (tooltip.firstChild) { tooltip.removeChild(tooltip.firstChild); }
    var line = document.createElement("div");
    line.className = "ytst-text";
    line.textContent = text;
    tooltip.appendChild(line);

    if (!isError && chip) {
      var chipEl = document.createElement("div");
      chipEl.className = "ytst-chip";
      chipEl.textContent = chip;
      tooltip.appendChild(chipEl);
    }

    if (isError) {
      tooltip.classList.add("ytst-error");
    } else {
      tooltip.classList.remove("ytst-error");
    }

    tooltip.style.visibility = "hidden";
    tooltip.classList.remove("ytst-hidden");

    var rect = targetEl.getBoundingClientRect();
    var tRect = tooltip.getBoundingClientRect();
    var top = rect.top - tRect.height - 8;
    if (top < 8) { top = rect.bottom + 8; }
    var left = rect.left + rect.width / 2 - tRect.width / 2;
    if (left < 8) { left = 8; }
    if (left + tRect.width > window.innerWidth - 8) { left = window.innerWidth - tRect.width - 8; }

    tooltip.style.top = top + "px";
    tooltip.style.left = left + "px";
    tooltip.style.visibility = "";
    setAutoHide();
  }

  // ---------- Word click ----------

  function cleanWord(raw) {
    return raw.replace(EDGE_TRIM_RE, "");
  }

  function handleWordClick(evt, span) {
    // Do NOT stopPropagation - let YouTube receive its own events
    evt.preventDefault();
    var word = cleanWord(span.textContent || "");
    if (!word) { return; }

    var myId = ++currentRequestId;
    showTooltip(span, "...", false, "");

    api.runtime.sendMessage({ type: "TRANSLATE_WORD", text: word })
      .then(function(response) {
        if (myId !== currentRequestId) { return; }
        if (!response || !response.ok) {
          var msg = (response && response.error) || "no response";
          if (response && response.code === "INVALID_ENDPOINT") { msg = "invalid endpoint URL"; }
          else if (response && response.code === "CUSTOM_NOT_SET") { msg = "custom endpoint not set"; }
          showTooltip(span, "Error: " + msg, true, "");
          return;
        }
        var chip = "";
        if (response.detectedLang && response.targetLang) {
          chip = response.detectedLang.toUpperCase() + " \u2192 " + response.targetLang.toUpperCase();
        }
        showTooltip(span, response.translatedText || "(empty)", false, chip);
      })
      .catch(function(err) {
        if (myId !== currentRequestId) { return; }
        showTooltip(span, "Error: " + (err.message || String(err)), true, "");
      });
  }

  // ---------- Segment wrapping ----------

  function splitToken(token, out) {
    if (!CJK_RE.test(token)) {
      out.push(token);
      return;
    }
    var chars = Array.from(token);
    var buf = "";
    for (var i = 0; i < chars.length; i++) {
      var ch = chars[i];
      if (CJK_RE.test(ch)) {
        if (buf) { out.push(buf); buf = ""; }
        var tok = ch;
        // Attach CJK punctuation (.,、。) to the preceding character so it
        // does not become a separate unclickable-looking span.
        while (i + 1 < chars.length && CJK_PUNCT_RE.test(chars[i + 1])) {
          i++;
          tok += chars[i];
        }
        out.push(tok);
      } else {
        buf += ch;
      }
    }
    if (buf) { out.push(buf); }
  }

  function wrapSegment(segmentEl) {
    var currentText = segmentEl.textContent;
    if (!currentText || !currentText.trim()) { return; }

    // If already processed with the same text - skip
    if (segmentEl.getAttribute(PROCESSED_ATTR) === currentText) { return; }

    // Mark with current text so we can detect when YouTube updates the content
    segmentEl.setAttribute(PROCESSED_ATTR, currentText);
    segmentEl.innerHTML = "";

    var wsParts = currentText.split(/(\s+)/);
    var tokens = [];
    for (var p = 0; p < wsParts.length; p++) {
      var wsPart = wsParts[p];
      if (!wsPart) { continue; }
      if (/^\s+$/.test(wsPart)) {
        tokens.push(wsPart);
      } else {
        splitToken(wsPart, tokens);
      }
    }

    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];
      if (!token) { continue; }
      if (/^\s+$/.test(token)) {
        segmentEl.appendChild(document.createTextNode(token));
        continue;
      }
      var span = document.createElement("span");
      span.className = "ytst-word";
      span.textContent = token;
      segmentEl.appendChild(span);
    }
  }

  function processSubtitles() {
    // Select ALL segments - not just unprocessed ones.
    // wrapSegment() itself checks if re-processing is needed.
    var segments = document.querySelectorAll(".ytp-caption-segment");
    for (var i = 0; i < segments.length; i++) { wrapSegment(segments[i]); }
  }

  function scheduleProcess() {
    if (processTimer) { return; }
    processTimer = setTimeout(function() {
      processTimer = null;
      processSubtitles();
    }, PROCESS_DEBOUNCE_MS);
  }

  // ---------- Init ----------

  function init() {
    processSubtitles();

    var observer = new MutationObserver(function(mutations) {
      var needsProcess = false;
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        // Ignore mutations caused by our own tooltip
        if (m.target && m.target.id === "ytst-tooltip") { continue; }
        if (m.target && m.target.closest && m.target.closest("#ytst-tooltip")) { continue; }
        if (m.addedNodes.length > 0 || m.type === "characterData") {
          needsProcess = true;
          break;
        }
      }
      if (needsProcess) { scheduleProcess(); }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // Delegated word clicks + hide tooltip on click outside, scroll, or Escape
    document.addEventListener("click", function(evt) {
      var t = evt.target;
      var span = (t && t.closest) ? t.closest(".ytst-word") : null;
      if (span) {
        handleWordClick(evt, span);
        return;
      }
      if (tooltipEl && !tooltipEl.contains(t)) {
        hideTooltip();
      }
    });
    document.addEventListener("keydown", function(evt) {
      if (evt.key === "Escape") { hideTooltip(); }
    });
    document.addEventListener("scroll", hideTooltip, true);
    window.addEventListener("yt-navigate-start", hideTooltip);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
