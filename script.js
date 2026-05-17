const catIcons = { 
  Venue: 'home', 
  Catering: 'utensils', 
  Photography: 'camera', 
  Decor: 'flower', 
  Entertainment: 'music',
  Attire: 'shirt',
  Transportation: 'car'
};

// Planned reference budgets strictly optimized to stay exactly within $40,000 budget - as requested
let categories = { 
  Venue: 12000, 
  Catering: 15000, 
  Photography: 5000, 
  Decor: 3000, 
  Entertainment: 2500,
  Attire: 1500,
  Transportation: 1000
};

// Clean state: empty of actual spent items by default on load - as requested
let expenses = [];

// Guest counts properly initialized to default 0 - as requested
let guestCounts = {
  Family: 0,
  Friends: 0,
  Colleagues: 0,
  Others: 0
};

// Start Date is clean (null) before the user sets it - as requested
let weddingDate = null;
let weddingLocation = ""; // Clean value on load, configurable by user

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
const printStatusLabel = document.getElementById("printStatusLabel");
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

const getSpent = (cat) => expenses.filter(e => e.cat === cat).reduce((s, e) => s + e.amount, 0);
const totalSpent = () => expenses.reduce((s, e) => s + e.amount, 0);
const totalPlanned = () => Object.values(categories).reduce((a, b) => a + b, 0);
const totalGuests = () => Object.values(guestCounts).reduce((a, b) => a + b, 0);

