(() => {
  const STORAGE_KEY = "weddingBudgetPlanner2.v1";
  const hadSavedPlanner2State = Boolean(localStorage.getItem(STORAGE_KEY));
  const numberValue = value => Math.max(0, Number(value) || 0);
  const defaultCategories = { Venue: 11000, Catering: 13000, Photography: 4000, Decor: 4000, Entertainment: 3500, Attire: 3000, Transportation: 1500 };
  const defaultBudget = () => ({ total: 40000, categories: { ...defaultCategories }, expenses: [], importedAt: null });
  const defaultGuestCounts = () => ({ Family: 0, Friends: 0, Colleagues: 0, Others: 0 });
  const defaultGuests = () => ({ current: defaultGuestCounts(), cateringRate: 130, scenarios: [] });
  const defaultProgress = () => ({ budgetReviewed: false, exported: false });
  const emptyState = () => ({ vendors: [], payments: [], budget: defaultBudget(), guests: defaultGuests(), progress: defaultProgress() });
  const parseState = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return saved && typeof saved === "object"
        ? {
            vendors: Array.isArray(saved.vendors) ? saved.vendors : [],
            payments: Array.isArray(saved.payments) ? saved.payments : [],
            budget: {
              total: numberValue(saved.budget?.total ?? 40000),
              categories: { ...defaultCategories, ...(saved.budget?.categories || {}) },
              expenses: Array.isArray(saved.budget?.expenses) ? saved.budget.expenses.map((item, index) => ({ id: item.id || `expense-saved-${Date.now()}-${index}`, desc: String(item.desc || item.description || ""), cat: String(item.cat || item.category || "Other"), amount: numberValue(item.amount), source: item.source || (saved.budget?.importedAt ? "Imported" : "Planner 2.0") })) : [],
              importedAt: saved.budget?.importedAt || null
            },
            guests: {
              current: { ...defaultGuestCounts(), ...(saved.guests?.current || {}) },
              cateringRate: numberValue(saved.guests?.cateringRate ?? 130),
              scenarios: Array.isArray(saved.guests?.scenarios) ? saved.guests.scenarios : []
            },
            progress: { ...defaultProgress(), ...(saved.progress || {}) }
          }
        : emptyState();
    } catch (_) {
      return emptyState();
    }
  };
  let state = parseState();
  let editingExpenseId = null;
  const workspace = document.getElementById("planner2Workspace");
  if (!workspace) return;
  document.body.classList.add("planner2-active");
  workspace.hidden = false;
  const confirmDialog = document.getElementById("p2ConfirmDialog");
  const confirmTitle = document.getElementById("p2ConfirmTitle");
  const confirmMessage = document.getElementById("p2ConfirmMessage");
  const confirmAccept = document.getElementById("p2ConfirmAccept");
  const confirmCancel = document.getElementById("p2ConfirmCancel");
  let pendingConfirm = null;
  const closeConfirmation = () => {
    confirmDialog.hidden = true;
    pendingConfirm = null;
  };
  const openConfirmation = ({ title, message, confirmLabel = "Confirm change", onConfirm }) => {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmAccept.textContent = confirmLabel;
    pendingConfirm = onConfirm;
    confirmDialog.hidden = false;
    confirmCancel.focus();
  };
  confirmCancel.addEventListener("click", closeConfirmation);
  confirmAccept.addEventListener("click", () => {
    const action = pendingConfirm;
    closeConfirmation();
    if (action) action();
  });
  confirmDialog.addEventListener("click", event => { if (event.target === confirmDialog) closeConfirmation(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && !confirmDialog.hidden) closeConfirmation(); });

  const money2 = value => `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  const safe = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  const id = prefix => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const vendorTotal = vendor => {
    const subtotal = numberValue(vendor.packagePrice) + numberValue(vendor.fees) + numberValue(vendor.travel) + numberValue(vendor.rentals) + numberValue(vendor.overtime);
    return subtotal + subtotal * numberValue(vendor.taxRate) / 100;
  };
  const budgetExpenseTotal = () => state.budget.expenses.reduce((sum, item) => sum + numberValue(item.amount), 0);
  const budgetExpenseFor = category => state.budget.expenses.filter(item => item.cat === category).reduce((sum, item) => sum + numberValue(item.amount), 0);
  const committedFor = category => state.vendors.filter(vendor => vendor.selected && vendor.category === category).reduce((sum, vendor) => sum + vendorTotal(vendor), 0);
  const guestTotalFor = counts => Object.values(counts || {}).reduce((sum, count) => sum + Math.max(0, Math.floor(Number(count) || 0)), 0);
  const trackedTotal = () => state.vendors.filter(vendor => vendor.selected).reduce((sum, vendor) => sum + vendorTotal(vendor), 0) + budgetExpenseTotal();
  const scenarioProjection = counts => {
    const total = guestTotalFor(counts);
    const catering = total * numberValue(state.guests.cateringRate);
    const trackedCatering = committedFor("Catering") + budgetExpenseFor("Catering");
    const projectedTotal = Math.max(0, trackedTotal() - trackedCatering) + catering;
    return { total, catering, projectedTotal, costPerGuest: total ? trackedTotal() / total : 0, headroom: numberValue(state.budget.total) - projectedTotal };
  };
  const paymentStatus = payment => {
    if (payment.paid) return "paid";
    const due = new Date(`${payment.dueDate}T23:59:59`);
    const today = new Date();
    const days = Math.ceil((due - today) / 86400000);
    if (days < 0) return "overdue";
    if (days <= 14) return "due-soon";
    return "scheduled";
  };
  const setOverviewCardState = (cardId, stateName) => {
    const card = document.getElementById(cardId);
    card.classList.remove("is-success", "is-warning", "is-danger");
    if (stateName) card.classList.add(`is-${stateName}`);
  };
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const downloadText = (filename, textContent, type = "text/csv;charset=utf-8") => {
    const blob = new Blob([textContent], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = filename; link.click();
    URL.revokeObjectURL(url);
  };
  const csvRows = rows => rows.map(row => row.map(csvCell).join(",")).join("\n") + "\n";
  const markExported = message => {
    state.progress.exported = true;
    save();
    render();
    document.getElementById("p2ExportStatus").textContent = message;
  };
  const importLegacySnapshot = transfer => {
    const source = transfer && typeof transfer === "object" ? transfer : {};
    const liveCategories = typeof categories !== "undefined" ? categories : defaultCategories;
    const liveExpenses = typeof expenses !== "undefined" ? expenses : [];
    state.budget = {
      total: numberValue(source.total ?? document.getElementById("totalBudget")?.value),
      categories: Object.fromEntries(Object.entries(source.categories || liveCategories).map(([name, value]) => [name, numberValue(value)])),
      expenses: (Array.isArray(source.expenses) ? source.expenses : liveExpenses).map((item, index) => ({ id: item.id || `expense-imported-${Date.now()}-${index}`, desc: String(item.desc || ""), cat: String(item.cat || "Other"), amount: numberValue(item.amount), source: "Imported" })),
      importedAt: new Date().toISOString()
    };
    const importedGuests = source.guestCounts || (typeof guestCounts !== "undefined" ? guestCounts : null);
    if (importedGuests) state.guests.current = Object.fromEntries(Object.entries({ ...defaultGuestCounts(), ...importedGuests }).map(([name, value]) => [name, Math.max(0, Math.floor(Number(value) || 0))]));
    save();
  };

  if (!hadSavedPlanner2State) {
    try {
      const transfer = JSON.parse(sessionStorage.getItem("weddingBudgetPlanner2.transfer.v1"));
      if (transfer) {
        importLegacySnapshot(transfer);
        sessionStorage.removeItem("weddingBudgetPlanner2.transfer.v1");
      }
    } catch (_) { /* Keep the saved Planner 2.0 budget if transfer data is invalid. */ }
  }

  const showView = (view, updateUrl = false) => {
    workspace.querySelectorAll("[data-workspace-view]").forEach(button => button.classList.toggle("active", button.dataset.workspaceView === view));
    workspace.querySelectorAll("[data-workspace-panel]").forEach(panel => panel.classList.toggle("active", panel.dataset.workspacePanel === view));
    document.getElementById("planner2Title").textContent = view.charAt(0).toUpperCase() + view.slice(1);
    if (updateUrl) history.replaceState(null, "", view === "overview" ? window.location.pathname : `${window.location.pathname}#${view}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  workspace.querySelectorAll("[data-workspace-view]").forEach(button => button.addEventListener("click", () => showView(button.dataset.workspaceView, true)));
  const requestedView = window.location.hash.slice(1);
  if (["overview", "budget", "vendors", "payments", "guests", "reports"].includes(requestedView)) showView(requestedView);
  window.addEventListener("hashchange", () => {
    const nextView = window.location.hash.slice(1) || "overview";
    if (["overview", "budget", "vendors", "payments", "guests", "reports"].includes(nextView)) showView(nextView);
  });

  const render = () => {
    const selected = state.vendors.filter(v => v.selected);
    const startSteps = [
      { label: "Review your total and category limits", detail: "Set a working ceiling before comparing quotes.", view: "budget", done: state.progress.budgetReviewed || Boolean(state.budget.importedAt) },
      { label: "Add a vendor quote", detail: "Include required fees, delivery, rentals, overtime, and tax.", view: "vendors", done: state.vendors.length > 0 },
      { label: "Select a vendor commitment", detail: "Selected true cost becomes part of your committed budget.", view: "vendors", done: selected.length > 0 },
      { label: "Schedule a payment", detail: "Record a deposit, installment, or final balance with its due date.", view: "payments", done: state.payments.length > 0 },
      { label: "Test your guest count", detail: "See how catering assumptions change projected headroom.", view: "guests", done: guestTotalFor(state.guests.current) > 0 || state.guests.scenarios.length > 0 },
      { label: "Export a planning snapshot", detail: "Download a report when the current plan is ready to review.", view: "reports", done: state.progress.exported }
    ];
    const completedSteps = startSteps.filter(step => step.done).length;
    document.getElementById("p2StartProgress").textContent = `${completedSteps} of ${startSteps.length} complete`;
    document.getElementById("p2StartSteps").innerHTML = startSteps.map((step, index) => `<button class="planner2-start-step ${step.done ? "is-complete" : ""}" data-go-view="${step.view}"><span class="planner2-step-marker">${step.done ? "✓" : index + 1}</span><span><strong>${step.label}</strong><small>${step.detail}</small></span><span class="planner2-step-action">${step.done ? "Review" : "Start"}</span></button>`).join("");
    const vendorRows = document.getElementById("p2VendorRows");
    vendorRows.innerHTML = state.vendors.length ? state.vendors.map(vendor => {
      const extras = numberValue(vendor.fees) + numberValue(vendor.travel) + numberValue(vendor.rentals) + numberValue(vendor.overtime);
      const tax = vendorTotal(vendor) - numberValue(vendor.packagePrice) - extras;
      return `<tr><td><strong>${safe(vendor.name)}</strong><br><small>${safe(vendor.category)}</small></td><td>${money2(vendor.packagePrice)}</td><td>${money2(extras)}</td><td>${money2(tax)}</td><td><strong>${money2(vendorTotal(vendor))}</strong></td><td><span class="planner2-badge ${vendor.selected ? "selected" : ""}">${vendor.selected ? "Selected" : "Comparing"}</span></td><td><button data-select-vendor="${vendor.id}">${vendor.selected ? "Unselect" : "Select"}</button> <button data-delete-vendor="${vendor.id}">Remove</button></td></tr>`;
    }).join("") : `<tr><td colspan="7" class="planner2-empty"><strong>No quotes to compare yet.</strong><br>Add a vendor name and the complete costs above. Your first quote becomes the baseline for comparison.</td></tr>`;

    const paymentRows = document.getElementById("p2PaymentRows");
    paymentRows.innerHTML = state.payments.length ? [...state.payments].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map(payment => {
      const status = paymentStatus(payment);
      return `<tr><td><strong>${safe(payment.name)}</strong></td><td>${safe(payment.vendor || "—")}</td><td>${safe(payment.dueDate)}</td><td><strong>${money2(payment.amount)}</strong></td><td><span class="planner2-badge ${status}">${status.replace("-", " ")}</span></td><td><button data-toggle-payment="${payment.id}">${payment.paid ? "Mark unpaid" : "Mark paid"}</button> <button data-delete-payment="${payment.id}">Remove</button></td></tr>`;
    }).join("") : `<tr><td colspan="6" class="planner2-empty"><strong>No payment dates yet.</strong><br>Select a vendor first, then add its deposit or next balance above.</td></tr>`;

    const committed = selected.reduce((sum, vendor) => sum + vendorTotal(vendor), 0);
    document.getElementById("p2SelectedVendorOptions").innerHTML = selected.map(vendor => `<option value="${safe(vendor.name)}">${safe(vendor.category)} · ${money2(vendorTotal(vendor))}</option>`).join("");
    document.getElementById("p2VendorPaymentBalances").innerHTML = selected.length ? selected.map(vendor => {
      const linkedPayments = state.payments.filter(payment => payment.vendorId === vendor.id || (!payment.vendorId && payment.vendor.trim().toLowerCase() === vendor.name.trim().toLowerCase()));
      const scheduled = linkedPayments.reduce((sum, payment) => sum + numberValue(payment.amount), 0);
      const vendorPaid = linkedPayments.filter(payment => payment.paid).reduce((sum, payment) => sum + numberValue(payment.amount), 0);
      const contract = vendorTotal(vendor);
      const remaining = Math.max(0, contract - vendorPaid);
      const excess = scheduled - contract;
      return `<article class="planner2-balance-card ${excess > .005 ? "is-warning" : ""}"><strong>${safe(vendor.name)}</strong><dl><dt>Contract</dt><dd>${money2(contract)}</dd><dt>Scheduled</dt><dd>${money2(scheduled)}</dd><dt>Paid</dt><dd>${money2(vendorPaid)}</dd><dt>Still payable</dt><dd>${money2(remaining)}</dd></dl>${excess > .005 ? `<p class="planner2-balance-warning">Scheduled payments exceed this commitment by ${money2(excess)}. Check for a duplicate or an outdated quote.</p>` : ""}</article>`;
    }).join("") : `<div class="planner2-note"><strong>No selected vendor yet:</strong> select a quote on the Vendors page to make it available here. You can still type a vendor name manually.</div>`;
    const actualSpent = budgetExpenseTotal();
    const paid = state.payments.filter(p => p.paid).reduce((sum, p) => sum + numberValue(p.amount), 0);
    const open = state.payments.filter(p => !p.paid);
    const next = [...open].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
    const uncommitted = numberValue(state.budget.total) - committed - actualSpent;
    document.getElementById("p2TotalBudget").textContent = money2(state.budget.total);
    document.getElementById("p2Committed").textContent = money2(committed);
    document.getElementById("p2Paid").textContent = money2(paid);
    document.getElementById("p2ActualSpent").textContent = money2(actualSpent);
    document.getElementById("p2Uncommitted").textContent = `${uncommitted < 0 ? "-" : ""}${money2(Math.abs(uncommitted))}`;
    document.getElementById("p2NextDue").textContent = next ? money2(next.amount) : "Not set";
    const nextStatus = next ? paymentStatus(next) : null;
    const nextStatusLabel = nextStatus === "overdue" ? "Overdue" : nextStatus === "due-soon" ? "Due soon" : nextStatus === "scheduled" ? "Scheduled" : "";
    document.getElementById("p2NextDueMeta").textContent = next ? `${nextStatusLabel} · ${next.name} · ${next.dueDate}` : "Add a payment date";
    document.getElementById("p2CommittedMeta").textContent = committed ? "Selected true-cost quotes" : "No vendor selected";
    document.getElementById("p2PaidMeta").textContent = paid ? "Completed payments" : "No completed payments";
    document.getElementById("p2ActualSpentMeta").textContent = actualSpent > state.budget.total && state.budget.total > 0 ? `Over total budget by ${money2(actualSpent - state.budget.total)}` : "Expense ledger";
    document.getElementById("p2UncommittedMeta").textContent = uncommitted < 0 ? `Overspent by ${money2(Math.abs(uncommitted))}` : uncommitted <= state.budget.total * .1 ? "Little headroom remaining" : "After commitments and other expenses";
    setOverviewCardState("p2CommittedCard", committed > 0 ? "success" : null);
    setOverviewCardState("p2PaidCard", paid > 0 ? "success" : null);
    setOverviewCardState("p2ActualSpentCard", actualSpent > state.budget.total && state.budget.total > 0 ? "danger" : actualSpent >= state.budget.total * .9 && state.budget.total > 0 ? "warning" : null);
    setOverviewCardState("p2UncommittedCard", uncommitted < 0 ? "danger" : uncommitted <= state.budget.total * .1 && state.budget.total > 0 ? "warning" : uncommitted > state.budget.total * .25 ? "success" : null);
    setOverviewCardState("p2NextDueCard", nextStatus === "overdue" ? "danger" : nextStatus === "due-soon" ? "warning" : null);
    const alerts = [];
    if (uncommitted < 0) alerts.push(`<div class="planner2-alert danger"><strong>Budget overrun:</strong> commitments and actual expenses exceed the working ceiling by ${money2(Math.abs(uncommitted))}.</div>`);
    if (paid > committed) alerts.push(`<div class="planner2-alert"><strong>Needs review:</strong> completed payments exceed selected vendor commitments by ${money2(paid - committed)}. Check whether a vendor still needs to be selected or a payment was also recorded as an actual expense.</div>`);
    const duplicateSelectedCategories = [...new Set(selected.map(vendor => vendor.category).filter(category => selected.filter(vendor => vendor.category === category).length > 1))];
    if (duplicateSelectedCategories.length) alerts.push(`<div class="planner2-alert"><strong>Vendor selections need review:</strong> more than one quote is selected for ${safe(duplicateSelectedCategories.join(", "))}. Keep one selected quote per category to avoid double-counting competing offers.</div>`);
    document.getElementById("p2OverviewAlerts").innerHTML = alerts.join("");

    const best = [...state.vendors].sort((a, b) => vendorTotal(a) - vendorTotal(b))[0];
    document.getElementById("p2BestVendor").innerHTML = best ? `<strong>${safe(best.name)}</strong><br>${safe(best.category)} · ${money2(vendorTotal(best))} true cost` : "Add quotes to compare package price with required fees, travel, rentals, overtime, and tax.";
    const statusCounts = state.payments.reduce((counts, payment) => { const status = paymentStatus(payment); counts[status] = (counts[status] || 0) + 1; return counts; }, {});
    document.getElementById("p2PaymentSummary").innerHTML = state.payments.length ? `<strong>${state.payments.length} scheduled payments</strong><br>${statusCounts.paid || 0} paid · ${statusCounts["due-soon"] || 0} due soon · ${statusCounts.overdue || 0} overdue` : "No payments scheduled yet.";

    const budgetInput = document.getElementById("p2BudgetInput");
    if (document.activeElement !== budgetInput) budgetInput.value = state.budget.total;
    document.getElementById("p2BudgetUsed").textContent = money2(committed + actualSpent);
    document.getElementById("p2BudgetRemaining").textContent = `${uncommitted < 0 ? "-" : ""}${money2(Math.abs(uncommitted))}`;
    document.getElementById("p2PaymentProgress").textContent = `${money2(paid)} of ${money2(committed)}`;
    const plannedCategoryTotal = Object.values(state.budget.categories).reduce((sum, value) => sum + numberValue(value), 0);
    const allocationWarning = plannedCategoryTotal > state.budget.total ? ` Category limits exceed the total budget by ${money2(plannedCategoryTotal - state.budget.total)}.` : "";
    document.getElementById("p2BudgetSource").innerHTML = state.budget.importedAt
      ? `<strong>Migrated planner budget</strong><span>Your earlier calculator snapshot and subsequent Planner 2.0 changes are saved in this browser.${allocationWarning}</span>`
      : `<strong>Planner budget</strong><span>Your plan is saved privately in this browser.${allocationWarning}</span>`;
    document.getElementById("p2BudgetRows").innerHTML = Object.keys(state.budget.categories).map(category => {
      const planned = numberValue(state.budget.categories[category]);
      const categoryCommitted = committedFor(category);
      const categorySpent = budgetExpenseFor(category);
      const available = planned - categoryCommitted - categorySpent;
      const status = available < 0 ? "overdue" : available <= planned * .25 ? "due-soon" : "selected";
      const label = available < 0 ? "Over" : available <= planned * .25 ? "Watch" : "Available";
      return `<tr><td><strong>${safe(category)}</strong></td><td><input class="planner2-category-input" type="number" min="0" step="100" data-budget-category="${safe(category)}" value="${planned}"></td><td>${money2(categoryCommitted)}</td><td>${money2(categorySpent)}</td><td><strong>${available < 0 ? "-" : ""}${money2(Math.abs(available))}</strong></td><td><span class="planner2-badge ${status}">${label}</span></td></tr>`;
    }).join("");
    document.getElementById("p2ExpenseRows").innerHTML = state.budget.expenses.length ? state.budget.expenses.map(expense => `<tr><td><strong>${safe(expense.desc)}</strong></td><td>${safe(expense.cat)}</td><td><strong>${money2(expense.amount)}</strong></td><td><span class="planner2-badge">${safe(expense.source || "Planner 2.0")}</span></td><td><button data-edit-expense="${expense.id}">Edit</button> <button data-delete-expense="${expense.id}">Remove</button></td></tr>`).join("") : `<tr><td colspan="5" class="planner2-empty">No actual expenses recorded yet.</td></tr>`;

    const currentProjection = scenarioProjection(state.guests.current);
    document.getElementById("p2GuestTotal").textContent = currentProjection.total.toLocaleString();
    document.getElementById("p2GuestCost").textContent = money2(currentProjection.costPerGuest);
    document.getElementById("p2GuestCatering").textContent = money2(currentProjection.catering);
    document.getElementById("p2GuestCateringMeta").textContent = `Using ${money2(state.guests.cateringRate)} per guest`;
    document.getElementById("p2GuestHeadroom").textContent = `${currentProjection.headroom < 0 ? "-" : ""}${money2(Math.abs(currentProjection.headroom))}`;
    document.querySelectorAll("#p2GuestPlanForm input[name]").forEach(input => { if (document.activeElement !== input) input.value = state.guests.current[input.name] || 0; });
    const cateringRateInput = document.getElementById("p2CateringRate");
    if (document.activeElement !== cateringRateInput) cateringRateInput.value = state.guests.cateringRate;
    document.getElementById("p2ScenarioRows").innerHTML = state.guests.scenarios.length ? state.guests.scenarios.map(scenario => {
      const projection = scenarioProjection(scenario.counts);
      return `<tr><td><strong>${safe(scenario.name)}</strong></td><td>${projection.total.toLocaleString()}</td><td>${money2(projection.catering)}</td><td>${money2(projection.costPerGuest)}</td><td>${money2(projection.projectedTotal)}</td><td><strong>${projection.headroom < 0 ? "-" : ""}${money2(Math.abs(projection.headroom))}</strong></td><td><button data-use-scenario="${scenario.id}">Use plan</button> <button data-delete-scenario="${scenario.id}">Remove</button></td></tr>`;
    }).join("") : `<tr><td colspan="7" class="planner2-empty"><strong>No comparison saved yet.</strong><br>Enter a scenario name and guest groups above to compare a smaller or larger list.</td></tr>`;
    document.getElementById("p2ReportBudget").textContent = money2(state.budget.total);
    document.getElementById("p2ReportVendors").textContent = selected.length.toLocaleString();
    document.getElementById("p2ReportPayments").textContent = state.payments.length.toLocaleString();
    document.getElementById("p2ReportPaymentMeta").textContent = `${state.payments.filter(payment => payment.paid).length} completed`;
    document.getElementById("p2ReportScenarios").textContent = state.guests.scenarios.length.toLocaleString();
    if (window.lucide) lucide.createIcons();
  };

  const exportVendorCsv = () => {
    downloadText("wedding_vendor_comparison.csv", csvRows([
      ["Vendor", "Category", "Package Price", "Required Fees", "Travel / Delivery", "Rentals / Add-ons", "Likely Overtime", "Tax Rate %", "True Cost", "Selected"],
      ...state.vendors.map(vendor => [vendor.name, vendor.category, vendor.packagePrice, vendor.fees, vendor.travel, vendor.rentals, vendor.overtime, vendor.taxRate, vendorTotal(vendor), vendor.selected ? "Yes" : "No"])
    ]));
    markExported("Vendor comparison CSV downloaded.");
  };
  const exportPaymentCsv = () => {
    downloadText("wedding_payment_schedule.csv", csvRows([
      ["Payment", "Vendor", "Due Date", "Amount", "Status"],
      ...[...state.payments].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map(payment => [payment.name, payment.vendor, payment.dueDate, payment.amount, paymentStatus(payment).replace("-", " ").toUpperCase()])
    ]));
    markExported("Payment schedule CSV downloaded.");
  };
  const exportExpenseCsv = () => {
    downloadText("wedding_actual_expenses.csv", csvRows([
      ["Expense", "Category", "Amount", "Source"],
      ...state.budget.expenses.map(expense => [expense.desc, expense.cat, expense.amount, expense.source || "Planner 2.0"])
    ]));
    markExported("Actual expense CSV downloaded.");
  };
  const exportPlanner2Excel = () => {
    if (!window.XLSX) {
      document.getElementById("p2ExportStatus").textContent = "Excel export is temporarily unavailable because the spreadsheet library did not load. CSV and PDF remain available.";
      return;
    }
    document.getElementById("p2ExportStatus").textContent = "Preparing Excel workbook…";
    const selected = state.vendors.filter(vendor => vendor.selected);
    const committed = selected.reduce((sum, vendor) => sum + vendorTotal(vendor), 0);
    const actualSpent = budgetExpenseTotal();
    const paid = state.payments.filter(payment => payment.paid).reduce((sum, payment) => sum + numberValue(payment.amount), 0);
    const wb = XLSX.utils.book_new();
    appendSheet(wb, [["Metric", "Value"], ["Generated", todayLabel()], ["Total Budget", state.budget.total], ["Selected Commitments", committed], ["Actual Expenses", actualSpent], ["Uncommitted", state.budget.total - committed - actualSpent], ["Payments Paid", paid], ["Payments Scheduled", state.payments.length], ["Current Guests", guestTotalFor(state.guests.current)], ["Catering Per Guest", state.guests.cateringRate]], "Summary", [26, 20], [1]);
    const budgetRows = [["Category", "Planned", "Committed", "Other Expenses", "Available", "Status"]];
    Object.entries(state.budget.categories).forEach(([category, plannedValue]) => { const planned = numberValue(plannedValue); const committedCategory = committedFor(category); const spentCategory = budgetExpenseFor(category); const available = planned - committedCategory - spentCategory; budgetRows.push([category, planned, committedCategory, spentCategory, available, available < 0 ? "OVER" : available <= planned * .25 ? "WATCH" : "AVAILABLE"]); });
    appendSheet(wb, budgetRows, "Budget", [18, 14, 14, 16, 14, 12], [1, 2, 3, 4]);
    appendSheet(wb, [["Expense", "Category", "Amount", "Source"], ...state.budget.expenses.map(expense => [expense.desc, expense.cat, expense.amount, expense.source || "Planner 2.0"])], "Expenses", [32, 18, 14, 16], [2]);
    appendSheet(wb, [["Vendor", "Category", "Package Price", "Required Fees", "Travel / Delivery", "Rentals / Add-ons", "Likely Overtime", "Tax Rate", "True Cost", "Selected"], ...state.vendors.map(vendor => [vendor.name, vendor.category, vendor.packagePrice, vendor.fees, vendor.travel, vendor.rentals, vendor.overtime, vendor.taxRate / 100, vendorTotal(vendor), vendor.selected ? "Yes" : "No"])], "Vendors", [28, 18, 15, 14, 16, 17, 16, 11, 15, 11], [2, 3, 4, 5, 6, 8], [7]);
    appendSheet(wb, [["Payment", "Vendor", "Due Date", "Amount", "Status"], ...[...state.payments].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map(payment => [payment.name, payment.vendor, payment.dueDate, payment.amount, paymentStatus(payment).toUpperCase()])], "Payments", [28, 24, 14, 14, 14], [3]);
    appendSheet(wb, [["Group", "Current Count"], ...Object.entries(state.guests.current), ["Total", guestTotalFor(state.guests.current)], ["Catering Per Guest", state.guests.cateringRate]], "Guest Plan", [20, 16], [1]);
    appendSheet(wb, [["Scenario", "Family", "Friends", "Colleagues", "Others", "Total Guests", "Catering Estimate", "Tracked Cost / Guest", "Projected Total", "Headroom"], ...state.guests.scenarios.map(scenario => { const projection = scenarioProjection(scenario.counts); return [scenario.name, scenario.counts.Family, scenario.counts.Friends, scenario.counts.Colleagues, scenario.counts.Others, projection.total, projection.catering, projection.costPerGuest, projection.projectedTotal, projection.headroom]; })], "Guest Scenarios", [24, 11, 11, 13, 11, 13, 17, 19, 16, 14], [6, 7, 8, 9]);
    XLSX.writeFile(wb, "Wedding_Planner_2_Report.xlsx");
    markExported("Excel workbook downloaded.");
  };
  const preparePlanner2PrintReport = () => {
    const report = document.querySelector(".print-only.report-header");
    if (!report) return;
    const selected = state.vendors.filter(vendor => vendor.selected);
    const committed = selected.reduce((sum, vendor) => sum + vendorTotal(vendor), 0);
    const actualSpent = budgetExpenseTotal();
    const paid = state.payments.filter(payment => payment.paid).reduce((sum, payment) => sum + numberValue(payment.amount), 0);
    const budgetRows = Object.entries(state.budget.categories).map(([category, plannedValue]) => { const planned = numberValue(plannedValue); const used = committedFor(category) + budgetExpenseFor(category); const available = planned - used; return `<tr><td>${safe(category)}</td><td>${money2(planned)}</td><td>${money2(used)}</td><td>${available < 0 ? "-" : ""}${money2(Math.abs(available))}</td><td>${available < 0 ? "Over" : available <= planned * .25 ? "Watch" : "Available"}</td></tr>`; }).join("");
    const vendorRows = state.vendors.length ? state.vendors.map(vendor => `<tr><td>${safe(vendor.name)}</td><td>${safe(vendor.category)}</td><td>${money2(vendor.packagePrice)}</td><td>${money2(vendorTotal(vendor))}</td><td>${vendor.selected ? "Selected" : "Comparing"}</td></tr>`).join("") : `<tr><td colspan="5">No vendor quotes saved.</td></tr>`;
    const paymentRows = state.payments.length ? [...state.payments].sort((a,b) => a.dueDate.localeCompare(b.dueDate)).map(payment => `<tr><td>${safe(payment.name)}</td><td>${safe(payment.vendor || "-")}</td><td>${safe(payment.dueDate)}</td><td>${money2(payment.amount)}</td><td>${paymentStatus(payment).replace("-", " ")}</td></tr>`).join("") : `<tr><td colspan="5">No payments scheduled.</td></tr>`;
    const expenseRows = state.budget.expenses.length ? state.budget.expenses.map(expense => `<tr><td>${safe(expense.desc)}</td><td>${safe(expense.cat)}</td><td>${money2(expense.amount)}</td><td>${safe(expense.source || "Planner 2.0")}</td></tr>`).join("") : `<tr><td colspan="4">No actual expenses recorded.</td></tr>`;
    const scenarioRows = state.guests.scenarios.length ? state.guests.scenarios.map(scenario => { const projection = scenarioProjection(scenario.counts); return `<tr><td>${safe(scenario.name)}</td><td>${projection.total}</td><td>${money2(projection.catering)}</td><td>${money2(projection.projectedTotal)}</td><td>${projection.headroom < 0 ? "-" : ""}${money2(Math.abs(projection.headroom))}</td></tr>`; }).join("") : `<tr><td colspan="5">No guest scenarios saved.</td></tr>`;
    report.innerHTML = `<style>
      @page{size:A4;margin:14mm} html,body{background:#fff!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important} body>*:not(.print-only){display:none!important}.print-only.report-header{display:block!important;max-width:100%!important;text-align:left!important;font-family:Inter,Arial,sans-serif;color:#243027;border:0!important;margin:0!important;padding:0!important}.p2-print-cover{padding:22px;border:1px solid #dce6dc;border-radius:18px;background:#f5f8f3}.p2-print-cover h1{margin:4px 0;color:#33483a;font:700 30px Georgia,serif}.p2-print-kicker{margin:0;color:#6e7b6c;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.p2-print-meta{color:#647067;font-size:11px}.p2-print-cards{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:14px}.p2-print-card{padding:10px;border:1px solid #dfe6de;border-radius:10px;background:#fff}.p2-print-card span{display:block;color:#718074;font-size:9px;font-weight:800;text-transform:uppercase;margin-bottom:4px}.p2-print-card strong{font-size:13px}.p2-print-section{margin-top:16px;break-inside:auto}.p2-print-section h2{margin:0 0 7px;padding-bottom:5px;border-bottom:2px solid #dfe9dc;color:#405846;font:700 16px Georgia,serif;break-after:avoid}.p2-print-table{width:100%;border-collapse:collapse;font-size:9px}.p2-print-table th{background:#edf3ea;color:#405846;text-align:left}.p2-print-table th,.p2-print-table td{padding:6px;border-bottom:1px solid #e4e9e2}.p2-print-table tr{break-inside:avoid}.p2-print-footer{margin-top:16px;padding-top:8px;border-top:1px solid #dfe5dc;color:#728075;font-size:9px;display:flex;justify-content:space-between;gap:12px;break-inside:avoid}
    </style><header class="p2-print-cover"><p class="p2-print-kicker">Wedding Budget Planner 2.0</p><h1>Integrated Planning Report</h1><p class="p2-print-meta">Generated ${todayLabel()} · Payments are cash flow within commitments, not additional contract cost.</p><div class="p2-print-cards"><div class="p2-print-card"><span>Budget</span><strong>${money2(state.budget.total)}</strong></div><div class="p2-print-card"><span>Committed</span><strong>${money2(committed)}</strong></div><div class="p2-print-card"><span>Actual expenses</span><strong>${money2(actualSpent)}</strong></div><div class="p2-print-card"><span>Paid</span><strong>${money2(paid)}</strong></div><div class="p2-print-card"><span>Guests</span><strong>${guestTotalFor(state.guests.current)}</strong></div></div></header><section class="p2-print-section"><h2>Budget</h2><table class="p2-print-table"><thead><tr><th>Category</th><th>Planned</th><th>Used</th><th>Available</th><th>Status</th></tr></thead><tbody>${budgetRows}</tbody></table></section><section class="p2-print-section"><h2>Actual Expenses</h2><table class="p2-print-table"><thead><tr><th>Expense</th><th>Category</th><th>Amount</th><th>Source</th></tr></thead><tbody>${expenseRows}</tbody></table></section><section class="p2-print-section"><h2>Vendor Comparison</h2><table class="p2-print-table"><thead><tr><th>Vendor</th><th>Category</th><th>Package</th><th>True Cost</th><th>Status</th></tr></thead><tbody>${vendorRows}</tbody></table></section><section class="p2-print-section"><h2>Payment Schedule</h2><table class="p2-print-table"><thead><tr><th>Payment</th><th>Vendor</th><th>Due</th><th>Amount</th><th>Status</th></tr></thead><tbody>${paymentRows}</tbody></table></section><section class="p2-print-section"><h2>Guest Scenarios</h2><table class="p2-print-table"><thead><tr><th>Scenario</th><th>Guests</th><th>Catering</th><th>Projected Total</th><th>Headroom</th></tr></thead><tbody>${scenarioRows}</tbody></table></section><footer class="p2-print-footer"><span>Wedding Budget Planner 2.0 · ${todayLabel()}</span><span>Planning estimates only. Confirm prices, tax, scope, and payment terms with vendors.</span></footer>`;
  };
  document.getElementById("p2ExportVendorCsv").addEventListener("click", exportVendorCsv);
  document.getElementById("p2ExportPaymentCsv").addEventListener("click", exportPaymentCsv);
  document.getElementById("p2ExportExpenseCsv").addEventListener("click", exportExpenseCsv);
  document.getElementById("p2ExportExcel").addEventListener("click", exportPlanner2Excel);
  document.getElementById("p2PrintReport").addEventListener("click", () => { markExported("Print dialog opened. Choose Save as PDF to download the report."); preparePlanner2PrintReport(); window.print(); });
  window.addEventListener("beforeprint", preparePlanner2PrintReport);

  document.getElementById("p2BudgetInput").addEventListener("input", event => {
    state.budget.total = numberValue(event.target.value); state.progress.budgetReviewed = true; save(); render();
  });
  document.getElementById("p2BudgetRows").addEventListener("input", event => {
    if (!event.target.dataset.budgetCategory) return;
    state.budget.categories[event.target.dataset.budgetCategory] = numberValue(event.target.value); state.progress.budgetReviewed = true; save(); render();
  });
  const resetExpenseForm = () => {
    editingExpenseId = null;
    document.getElementById("p2ExpenseForm").reset();
    document.getElementById("p2ExpenseSubmit").textContent = "Add expense";
    document.getElementById("p2ExpenseCancel").hidden = true;
  };
  document.getElementById("p2ExpenseForm").addEventListener("submit", event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const amountInput = event.currentTarget.elements.amount;
    if (!data.description.trim()) { event.currentTarget.elements.description.setCustomValidity("Enter a short expense description."); event.currentTarget.reportValidity(); event.currentTarget.elements.description.setCustomValidity(""); return; }
    if (Number(data.amount) <= 0) { amountInput.setCustomValidity("Enter an expense amount greater than zero."); event.currentTarget.reportValidity(); amountInput.setCustomValidity(""); return; }
    const previousExpense = editingExpenseId ? state.budget.expenses.find(item => item.id === editingExpenseId) : null;
    const previousSource = previousExpense?.source || "Planner 2.0";
    const expense = { id: editingExpenseId || id("expense"), desc: data.description.trim(), cat: data.category, amount: numberValue(data.amount), source: previousSource === "Imported" ? "Imported (edited)" : previousSource };
    if (editingExpenseId) state.budget.expenses = state.budget.expenses.map(item => item.id === editingExpenseId ? expense : item);
    else state.budget.expenses.push(expense);
    resetExpenseForm(); save(); render();
  });
  document.getElementById("p2ExpenseCancel").addEventListener("click", resetExpenseForm);
  document.getElementById("p2GuestPlanForm").addEventListener("input", event => {
    if (event.target.id === "p2CateringRate") state.guests.cateringRate = numberValue(event.target.value);
    else if (event.target.name) state.guests.current[event.target.name] = Math.max(0, Math.floor(Number(event.target.value) || 0));
    save(); render();
  });
  document.getElementById("p2ScenarioForm").addEventListener("submit", event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const scenarioTotal = Object.keys(defaultGuestCounts()).reduce((sum, group) => sum + Math.max(0, Math.floor(Number(data[group]) || 0)), 0);
    if (!scenarioTotal) { event.currentTarget.elements.Family.setCustomValidity("Enter at least one guest before saving a scenario."); event.currentTarget.reportValidity(); event.currentTarget.elements.Family.setCustomValidity(""); return; }
    state.guests.scenarios.push({ id: id("scenario"), name: data.name.trim(), counts: Object.fromEntries(Object.keys(defaultGuestCounts()).map(group => [group, Math.max(0, Math.floor(Number(data[group]) || 0))])) });
    event.currentTarget.reset(); save(); render();
  });
  document.getElementById("p2VendorForm").addEventListener("submit", event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const costFields = ["packagePrice", "fees", "travel", "rentals", "overtime"];
    const enteredTotal = costFields.reduce((sum, field) => sum + (Number(data[field]) || 0), 0);
    if (enteredTotal <= 0) { event.currentTarget.elements.packagePrice.setCustomValidity("Enter at least one vendor cost greater than zero."); event.currentTarget.reportValidity(); event.currentTarget.elements.packagePrice.setCustomValidity(""); return; }
    if (Number(data.taxRate) < 0 || Number(data.taxRate) > 100) { event.currentTarget.elements.taxRate.setCustomValidity("Enter a tax rate from 0 to 100%."); event.currentTarget.reportValidity(); event.currentTarget.elements.taxRate.setCustomValidity(""); return; }
    const duplicateName = state.vendors.some(vendor => vendor.category === data.category && vendor.name.trim().toLowerCase() === data.name.trim().toLowerCase());
    if (duplicateName) { event.currentTarget.elements.name.setCustomValidity("A quote with this vendor name already exists in the selected category."); event.currentTarget.reportValidity(); event.currentTarget.elements.name.setCustomValidity(""); return; }
    state.vendors.push({ id: id("vendor"), name: data.name.trim(), category: data.category, packagePrice: numberValue(data.packagePrice), fees: numberValue(data.fees), travel: numberValue(data.travel), rentals: numberValue(data.rentals), overtime: numberValue(data.overtime), taxRate: numberValue(data.taxRate), selected: false });
    event.currentTarget.reset(); save(); render();
    document.getElementById("p2VendorStatus").textContent = `${data.name.trim()} was added for comparison.`;
  });
  document.getElementById("p2PaymentForm").addEventListener("submit", event => {
    event.preventDefault();
    const paymentForm = event.currentTarget;
    const data = Object.fromEntries(new FormData(paymentForm));
    const vendorName = data.vendor.trim();
    const linkedVendor = state.vendors.find(vendor => vendor.selected && vendor.name.trim().toLowerCase() === vendorName.toLowerCase());
    if (!linkedVendor) { paymentForm.elements.vendor.setCustomValidity("Choose a vendor that is currently selected on the Vendors page."); paymentForm.reportValidity(); paymentForm.elements.vendor.setCustomValidity(""); return; }
    if (Number(data.amount) <= 0) { paymentForm.elements.amount.setCustomValidity("Enter a payment amount greater than zero."); paymentForm.reportValidity(); paymentForm.elements.amount.setCustomValidity(""); return; }
    const payment = { id: id("payment"), name: data.name.trim(), vendor: linkedVendor.name, vendorId: linkedVendor.id, amount: numberValue(data.amount), dueDate: data.dueDate, paid: false };
    const addPayment = () => {
      state.payments.push(payment);
      paymentForm.reset(); save(); render();
      const isPastDue = new Date(`${payment.dueDate}T23:59:59`) < new Date();
      const status = document.getElementById("p2PaymentStatus");
      status.classList.toggle("is-warning", isPastDue);
      status.textContent = isPastDue ? `${payment.name} was added as overdue. Mark it paid if it has already been settled.` : `${payment.name} was added to the payment schedule.`;
    };
    const scheduledTotal = state.payments.filter(item => item.vendorId === linkedVendor.id).reduce((sum, item) => sum + numberValue(item.amount), 0) + payment.amount;
    const excess = scheduledTotal - vendorTotal(linkedVendor);
    if (excess > .005) {
      openConfirmation({ title: "Scheduled payments exceed the commitment", message: `Adding ${payment.name} will make scheduled payments for ${linkedVendor.name} exceed its ${money2(vendorTotal(linkedVendor))} true cost by ${money2(excess)}. Add it anyway only if the quote or payment schedule still needs updating.`, confirmLabel: "Add payment anyway", onConfirm: addPayment });
      return;
    }
    addPayment();
  });
  const applyVendorSelection = (vendorId, selectedValue, replacedCategory = null) => {
    state.vendors = state.vendors.map(vendor => {
      if (replacedCategory && vendor.category === replacedCategory && vendor.id !== vendorId) return { ...vendor, selected: false };
      return vendor.id === vendorId ? { ...vendor, selected: selectedValue } : vendor;
    });
    save(); render();
  };
  const requestVendorSelection = vendorId => {
    const vendor = state.vendors.find(item => item.id === vendorId);
    if (!vendor) return;
    const linkedPayments = state.payments.filter(payment => payment.vendorId === vendor.id);
    if (vendor.selected) {
      if (linkedPayments.length) {
        openConfirmation({ title: `Unselect ${vendor.name}?`, message: `${linkedPayments.length} payment record${linkedPayments.length === 1 ? " is" : "s are"} linked to this vendor. The records will remain in the payment tracker, but this quote will no longer count as a selected commitment.`, confirmLabel: "Unselect vendor", onConfirm: () => applyVendorSelection(vendor.id, false) });
      } else applyVendorSelection(vendor.id, false);
      return;
    }
    const existing = state.vendors.find(item => item.selected && item.category === vendor.category && item.id !== vendor.id);
    if (!existing) { applyVendorSelection(vendor.id, true); return; }
    const existingPayments = state.payments.filter(payment => payment.vendorId === existing.id);
    const paymentNote = existingPayments.length ? ` ${existingPayments.length} existing payment record${existingPayments.length === 1 ? " will" : "s will"} stay linked to ${existing.name} as historical records.` : "";
    openConfirmation({ title: `Replace the selected ${vendor.category} quote?`, message: `${existing.name} is already selected for ${vendor.category}. Replace it with ${vendor.name}?${paymentNote}`, confirmLabel: "Replace vendor", onConfirm: () => applyVendorSelection(vendor.id, true, vendor.category) });
  };
  const requestVendorRemoval = vendorId => {
    const vendor = state.vendors.find(item => item.id === vendorId);
    if (!vendor) return;
    const linkedPayments = state.payments.filter(payment => payment.vendorId === vendor.id);
    const removeVendor = () => {
      state.vendors = state.vendors.filter(item => item.id !== vendor.id);
      state.payments = state.payments.map(payment => payment.vendorId === vendor.id ? { ...payment, vendorId: "", vendor: payment.vendor || vendor.name } : payment);
      save(); render();
    };
    if (linkedPayments.length) {
      openConfirmation({ title: `Remove ${vendor.name}?`, message: `${linkedPayments.length} linked payment record${linkedPayments.length === 1 ? " will" : "s will"} remain in the tracker under ${vendor.name}. They will not be deleted or moved to another vendor.`, confirmLabel: "Remove vendor", onConfirm: removeVendor });
    } else removeVendor();
  };
  workspace.addEventListener("click", event => {
    const guideLink = event.target.closest(".planner2-guides a[href^='/']");
    const isLocalPreview = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    if (!guideLink || !isLocalPreview) return;
    event.preventDefault();
    window.location.href = `${guideLink.getAttribute("href")}.html`;
  });
  workspace.addEventListener("click", event => {
    const target = event.target.closest("button");
    if (!target) return;
    if (target.dataset.goView) { showView(target.dataset.goView, true); return; }
    if (target.dataset.selectVendor) { requestVendorSelection(target.dataset.selectVendor); return; }
    else if (target.dataset.deleteVendor) { requestVendorRemoval(target.dataset.deleteVendor); return; }
    else if (target.dataset.togglePayment) state.payments = state.payments.map(p => p.id === target.dataset.togglePayment ? { ...p, paid: !p.paid } : p);
    else if (target.dataset.deletePayment) state.payments = state.payments.filter(p => p.id !== target.dataset.deletePayment);
    else if (target.dataset.editExpense) {
      const expense = state.budget.expenses.find(item => item.id === target.dataset.editExpense);
      if (!expense) return;
      editingExpenseId = expense.id;
      const form = document.getElementById("p2ExpenseForm");
      form.elements.description.value = expense.desc;
      form.elements.category.value = expense.cat;
      form.elements.amount.value = expense.amount;
      document.getElementById("p2ExpenseSubmit").textContent = "Update expense";
      document.getElementById("p2ExpenseCancel").hidden = false;
      form.elements.description.focus();
      return;
    }
    else if (target.dataset.deleteExpense) {
      state.budget.expenses = state.budget.expenses.filter(item => item.id !== target.dataset.deleteExpense);
      if (editingExpenseId === target.dataset.deleteExpense) resetExpenseForm();
    }
    else if (target.dataset.useScenario) {
      const scenario = state.guests.scenarios.find(item => item.id === target.dataset.useScenario);
      if (scenario) state.guests.current = { ...scenario.counts };
    }
    else if (target.dataset.deleteScenario) state.guests.scenarios = state.guests.scenarios.filter(item => item.id !== target.dataset.deleteScenario);
    else return;
    save(); render();
  });
  render();
})();
