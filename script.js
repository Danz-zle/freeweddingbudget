const catIcons = { Venue: 'home', Catering: 'utensils', Photography: 'camera', Decor: 'flower', Entertainment: 'music' };
let categories = { Venue: 8000, Catering: 12000, Photography: 4000, Decor: 3000, Entertainment: 3000 };
let expenses = [];
let weddingDate = null;

// DOM Elements
const totalBudgetInput = document.getElementById("totalBudget");
const remainingBudgetText = document.getElementById("remainingBudget");
const categoryBudgetTable = document.getElementById("categoryBudgetTable");
const expenseTable = document.getElementById("expenseTable");
const categoryProgress = document.getElementById("categoryProgress");
const totalGuestsText = document.getElementById("totalGuests");
const actualCostText = document.getElementById("actualCostPerGuest");
const addExpenseBtn = document.getElementById("addExpense");
const allocationWarning = document.getElementById("allocationWarning");
const warningText = document.getElementById("warningText");
const printStatusLabel = document.getElementById("printStatusLabel");
const weddingDateInput = document.getElementById("weddingDateInput");
const countdownContainer = document.getElementById("countdownContainer");
const countdownDisplay = document.getElementById("countdownDisplay");

const getSpent = (cat) => expenses.filter(e => e.cat === cat).reduce((s, e) => s + e.amount, 0);
const totalSpent = () => expenses.reduce((s, e) => s + e.amount, 0);
const totalPlanned = () => Object.values(categories).reduce((a, b) => a + b, 0);

function updateCountdown() {
    if (!weddingDate) {
        countdownContainer.style.display = "none";
        return;
    }
    const now = new Date();
    const diff = weddingDate - now;
    
    if (diff <= 0) {
        countdownDisplay.innerText = "It's Wedding Day! ❤️";
        countdownContainer.style.display = "block";
        return;
    }

    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    countdownDisplay.innerText = `${days} Days to go! 🌸`;
    countdownContainer.style.display = "block";
}

function refresh() {
    const budget = Number(totalBudgetInput.value) || 0;
    const spent = totalSpent();
    const planned = totalPlanned();
    
    const guests = Array.from(document.querySelectorAll(".guestCount")).reduce((s, g) => s + (Number(g.value) || 0), 0);

    // Allocation Warning
    if (planned > budget) {
        allocationWarning.style.display = "flex";
        warningText.innerText = `Warning: Allocated $${planned.toLocaleString()} exceeds your $${budget.toLocaleString()} budget by $${(planned - budget).toLocaleString()}!`;
    } else {
        allocationWarning.style.display = "none";
    }

    // Remaining Balance UI
    const remaining = budget - spent;
    remainingBudgetText.innerText = `$${remaining.toLocaleString()}`;
    remainingBudgetText.className = remaining < 0 ? "status-danger" : "status-safe";
    printStatusLabel.innerText = remaining < 0 ? "OVER BUDGET" : "ON TARGET";
    printStatusLabel.className = `p-status-msg ${remaining < 0 ? 'status-danger' : 'status-safe'}`;

    // Table: Budget Allocation with inline Status Bars
    categoryBudgetTable.querySelector("tbody").innerHTML = Object.keys(categories).map(c => {
        const cSpent = getSpent(c);
        const perc = Math.min((cSpent / categories[c]) * 100, 100) || 0;
        const barClass = perc >= 100 ? "bg-danger" : (perc > 85 ? "bg-warning" : "bg-safe");
        
        return `
            <tr>
                <td style="font-weight:600;">
                   <div style="display:flex; align-items:center; gap:8px;">
                     <i data-lucide="${catIcons[c]}" style="width:14px;"></i> ${c}
                   </div>
                </td>
                <td><input type="number" value="${categories[c]}" onchange="updateCat('${c}', this.value)" style="width:90px; padding:4px;"></td>
                <td>
                    <div style="font-size:0.8rem; margin-bottom:4px; color:var(--text-muted); font-weight:600;">$${cSpent.toLocaleString()} spent</div>
                    <div class="p-bar" style="height:6px; margin-bottom:0; width:120px;"><div class="p-fill ${barClass}" style="width: ${perc}%"></div></div>
                </td>
                <td class="${categories[c] - cSpent < 0 ? 'status-danger' : ''}">$${(categories[c] - cSpent).toLocaleString()}</td>
            </tr>
        `;
    }).join('');

    // Table: Expenses
    expenseTable.querySelector("tbody").innerHTML = expenses.map((e, i) => `
        <tr>
            <td>${e.desc}</td>
            <td><span style="font-size:0.8rem; background:#f0f4f8; padding:2px 6px; border-radius:4px;">${e.cat}</span></td>
            <td>$${e.amount.toLocaleString()}</td>
            <td><button onclick="removeExpense(${i})" style="padding:4px 8px; background:#fed7d7; color:#c53030; width:auto;"><i data-lucide="trash-2" style="width:14px;"></i></button></td>
        </tr>
    `).join('');

    // Summary Visualization (Right Sidebar)
    categoryProgress.innerHTML = Object.keys(categories).map(c => {
        const pSpent = getSpent(c);
        const perc = Math.min((pSpent / categories[c]) * 100, 100) || 0;
        const statusClass = perc >= 100 ? "bg-danger" : (perc > 85 ? "bg-warning" : "bg-safe");
        return `
            <div class="progress-item">
                <div class="p-label">
                    <span>${c}</span>
                    <span>${perc.toFixed(0)}%</span>
                </div>
                <div class="p-bar"><div class="p-fill ${statusClass}" style="width: ${perc}%"></div></div>
            </div>
        `;
    }).join('');

    totalGuestsText.innerText = guests.toLocaleString();
    actualCostText.innerText = guests > 0 ? `$${Math.round(spent / guests).toLocaleString()}` : "$0";
    
    updateCountdown();
    lucide.createIcons();
}

