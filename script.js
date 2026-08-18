const catIcons = {
  Venue: "home",
  Catering: "utensils",
  Photography: "camera",
  Decor: "flower",
  Entertainment: "music",
  Attire: "shirt",
  Transportation: "car"
};

let categories = {
  Venue: 11000,
  Catering: 13000,
  Photography: 4000,
  Decor: 4000,
  Entertainment: 3500,
  Attire: 3000,
  Transportation: 1500
};

let expenses = [];
let guestCounts = { Family: 0, Friends: 0, Colleagues: 0, Others: 0 };
let weddingDate = localStorage.getItem("weddingBudgetDate") || null;
let weddingLocation = localStorage.getItem("weddingBudgetLocation") || "";
let latestTips = [];

const totalBudgetInput = document.getElementById("totalBudget");
const remainingBudgetText = document.getElementById("remainingBudget");
const remainingCard = document.getElementById("remainingCard");
const expenseTable = document.getElementById("expenseTable");
const categoryProgress = document.getElementById("categoryProgress");
const totalGuestsText = document.getElementById("totalGuests");
const actualCostText = document.getElementById("actualCostPerGuest");
const addExpenseBtn = document.getElementById("addExpense");
const allocationWarning = document.getElementById("allocationWarning");
const warningText = document.getElementById("warningText");
const totalSpentValue = document.getElementById("totalSpentValue");
const guestInvitedSub = document.getElementById("guestInvitedSub");
const guestTotalBadge = document.getElementById("guestTotalBadge");
const allocationMeta = document.getElementById("allocationMeta");
const budgetAllocationList = document.getElementById("budgetAllocationList");
const countdownBanner = document.getElementById("countdownBanner");
const countdownDaysText = document.getElementById("countdownDaysText");
const weddingDayCard = document.getElementById("weddingDayCard");
const smartTipsCard = document.getElementById("smartTipsCard");
const smartTipsContent = document.getElementById("smartTipsContent");
const exportCsvBtn = document.getElementById("exportCsv");

if (exportCsvBtn) exportCsvBtn.textContent = "Export Expense CSV";

const money = value => `$${Number(value || 0).toLocaleString()}`;
const todayLabel = () => new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
const getSpent = cat => expenses.filter(e => e.cat === cat).reduce((sum, e) => sum + e.amount, 0);
const totalSpent = () => expenses.reduce((sum, e) => sum + e.amount, 0);
const totalPlanned = () => Object.values(categories).reduce((sum, value) => sum + value, 0);
const totalGuests = () => Object.values(guestCounts).reduce((sum, value) => sum + value, 0);
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
const csvCell = value => `"${String(value ?? "").replace(/"/g, '""')}"`;

function overallStatus() {
  const budget = Number(totalBudgetInput ? totalBudgetInput.value : 0) || 0;
  const spent = totalSpent();
  if (budget > 0 && spent > budget) return { code: "OVER", label: "Over Budget", className: "over" };
  if (budget > 0 && spent >= budget * 0.85) return { code: "WATCH", label: "Watch", className: "watch" };
  return { code: "SAFE", label: "On Track", className: "safe" };
}

function categoryStatus(spent, planned) {
  if (planned > 0 && spent > planned) return { code: "OVER", label: "Over", className: "over" };
  if (planned > 0 && spent >= planned * 0.85) return { code: "WATCH", label: "Watch", className: "watch" };
  return { code: "SAFE", label: "Safe", className: "safe" };
}

function handleResponsiveLayout() {
  const card = document.getElementById("weddingDayCard");
  if (!card) return;
  const isMobile = window.innerWidth <= 850;
  const container = document.querySelector(".dashboard-container");
  const sidebar = document.querySelector(".sidebar-col");
  if (isMobile) {
    if (container && card.parentElement !== container) container.insertBefore(card, container.firstChild);
  } else if (sidebar && card.parentElement !== sidebar) {
    sidebar.insertBefore(card, sidebar.firstChild);
  }
}

window.addEventListener("resize", handleResponsiveLayout);

