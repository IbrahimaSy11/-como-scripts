// ==UserScript==
// @name         COMO - Early Task In Order With Timer & Batcher Dashboard
// @namespace    https://github.com/uny2-ops
// @version      18.0.0
// @description  Sorts tasks in order by earliest Batch Target + Time Left column + Batcher Timer Dashboard
// @author       Ibrahim
// @match        https://como-operations-dashboard-iad.iad.proxy.amazon.com/store/*/dash*
// @match        https://como-operations-dashboard-iad.iad.proxy.amazon.com/store/*/tasks*
// @match        https://como-operations-dashboard-iad.iad.proxy.amazon.com/store/*/jobs*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @connect      drive.corp.amazon.com
// ==/UserScript==

(function () {
  'use strict';

  var STORE_ID  = (window.location.href.split('store/')[1] || '').split('/')[0];
  var DRIVE_URL = 'https://drive.corp.amazon.com/view/jsermar@/COMO_Dashboard_BatchRate_NA.json?download=true';
  var COMO_BASE = 'https://como-operations-dashboard-iad.iad.proxy.amazon.com';

  /* ══════════════════════════════════════════
     STYLES
  ══════════════════════════════════════════ */
  var style = document.createElement('style');
  style.textContent = `
    .etf-timeleft {
      font-size: 22px; font-weight: 600;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      background: none !important; border: none !important;
      padding: 0 !important; border-radius: 0 !important; white-space: nowrap;
    }
    .etf-timeleft.overdue  { color: #f85149; font-weight: 700; }
    .etf-timeleft.critical { color: #e3b341; }
    .etf-timeleft.ok       { color: #3fb950; }
    .etf-col-header {
      font-size: 18px; font-weight: 400; color: #333;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      white-space: nowrap; text-align: center; width: 100%; display: block;
    }
    .etf-col-cell { display: flex; align-items: center; justify-content: center; text-align: center; }

    /* ── Dark mode ── */
    #cbt-panel.dark { background: #000 !important; border-color: #333 !important; color: #fff !important; }
    #cbt-panel.dark #cbt-header { background: #111 !important; border-bottom-color: #333 !important; }
    #cbt-panel.dark #cbt-title { color: #fff !important; }
    #cbt-panel.dark #cbt-controls span { color: #aaa !important; }
    #cbt-panel.dark #cbt-stats-bar { background: #111 !important; border-bottom-color: #333 !important; }
    #cbt-panel.dark #cbt-label-batchers { color: #ffffff !important; }
    #cbt-panel.dark #cbt-label-rec { color: #ffffff !important; }
    #cbt-panel.dark #cbt-label-remaining { color: #ffffff !important; }
    #cbt-panel.dark #cbt-stat-ip { color: #58a6ff !important; }
    #cbt-panel.dark #cbt-stat-rem { color: #58a6ff !important; }
    #cbt-panel.dark #cbt-tabs { background: #111 !important; border-bottom-color: #333 !important; }
    #cbt-panel.dark .cbt-tab { color: #aaa !important; }
    #cbt-panel.dark .cbt-tab.active { color: #58a6ff !important; border-bottom-color: #58a6ff !important; }
    #cbt-panel.dark #cbt-body { background: #000 !important; }
    #cbt-panel.dark #cbt-table th, #cbt-panel.dark #cbt-hist-table th, #cbt-panel.dark #cbt-weekly-table th { background: #000 !important; color: #fff !important; }
    #cbt-panel.dark #cbt-table td, #cbt-panel.dark #cbt-hist-table td, #cbt-panel.dark #cbt-weekly-table td { color: #e6edf3 !important; border-bottom-color: #222 !important; }
    #cbt-panel.dark #cbt-table tbody tr:hover td, #cbt-panel.dark #cbt-hist-table tbody tr:hover td, #cbt-panel.dark #cbt-weekly-table tbody tr:hover td { background: #111 !important; }
    #cbt-panel.dark .cbt-assoc { color: #e6edf3 !important; }
    #cbt-panel.dark .cbt-assoc:hover { color: #58a6ff !important; }
    #cbt-panel.dark .cbt-hist-meta { color: #e6edf3 !important; }
    #cbt-panel.dark .cbt-ws-val { color: #e6edf3 !important; }
    #cbt-panel.dark .cbt-ws-label { color: #aaa !important; }
    #cbt-panel.dark #cbt-search-input, #cbt-panel.dark #cbt-hist-search-input { background: #111 !important; border-color: #333 !important; color: #fff !important; }
    #cbt-panel.dark #cbt-updated { color: #555 !important; }
    #cbt-panel.dark #cbt-weekly-summary, #cbt-panel.dark #cbt-hist-summary { border-bottom-color: #333 !important; }
    #cbt-panel.dark #cbt-drag-bottom { background: #222 !important; }
    #cbt-panel.dark #cbt-drag-bottom:hover { background: #58a6ff !important; }

    #cbt-panel {
      width: 100%; background: #ffffff; border: 1px solid #c8c8c8;
      border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      color: #333; margin-bottom: 12px; overflow: hidden;
    }
    #cbt-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; background: #f5f5f5;
      border-bottom: 1px solid #ddd; border-radius: 4px 4px 0 0;
    }
    #cbt-title { font-weight: 700; font-size: 22px; color: #333; letter-spacing: 0.02em; }
    #cbt-controls { display: flex; gap: 12px; align-items: center; }
    #cbt-controls span { cursor: pointer; }
    #cbt-controls span:hover { opacity: 0.7; }
    #cbt-tabs {
      display: flex; justify-content: center;
      border-bottom: 1px solid #ddd; background: #f5f5f5;
    }
    .cbt-tab {
      flex: 1; text-align: center; padding: 8px 0; font-size: 22px;
      font-weight: 600; color: #888; cursor: pointer;
      text-transform: uppercase; letter-spacing: 0.06em;
    }
    .cbt-tab:hover { color: #333; }
    .cbt-tab.active { color: #0066cc; border-bottom: 2px solid #0066cc; }
    #cbt-body { padding: 6px 8px 8px; height: 270px; max-height: 270px; overflow-y: auto; background: #fff; }
    #cbt-table, #cbt-hist-table, #cbt-weekly-table { width: 100%; border-collapse: collapse; }
    #cbt-table thead tr, #cbt-hist-table thead tr, #cbt-weekly-table thead tr { border-bottom: 1px solid #ddd; }
    #cbt-table th, #cbt-hist-table th, #cbt-weekly-table th {
      color: #333; font-weight: 700; font-size: 16px; text-transform: uppercase;
      letter-spacing: 0.06em; padding: 5px 6px 7px; text-align: left; background: #fff;
    }
    #cbt-table th:not(:first-child), #cbt-hist-table th:not(:first-child),
    #cbt-weekly-table th:not(:first-child) { text-align: center; }
    #cbt-table td, #cbt-hist-table td, #cbt-weekly-table td {
      padding: 7px 6px; border-bottom: 1px solid #f0f0f0;
      vertical-align: middle; text-align: center; font-size: 22px; color: #333;
    }
    #cbt-table td:first-child, #cbt-hist-table td:first-child,
    #cbt-weekly-table td:first-child { text-align: left; }
    #cbt-table tbody tr:last-child td, #cbt-hist-table tbody tr:last-child td,
    #cbt-weekly-table tbody tr:last-child td { border-bottom: none; }
    #cbt-table tbody tr:hover td, #cbt-hist-table tbody tr:hover td,
    #cbt-weekly-table tbody tr:hover td { background: #f9f9f9; }
    .cbt-assoc { font-size: 22px; font-weight: 700; color: #333; cursor: pointer; }
    .cbt-assoc:hover { color: #0066cc; }
    .cbt-ref { display: block; font-size: 12px; color: #aaa; font-family: monospace; }
    .cbt-elapsed { font-family: "Courier New", monospace; font-size: 22px; font-weight: 700; color: #2a9d2a; }
    .cbt-elapsed.warn { color: #cc8800; } .cbt-elapsed.alert { color: #cc2200; }
    .cbt-rate { font-family: "Courier New", monospace; font-size: 22px; font-weight: 700; color: #2a9d2a; }
    .cbt-rate.warn { color: #cc8800; } .cbt-rate.alert { color: #cc2200; }
    .cbt-rate.pending { color: #aaa; font-style: italic; font-size: 22px; }
    .cbt-hist-rate { font-family: "Courier New", monospace; font-size: 22px; font-weight: 700; }
    .cbt-hist-rate.good { color: #2a9d2a; } .cbt-hist-rate.warn { color: #cc8800; } .cbt-hist-rate.alert { color: #cc2200; }
    .cbt-hist-meta { font-size: 22px; color: #333; }
    .cbt-rank { display: inline-block; width: 22px; height: 22px; line-height: 22px; border-radius: 50%;
      font-size: 13px; font-weight: 700; text-align: center; margin-right: 5px; background: #eee; color: #666; }
    .cbt-rank.gold { background: #b8860b; color: #fff; }
    .cbt-rank.silver { background: #888; color: #fff; }
    .cbt-rank.bronze { background: #cd7f32; color: #fff; }
    #cbt-empty, #cbt-hist-empty, #cbt-weekly-empty {
      display: none; text-align: center; color: #aaa; padding: 12px 0; font-style: italic; font-size: 14px;
    }
    #cbt-updated { text-align: right; color: #bbb; font-size: 13px; margin-top: 4px; }
    #cbt-weekly-summary, #cbt-hist-summary {
      display: flex; justify-content: space-around;
      padding: 8px 4px 10px; border-bottom: 1px solid #ddd; margin-bottom: 4px;
    }
    .cbt-ws-stat { text-align: center; }
    .cbt-ws-val { font-family: "Courier New", monospace; font-size: 22px; font-weight: 700; color: #333; display: block; }
    .cbt-ws-label { font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 0.07em; }
    #cbt-weekly-search, #cbt-hist-search { padding: 6px 4px 2px; text-align: center; }
    #cbt-search-input, #cbt-hist-search-input {
      width: 95%; padding: 6px 10px; background: #fff; border: 1px solid #ccc;
      border-radius: 6px; color: #333; font-size: 16px; outline: none;
    }
    #cbt-search-input:focus, #cbt-hist-search-input:focus { border-color: #0066cc; }
    .cbt-sortable, .cbt-sortable-live, .cbt-sortable-hist { cursor: pointer; user-select: none; }
    .cbt-sortable:hover, .cbt-sortable-live:hover, .cbt-sortable-hist:hover { color: #0066cc; }
    .cbt-miss-dot { margin-left: 4px; font-size: 16px; vertical-align: middle; }
    .cbt-miss-dot.warn { color: #cc8800; } .cbt-miss-dot.alert { color: #cc2200; }

    /* Drag handle at bottom */
    #cbt-drag-bottom {
      width: 100%; height: 8px; background: #e0e0e0;
      cursor: ns-resize; border-radius: 0 0 4px 4px; transition: background 0.2s;
      user-select: none;
    }
    #cbt-drag-bottom:hover { background: #0066cc; }
  `;

  /* ══════════════════════════════════════════
     PART 1 — EARLIEST TASK SORTING
  ══════════════════════════════════════════ */
  var _sorting = false, _sortObserver = null, _attached = null;

  /* ── Get the store's timezone from the dashboard header ── */
  function getStoreTimezone() {
    // The dashboard shows timezone in the top right e.g. "America/New_York"
    var tzEl = document.querySelector('[class*="timezone"], [class*="time-zone"], .store-time, .current-time');
    if (tzEl) {
      var match = tzEl.textContent.match(/([A-Za-z]+\/[A-Za-z_]+)/);
      if (match) return match[1];
    }
    // Fallback: read from the page text
    var bodyText = document.body ? document.body.innerHTML : '';
    var tzMatch = bodyText.match(/America\/[A-Za-z_]+/);
    if (tzMatch) return tzMatch[0];
    // Default to New York if nothing found
    return 'America/New_York';
  }

  function parseTime(raw) {
    if (!raw) return null;
    var str = raw.replace(/[^\d:APMapm\s]/g, '').trim();
    var m = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!m) return null;
    var h = parseInt(m[1], 10), mn = parseInt(m[2], 10);
    var ap = m[3] ? m[3].toUpperCase() : null;
    if (ap === 'PM' && h < 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;

    // Use the store's timezone so times are always correct regardless of browser location
    try {
      var tz = getStoreTimezone();
      var now = new Date();
      // Get today's date string in the store's timezone
      var dateStr = now.toLocaleDateString('en-CA', { timeZone: tz }); // YYYY-MM-DD format
      // Build a full datetime string in that timezone
      var fullStr = dateStr + 'T' + String(h).padStart(2,'0') + ':' + String(mn).padStart(2,'0') + ':00';
      // Parse it as if it's in the store timezone
      var storeDate = new Date(new Date(fullStr).toLocaleString('en-US', { timeZone: tz }));
      // Convert back to UTC ms
      var result = new Date(fullStr + ' ' + Intl.DateTimeFormat('en-US', {
        timeZone: tz, timeZoneName: 'short'
      }).formatToParts(now).find(function(p){ return p.type === 'timeZoneName'; }).value).getTime();
      if (isNaN(result)) throw new Error('fallback');
      if (result > Date.now() + 8 * 3600000) result -= 86400000;
      return result;
    } catch(e) {
      // Fallback to simple local time parsing
      var d = new Date(); d.setHours(h, mn, 0, 0);
      if (d.getTime() > Date.now() + 8 * 3600000) d.setDate(d.getDate() - 1);
      return d.getTime();
    }
  }

  function getBatchTarget(card) {
    var text = card.innerText || card.textContent || '';
    var matches = text.match(/\b(\d{1,2}:\d{2}\s*(?:AM|PM))\b/gi);
    if (!matches) return null;
    var times = matches.map(parseTime).filter(Boolean);
    return times.length ? Math.min.apply(null, times) : null;
  }

  function sortNow(container) {
    if (_sorting) return;
    var cards = Array.from(container.querySelectorAll(':scope > job-card'));
    if (cards.length < 2) return;
    var data = cards.map(function (card) { return { card: card, btMs: getBatchTarget(card) }; });
    data.sort(function (a, b) {
      var hasA = a.btMs != null, hasB = b.btMs != null;
      if (hasA && hasB) return a.btMs - b.btMs;
      if (hasA) return -1; if (hasB) return 1; return 0;
    });
    var current = Array.from(container.querySelectorAll(':scope > job-card'));
    if (data.every(function (item, i) { return item.card === current[i]; })) return;
    _sorting = true;
    var frag = document.createDocumentFragment();
    data.forEach(function (item) { frag.appendChild(item.card); });
    container.appendChild(frag);
    _sorting = false;
  }

  function attach(container) {
    if (_attached === container) return;
    if (_sortObserver) _sortObserver.disconnect();
    _attached = container;
    sortNow(container);
    _sortObserver = new MutationObserver(function (mutations) {
      if (_sorting) return;
      for (var i = 0; i < mutations.length; i++) {
        if (mutations[i].type === 'childList') { sortNow(container); return; }
      }
    });
    _sortObserver.observe(container, { childList: true });
  }

  function getContainer() {
    var c = document.querySelector('div.container-fluid.job-cards');
    if (c) return c;
    var first = document.querySelector('job-card');
    return first ? first.parentElement : null;
  }

  var bodyWatcher = new MutationObserver(function () {
    var c = getContainer(); if (c) attach(c);
  });
  bodyWatcher.observe(document.documentElement, { childList: true, subtree: true });
  var c = getContainer(); if (c) attach(c);

  /* ══════════════════════════════════════════
     PART 2 — TIME LEFT COLUMN
  ══════════════════════════════════════════ */
  function fmtTimeLeft(targetMs) {
    var diffMs  = targetMs - Date.now();
    var diffMin = Math.floor(Math.abs(diffMs) / 60000);
    var diffSec = Math.floor((Math.abs(diffMs) % 60000) / 1000);
    if (diffMs < 0) return { text: 'Overdue ' + diffMin + 'm', cls: 'overdue' };
    if (diffMin < 10) return { text: diffMin + ':' + String(diffSec).padStart(2,'0') + ' left', cls: 'critical' };
    return { text: diffMin + ' min left', cls: 'ok' };
  }

  function findBatchTargetCol(row) {
    var cols = row.querySelectorAll(':scope > div[class*="col-"]');
    for (var i = 0; i < cols.length; i++) {
      if (/\d{1,2}:\d{2}\s*(AM|PM)/i.test(cols[i].textContent) ||
          /batch\s*target/i.test(cols[i].textContent)) {
        return { col: cols[i], idx: i };
      }
    }
    return null;
  }

  function injectRowTimer(row) {
    if (row.querySelector('.etf-col-cell')) return;
    var isHeader = row.classList.contains('job-card-header');
    var found = findBatchTargetCol(row);
    if (!found) return;
    var btCol  = found.col;
    var newCol = document.createElement('div');
    newCol.className = 'col-lg-2 etf-col-cell';
    newCol.style.cssText = 'padding-left:5px;padding-right:5px;';
    if (isHeader) {
      newCol.innerHTML = '<span class="etf-col-header">\u23F1 Time Left</span>';
    } else {
      var btRaw = btCol.textContent.replace(/[^\d:APMapm\s]/g, '').trim();
      var m2 = btRaw.match(/\d{1,2}:\d{2}\s*(?:AM|PM)/i);
      var btMs = m2 ? parseTime(m2[0]) : null;
      if (btMs) {
        var result = fmtTimeLeft(btMs);
        newCol.innerHTML = '<span class="etf-timeleft ' + result.cls + '" data-target="' + btMs + '">' + result.text + '</span>';
      } else {
        newCol.innerHTML = '<span class="etf-timeleft ok">\u2014</span>';
      }
    }
    btCol.parentNode.insertBefore(newCol, btCol.nextSibling);
  }

  /* ── Check if an element is inside Partially Batched or Staged for Pickup ── */
  function isInExcludedSection(el) {
    var node = el;
    while (node && node !== document.body) {
      // Check siblings and parent text for section headings
      var prev = node.previousElementSibling;
      while (prev) {
        if (/partially\s*batched|staged\s*for\s*pickup/i.test(prev.textContent || '')) return true;
        prev = prev.previousElementSibling;
      }
      // Check parent's previous siblings
      if (node.parentElement) {
        var parentPrev = node.parentElement.previousElementSibling;
        if (parentPrev && /partially\s*batched|staged\s*for\s*pickup/i.test(parentPrev.textContent || '')) return true;
      }
      node = node.parentElement;
    }
    return false;
  }

  function injectAllTimers() {
    // First remove any Time Left columns already injected in excluded sections
    document.querySelectorAll('div.row.job-card-header, job-card').forEach(function(el) {
      if (isInExcludedSection(el)) {
        el.querySelectorAll('.etf-col-cell').forEach(function(col) { col.remove(); });
      }
    });

    document.querySelectorAll('div.row.job-card-header').forEach(function(row) {
      if (isInExcludedSection(row)) return;
      injectRowTimer(row);
    });
    document.querySelectorAll('job-card').forEach(function (card) {
      if (isInExcludedSection(card)) return;
      var row = card.querySelector('div.row');
      if (row) injectRowTimer(row);
    });
  }

  function tickTimers() {
    document.querySelectorAll('.etf-timeleft[data-target]').forEach(function (el) {
      var targetMs = parseInt(el.dataset.target, 10);
      if (!targetMs) return;
      var result = fmtTimeLeft(targetMs);
      el.textContent = result.text;
      el.className = 'etf-timeleft ' + result.cls;
    });
  }

  var timerWatcher = new MutationObserver(function () { injectAllTimers(); });

  /* ══════════════════════════════════════════
     PART 3 — BATCHERS + REMAINING PACKAGES
  ══════════════════════════════════════════ */
  var batchRateCache = 120; // 2.0 bags/min per batcher = 120 bags/hour (conservative fallback)

  function updateStats(inProgress, remaining, recommended, dotColor) {
    var elIP  = document.getElementById('cbt-stat-ip');
    var elRem = document.getElementById('cbt-stat-rem');
    var elRec = document.getElementById('cbt-stat-rec');
    var elDot = document.getElementById('cbt-stat-dot');
    if (elIP)  elIP.textContent  = inProgress;
    if (elRem) elRem.textContent = remaining;
    if (elRec) elRec.textContent = recommended != null ? recommended : '—';
    if (elDot && dotColor) { elDot.style.background = dotColor; elDot.style.boxShadow = '0 0 6px ' + dotColor; }
    // Remove any old Problem Solve injection
    var old = document.getElementById('etf-ps-stats');
    if (old) old.remove();
  }

  function removeFromHeader() {
    var h1 = document.querySelector("h1[data-dtk-test-id='job-grid-title']");
    if (!h1) return;
    var old = h1.querySelector('#etf-stats');
    if (old) old.remove();
  }

  function fetchAndUpdate() {
    removeFromHeader();
    fetch(COMO_BASE + '/api/store/' + STORE_ID + '/activeJobSummary')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var inProgress = data.filter(function (j) { return j.operationState === 'IN_PROGRESS'; }).length;
        var activeJobs = data.filter(function (j) {
          return j.operationState === 'IN_PROGRESS' || j.operationState === 'NONE';
        });
        var expected  = activeJobs.reduce(function (s, j) { return s + (Number(j.totalExpectedPackages) || 0); }, 0);
        var batched   = activeJobs.reduce(function (s, j) { return s + (Number(j.packagesBatched) || 0); }, 0);
        var collected = activeJobs.reduce(function (s, j) { return s + (Number(j.packagesCollected) || 0); }, 0);
        var remaining = expected - (batched + collected);

        var latestTarget = Math.max.apply(null,
          data.filter(function(j){ return j.destinationType !== 'UNPACK'; })
              .map(function(j){ return Number(j.jobBatchTarget); })
              .filter(function(t){ return t > 0; })
        );
        var nowEpoch = Date.now() / 1000;
        var timeRemaining = (latestTarget - nowEpoch) / 3600;
        var remainingPackages = remaining;
        var timeLossHours = (45 * activeJobs.length) / 3600;
        var adjustedTimeRemaining = timeRemaining - timeLossHours;

        // Calculate actual avg rate from live batchers in taskCache
        var liveRates = [];
        taskCache.forEach(function(d) {
          if (d.state === 'BATCHING') {
            var r = computeRow(d);
            if (r.scanRate && r.scanRate > 0) liveRates.push(r.scanRate);
          }
        });
        // avgRate in bags/min → convert to bags/hour for formula
        var avgRatePerBatcher = liveRates.length > 0
          ? (liveRates.reduce(function(s,r){return s+r;},0) / liveRates.length) * 60
          : batchRateCache;

        var recommended = Math.ceil(remainingPackages / (avgRatePerBatcher * adjustedTimeRemaining));
        if (recommended < 0 || isNaN(recommended)) recommended = 0;
        if (recommended > 38) recommended = 38;

        var dotColor = 'gray';
        if (recommended >= 38)               dotColor = '#f85149';
        else if (inProgress === recommended) dotColor = '#3fb950';
        else if (inProgress < recommended)   dotColor = '#e3b341';
        else                                 dotColor = '#f85149';

        updateStats(inProgress, remaining, recommended, dotColor);
        removeFromHeader();
      }).catch(function () {});
  }

  /* ══════════════════════════════════════════
     PART 4 — BATCHER TIMER PANEL
  ══════════════════════════════════════════ */
  var POLL_MS = 2000, TICK_MS = 500;
  var WARN_ELAPSED_MIN = 15, ALERT_ELAPSED_MIN = 25;
  var WARN_RATE = 2.1, ALERT_RATE = 1.5;
  var STORAGE_KEY = 'cbt_history', DATE_KEY = 'cbt_history_date';
  var WEEKLY_KEY = 'cbt_weekly_history', WEEKLY_DAYS = 7;
  var taskCache = new Map();
  var activeTab = 'live';
  var weeklySortKey = 'avgRate', weeklySortAsc = false, weeklySearchTerm = '';
  var liveSortKey = 'rate', liveSortAsc = false;
  var historySortKey = 'avgRate', historySortAsc = false, historySearchTerm = '';

  function todayStr() { return new Date().toLocaleDateString('en-US'); }
  function fmt(s) {
    if (s == null || isNaN(s) || s < 0) return '--:--';
    return String(Math.floor(s / 60)).padStart(2,'0') + ':' + String(Math.floor(s % 60)).padStart(2,'0');
  }
  function fmtHours(s) {
    if (!s) return '0h';
    var h = s / 3600;
    return h >= 1 ? h.toFixed(1) + 'h' : Math.round(s / 60) + 'm';
  }

  function loadWeekly() { try { return JSON.parse(localStorage.getItem(WEEKLY_KEY) || '{}'); } catch(e) { return {}; } }
  function saveWeekly(w) { try { localStorage.setItem(WEEKLY_KEY, JSON.stringify(w)); } catch(e) {} }

  function pruneWeeklyOlderThan(days) {
    var w = loadWeekly();
    var cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days); cutoff.setHours(0,0,0,0);
    var changed = false;
    for (var dk of Object.keys(w)) { if (new Date(dk) < cutoff) { delete w[dk]; changed = true; } }
    if (changed) saveWeekly(w);
    return w;
  }

  function rollDailyIntoWeekly() {
    try {
      var sd = localStorage.getItem(DATE_KEY); if (!sd) return;
      var daily = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (!Object.keys(daily).length) return;
      var w = loadWeekly(); if (!w[sd]) w[sd] = {};
      for (var a of Object.keys(daily)) {
        var d2 = daily[a];
        w[sd][a] = { totalPkgs: d2.totalPkgs, totalSec: d2.totalSec, runs: d2.runs,
          avgRate: d2.avgRate, totalMissing: d2.totalMissing||0, totalExpected: d2.totalExpected||0 };
      }
      saveWeekly(w);
    } catch(e) {}
  }

  function loadHistory() {
    try {
      var sd = localStorage.getItem(DATE_KEY);
      if (sd !== todayStr()) { rollDailyIntoWeekly(); localStorage.removeItem(STORAGE_KEY); localStorage.setItem(DATE_KEY, todayStr()); return {}; }
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch(e) { return {}; }
  }

  function saveHistory(h) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(h)); localStorage.setItem(DATE_KEY, todayStr()); } catch(e) {} }

  function computeRow(data) {
    var op = (data.operationDetails||[]).find(function(o){return o.name==='BATCHING';});
    var startMs = op&&op.start ? op.start*1000 : data.created ? data.created*1000 : null;
    var inProg = (op&&op.state==='IN_PROGRESS')||data.state==='BATCHING';
    var batchedN = data.packagesBatched||0;
    var elapsedSec = startMs ? (Date.now()-startMs)/1000 : null;
    var scanRate = (batchedN>0&&elapsedSec>30) ? batchedN/(elapsedSec/60) : null;
    return { startMs:startMs, elapsedSec:elapsedSec, scanRate:scanRate, inProgress:inProg };
  }

  function recordCompletedBatch(data, elapsedSec) {
    if (!data.associateId&&!data.associate) return;
    var pkgs = data.packagesBatched||0;
    if (pkgs===0||!elapsedSec||elapsedSec<30) return;
    var assoc = data.associateId||data.associate;
    var rate = pkgs/(elapsedSec/60);
    var expected = data.totalExpectedPackages||0;
    var collected = data.packagesCollected||data.packagesBatched||0;
    var missing = expected>collected ? expected-collected : 0;
    var history = loadHistory();
    if (history[assoc]) {
      var e2=history[assoc], tp=e2.totalPkgs+pkgs, ts=e2.totalSec+elapsedSec;
      history[assoc] = { assoc:assoc, totalPkgs:tp, totalSec:ts, runs:e2.runs+1,
        avgRate:tp/(ts/60), lastRate:rate, totalMissing:(e2.totalMissing||0)+missing, totalExpected:(e2.totalExpected||0)+expected };
    } else {
      history[assoc] = { assoc:assoc, totalPkgs:pkgs, totalSec:elapsedSec, runs:1,
        avgRate:rate, lastRate:rate, totalMissing:missing, totalExpected:expected };
    }
    saveHistory(history);
    if (activeTab==='history') renderHistory();
  }

  function ingestItem(item) {
    if (!item||typeof item!=='object') return false;
    var ref = item.shortClientRef; if (!ref) return false;
    var existing = taskCache.get(ref);
    if (existing&&existing.state==='BATCHING'&&item.state!=='BATCHING'&&item.state!==undefined) {
      existing._recording=true; taskCache.set(ref,existing);
      var merged=Object.assign({},existing,item), r=computeRow(merged);
      recordCompletedBatch(merged,r.elapsedSec); taskCache.delete(ref); return true;
    }
    if (item.state!=='BATCHING'&&item.operationState!=='IN_PROGRESS') return false;
    taskCache.set(ref,item); return true;
  }

  function ingestData(d) {
    if (!d) return; var changed=false;
    if (Array.isArray(d)) { d.forEach(function(i){if(ingestItem(i))changed=true;}); }
    else if (d.shortClientRef) { if(ingestItem(d))changed=true; }
    else { for(var k of ['summaries','tasks','results','items','jobs','data']) { if(Array.isArray(d[k])){d[k].forEach(function(i){if(ingestItem(i))changed=true;});if(changed)break;}}}
    if (changed) renderLive();
  }

  var _origFetch = window.fetch;
  window.fetch = async function() {
    var resp; try { resp = await _origFetch.apply(this,arguments); } catch(e){throw e;}
    try { if((resp.headers.get('content-type')||'').includes('json')){resp.clone().json().then(function(d){ingestData(d);}).catch(function(){});} } catch(e){}
    return resp;
  };
  var _xhrOpen=XMLHttpRequest.prototype.open, _xhrSend=XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open=function(m,url){this._cbtUrl=url;return _xhrOpen.apply(this,arguments);};
  XMLHttpRequest.prototype.send=function(){
    this.addEventListener('load',function(){try{if(!(this.getResponseHeader('content-type')||'').includes('json'))return;ingestData(JSON.parse(this.responseText));}catch(e){}});
    return _xhrSend.apply(this,arguments);
  };

  async function pollActiveTasks() {
    try {
      var res = await _origFetch(COMO_BASE+'/store/'+STORE_ID+'/activeJobsWithSiteSummary',{credentials:'include',headers:{Accept:'application/json'}});
      if(res.ok) ingestData(await res.json());
    } catch(e){}
    for(var entry of taskCache.entries()){
      var data=entry[1]; if(!data.jobId) continue;
      try{var r2=await _origFetch(COMO_BASE+'/store/'+STORE_ID+'/task/'+encodeURIComponent(data.jobId),{credentials:'include',headers:{Accept:'application/json'}});if(r2.ok)ingestData(await r2.json());}catch(e){}
    }
    renderLive();
  }

  /* ── Build panel DOM ── */
  function buildPanel() {
    var panel2 = document.createElement('div');
    panel2.id = 'cbt-panel';
    panel2.innerHTML =
      '<div id="cbt-header">' +
        '<span id="cbt-title">\u23F1 Batcher Timers</span>' +
        '<div id="cbt-controls">' +
          '<span id="cbt-collapse-btn" title="Collapse/Expand" style="font-size:22px;cursor:pointer;">🔼</span>' +
          '<span id="cbt-theme-btn" title="Toggle Dark/Light" style="font-size:22px;cursor:pointer;">🌙</span>' +
          '<span id="cbt-reset-size" title="Reset Size" style="font-size:22px;">↕️</span>' +
        '</div>' +
      '</div>' +
      '<div id="cbt-stats-bar" style="display:flex;justify-content:space-around;padding:8px 10px;border-bottom:1px solid #ddd;background:#fafafa;">' +
        '<div style="text-align:center;">' +
          '<span style="font-size:22px;">\uD83E\uDDBA</span>' +
          '<span id="cbt-label-batchers" style="font-size:26px;font-weight:700;color:#333;margin-left:5px;">Batchers: <b id="cbt-stat-ip" style="color:#0066cc;">—</b></span>' +
        '</div>' +
        '<div style="text-align:center;">' +
          '<span style="font-size:22px;">\uD83D\uDCCA</span>' +
          '<span id="cbt-label-rec" style="font-size:26px;font-weight:700;color:#333;margin-left:5px;">Recommended: <b id="cbt-stat-rec" style="color:#0066cc;">—</b>' +
          '<span id="cbt-stat-dot" style="display:inline-block;width:16px;height:16px;border-radius:50%;background:gray;box-shadow:0 0 6px gray;vertical-align:middle;margin-left:8px;"></span></b></span>' +
        '</div>' +
        '<div style="text-align:center;">' +
          '<span style="font-size:22px;">\uD83D\uDCE6</span>' +
          '<span id="cbt-label-remaining" style="font-size:26px;font-weight:700;color:#333;margin-left:5px;">Remaining: <b id="cbt-stat-rem" style="color:#0066cc;">—</b></span>' +
        '</div>' +
      '</div>' +
      '<div id="cbt-tabs">' +
        '<span class="cbt-tab active" data-tab="live">Live</span>' +
        '<span class="cbt-tab" data-tab="history">Today</span>' +
        '<span class="cbt-tab" data-tab="weekly">Weekly</span>' +
      '</div>' +
      '<div id="cbt-body">' +
        '<div id="cbt-live-view">' +
          '<table id="cbt-table"><thead><tr>' +
            '<th class="cbt-sortable-live" data-sort="assoc">Associate</th>' +
            '<th class="cbt-sortable-live" data-sort="elapsed">Elapsed</th>' +
            '<th class="cbt-sortable-live" data-sort="rate">Bags/min \u25BC</th>' +
          '</tr></thead><tbody id="cbt-tbody"></tbody></table>' +
          '<div id="cbt-empty">No active batching tasks</div>' +
          '<div id="cbt-updated"></div>' +
        '</div>' +
        '<div id="cbt-history-view" style="display:none">' +
          '<div id="cbt-hist-search"><input id="cbt-hist-search-input" type="text" placeholder="Search associate..."/></div>' +
          '<div id="cbt-hist-summary"></div>' +
          '<table id="cbt-hist-table"><thead><tr>' +
            '<th class="cbt-sortable-hist" data-sort="assoc">Associate</th>' +
            '<th class="cbt-sortable-hist" data-sort="runs">Runs</th>' +
            '<th class="cbt-sortable-hist" data-sort="pkgs">Pkgs</th>' +
            '<th class="cbt-sortable-hist" data-sort="avgRate">Avg Rate \u25BC</th>' +
          '</tr></thead><tbody id="cbt-hist-tbody"></tbody></table>' +
          '<div id="cbt-hist-empty">No history yet today</div>' +
        '</div>' +
        '<div id="cbt-weekly-view" style="display:none">' +
          '<div id="cbt-weekly-search"><input id="cbt-search-input" type="text" placeholder="Search associate..."/></div>' +
          '<div id="cbt-weekly-summary"></div>' +
          '<table id="cbt-weekly-table"><thead><tr>' +
            '<th class="cbt-sortable" data-sort="assoc">Associate</th>' +
            '<th class="cbt-sortable" data-sort="days">Days</th>' +
            '<th class="cbt-sortable" data-sort="runs">Runs</th>' +
            '<th class="cbt-sortable" data-sort="pkgs">Pkgs</th>' +
            '<th class="cbt-sortable" data-sort="avgRate">Avg Rate \u25BC</th>' +
            '<th class="cbt-sortable" data-sort="hrs">Hrs</th>' +
          '</tr></thead><tbody id="cbt-weekly-tbody"></tbody></table>' +
          '<div id="cbt-weekly-empty">No weekly data yet</div>' +
        '</div>' +
      '</div>' +
      '<div id="cbt-drag-bottom" title="Drag to resize"></div>';
    return panel2;
  }

  /* ── Inject panel above Utilization ── */
  var _panel2Ref = null;

  function injectPanel() {
    if (document.getElementById('cbt-panel')) return;
    var utilEl = document.querySelector('utilization.dashboard-utilization');
    if (!utilEl) utilEl = document.querySelector('utilization');
    if (!utilEl) return;

    // Build panel only ONCE then reuse same DOM node
    if (!_panel2Ref) {
      _panel2Ref = buildPanel();
      attachPanelEvents(_panel2Ref);
    }

    // Restore saved height
    try {
      var savedH = localStorage.getItem('cbt_body_h');
      var body0  = _panel2Ref.querySelector('#cbt-body');
      var tabs0  = _panel2Ref.querySelector('#cbt-tabs');
      if (savedH && body0) {
        var h0 = parseFloat(savedH);
        body0.style.height    = h0 + 'px';
        body0.style.maxHeight = h0 + 'px';
        if (tabs0) tabs0.style.display = h0 === 0 ? 'none' : '';
      }
    } catch(ex) {}

    // Re-insert same panel element preserving all data and size
    utilEl.parentNode.insertBefore(_panel2Ref, utilEl);

    // Render cached data immediately
    renderLive();
    renderHistory();
    renderWeekly();
  }

  function attachPanelEvents(panel2) {
    /* ── Tab switching ── */
    panel2.querySelectorAll('.cbt-tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        panel2.querySelectorAll('.cbt-tab').forEach(function(t){t.classList.remove('active');});
        tab.classList.add('active');
        activeTab = tab.dataset.tab;
        document.getElementById('cbt-live-view').style.display    = activeTab==='live'    ? '' : 'none';
        document.getElementById('cbt-history-view').style.display = activeTab==='history' ? '' : 'none';
        document.getElementById('cbt-weekly-view').style.display  = activeTab==='weekly'  ? '' : 'none';
        if (activeTab==='history') renderHistory();
        if (activeTab==='weekly')  renderWeekly();
      });
    });

    /* ── Collapse / Expand button ── */
    var isCollapsed = false;
    var collapseBtn = panel2.querySelector('#cbt-collapse-btn');
    collapseBtn.addEventListener('click', function() {
      var body = panel2.querySelector('#cbt-body');
      var tabs = panel2.querySelector('#cbt-tabs');
      var drag = panel2.querySelector('#cbt-drag-bottom');
      isCollapsed = !isCollapsed;
      if (isCollapsed) {
        // Collapse — hide body, tabs and drag handle
        if (body) { body.style.display = 'none'; }
        if (tabs) { tabs.style.display = 'none'; }
        if (drag) { drag.style.display = 'none'; }
        collapseBtn.textContent = '🔽';
      } else {
        // Expand — show everything back
        if (body) { body.style.display = ''; }
        if (tabs) { tabs.style.display = ''; }
        if (drag) { drag.style.display = ''; }
        collapseBtn.textContent = '🔼';
      }
    });

    /* ── Dark/Light theme toggle ── */
    var isDark = localStorage.getItem('cbt_dark') !== 'false'; // default is dark/black
    var themeBtn = panel2.querySelector('#cbt-theme-btn');
    function applyTheme() {
      if (isDark) {
        panel2.classList.add('dark');
        themeBtn.textContent = '☀️';
      } else {
        panel2.classList.remove('dark');
        themeBtn.textContent = '🌙';
      }
    }
    applyTheme();
    themeBtn.addEventListener('click', function() {
      isDark = !isDark;
      try { localStorage.setItem('cbt_dark', isDark); } catch(e) {}
      applyTheme();
    });

    /* ── Reset size ── */
    panel2.querySelector('#cbt-reset-size').addEventListener('click', function() {
      var body = panel2.querySelector('#cbt-body');
      var tabs = panel2.querySelector('#cbt-tabs');
      var drag = panel2.querySelector('#cbt-drag-bottom');
      if (!body) return;
      // Un-collapse first
      isCollapsed = false;
      collapseBtn.textContent = '🔼';
      if (body) { body.style.display = ''; }
      if (tabs) { tabs.style.display = ''; }
      if (drag) { drag.style.display = ''; }
      // Reset height
      body.style.height = '270px';
      body.style.maxHeight = '270px';
      try { localStorage.removeItem('cbt_body_h'); } catch(ex) {}
    });

    /* ── DRAG to resize (up and down) ── */
    var isDragging = false, dragStartY = 0, dragStartH = 270;

    panel2.querySelector('#cbt-drag-bottom').addEventListener('mousedown', function(e) {
      isDragging = true;
      dragStartY = e.clientY;
      var body = panel2.querySelector('#cbt-body');
      dragStartH = body ? body.offsetHeight : 185;
      e.preventDefault();
      e.stopPropagation();
    });

    document.addEventListener('mousemove', function(e) {
      if (!isDragging) return;
      var body = panel2.querySelector('#cbt-body');
      var tabs = panel2.querySelector('#cbt-tabs');
      if (!body) return;
      var newH = Math.max(0, dragStartH + (e.clientY - dragStartY));
      body.style.height = newH + 'px';
      body.style.maxHeight = newH + 'px';
      // Hide tabs when fully collapsed so only header + stats bar show
      if (tabs) tabs.style.display = newH === 0 ? 'none' : '';
      try { localStorage.setItem('cbt_body_h', newH); } catch(ex) {}
    });

    document.addEventListener('mouseup', function() { isDragging = false; });

    /* ── Restore saved height ── */
    try {
      var savedH = localStorage.getItem('cbt_body_h');
      if (savedH) {
        var body = panel2.querySelector('#cbt-body');
        var tabs = panel2.querySelector('#cbt-tabs');
        var h = parseFloat(savedH);
        if (body) { body.style.height = h + 'px'; body.style.maxHeight = h + 'px'; }
        if (tabs) tabs.style.display = h === 0 ? 'none' : '';
      }
    } catch(ex) {}

    /* ── Click associate name to copy ── */
    document.addEventListener('click', function(e) {
      var el = e.target.closest('.cbt-assoc');
      if (!el || !panel2.contains(el)) return;
      var text = el.textContent.replace(/^\d+\s*/, '').replace(/[●•]/g, '').trim();
      navigator.clipboard.writeText(text).then(function() {
        var prev = el.style.color;
        el.style.color = '#2a9d2a';
        setTimeout(function() { el.style.color = prev; }, 600);
      });
    });

    /* ── Search ── */
    document.addEventListener('input', function(e) {
      if (e.target.id==='cbt-search-input') { weeklySearchTerm=e.target.value; renderWeekly(); }
      if (e.target.id==='cbt-hist-search-input') { historySearchTerm=e.target.value; renderHistory(); }
    });

    /* ── Sort ── */
    document.addEventListener('click', function(e) {
      var th = e.target.closest('.cbt-sortable');
      if (th && document.getElementById('cbt-weekly-table') && document.getElementById('cbt-weekly-table').contains(th)) {
        var key=th.dataset.sort;
        if(weeklySortKey===key){weeklySortAsc=!weeklySortAsc;}else{weeklySortKey=key;weeklySortAsc=false;}
        renderWeekly();
      }
      th = e.target.closest('.cbt-sortable-live');
      if (th && document.getElementById('cbt-table') && document.getElementById('cbt-table').contains(th)) {
        var key2=th.dataset.sort;
        if(liveSortKey===key2){liveSortAsc=!liveSortAsc;}else{liveSortKey=key2;liveSortAsc=false;}
        renderLive();
      }
      th = e.target.closest('.cbt-sortable-hist');
      if (th && document.getElementById('cbt-hist-table') && document.getElementById('cbt-hist-table').contains(th)) {
        var key3=th.dataset.sort;
        if(historySortKey===key3){historySortAsc=!historySortAsc;}else{historySortKey=key3;historySortAsc=false;}
        renderHistory();
      }
    });
  }

  /* ── Render Live ── */
  function renderLive() {
    var tbody=document.querySelector('#cbt-tbody'), empty=document.querySelector('#cbt-empty');
    if (!tbody||!empty) return;
    var rows=[]; taskCache.forEach(function(d){if(d.state==='BATCHING')rows.push(d);});
    rows.sort(function(a,b){
      var ra=computeRow(a),rb=computeRow(b),va,vb;
      if(liveSortKey==='assoc'){va=(a.associateId||a.associate||'').toLowerCase();vb=(b.associateId||b.associate||'').toLowerCase();return liveSortAsc?va.localeCompare(vb):vb.localeCompare(va);}
      else if(liveSortKey==='rate'){va=ra.scanRate||0;vb=rb.scanRate||0;}
      else{va=ra.elapsedSec||0;vb=rb.elapsedSec||0;}
      return liveSortAsc?va-vb:vb-va;
    });
    if(rows.length===0){tbody.innerHTML='';empty.style.display='block';return;}
    empty.style.display='none';
    var html='';
    for(var i=0;i<rows.length;i++){
      var data=rows[i],assoc=data.associateId||data.associate||data.shortClientRef,shortRef=data.shortClientRef,r=computeRow(data);
      var elMin=r.elapsedSec!=null?r.elapsedSec/60:0;
      var elCls=r.elapsedSec!=null?(elMin>=ALERT_ELAPSED_MIN?'alert':elMin>=WARN_ELAPSED_MIN?'warn':''):'';
      var elTxt=r.elapsedSec!=null?fmt(r.elapsedSec):'--:--';
      var rateCls=r.scanRate!=null?(r.scanRate<ALERT_RATE?'alert':r.scanRate<WARN_RATE?'warn':''):'pending';
      var rateTxt=r.scanRate!=null?r.scanRate.toFixed(1):'\u2014';
      html+='<tr><td><span class="cbt-assoc">'+assoc+'</span><span class="cbt-ref">'+shortRef+'</span></td>';
      html+='<td><span class="cbt-elapsed '+elCls+'" data-start="'+(r.startMs||'')+'" data-live="'+(r.inProgress?'1':'0')+'">'+elTxt+'</span></td>';
      html+='<td><span class="cbt-rate '+rateCls+'">'+rateTxt+'</span></td></tr>';
    }
    tbody.innerHTML=html;
    var upd=document.querySelector('#cbt-updated');
    if(upd) upd.textContent='updated '+new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  }

  /* ── Render History ── */
  function renderHistory() {
    var tbody=document.querySelector('#cbt-hist-tbody'),empty=document.querySelector('#cbt-hist-empty'),summary=document.querySelector('#cbt-hist-summary');
    if(!tbody||!empty) return;
    var history=loadHistory(),entries=Object.values(history);
    if(entries.length===0){tbody.innerHTML='';empty.style.display='block';if(summary)summary.innerHTML='';return;}
    empty.style.display='none';
    if(summary){
      var tA=entries.length,tS=entries.reduce(function(s,e){return s+e.totalSec;},0);
      var oR=entries.reduce(function(s,e){return s+e.totalPkgs;},0)/(tS/60);
      var tMissing=entries.reduce(function(s,e){return s+(e.totalMissing||0);},0);
      var tExpected=entries.reduce(function(s,e){return s+(e.totalExpected||0);},0);
      var avgMissPct=tExpected>0?(tMissing/tExpected*100):0;
      summary.innerHTML='<div class="cbt-ws-stat"><span class="cbt-ws-val">'+tA+'</span><span class="cbt-ws-label">Batchers</span></div>'+
        '<div class="cbt-ws-stat"><span class="cbt-ws-val">'+oR.toFixed(1)+'</span><span class="cbt-ws-label">Avg Rate</span></div>'+
        '<div class="cbt-ws-stat"><span class="cbt-ws-val">'+avgMissPct.toFixed(1)+'%</span><span class="cbt-ws-label">Avg Miss %</span></div>';
    }
    var filtered=entries;
    if(historySearchTerm){var term=historySearchTerm.toLowerCase();filtered=entries.filter(function(e){return e.assoc.toLowerCase().indexOf(term)!==-1;});}
    filtered.sort(function(a,b){
      var va,vb;
      if(historySortKey==='assoc'){va=a.assoc.toLowerCase();vb=b.assoc.toLowerCase();return historySortAsc?va.localeCompare(vb):vb.localeCompare(va);}
      else if(historySortKey==='runs'){va=a.runs;vb=b.runs;}
      else if(historySortKey==='pkgs'){va=a.totalPkgs;vb=b.totalPkgs;}
      else{va=a.avgRate;vb=b.avgRate;}
      return historySortAsc?va-vb:vb-va;
    });
    var html='';
    for(var i=0;i<filtered.length;i++){
      var e=filtered[i],rateCls=e.avgRate>=WARN_RATE?'good':e.avgRate>=ALERT_RATE?'warn':'alert';
      var rankCls=i===0?'gold':i===1?'silver':i===2?'bronze':'';
      html+='<tr><td><span class="cbt-assoc"><span class="cbt-rank '+rankCls+'">'+(i+1)+'</span>'+e.assoc+'</span></td>';
      html+='<td><span class="cbt-hist-meta">'+e.runs+'</span></td><td><span class="cbt-hist-meta">'+e.totalPkgs+'</span></td>';
      html+='<td><span class="cbt-hist-rate '+rateCls+'">'+e.avgRate.toFixed(1)+'</span></td></tr>';
    }
    tbody.innerHTML=html;
  }

  /* ── Render Weekly ── */
  function renderWeekly() {
    var tbody=document.querySelector('#cbt-weekly-tbody'),empty=document.querySelector('#cbt-weekly-empty'),summary=document.querySelector('#cbt-weekly-summary');
    if(!tbody||!empty) return;
    var weekly=pruneWeeklyOlderThan(WEEKLY_DAYS),agg={};
    for(var dayKey of Object.keys(weekly)){
      for(var assoc of Object.keys(weekly[dayKey])){
        var d3=weekly[dayKey][assoc];
        if(!agg[assoc])agg[assoc]={assoc:assoc,totalPkgs:0,totalSec:0,runs:0,totalMissing:0,totalExpected:0,daysSet:new Set()};
        agg[assoc].totalPkgs+=d3.totalPkgs;agg[assoc].totalSec+=d3.totalSec;agg[assoc].runs+=d3.runs;
        agg[assoc].totalMissing+=(d3.totalMissing||0);agg[assoc].totalExpected+=(d3.totalExpected||0);agg[assoc].daysSet.add(dayKey);
      }
    }
    var all=Object.values(agg).map(function(a){return{assoc:a.assoc,totalPkgs:a.totalPkgs,totalSec:a.totalSec,runs:a.runs,days:a.daysSet.size,avgRate:a.totalPkgs/(a.totalSec/60),hrs:a.totalSec,missPct:a.totalExpected>0?(a.totalMissing/a.totalExpected*100):0};});
    if(all.length===0){tbody.innerHTML='';empty.style.display='block';if(summary)summary.innerHTML='';return;}
    empty.style.display='none';
    if(summary){
      var tA=all.length,tS=all.reduce(function(s,e){return s+e.totalSec;},0);
      var oR=all.reduce(function(s,e){return s+e.totalPkgs;},0)/(tS/60);
      var tM=all.reduce(function(s,e){return s+e.missPct;},0)/tA;
      summary.innerHTML='<div class="cbt-ws-stat"><span class="cbt-ws-val">'+tA+'</span><span class="cbt-ws-label">Batchers</span></div>'+
        '<div class="cbt-ws-stat"><span class="cbt-ws-val">'+oR.toFixed(1)+'</span><span class="cbt-ws-label">Avg Rate</span></div>'+
        '<div class="cbt-ws-stat"><span class="cbt-ws-val">'+tM.toFixed(1)+'%</span><span class="cbt-ws-label">Avg Miss %</span></div>';
    }
    var filtered=all;
    if(weeklySearchTerm){var term=weeklySearchTerm.toLowerCase();filtered=all.filter(function(e){return e.assoc.toLowerCase().indexOf(term)!==-1;});}
    filtered.sort(function(a,b){
      var va,vb;
      if(weeklySortKey==='assoc'){va=a.assoc.toLowerCase();vb=b.assoc.toLowerCase();return weeklySortAsc?va.localeCompare(vb):vb.localeCompare(va);}
      else if(weeklySortKey==='days'){va=a.days;vb=b.days;}else if(weeklySortKey==='runs'){va=a.runs;vb=b.runs;}
      else if(weeklySortKey==='pkgs'){va=a.totalPkgs;vb=b.totalPkgs;}else if(weeklySortKey==='avgRate'){va=a.avgRate;vb=b.avgRate;}
      else if(weeklySortKey==='hrs'){va=a.hrs;vb=b.hrs;}else{va=a.avgRate;vb=b.avgRate;}
      return weeklySortAsc?va-vb:vb-va;
    });
    var html='';
    for(var i=0;i<filtered.length;i++){
      var e=filtered[i],rateCls=e.avgRate>=WARN_RATE?'good':e.avgRate>=ALERT_RATE?'warn':'alert';
      var rankCls=i===0?'gold':i===1?'silver':i===2?'bronze':'';
      html+='<tr><td><span class="cbt-assoc"><span class="cbt-rank '+rankCls+'">'+(i+1)+'</span>'+e.assoc+'</span></td>';
      html+='<td><span class="cbt-hist-meta">'+e.days+'</span></td><td><span class="cbt-hist-meta">'+e.runs+'</span></td>';
      html+='<td><span class="cbt-hist-meta">'+e.totalPkgs+'</span></td><td><span class="cbt-hist-rate '+rateCls+'">'+e.avgRate.toFixed(1)+'</span></td>';
      html+='<td><span class="cbt-hist-meta">'+fmtHours(e.totalSec)+'</span></td></tr>';
    }
    tbody.innerHTML=html;
  }

  /* ── Live tick ── */
  function tickLive() {
    document.querySelectorAll('.cbt-elapsed[data-live="1"]').forEach(function(el){
      var startMs=parseFloat(el.dataset.start); if(!startMs) return;
      var sec=(Date.now()-startMs)/1000, min=sec/60;
      el.className='cbt-elapsed '+(min>=ALERT_ELAPSED_MIN?'alert':min>=WARN_ELAPSED_MIN?'warn':'');
      el.textContent=fmt(sec);
    });
  }

  /* ── Watch for Utilization box ── */
  var panelWatcher = new MutationObserver(function() {
    if (!document.getElementById('cbt-panel')) injectPanel();
  });

  /* ══════════════════════════════════════════
     START
  ══════════════════════════════════════════ */
  function start() {
    document.head.appendChild(style);

    timerWatcher.observe(document.documentElement, { childList: true, subtree: true });
    injectAllTimers();
    setInterval(tickTimers, 1000);
    setInterval(injectAllTimers, 1000);

    fetchAndUpdate();

    panelWatcher.observe(document.documentElement, { childList: true, subtree: true });
    injectPanel();

    pollActiveTasks();
    setInterval(pollActiveTasks, POLL_MS);
    setInterval(tickLive, TICK_MS);
    setInterval(fetchAndUpdate, 1000);

    try {
      GM_xmlhttpRequest({
        method: 'GET', url: DRIVE_URL + '&_=' + Date.now(), responseType: 'json',
        onload: function(res) {
          if (res.status>=200&&res.status<300&&res.response) batchRateCache = res.response[STORE_ID]||200;
          fetchAndUpdate();
        },
        onerror: function(){}
      });
    } catch(e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

})();