// Actions
window.updateCat = (cat, val) => { categories[cat] = Number(val); refresh(); };
window.removeExpense = (i) => { expenses.splice(i, 1); refresh(); };

addExpenseBtn.onclick = () => {
    const dInput = document.getElementById("expenseDesc");
    const cSelect = document.getElementById("expenseCat");
    const aInput = document.getElementById("expenseAmount");
    if (dInput.value && aInput.value) { 
        expenses.push({ desc: dInput.value, cat: cSelect.value, amount: Number(aInput.value) }); 
        dInput.value = ""; aInput.value = ""; refresh(); 
    }
};

totalBudgetInput.oninput = refresh;

// Wedding Date Action
document.getElementById("saveDate").onclick = () => {
    const val = weddingDateInput.value;
    if (val) {
        weddingDate = new Date(val);
        refresh();
    }
};

document.getElementById("addGroup").onclick = () => {
    const div = document.createElement("div");
    div.className = "guestGroup";
    div.style.marginBottom = "10px";
    div.innerHTML = `
        <input type="text" placeholder="Group Name" style="margin-bottom:5px;">
        <div style="display:flex; gap:5px;">
            <input type="number" class="guestCount" value="0" oninput="refresh()" style="flex:1;">
            <button onclick="this.parentElement.parentElement.remove(); refresh();" style="width:40px; background:#fed7d7; color:#c53030;">×</button>
        </div>
    `;
    document.getElementById("guestList").appendChild(div);
    refresh();
};

// Excel Export
document.getElementById("exportExcel").onclick = () => {
    const wb = XLSX.utils.book_new();
    const summary = [
        ["WEDDING BUDGET REPORT", ""],
        ["Wedding Date", weddingDate ? weddingDate.toDateString() : "Not Set"],
        ["Total Budget", Number(totalBudgetInput.value)],
        ["Total Spent", totalSpent()],
        ["Total Remaining", Number(totalBudgetInput.value) - totalSpent()]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "Summary");
    const breakdn = [["Category", "Planned Budget", "Actual Spent", "Remaining Balance"]];
    Object.keys(categories).forEach(c => breakdn.push([c, categories[c], getSpent(c), categories[c] - getSpent(c)]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(breakdn), "Breakdown");
    XLSX.writeFile(wb, "Wedding_Budget_Plan.xlsx");
};

document.getElementById("exportCsv").onclick = () => {
    let csv = "Description,Category,Amount\n";
    expenses.forEach(e => csv += `${e.desc},${e.cat},${e.amount}\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'wedding_expenses.csv'; a.click();
};

// Initial Load
document.querySelectorAll(".guestCount").forEach(input => input.oninput = refresh);
refresh();