function refresh() {
  if (exportCsvBtn) exportCsvBtn.textContent = "Export Expense CSV";

  const budget = Number(totalBudgetInput ? totalBudgetInput.value : 0) || 0;
  const spent = totalSpent();
  const planned = totalPlanned();
  const guests = totalGuests();
  const remaining = budget - spent;
  const costPerGuest = guests > 0 ? Math.round(spent / guests) : 0;

  if (planned > budget && budget > 0) {
    if (allocationWarning) allocationWarning.style.display = "flex";
    if (warningText) warningText.innerText = `Warning: Total planned categories (${money(planned)}) exceed your budget by ${money(planned - budget)}.`;
  } else if (allocationWarning) {
    allocationWarning.style.display = "none";
  }

  if (allocationMeta) {
    allocationMeta.innerText = `Planned: ${money(planned)} / ${money(budget)}`;
    allocationMeta.style.color = planned > budget && budget > 0 ? "#e53e3e" : "var(--text-muted)";
  }

  if (remainingBudgetText) remainingBudgetText.innerText = `${remaining < 0 ? "-$" : "$"}${Math.abs(remaining).toLocaleString()}`;
  if (remainingCard) {
    remainingCard.className = remaining < 0 ? "stat-card red-danger" : "stat-card green";
    if (remainingBudgetText) remainingBudgetText.style.color = remaining < 0 ? "#c53030" : "#2f855a";
  }

  if (totalSpentValue) totalSpentValue.innerText = money(spent);
  if (totalGuestsText) totalGuestsText.innerText = guests;
  if (actualCostText) actualCostText.innerText = guests > 0 ? money(costPerGuest) : "$0";
  if (guestInvitedSub) guestInvitedSub.innerText = `${guests} guests invited`;
  if (guestTotalBadge) guestTotalBadge.innerText = `${guests} total`;

  renderAllocation();
  renderExpenseHistory();
  renderProgress();
  renderWeddingDayTracker();
  Object.keys(guestCounts).forEach(group => {
    const input = document.getElementById(`input-${group}`);
    if (input && document.activeElement !== input) input.value = guestCounts[group];
  });
  updateSmartTips(planned, budget, spent, remaining, costPerGuest);
  handleResponsiveLayout();
  if (window.lucide) lucide.createIcons();
}

function renderAllocation() {
  if (!budgetAllocationList) return;
  if (budgetAllocationList.children.length === 0) {
    Object.keys(categories).forEach(cat => {
      const row = document.createElement("div");
      row.className = "budget-alloc-row";
      row.innerHTML = `
        <div class="budget-alloc-meta">
          <div class="budget-alloc-title">
            <i data-lucide="${catIcons[cat]}" style="width:16px;height:16px;color:var(--primary);"></i>
            <span>${cat}</span>
          </div>
          <input type="number" class="edit-planned" id="alloc-input-${cat}" data-cat="${cat}" value="${categories[cat]}">
        </div>
        <div class="p-bar"><div class="p-fill" id="alloc-fill-${cat}"></div></div>
        <div class="budget-alloc-spent" id="alloc-spent-${cat}">$0 spent</div>`;
      budgetAllocationList.appendChild(row);
    });
    document.querySelectorAll(".edit-planned").forEach(input => {
      input.oninput = e => {
        categories[e.target.dataset.cat] = Number(e.target.value) || 0;
        refresh();
      };
    });
  }

  Object.keys(categories).forEach(cat => {
    const spent = getSpent(cat);
    const limit = categories[cat] || 1;
    const pct = Math.min(100, (spent / limit) * 100);
    const fill = document.getElementById(`alloc-fill-${cat}`);
    const spentText = document.getElementById(`alloc-spent-${cat}`);
    const input = document.getElementById(`alloc-input-${cat}`);
    if (fill) {
      fill.className = `p-fill ${spent > limit && limit > 1 ? "bg-danger" : "bg-primary"}`;
      fill.style.width = `${pct}%`;
    }
    if (spentText) spentText.innerText = `${money(spent)} spent`;
    if (input && document.activeElement !== input) input.value = categories[cat];
  });
}

function renderExpenseHistory() {
  if (!expenseTable) return;
  expenseTable.innerHTML = "";
  if (expenses.length === 0) {
    expenseTable.insertRow().innerHTML = `<td colspan="4" style="text-align:center;color:var(--text-muted);padding:25px;">No expenses yet. Add your first expense above.</td>`;
    return;
  }
  expenses.forEach((expense, index) => {
    expenseTable.insertRow().innerHTML = `
      <td>${escapeHtml(expense.desc)}</td>
      <td><span class="status-badge" style="background:#f3f4f6;color:#4b5563;">${escapeHtml(expense.cat)}</span></td>
      <td style="font-weight:700;">${money(expense.amount)}</td>
      <td class="no-print" style="text-align:right;"><button onclick="deleteExp(${index})" class="remove-btn"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button></td>`;
  });
}

