// content.js - Firefox MV2, ASCII only, no async/await

(function () {
  var PROCESSED_ATTR = "data-ytst-processed";
  var tooltipEl = null;
  var currentRequestId = 0;

  // ---------- Tooltip ----------

  function ensureTooltip() {
    if (tooltipEl && document.body.contains(tooltipEl)) { return tooltipEl; }
    tooltipEl = document.createElement("div");
    tooltipEl.id = "ytst-tooltip";
    tooltipEl.className = "ytst-tooltip ytst-hidden";
    document.body.appendChild(tooltipEl);
    return tooltipEl;
  }

  function hideTooltip() {
    if (tooltipEl) { tooltipEl.classList.add("ytst-hidden"); }
  }

  function showTooltip(targetEl, text, isError) {
    var tooltip = ensureTooltip();
    tooltip.textContent = text;
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
  }

  // ---------- Word click ----------

  function cleanWord(raw) {
    return raw.replace(/^[^\w\u00C0-\u024F\u0400-\u04FF\u4E00-\u9FFF\u3040-\u30FF]+|[^\w\u00C0-\u024F\u0400-\u04FF\u4E00-\u9FFF\u3040-\u30FF]+$/g, "");
  }

  function handleWordClick(evt) {
    // Do NOT stopPropagation - let YouTube receive its own events
    evt.preventDefault();
    var span = evt.currentTarget;
    var word = cleanWord(span.textContent || "");
    if (!word) { return; }

    var myId = ++currentRequestId;
    showTooltip(span, "...", false);

    browser.runtime.sendMessage({ type: "TRANSLATE_WORD", text: word })
      .then(function(response) {
        if (myId !== currentRequestId) { return; }
        if (!response || !response.ok) {
          showTooltip(span, "Error: " + ((response && response.error) || "no response"), true);
          return;
        }
        showTooltip(span, response.translatedText || "(empty)", false);
      })
      .catch(function(err) {
        if (myId !== currentRequestId) { return; }
        showTooltip(span, "Error: " + (err.message || String(err)), true);
      });
  }

  // ---------- Segment wrapping ----------

  function getSegmentText(segmentEl) {
    // Collect text from direct text nodes and our own ytst-word spans only,
    // ignoring any other nested elements YouTube may add.
    var text = "";
    var nodes = segmentEl.childNodes;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.nodeType === 3) { // Text node
        text += n.nodeValue;
      } else if (n.nodeType === 1 && n.classList && n.classList.contains("ytst-word")) {
        text += n.textContent;
      } else if (n.nodeType === 1) {
        // Some YouTube span wrappers - grab their text too
        text += n.textContent;
      }
    }
    return text;
  }

  function wrapSegment(segmentEl) {
    var currentText = segmentEl.textContent;
    if (!currentText || !currentText.trim()) { return; }

    // If already processed with the same text - skip
    if (segmentEl.getAttribute(PROCESSED_ATTR) === currentText) { return; }

    // Mark with current text so we can detect when YouTube updates the content
    segmentEl.setAttribute(PROCESSED_ATTR, currentText);
    segmentEl.innerHTML = "";

    var parts = currentText.split(/(\s+)/);
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      if (!part) { continue; }
      if (/^\s+$/.test(part)) {
        segmentEl.appendChild(document.createTextNode(part));
        continue;
      }
      var span = document.createElement("span");
      span.className = "ytst-word";
      span.textContent = part;
      span.addEventListener("click", handleWordClick);
      segmentEl.appendChild(span);
    }
  }

  function processSubtitles() {
    // Select ALL segments - not just unprocessed ones.
    // wrapSegment() itself checks if re-processing is needed.
    var segments = document.querySelectorAll(".ytp-caption-segment");
    for (var i = 0; i < segments.length; i++) { wrapSegment(segments[i]); }
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
      if (needsProcess) { processSubtitles(); }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // Hide tooltip on click outside or scroll
    document.addEventListener("click", function(evt) {
      var t = evt.target;
      if (tooltipEl &&
          !tooltipEl.contains(t) &&
          !(t.classList && t.classList.contains("ytst-word"))) {
        hideTooltip();
      }
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
