const catIcons = { 
  Venue: 'home', 
  Catering: 'utensils', 
  Photography: 'camera', 
  Decor: 'flower', 
  Entertainment: 'music',
  Attire: 'shirt',
  Transportation: 'car'
};

// Initial state parameters aligned directly with user screenshots
let categories = { 
  Venue: 12000, 
  Catering: 15000, 
  Photography: 5000, 
  Decor: 4000, 
  Entertainment: 3500,
  Attire: 3000,
  Transportation: 1500
};

let expenses = [
  { desc: "Venue Initial Booking", cat: "Venue", amount: 2222 },
  { desc: "Catering Deposit", cat: "Catering", amount: 34343 },
  { desc: "Professional Video Sourcing", cat: "Photography", amount: 21121 },
  { desc: "Table Centerpieces", cat: "Decor", amount: 3111 },
  { desc: "Cocktail Jazz Performance", cat: "Entertainment", amount: 1222 },
  { desc: "Bridal Gown & Fitting Layout", cat: "Attire", amount: 23232 },
  { desc: "Transportation logistics", cat: "Transportation", amount: 800 }
];

let guestCounts = {
  Family: 8,
  Friends: 6,
  Colleagues: 7,
  Others: 10
};

// Default date calculated as exactly +75 days from May 17, 2026 to July 31, 2026
let weddingDate = "2026-07-31"; 

// DOM Elements
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

    // 1. PDF Global Status
    if (printStatusLabel) {
        printStatusLabel.innerText = spent > budget ? "Over Budget" : "On Track";
        printStatusLabel.style.color = spent > budget ? "#e53e3e" : "#48bb78";
    }

    // 2. Budget Header Allocation warning metadata
    if (allocationMeta) {
        allocationMeta.innerText = `Planned: $${planned.toLocaleString()} / $${budget.toLocaleString()}`;
        allocationMeta.style.color = planned > budget ? "#e53e3e" : "var(--text-muted)";
    }

    // Standard Allocation Warning Logic box
    if (planned > budget) {
        allocationWarning.style.display = "flex";
        warningText.innerText = `Your planned allocations exceed your total budget. Consider adjusting.`;
    } else {
        allocationWarning.style.display = "none";
    }

    // 3. Header Stats Summary Cards Setup
    remainingBudgetText.innerText = `${remaining < 0 ? '-$' : '$'}${Math.abs(remaining).toLocaleString()}`;
    if (remaining < 0) {
        remainingCard.className = "stat-card red-danger";
        remainingBudgetText.style.color = "#c53030";
    } else {
        remainingCard.className = "stat-card green";
        remainingBudgetText.style.color = "#2f855a";
    }
    
    totalSpentValue.innerText = `$${spent.toLocaleString()}`;
    actualCostText.innerText = `$${costPerGuest.toLocaleString()}`;
    guestInvitedSub.innerText = `${guests} guests invited`;
    guestTotalBadge.innerText = `${guests} total`;

    // 4. Budget Allocation Widget Rendering (Matches Screenshot 1 & Image 00ee72)
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

    // 5. Expense History Table Rendering
    expenseTable.innerHTML = `<tr><th>Item</th><th>Category</th><th>Due</th><th>Status</th><th>Amount</th><th class="no-print"></th></tr>`;
    expenses.forEach((e, i) => {
        const row = expenseTable.insertRow();
        row.innerHTML = `
            <td>${e.desc}</td>
            <td>${e.cat}</td>
            <td style="color:var(--text-muted); font-size:0.85rem;">—</td>
            <td><span class="status-badge">Pending</span></td>
            <td style="font-weight:700;">$${e.amount.toLocaleString()}</td>
            <td class="no-print" style="text-align:right;"><button onclick="deleteExp(${i})" class="remove-btn"><i data-lucide="trash-2" style="width:14px; height:14px;"></i></button></td>
        `;
    });

    // 6. Spending Progress Sidebar (Matches screenshot 2 & Image 00ee38)
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
        } else if (p > 75) {
            statusBadge = `<span class="badge badge-track">ON TRACK</span>`;
            barColor = "bg-warning";
            subText = `Spent: $${s.toLocaleString()}`;
        }

        const div = document.createElement("div");
        div.className = "progress-item-block";
        div.innerHTML = `
            <div class="progress-block-header">
                <span class="progress-block-title">${c} ${statusBadge}</span>
                <span class="progress-block-percent">${Math.round(p)}% of $${limit.toLocaleString()}</span>
            </div>
            <div class="p-bar"><div class="p-fill ${barColor}" style="width:${p}%"></div></div>
            <div class="progress-block-spent">${subText}</div>
        `;
        categoryProgress.appendChild(div);
    });

    // 7. Dynamic Wedding Countdown State Switching Logic
    renderWeddingDayTracker();

    // 8. Guest Counter value synchronization
    Object.keys(guestCounts).forEach(g => {
        const valSpan = document.getElementById(`count-${g}`);
        if (valSpan) valSpan.innerText = guestCounts[g];
    });

    // 9. Smart Tips Engine (Only displays contextual alerts if warning triggers are met)
    renderSmartTips(planned, budget, spent, remaining, costPerGuest);

    if (window.lucide) lucide.createIcons();
    
    // Bind change allocation events
    document.querySelectorAll(".edit-planned").forEach(input => {
        input.oninput = (e) => {
            categories[e.target.dataset.cat] = Number(e.target.value) || 0;
            refresh();
        };
    });
}