function renderProgress() {
  if (!categoryProgress) return;
  categoryProgress.innerHTML = "";
  let visible = 0;
  Object.keys(categories).forEach(cat => {
    const spent = getSpent(cat);
    const limit = categories[cat];
    if (limit === 0 && spent === 0) return;
    visible++;
    const pct = Math.min(100, (spent / (limit || 1)) * 100);
    const status = categoryStatus(spent, limit);
    const badgeClass = status.code === "OVER" ? "badge-over" : status.code === "WATCH" ? "badge-track" : "badge-safe";
    const barClass = status.code === "OVER" ? "bg-danger" : status.code === "WATCH" ? "bg-warning" : "bg-safe";
    const subText = status.code === "OVER"
      ? `Spent: ${money(spent)} <span style="color:#e53e3e;font-weight:700;margin-left:8px;">+${money(spent - limit)} over</span>`
      : `Spent: ${money(spent)}`;
    const div = document.createElement("div");
    div.className = "progress-item-block";
    div.style.marginBottom = "1.5rem";
    div.innerHTML = `
      <div class="progress-block-header" style="display:flex;justify-content:space-between;align-items:center;font-size:0.85rem;font-weight:700;margin-bottom:4px;">
        <span class="progress-block-title" style="display:flex;align-items:center;gap:6px;">${cat} <span class="badge ${badgeClass}">${status.label.toUpperCase()}</span></span>
        <span class="progress-block-percent" style="color:var(--text-muted);font-size:0.8rem;">${Math.round(pct)}% of ${money(limit)}</span>
      </div>
      <div class="p-bar" style="height:8px;background:#edf2f7;border-radius:6px;overflow:hidden;"><div class="p-fill ${barClass}" style="width:${pct}%"></div></div>
      <div class="progress-block-spent" style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">${subText}</div>`;
    categoryProgress.appendChild(div);
  });
  if (visible === 0) categoryProgress.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:10px 0;font-size:0.9rem;">Set a category planned amount to track progress.</div>`;
}

window.adjustGuests = (group, delta) => {
  guestCounts[group] = Math.max(0, guestCounts[group] + delta);
  refresh();
};

window.setGuestManual = (group, value) => {
  guestCounts[group] = Math.max(0, parseInt(value, 10) || 0);
  refresh();
};