function refresh() {
    const budget = Number(totalBudgetInput.value) || 0;
    const spent = totalSpent();
    const planned = totalPlanned();
    const guests = totalGuests();
    const remaining = budget - spent;
    const costPerGuest = guests > 0 ? Math.round(spent / guests) : 0;

    // PDF Global Status
    const statusText = spent > budget ? "Over Budget" : "On Track";
    if (printStatusLabel) {
        printStatusLabel.innerText = statusText;
        printStatusLabel.style.color = spent > budget ? "#e53e3e" : "#48bb78";
    }

    // Allocation Warning Logic (exceed matches exact planned limit differences)
    if (planned > budget) {
        allocationWarning.style.display = "flex";
        warningText.innerText = `Warning: Total planned categories ($${planned.toLocaleString()}) exceed your budget by $${(planned - budget).toLocaleString()}!`;
    } else {
        allocationWarning.style.display = "none";
    }

    // Allocation Meta Header Text
    if (allocationMeta) {
        allocationMeta.innerText = `Planned: $${planned.toLocaleString()} / $${budget.toLocaleString()}`;
        allocationMeta.style.color = planned > budget ? "#e53e3e" : "var(--text-muted)";
    }

    // Summary Card Displays
    remainingBudgetText.innerText = `${remaining < 0 ? '-$' : '$'}${Math.abs(remaining).toLocaleString()}`;
    if (remaining < 0) {
        remainingCard.className = "stat-card red-danger";
        remainingBudgetText.style.color = "#c53030";
    } else {
        remainingCard.className = "stat-card green";
        remainingBudgetText.style.color = "#2f855a";
    }

    totalSpentValue.innerText = `$${spent.toLocaleString()}`;
    totalGuestsText.innerText = guests;
    actualCostText.innerText = guests > 0 ? `$${costPerGuest.toLocaleString()}` : "$0";
    guestInvitedSub.innerText = `${guests} guests invited`;
    guestTotalBadge.innerText = `${guests} total`;

    // Category Allocation Table with inline Progress lines
    budgetAllocationList.innerHTML = "";
    Object.keys(categories).forEach(c => {
        const cSpent = getSpent(c);
        const limit = categories[c] || 1;
        const p = Math.min(100, (cSpent / limit) * 100);
        
        const row = document.createElement("div");
        row.className = "budget-alloc-row";
        row.innerHTML = `
            <div class="budget-alloc-meta">
                <div class="budget-alloc-title">
                    <i data-lucide="${catIcons[c]}" style="width:16px; height:16px; color: var(--primary);"></i>
                    <span>${c}</span>
                </div>
                <input type="number" class="edit-planned" data-cat="${c}" value="${categories[c]}">
            </div>
            <div class="p-bar"><div class="p-fill ${cSpent > limit ? 'bg-danger' : 'bg-primary'}" style="width:${p}%"></div></div>
            <div class="budget-alloc-spent">$${cSpent.toLocaleString()} spent</div>
        `;
        budgetAllocationList.appendChild(row);
    });

    // Clean single-header Expense History Table (Duplicate row bug resolved)
    expenseTable.innerHTML = "";
    if (expenses.length === 0) {
        const row = expenseTable.insertRow();
        row.innerHTML = `<td colspan="4" style="text-align:center; color:var(--text-muted); padding: 25px;">No expenses yet. Add your first expense above.</td>`;
    } else {
        expenses.forEach((e, i) => {
            const row = expenseTable.insertRow();
            row.innerHTML = `
                <td>${e.desc}</td>
                <td><span class="status-badge" style="background:#f3f4f6; color:#4b5563;">${e.cat}</span></td>
                <td style="font-weight:700;">$${e.amount.toLocaleString()}</td>
                <td class="no-print" style="text-align:right;"><button onclick="deleteExp(${i})" class="remove-btn"><i data-lucide="trash-2" style="width:14px; height:14px;"></i></button></td>
            `;
        });
    }

    // Spending Progress Sidebar Cards with badged statuses
    categoryProgress.innerHTML = "";
    Object.keys(categories).forEach(c => {
        const s = getSpent(c);
        const limit = categories[c] || 1;
        const p = Math.min(100, (s / limit) * 100);
        
        let statusBadge = `<span class="badge badge-safe">SAFE</span>`;
        let barColor = "bg-safe";
        let subText = `Spent: $${s.toLocaleString()}`;

        if (s > limit) {
            statusBadge = `<span class="badge badge-over">OVER</span>`;
            barColor = "bg-danger";
            subText = `Spent: $${s.toLocaleString()} <span style="color:#e53e3e; font-weight:700; margin-left:8px;">+$${(s - limit).toLocaleString()} over</span>`;
        } else if (p > 80) {
            statusBadge = `<span class="badge badge-track">ON TRACK</span>`;
            barColor = "bg-warning";
            subText = `Spent: $${s.toLocaleString()}`;
        }

        const div = document.createElement("div");
        div.className = "progress-item-block";
        div.style.marginBottom = "1.5rem";
        div.innerHTML = `
            <div class="progress-block-header" style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; font-weight:700; margin-bottom:4px;">
                <span class="progress-block-title" style="display:flex; align-items:center; gap:6px;">${c} ${statusBadge}</span>
                <span class="progress-block-percent" style="color:var(--text-muted); font-size:0.8rem;">${Math.round(p)}% of $${limit.toLocaleString()}</span>
            </div>
            <div class="p-bar" style="height:8px; background:#edf2f7; border-radius:6px; overflow:hidden;"><div class="p-fill ${barColor}" style="width:${p}%"></div></div>
            <div class="progress-block-spent" style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">${subText}</div>
        `;
        categoryProgress.appendChild(div);
    });

    // Dynamic countdown card and top hero banner sync
    renderWeddingDayTracker();

    // Guest counter manual field values sync
    Object.keys(guestCounts).forEach(g => {
        const valInput = document.getElementById(`input-${g}`);
        if (valInput) valInput.value = guestCounts[g];
    });

    // Loops and evaluates all category warning triggers dynamically
    updateSmartTips(planned, budget, spent, remaining, costPerGuest);

    // Sync Print PDF Details
    const printDateMeta = document.getElementById("printDateMeta");
    const printWeddingDetails = document.getElementById("printWeddingDetails");
    if (printDateMeta) {
        printDateMeta.innerText = `Report Generated: ${new Date().toLocaleDateString()}`;
    }
    if (printWeddingDetails) {
        printWeddingDetails.innerHTML = `
            <p style="margin: 5px 0;"><strong>Wedding Date:</strong> ${weddingDate ? weddingDate : 'Not Set'}</p>
            <p style="margin: 5px 0;"><strong>Location:</strong> ${weddingLocation ? weddingLocation : 'Not Set'}</p>
            <p style="margin: 5px 0;"><strong>Guest Count:</strong> ${guests} guests invited</p>
        `;
    }

    if (window.lucide) lucide.createIcons();

    document.querySelectorAll(".edit-planned").forEach(input => {
        input.oninput = (e) => {
            categories[e.target.dataset.cat] = Number(e.target.value) || 0;
            refresh();
        };
    });
}

// Interactive Guest actions (Both Buttons and Manual inputs synchronized)
window.adjustGuests = (group, delta) => {
    guestCounts[group] = Math.max(0, guestCounts[group] + delta);
    refresh();
};

