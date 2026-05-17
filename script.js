const catIcons = { 
  Venue: 'home', 
  Catering: 'utensils', 
  Photography: 'camera', 
  Decor: 'flower', 
  Entertainment: 'music',
  Attire: 'shirt',
  Transportation: 'car'
};

// Hardcoded planned reference budgets (matching Image 00ee72 / image_007675)
let categories = { 
  Venue: 12000, 
  Catering: 15000, 
  Photography: 5000, 
  Decor: 4000, 
  Entertainment: 3500,
  Attire: 3000,
  Transportation: 1500
};

// Clean state: empty of actual spent items by default, populates dynamically
let expenses = [];

let guestCounts = {
  Family: 8,
  Friends: 6,
  Colleagues: 7,
  Others: 10
};

let weddingDate = "2026-10-31"; // Default date matching image 167 Days countdown (May 17, 2026 -> Oct 31, 2026)
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
const categoryBudgetTable = document.getElementById("categoryBudgetTable");
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
    const budget = Number(totalBudgetInput ? totalBudgetInput.value : 0) || 0;
    const spent = totalSpent();
    const planned = totalPlanned();
    
    // Sync guest counts from DOM if the old plain HTML inputs exist, otherwise use stepper values
    const oldInputs = document.querySelectorAll(".guestGroup");
    if (oldInputs.length > 0 && !document.getElementById("input-Family")) {
        guestCounts.Family = Number(oldInputs[0]?.value) || 0;
        guestCounts.Friends = Number(oldInputs[1]?.value) || 0;
        guestCounts.Colleagues = Number(oldInputs[2]?.value) || 0;
        guestCounts.Others = Number(oldInputs[3]?.value) || 0;
    }
    const guests = totalGuests();
    const remaining = budget - spent;
    const costPerGuest = guests > 0 ? Math.round(spent / guests) : 0;

    // PDF Global Status
    const statusText = spent > budget ? "Over Budget" : "On Track";
    if (printStatusLabel) {
        printStatusLabel.innerText = statusText;
        printStatusLabel.style.color = spent > budget ? "#e53e3e" : "#48bb78";
    }

    // Allocation Warning Logic
    if (planned > budget) {
        if (allocationWarning) allocationWarning.style.display = "flex";
        if (warningText) warningText.innerText = `Warning: Total planned categories ($${planned.toLocaleString()}) exceed your budget by $${(planned - budget).toLocaleString()}!`;
    } else {
        if (allocationWarning) allocationWarning.style.display = "none";
    }

    // Allocation Meta Header Text
    if (allocationMeta) {
        allocationMeta.innerText = `Planned: $${planned.toLocaleString()} / $${budget.toLocaleString()}`;
        allocationMeta.style.color = planned > budget ? "#e53e3e" : "var(--text-muted)";
    }

    // Summary Card Displays
    if (remainingBudgetText) {
        remainingBudgetText.innerText = `${remaining < 0 ? '-$' : '$'}${Math.abs(remaining).toLocaleString()}`;
    }
    if (remainingCard) {
        if (remaining < 0) {
            remainingCard.className = "stat-card red-danger";
            if (remainingBudgetText) remainingBudgetText.style.color = "#c53030";
        } else {
            remainingCard.className = "stat-card green";
            if (remainingBudgetText) remainingBudgetText.style.color = "#2f855a";
        }
    } else if (remainingBudgetText) {
        remainingBudgetText.style.color = (budget - spent < 0) ? "#e53e3e" : "#2d3748";
    }

    if (totalSpentValue) totalSpentValue.innerText = `$${spent.toLocaleString()}`;
    if (totalGuestsText) totalGuestsText.innerText = guests;
    if (actualCostText) actualCostText.innerText = guests > 0 ? `$${costPerGuest.toLocaleString()}` : "$0";
    if (guestInvitedSub) guestInvitedSub.innerText = `${guests} guests invited`;
    if (guestTotalBadge) guestTotalBadge.innerText = `${guests} total`;

    // Dynamic rendering supporting both visual container block and spacious table list
    if (budgetAllocationList) {
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
                        <i data-lucide="${catIcons[c] || 'package'}" style="width:16px; height:16px; color: var(--primary);"></i>
                        <span>${c}</span>
                    </div>
                    <input type="number" class="edit-planned" data-cat="${c}" value="${categories[c]}">
                </div>
                <div class="p-bar"><div class="p-fill ${cSpent > limit ? 'bg-danger' : 'bg-primary'}" style="width:${p}%"></div></div>
                <div class="budget-alloc-spent">$${cSpent.toLocaleString()} spent</div>
            `;
            budgetAllocationList.appendChild(row);
        });
    } else if (categoryBudgetTable) {
        categoryBudgetTable.innerHTML = `<tr><th>Category</th><th>Planned ($)</th><th>Spent Progress</th><th>Remaining</th></tr>`;
        Object.keys(categories).forEach(c => {
            const row = categoryBudgetTable.insertRow();
            const cSpent = getSpent(c);
            const limit = categories[c] || 1;
            const pct = Math.min(100, (cSpent / limit) * 100);
            const barColor = cSpent > limit ? "bg-danger" : "bg-primary";
            const rem = categories[c] - cSpent;
            const remClass = rem < 0 ? "status-danger" : "";

            row.innerHTML = `
                <td style="font-weight: 600;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <i data-lucide="${catIcons[c] || 'package'}" style="width:14px; color: var(--primary);"></i>
                        <span>${c}</span>
                    </div>
                </td>
                <td><input type="number" class="edit-planned" data-cat="${c}" value="${categories[c]}" style="width:90px; padding:6px; border:1px solid #ddd; border-radius:6px; font-weight:700;"></td>
                <td>
                    <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; margin-bottom: 4px;">$${cSpent.toLocaleString()} spent</div>
                    <div class="p-bar" style="height:6px; margin:0; width:120px;"><div class="p-fill ${barColor}" style="width: ${pct}%"></div></div>
                </td>
                <td style="font-weight:700;" class="${remClass}">$${rem.toLocaleString()}</td>
            `;
        });
    }

    // Clean Expense History Table (DUE & STATUS columns removed)
    if (expenseTable) {
        expenseTable.innerHTML = `<tr><th>Item</th><th>Category</th><th>Amount</th><th class="no-print" style="width: 50px;"></th></tr>`;
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
    }

    // Spending Progress Sidebar Cards with badged statuses
    if (categoryProgress) {
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
    }

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
    if (!weddingDayCard) return;
    
    if (weddingDate) {
        const target = new Date(weddingDate);
        target.setHours(0,0,0,0);
        const current = new Date("2026-05-17"); // System default current baseline date (Sunday, May 17, 2026)
        current.setHours(0,0,0,0);
        
        const diffTime = target.getTime() - current.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (countdownBanner) countdownBanner.style.display = "block";
        if (countdownDaysText) {
            if (diffDays > 0) {
                countdownDaysText.innerHTML = `${diffDays} Days to go! 🌸`;
            } else if (diffDays === 0) {
                countdownDaysText.innerHTML = `It's Wedding Day! ❤️`;
            } else {
                countdownDaysText.innerHTML = `Married! ✨`;
            }
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
        if (countdownBanner) countdownBanner.style.display = "none";
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