function renderWeddingDayTracker() {
  if (!weddingDayCard) return;
  if (weddingDate) {
    const target = new Date(weddingDate);
    const current = new Date();
    target.setHours(0, 0, 0, 0);
    current.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((target.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
    if (countdownBanner) countdownBanner.style.display = "block";
    if (countdownDaysText) countdownDaysText.innerHTML = diffDays > 0 ? `${diffDays} Days to go! 🌸` : diffDays === 0 ? "It's Wedding Day! ❤️" : "Married! ✨";
    const formattedDate = target.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    weddingDayCard.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:1rem;">
        <div style="width:32px;height:32px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;"><i data-lucide="heart" style="width:16px;height:16px;color:#fff;"></i></div>
        <h2 style="border:none;margin:0;padding:0;">Wedding Day</h2>
      </div>
      <div style="text-align:center;margin:1.5rem 0;">
        <div style="font-size:3.8rem;font-weight:900;color:var(--text-main);line-height:1;">${diffDays > 0 ? diffDays : 0}</div>
        <div style="font-size:0.8rem;font-weight:700;color:var(--text-muted);letter-spacing:0.15em;margin-top:5px;">DAYS TO GO</div>
      </div>
      <div style="border-top:1px solid #edf2f7;padding-top:1rem;display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:0.85rem;font-weight:600;color:var(--text-muted);">
        <span>${formattedDate}${weddingLocation ? " • " + escapeHtml(weddingLocation) : ""}</span>
        <a href="#" onclick="changeDate();return false;" style="color:var(--primary);text-decoration:none;">Change</a>
      </div>`;
  } else {
    if (countdownBanner) countdownBanner.style.display = "none";
    weddingDayCard.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:1rem;">
        <div style="width:32px;height:32px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;"><i data-lucide="heart" style="width:16px;height:16px;color:#fff;"></i></div>
        <h2 style="border:none;margin:0;padding:0;">Wedding Day</h2>
      </div>
      <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:1rem;">Optional details for your report</p>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <input type="date" id="weddingDateInput" style="width:100%;box-sizing:border-box;" value="">
        <input type="text" id="weddingLocationInput" placeholder="Wedding location (e.g., Taipei, Paris)" value="${escapeHtml(weddingLocation)}" style="width:100%;box-sizing:border-box;margin-bottom:8px;">
        <button id="saveDate" onclick="saveDateValue()" style="width:100%;">Save Wedding Details</button>
      </div>`;
  }
}

window.saveDateValue = () => {
  const picker = document.getElementById("weddingDateInput");
  const locInput = document.getElementById("weddingLocationInput");
  if (picker && picker.value) {
    weddingDate = picker.value;
    localStorage.setItem("weddingBudgetDate", weddingDate);
  }
  if (locInput) {
    weddingLocation = locInput.value.trim();
    localStorage.setItem("weddingBudgetLocation", weddingLocation);
  }
  refresh();
};

window.changeDate = () => {
  weddingDate = null;
  localStorage.removeItem("weddingBudgetDate");
  refresh();
};

function updateSmartTips(planned, budget, spent, remaining, costPerGuest) {
  if (!smartTipsCard || !smartTipsContent) return;
  const tips = [];
  if (planned > budget && budget > 0) tips.push({ type: "warning", title: "Planned Budget Is High", desc: `Your planned categories (${money(planned)}) exceed your total budget. Consider reducing flexible categories before adding new expenses.` });
  if (costPerGuest > 300) tips.push({ type: "warning", title: "High Cost Per Guest", desc: `Your cost per guest is ${money(costPerGuest)}. Consider checking guest count, catering, and venue assumptions.` });
  if (budget > 0 && remaining < budget * 0.15) tips.push({ type: remaining < 0 ? "danger" : "warning", title: remaining < 0 ? "Over Total Budget" : "Budget Buffer Is Low", desc: remaining < 0 ? `You have exceeded your total budget by ${money(Math.abs(remaining))}. Review optional upgrades first.` : `You only have ${money(remaining)} left. Keep a buffer for final balances, tips, and small last-minute costs.` });
  Object.keys(categories).forEach(cat => {
    const spentCat = getSpent(cat);
    const limit = categories[cat] || 0;
    if (limit > 0 && spentCat > limit) tips.push({ type: "danger", title: `${cat} Over Budget`, desc: `You are over your ${cat} budget by ${money(spentCat - limit)}. Check whether any add-ons can be reduced.` });
    else if (limit > 0 && spentCat > limit * 0.85) tips.push({ type: "warning", title: `${cat} Near Limit`, desc: `You are close to your ${cat} budget limit of ${money(limit)}. Review this category before booking more items.` });
  });
  latestTips = tips;
  if (tips.length > 0) {
    smartTipsCard.style.display = "block";
    smartTipsContent.innerHTML = tips.map(t => `
      <div class="tip-alert-box tip-${t.type}" style="border-radius:12px;padding:12px;border:1px solid;margin-bottom:10px;font-size:0.85rem;line-height:1.4;">
        <div style="display:flex;align-items:center;gap:8px;font-weight:700;margin-bottom:4px;"><i data-lucide="alert-circle" style="width:16px;height:16px;"></i><span>${escapeHtml(t.title)}</span></div>
        <p style="margin:0;color:inherit;font-size:0.8rem;">${escapeHtml(t.desc)}</p>
      </div>`).join("");
  } else {
    smartTipsCard.style.display = "none";
    smartTipsContent.innerHTML = "";
  }
}

function expenseHighlights() {
  if (!expenses.length) return null;
  const largest = expenses.reduce((max, item) => item.amount > max.amount ? item : max, expenses[0]);
  const categoryTotals = {};
  expenses.forEach(item => categoryTotals[item.cat] = (categoryTotals[item.cat] || 0) + item.amount);
  const top = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  return { count: expenses.length, largest, topCategory: { name: top[0], amount: top[1] }, total: totalSpent() };
}

window.preparePrintReport = () => {
  const report = document.querySelector(".print-only.report-header");
  if (!report) return;
  const budget = Number(totalBudgetInput ? totalBudgetInput.value : 0) || 0;
  const spent = totalSpent();
  const remaining = budget - spent;
  const guests = totalGuests();
  const costPerGuest = guests > 0 ? Math.round(spent / guests) : 0;
  const status = overallStatus();
  const highlights = expenseHighlights();

  const allocationRows = Object.keys(categories).map(cat => {
    const planned = categories[cat] || 0;
    const spentCat = getSpent(cat);
    const usage = planned > 0 ? Math.min(100, (spentCat / planned) * 100) : 0;
    const state = categoryStatus(spentCat, planned);
    return `
      <div class="print-budget-row">
        <div class="print-budget-top"><strong>${escapeHtml(cat)}</strong><span class="print-status ${state.className}">${state.label}</span></div>
        <div class="print-budget-numbers"><span>Planned: ${money(planned)}</span><span>Spent: ${money(spentCat)}</span><span>Remaining: ${planned - spentCat < 0 ? "-" : ""}${money(Math.abs(planned - spentCat))}</span><span>${Math.round(usage)}%</span></div>
        <div class="print-progress"><i class="${state.className}" style="width:${usage}%"></i></div>
      </div>`;
  }).join("");

  const expenseRows = expenses.length ? `<table class="print-table"><thead><tr><th>Item</th><th>Category</th><th>Amount</th></tr></thead><tbody>${expenses.map(item => `<tr><td>${escapeHtml(item.desc)}</td><td>${escapeHtml(item.cat)}</td><td>${money(item.amount)}</td></tr>`).join("")}</tbody></table>` : `<div class="print-empty">No expenses recorded yet. Add expenses in the calculator to make this report more useful.</div>`;
  const highlightsHtml = highlights ? `<div class="print-grid print-highlight-grid"><div class="print-card"><span>Expense Records</span><strong>${highlights.count}</strong></div><div class="print-card"><span>Largest Expense</span><strong>${escapeHtml(highlights.largest.desc)} • ${money(highlights.largest.amount)}</strong></div><div class="print-card"><span>Top Category</span><strong>${escapeHtml(highlights.topCategory.name)} • ${money(highlights.topCategory.amount)}</strong></div><div class="print-card"><span>Total Spent</span><strong>${money(highlights.total)}</strong></div></div>` : `<div class="print-empty">No expense highlights yet because no expenses have been recorded.</div>`;
  const tipsHtml = latestTips.length ? `<section class="print-section"><h2>Smart Tips & Insights</h2><div class="print-tips">${latestTips.map(t => `<div class="print-tip ${t.type}"><strong>${escapeHtml(t.title)}</strong><p>${escapeHtml(t.desc)}</p></div>`).join("")}</div></section>` : "";

  report.innerHTML = `
    <style>
      @media print {
        @page { margin: 0.45in; }
        html, body { background: #fff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body > *:not(.print-only) { display: none !important; }
        .print-only.report-header { display:block !important; max-width:100% !important; font-family:Inter,Arial,sans-serif; color:#1f2937; text-align:left !important; }
        .print-cover { border:1px solid #f1d9e5; border-radius:22px; padding:26px; background:linear-gradient(135deg,#fff7fb,#fff); margin-bottom:20px; }
        .print-kicker { color:#be185d; letter-spacing:.16em; font-size:10px; font-weight:900; text-transform:uppercase; margin:0 0 8px; }
        .print-cover h1 { font-size:34px; line-height:1.05; margin:0; color:#831843; }
        .print-subtitle { color:#64748b; margin:8px 0 18px; font-size:13px; }
        .print-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
        .print-summary-grid { grid-template-columns:repeat(6,1fr); }
        .print-guest-grid { grid-template-columns:repeat(6,1fr); }
        .print-highlight-grid { grid-template-columns:repeat(4,1fr); }
        .print-card { border:1px solid #f3e3eb; background:#fff; border-radius:14px; padding:11px 12px; }
        .print-card span { display:block; color:#64748b; font-size:10px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; margin-bottom:5px; }
        .print-card strong { color:#1e293b; font-size:14px; line-height:1.3; }
        .print-section { margin-top:18px; page-break-inside:auto; break-inside:auto; }
        .print-section h2 { font-size:17px; color:#831843; margin:0 0 10px; padding-bottom:6px; border-bottom:2px solid #fce7f3; page-break-after:avoid; break-after:avoid; }
        .print-budget-row { border:1px solid #eef2f7; border-radius:13px; padding:10px 12px; margin-bottom:8px; page-break-inside:avoid; }
        .print-budget-top, .print-budget-numbers { display:flex; justify-content:space-between; gap:10px; align-items:center; }
        .print-budget-numbers { color:#64748b; font-size:11px; margin:7px 0; flex-wrap:wrap; }
        .print-status { border-radius:999px; padding:3px 8px; font-size:10px; font-weight:900; text-transform:uppercase; border:1px solid currentColor; }
        .safe { color:#047857; } .watch { color:#b45309; } .over { color:#b91c1c; }
        .print-progress { height:9px; border-radius:999px; background:#f1f5f9; overflow:hidden; }
        .print-progress i { display:block; height:100%; border-radius:999px; background:#be185d; }
        .print-progress i.safe { background:#10b981; } .print-progress i.watch { background:#f59e0b; } .print-progress i.over { background:#ef4444; }
        .print-table { width:100%; border-collapse:collapse; font-size:11px; }
        .print-table th { text-align:left; background:#fff1f7; color:#831843; }
        .print-table th, .print-table td { padding:8px; border:1px solid #e5e7eb; }
        .print-empty { border:1px dashed #f3d4e2; color:#64748b; border-radius:12px; padding:14px; background:#fff7fb; font-size:12px; }
        .print-tips { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .print-tip { border:1px solid #e5e7eb; border-left:5px solid #be185d; border-radius:12px; padding:10px; page-break-inside:avoid; }
        .print-tip p { margin:4px 0 0; font-size:11px; color:#475569; line-height:1.45; }
        .print-footer { margin-top:22px; padding-top:10px; border-top:1px solid #e5e7eb; color:#64748b; font-size:10px; display:flex; justify-content:space-between; gap:12px; page-break-inside:avoid; break-inside:avoid; }
      }
    </style>
    <header class="print-cover">
      <p class="print-kicker">Wedding Budget Planner</p><h1>Wedding Budget Report</h1><p class="print-subtitle">Budget summary and planning snapshot</p>
      <div class="print-grid"><div class="print-card"><span>Generated</span><strong>${todayLabel()}</strong></div><div class="print-card"><span>Wedding Date</span><strong>${weddingDate ? escapeHtml(weddingDate) : "Not Set"}</strong></div><div class="print-card"><span>Location</span><strong>${weddingLocation ? escapeHtml(weddingLocation) : "Not Set"}</strong></div></div>
    </header>
    <section class="print-section"><h2>Budget Snapshot</h2><div class="print-grid print-summary-grid"><div class="print-card"><span>Total Budget</span><strong>${money(budget)}</strong></div><div class="print-card"><span>Total Spent</span><strong>${money(spent)}</strong></div><div class="print-card"><span>Remaining</span><strong>${remaining < 0 ? "-" : ""}${money(Math.abs(remaining))}</strong></div><div class="print-card"><span>Total Guests</span><strong>${guests}</strong></div><div class="print-card"><span>Cost / Guest</span><strong>${money(costPerGuest)}</strong></div><div class="print-card"><span>Overall Status</span><strong>${status.label}</strong></div></div></section>
    <section class="print-section"><h2>Budget Allocation</h2>${allocationRows}</section>
    <section class="print-section"><h2>Guest Summary</h2><div class="print-grid print-guest-grid">${Object.entries(guestCounts).map(([group, count]) => `<div class="print-card"><span>${escapeHtml(group)}</span><strong>${count}</strong></div>`).join("")}<div class="print-card"><span>Total</span><strong>${guests}</strong></div><div class="print-card"><span>Cost / Guest</span><strong>${money(costPerGuest)}</strong></div></div></section>
    <section class="print-section"><h2>Expense Highlights</h2>${highlightsHtml}</section>
    <section class="print-section"><h2>Expense History</h2>${expenseRows}</section>
    ${tipsHtml}
    <footer class="print-footer"><span>Generated by Wedding Budget Planner • ${todayLabel()}</span><span>This report is for general wedding budgeting reference only and is not financial or professional planning advice.</span></footer>`;
};

function appendSheet(wb, rows, name, widths, moneyCols = [], percentCols = []) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = widths.map(wch => ({ wch }));
  const range = XLSX.utils.decode_range(ws["!ref"]);
  moneyCols.forEach(col => {
    for (let row = 1; row <= range.e.r; row++) {
      const cell = XLSX.utils.encode_cell({ r: row, c: col });
      if (ws[cell] && typeof ws[cell].v === "number") ws[cell].z = "$#,##0";
    }
  });
  percentCols.forEach(col => {
    for (let row = 1; row <= range.e.r; row++) {
      const cell = XLSX.utils.encode_cell({ r: row, c: col });
      if (ws[cell] && typeof ws[cell].v === "number") ws[cell].z = "0%";
    }
  });
  XLSX.utils.book_append_sheet(wb, ws, name);
}

document.getElementById("exportExcel").onclick = () => {
  const budget = Number(totalBudgetInput ? totalBudgetInput.value : 0) || 0;
  const spent = totalSpent();
  const guests = totalGuests();
  const costPerGuest = guests > 0 ? Math.round(spent / guests) : 0;
  const wb = XLSX.utils.book_new();
  appendSheet(wb, [["Metric", "Value"], ["Wedding Date", weddingDate || "Not Set"], ["Wedding Location", weddingLocation || "Not Set"], ["Generated Date", todayLabel()], ["Total Budget", budget], ["Total Spent", spent], ["Remaining Budget", budget - spent], ["Total Guests", guests], ["Cost Per Guest", costPerGuest], ["Overall Status", overallStatus().code]], "Summary", [24, 24], [1]);
  const allocation = [["Category", "Planned Budget", "Spent", "Remaining", "Usage %", "Status"]];
  Object.keys(categories).forEach(cat => {
    const planned = categories[cat] || 0;
    const spentCat = getSpent(cat);
    allocation.push([cat, planned, spentCat, planned - spentCat, planned > 0 ? spentCat / planned : 0, categoryStatus(spentCat, planned).code]);
  });
  appendSheet(wb, allocation, "Budget Allocation", [18, 16, 14, 14, 10, 12], [1, 2, 3], [4]);
  const expenseRows = [["Item", "Category", "Amount"]];
  if (expenses.length) expenses.forEach(item => expenseRows.push([item.desc, item.cat, item.amount]));
  else expenseRows.push(["No expenses recorded yet", "", ""]);
  appendSheet(wb, expenseRows, "Expense History", [32, 18, 14], [2]);
  const guestRows = [["Group", "Count"]];
  Object.keys(guestCounts).forEach(group => guestRows.push([group, guestCounts[group]]));
  guestRows.push(["Total", guests]);
  appendSheet(wb, guestRows, "Guest Count", [18, 12]);
  const tipRows = [["Type", "Message"]];
  if (latestTips.length) latestTips.forEach(tip => tipRows.push([tip.title, tip.desc]));
  else tipRows.push(["No smart tips generated yet", ""]);
  appendSheet(wb, tipRows, "Smart Tips", [28, 80]);
  XLSX.writeFile(wb, "Wedding_Budget_Planner.xlsx");
};

if (exportCsvBtn) {
  exportCsvBtn.onclick = () => {
    const exportedAt = new Date().toISOString().slice(0, 10);
    const rows = [
      ["Exported At", "Wedding Date", "Wedding Location", "Item", "Category", "Amount"],
      ...expenses.map(item => [
        exportedAt,
        weddingDate || "",
        weddingLocation || "",
        item.desc,
        item.cat,
        item.amount
      ])
    ];
    const csv = rows.map(row => row.map(csvCell).join(",")).join("\n") + "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "wedding_expense_ledger.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };
}

if (addExpenseBtn) {
  addExpenseBtn.onclick = () => {
    const desc = document.getElementById("expDesc");
    const amount = document.getElementById("expAmt");
    const category = document.getElementById("expCat");
    if (desc && amount && category && desc.value && amount.value) {
      expenses.push({ desc: desc.value, cat: category.value, amount: Number(amount.value) });
      desc.value = "";
      amount.value = "";
      refresh();
    }
  };
}

window.deleteExp = index => {
  expenses.splice(index, 1);
  refresh();
};

window.addEventListener("beforeprint", () => {
  if (!document.body.classList.contains("planner2-active")) preparePrintReport();
});
window.onload = refresh;
if (totalBudgetInput) totalBudgetInput.oninput = refresh;