window.setGuestManual = (group, value) => {
    guestCounts[group] = Math.max(0, parseInt(value) || 0);
    refresh();
};

// Wedding Day tracker state render logic (Save vs Change toggle state)
function renderWeddingDayTracker() {
    if (weddingDate) {
        const target = new Date(weddingDate);
        target.setHours(0,0,0,0);
        const current = new Date("2026-05-17"); // System default current baseline date (Sunday, May 17, 2026)
        current.setHours(0,0,0,0);
        
        const diffTime = target.getTime() - current.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        countdownBanner.style.display = "block";
        if (diffDays > 0) {
            countdownDaysText.innerHTML = `${diffDays} Days to go! 🌸`;
        } else if (diffDays === 0) {
            countdownDaysText.innerHTML = `It's Wedding Day! ❤️`;
        } else {
            countdownDaysText.innerHTML = `Married! ✨`;
        }

        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = target.toLocaleDateString('en-US', dateOptions);

        weddingDayCard.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:1rem;">
                <div class="tracker-icon-circle" style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center;"><i data-lucide="heart" style="width:16px; height:16px; color:#fff;"></i></div>
                <h2 style="border:none; margin:0; padding:0;">Wedding Day</h2>
            </div>
            <div class="days-remaining-display" style="text-align:center; margin:1.5rem 0;">
                <div class="big-days-num" style="font-size:3.8rem; font-weight:900; color:var(--text-main); line-height:1;">${diffDays > 0 ? diffDays : 0}</div>
                <div class="days-subtext" style="font-size:0.8rem; font-weight:700; color:var(--text-muted); letter-spacing:0.15em; margin-top:5px;">DAYS TO GO</div>
            </div>
            <div class="day-tracker-footer" style="border-top: 1px solid #edf2f7; padding-top:1rem; display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; font-weight:600; color:var(--text-muted);">
                <span>${formattedDate}</span>
                <a href="#" onclick="changeDate(); return false;" class="change-link" style="color:var(--primary); text-decoration:none;">Change</a>
            </div>
        `;
    } else {
        countdownBanner.style.display = "none";
        weddingDayCard.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:1rem;">
                <div class="tracker-icon-circle" style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center;"><i data-lucide="heart" style="width:16px; height:16px; color:#fff;"></i></div>
                <h2 style="border:none; margin:0; padding:0;">Wedding Day</h2>
            </div>
            <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">Set your wedding date</p>
            <div style="display:flex; flex-direction:column; gap:8px;">
                <input type="date" id="weddingDateInput" style="width:100%; box-sizing:border-box;" value="2026-10-31">
                <input type="text" id="weddingLocationInput" placeholder="Location Name (e.g., Paris)" value="${weddingLocation}" oninput="weddingLocation = this.value; refresh();" style="width:100%; box-sizing:border-box; margin-bottom: 8px;">
                <button id="saveDate" onclick="saveDateValue()" style="width:100%;">Save Wedding Date</button>
            </div>
        `;
    }
}

window.saveDateValue = () => {
    const picker = document.getElementById("weddingDateInput");
    if (picker && picker.value) {
        weddingDate = picker.value;
        refresh();
    }
};

window.changeDate = () => {
    weddingDate = null;
    refresh();
};