// Dynmically ensure drop-down category selectors match javascript's hardcoded category structure
const expCatSelect = document.getElementById("expCat");
if (expCatSelect) {
    const existingOptions = Array.from(expCatSelect.options).map(opt => opt.value);
    Object.keys(categories).forEach(cat => {
        if (!existingOptions.includes(cat)) {
            const opt = document.createElement("option");
            opt.value = cat;
            opt.text = cat;
            expCatSelect.add(opt);
        }
    });
}

if (addExpenseBtn) {
    addExpenseBtn.onclick = () => {
        const dInput = document.getElementById("expDesc");
        const aInput = document.getElementById("expAmt");
        const cSelect = document.getElementById("expCat");
        if (dInput && aInput && cSelect && dInput.value && aInput.value) { 
            expenses.push({ desc: dInput.value, cat: cSelect.value, amount: Number(aInput.value) }); 
            dInput.value = ""; aInput.value = ""; refresh(); 
        }
    };
}

// Excel Export (Wedding Date and Location metadata integrated)
const exportExcelBtn = document.getElementById("exportExcel");
if (exportExcelBtn) {
    exportExcelBtn.onclick = () => {
        const wb = XLSX.utils.book_new();
        const summary = [
            ["WEDDING BUDGET REPORT", ""],
            ["Wedding Date Target", weddingDate ? weddingDate : "Not Set"],
            ["Location", weddingLocation ? weddingLocation : "Not Set"],
            ["Total Budget", totalBudgetInput ? Number(totalBudgetInput.value) : 0],
            ["Total Spent", totalSpent()],
            ["Total Remaining", (totalBudgetInput ? Number(totalBudgetInput.value) : 0) - totalSpent()],
            ["Financial Status", totalSpent() > (totalBudgetInput ? Number(totalBudgetInput.value) : 0) ? "OVER BUDGET" : "ON TARGET"]
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
}

const exportCsvBtn = document.getElementById("exportCsv");
if (exportCsvBtn) {
    exportCsvBtn.onclick = () => {
        let csv = `Wedding Date Target,${weddingDate ? weddingDate : "Not Set"}\nLocation,${weddingLocation ? weddingLocation : "Not Set"}\n\nDescription,Category,Amount\n`;
        expenses.forEach(e => csv += `"${e.desc}","${e.cat}",${e.amount}\n`);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'wedding_expenses.csv'; a.click();
    };
}

window.deleteExp = (i) => { expenses.splice(i, 1); refresh(); };

if (totalBudgetInput) totalBudgetInput.oninput = refresh;
document.querySelectorAll(".guestGroup").forEach(i => i.oninput = refresh);

window.onload = refresh;