// Interactive Guest actions (Plus/Minus Increment button system)
window.adjustGuests = (group, delta) => {
    guestCounts[group] = Math.max(0, guestCounts[group] + delta);
    refresh();
};

// Wedding Day Tracker Renderer with state-switching UI (Save vs Change)
function renderWeddingDayTracker() {
    if (weddingDate) {
        // Calculate days cleanly to July 31, 2026
        const target = new Date(weddingDate);
        target.setHours(0,0,0,0);
        const current = new Date("2026-05-17"); // Fixed current baseline system date
        current.setHours(0,0,0,0);
        
        const diffTime = target.getTime() - current.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Update top Countdown Banner
        countdownBanner.style.display = "block";
        if (diffDays > 0) {
            countdownDaysText.innerHTML = `${diffDays} Days to go! 🌸`;
        } else if (diffDays === 0) {
            countdownDaysText.innerHTML = `It's Wedding Day! ❤️`;
        } else {
            countdownDaysText.innerHTML = `Married! ✨`;
        }

        // Render card with Saved Countdown layout (Screenshot 4)
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = target.toLocaleDateString('en-US', dateOptions);

        weddingDayCard.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:1rem;">
                <div class="tracker-icon-circle"><i data-lucide="heart" style="width:16px; height:16px; color:#fff;"></i></div>
                <h2 style="border:none; margin:0; padding:0;">Wedding Day</h2>
            </div>
            <div class="days-remaining-display">
                <div class="big-days-num">${diffDays > 0 ? diffDays : 0}</div>
                <div class="days-subtext">DAYS TO GO</div>
            </div>
            <div class="day-tracker-footer">
                <span>${formattedDate}</span>
                <a href="#" onclick="changeDate(); return false;" class="change-link">Change</a>
            </div>
        `;
    } else {
        // Render card with input Date form layout
        countdownBanner.style.display = "none";
        weddingDayCard.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:1rem;">
                <div class="tracker-icon-circle"><i data-lucide="heart" style="width:16px; height:16px; color:#fff;"></i></div>
                <h2 style="border:none; margin:0; padding:0;">Wedding Day</h2>
            </div>
            <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">Set your wedding date</p>
            <input type="date" id="weddingDateInput" style="margin-bottom:1rem;" value="2026-07-31">
            <button id="saveDate" onclick="saveDateValue()">Save Date</button>
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

// Smart Tips Engine displaying custom UI elements only on warning state triggers
function renderSmartTips(planned, budget, spent, remaining, costPerGuest) {
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

    // 4. Catering Near Limit Warning (Check Category specific parameters)
    const cateringSpent = getSpent("Catering");
    const cateringLimit = categories["Catering"] || 0;
    if (cateringSpent > (cateringLimit * 0.85)) {
        tips.push({
            type: "warning",
            title: "Catering Near Limit",
            icon: "utensils",
            desc: "You are close to your catering budget. Check if the menu can be adjusted or if a buffet saves costs."
        });
    }

    // Conditional visibility: Only show card if tips array contains items
    if (tips.length > 0) {
        smartTipsCard.style.display = "block";
        smartTipsContent.innerHTML = tips.map(t => `
            <div class="tip-alert-box tip-${t.type}">
                <div class="tip-alert-header">
                    <i data-lucide="${t.icon}" style="width:16px; height:16px;"></i>
                    <strong>${t.title}</strong>
                </div>
                <p>${t.desc}</p>
            </div>
        `).join('');
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

// Excel Export retaining Summary, Breakdowns and itemized Expense transactions
document.getElementById("exportExcel").onclick = () => {
    const wb = XLSX.utils.book_new();
    const summary = [
        ["WEDDING BUDGET REPORT", ""],
        ["Wedding Date Target", weddingDate ? weddingDate : "Not Specified"],
        ["Total Budget", Number(totalBudgetInput.value)],
        ["Total Spent", totalSpent()],
        ["Total Remaining", Number(totalBudgetInput.value) - totalSpent()],
        ["Financial Status", totalSpent() > Number(totalBudgetInput.value) ? "OVER BUDGET" : "ON TARGET"]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "Summary");
    const breakdn = [["Category", "Planned Budget", "Actual Spent", "Remaining Balance"]];
    Object.keys(categories).forEach(c => breakdn.push([c, categories[c], getSpent(c), categories[c] - getSpent(c)]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(breakdn), "Breakdown");
    const trans = [["Description", "Category", "Amount"]];
    expenses.forEach(e => trans.push([e.desc, e.cat, e.amount]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(trans), "Transactions");
    XLSX.writeFile(wb, "Wedding_Budget_Planner.xlsx");
};

document.getElementById("exportCsv").onclick = () => {
    let csv = "Description,Category,Amount\n";
    expenses.forEach(e => csv += `"${e.desc}","${e.cat}",${e.amount}\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'wedding_expenses.csv'; a.click();
};

window.deleteExp = (i) => { expenses.splice(i, 1); refresh(); };
window.onload = refresh;
totalBudgetInput.oninput = refresh;