// Loop evaluation of all Categories warnings
function updateSmartTips(planned, budget, spent, remaining, costPerGuest) {
    if (!smartTipsCard || !smartTipsContent) return;
    let tips = [];

    // 1. Over-allocated Warning
    if (planned > budget) {
        tips.push({
            type: "danger",
            title: "Over-Allocated",
            icon: "alert-triangle",
            desc: `Your planned spending ($${planned.toLocaleString()}) exceeds your total budget. Consider reducing some categories.`
        });
    }

    // 2. High Cost Per Guest Warning
    if (costPerGuest > 300) {
        tips.push({
            type: "warning",
            title: "High Cost Per Guest",
            icon: "user",
            desc: `Your cost per guest is $${costPerGuest.toLocaleString()}. The average is $200–$300. Consider trimming your guest list or budget.`
        });
    }

    // 3. Budget Running Low Warning
    if (remaining < (budget * 0.15)) {
        tips.push({
            type: "danger",
            title: "Budget Running Low",
            icon: "wallet",
            desc: remaining < 0 
                ? `You have exceeded your total budget by $${Math.abs(remaining).toLocaleString()}. Prioritize must-haves and consider cutting nice-to-haves.`
                : `You only have $${remaining.toLocaleString()} left. Prioritize must-haves and consider cutting nice-to-haves.`
        });
    }

    // 4. Over category limits checks
    Object.keys(categories).forEach(c => {
        const catSpent = getSpent(c);
        const catLimit = categories[c] || 0;
        if (catLimit > 0) {
            if (catSpent > catLimit) {
                tips.push({
                    type: "danger",
                    title: `${c} Over Budget`,
                    icon: "alert-triangle",
                    desc: `You are over your ${c} budget by $${(catSpent - catLimit).toLocaleString()}. Check if you can reduce costs.`
                });
            } else if (catSpent > (catLimit * 0.85)) {
                tips.push({
                    type: "warning",
                    title: `${c} Near Limit`,
                    icon: "trending-up",
                    desc: `You are close to your ${c} budget limit ($${catLimit.toLocaleString()}). Check if there are cheaper alternatives.`
                });
            }
        }
    });

    if (tips.length > 0) {
        smartTipsCard.style.display = "block";
        smartTipsContent.innerHTML = tips.map(t => `
            <div class="tip-alert-box tip-${t.type}" style="border-radius:12px; padding:12px; border:1px solid; margin-bottom:10px; font-size:0.85rem; line-height:1.4;">
                <div class="tip-alert-header" style="display:flex; align-items:center; gap:8px; font-weight:700; margin-bottom:4px;">
                    <i data-lucide="alert-circle" style="width:16px; height:16px;"></i>
                    <span>${t.title}</span>
                </div>
                <p style="margin:0; color:inherit; font-size:0.8rem;">${t.desc}</p>
            </div>
        `).join('');
        if (window.lucide) lucide.createIcons();
    } else {
        smartTipsCard.style.display = "none";
    }
}

addExpenseBtn.onclick = () => {
    const dInput = document.getElementById("expDesc");
    const aInput = document.getElementById("expAmt");
    const cSelect = document.getElementById("expCat");
    if (dInput.value && aInput.value) { 
        expenses.push({ desc: dInput.value, cat: cSelect.value, amount: Number(aInput.value) }); 
        dInput.value = ""; aInput.value = ""; refresh(); 
    }
};

// Excel Export (Wedding Date, Location and Cost Per Guest metadata integrated)
document.getElementById("exportExcel").onclick = () => {
    const wb = XLSX.utils.book_new();
    const summary = [
        ["WEDDING BUDGET REPORT", ""],
        ["Wedding Date Target", weddingDate ? weddingDate : "Not Set"],
        ["Location", weddingLocation ? weddingLocation : "Not Set"],
        ["Total Budget", Number(totalBudgetInput.value)],
        ["Total Spent", totalSpent()],
        ["Total Remaining", Number(totalBudgetInput.value) - totalSpent()],
        ["Financial Status", totalSpent() > Number(totalBudgetInput.value) ? "OVER BUDGET" : "ON TARGET"],
        ["Cost Per Guest", actualCostText ? actualCostText.innerText : "$0"]
    ];
    Xxlsx_append(wb, summary, "Summary");
    const breakdn = [["Category", "Planned Budget", "Actual Spent", "Remaining Balance"]];
    Object.keys(categories).forEach(c => breakdn.push([c, categories[c], getSpent(c), categories[c] - getSpent(c)]));
    Xxlsx_append(wb, breakdn, "Breakdown");
    const trans = [["Description", "Category", "Amount"]];
    expenses.forEach(e => trans.push([e.desc, e.cat, e.amount]));
    Xxlsx_append(wb, trans, "Transactions");
    XLSX.writeFile(wb, "Wedding_Budget_Planner.xlsx");
};

// Helper to secure excel worksheets append logic
function Xxlsx_append(wb, data, sheetName) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), sheetName);
}

document.getElementById("exportCsv").onclick = () => {
    let csv = `Wedding Date Target,${weddingDate ? weddingDate : "Not Set"}\nLocation,${weddingLocation ? weddingLocation : "Not Set"}\n\nDescription,Category,Amount\n`;
    expenses.forEach(e => csv += `"${e.desc}","${e.cat}",${e.amount}\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'wedding_expenses.csv'; a.click();
};

window.deleteExp = (i) => { expenses.splice(i, 1); refresh(); };
window.onload = refresh;
totalBudgetInput.oninput = refresh;
