# COMO - Early Task In Order With Timer & Batcher Dashboard

A Tampermonkey userscript for Amazon Fresh COMO Operations Dashboard that helps dispatchers manage batching tasks more efficiently.

---

## What It Does

### ⏰ Early Task In Order
Automatically sorts all **ASSIGNABLE** tasks by their **Batch Target time** — earliest deadline always at the top. Tasks that are overdue or close to their target are highlighted in red or yellow so dispatchers can act immediately.

### ⏱ Time Left Column
Adds a live **Time Left** column next to the Batch Target column on every task row. It counts down in real time so you always know exactly how many minutes each cart has left before its deadline.

- 🟢 Green → more than 10 minutes left
- 🟡 Yellow → under 10 minutes (MM:SS countdown)
- 🔴 Red → overdue

### 🦺 Batcher Timer Dashboard
A live dashboard injected above the Utilization section on the right side of the page. It tracks every active batcher in real time with three tabs:

- **Live** — shows all batchers currently batching, sorted by fastest scan rate. Displays elapsed time and bags/min for each batcher
- **Today** — daily history of every batcher's performance including total packages, runs, and average rate
- **Weekly** — 7-day aggregated data per batcher including days worked, total packages, and average rate

The dashboard also shows:
- 🦺 **Batchers** — how many are currently active
- 📦 **Remaining Packages** — how many packages still need to be batched

---

## How To Install

### Step 1 — Install Tampermonkey
If you don't have it already, install the Tampermonkey browser extension:
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
- [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)

### Step 2 — Install the Script
Click the link below. Tampermonkey will automatically detect it and show an install screen. Click **Install**.

👉 **[Click here to install the script](https://github.com/IbrahimaSy11/-como-scripts/raw/refs/heads/main/como-early-task-in-order.user.js)**

### Step 3 — Open the Dashboard
Go to your COMO Operations Dashboard. The script runs automatically.

---

## Features At A Glance

| Feature | Description |
|---|---|
| Early task sorting | Earliest Batch Target always on top |
| Time Left column | Live countdown next to every task |
| Batcher Timer panel | Live scan rates per batcher |
| Today tab | Daily performance history |
| Weekly tab | 7-day aggregated batcher stats |
| Batchers count | Live count of active batchers |
| Remaining packages | Live remaining package count |
| Click to copy | Click any associate name to copy it |
| Resizable panel | Drag the bottom bar to resize the Batcher Timer dashboard |
| Reset size | Press ↕️ to reset the panel to default size |

---

## How To Use

**Task Sorting**
Tasks are sorted automatically every 2 seconds. No action needed — the earliest task is always at the top when the page loads or refreshes.

**Time Left Column**
Appears automatically next to Batch Target. Updates every second.

**Batcher Timer Dashboard**
- Located above the Utilization section on the right side
- Switch between **Live**, **Today**, and **Weekly** tabs
- Click any associate name to copy it to clipboard
- Drag the bottom handle up or down to resize
- Press **↕️** to reset to default size
- Drag all the way up to collapse and show only Batchers and Remaining Packages

**Sorting in the Dashboard**
- Click any column header to sort by that column
- In the Live tab: fastest batchers are always on top by default
- In Today/Weekly tabs: highest average rate is always on top by default

---

## Compatible Pages

The script runs on:
- `https://como-operations-dashboard-iad.iad.proxy.amazon.com/store/*/dash*`
- `https://como-operations-dashboard-iad.iad.proxy.amazon.com/store/*/tasks*`
- `https://como-operations-dashboard-iad.iad.proxy.amazon.com/store/*/jobs*`

---

## Updates

When the script is updated, Tampermonkey will notify you automatically. Click **Update** in Tampermonkey to get the latest version.

---

## Author

Built by **Ibrahim** — Amazon Fresh Dispatcher, UNY2
