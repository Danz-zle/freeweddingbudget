const catIcons = { Venue: 'home', Catering: 'utensils', Photography: 'camera', Decor: 'flower', Entertainment: 'music' };
let categories = { Venue: 8000, Catering: 12000, Photography: 4000, Decor: 3000, Entertainment: 3000 };
let expenses = [];

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

const getSpent = (cat) => expenses.filter(e => e.cat === cat).reduce((s, e) => s + e.amount, 0);
const totalSpent = () => expenses.reduce((s, e) => s + e.amount, 0);
const totalPlanned = () => Object.values(categories).reduce((a, b) => a + b, 0);

function refresh() {
    const budget = Number(totalBudgetInput.value) || 0;
    const spent = totalSpent();
    const planned = totalPlanned();
    const guests = Array.from(document.querySelectorAll(".guestGroup")).reduce((s,g) => s + (Number(g.value)||0), 0);

    // Global Status for Header
    const statusText = spent > budget ? "Over Budget" : "On Track";
    if (printStatusLabel) {
        printStatusLabel.innerText = statusText;
        printStatusLabel.style.color = spent > budget ? "#e53e3e" : "#48bb78";
    }

    // Budget Warnings
    if (planned > budget) {
        allocationWarning.style.display = "flex";
        warningText.innerText = `Warning: Total planned categories exceed your budget by $${(planned - budget).toLocaleString()}!`;
    } else {
        allocationWarning.style.display = "none";
    }

    remainingBudgetText.innerText = `$${(budget - spent).toLocaleString()}`;
    remainingBudgetText.style.color = (budget - spent < 0) ? "#e53e3e" : "#2d3748";
    totalGuestsText.innerText = guests;
    actualCostText.innerText = guests > 0 ? `$${Math.round(spent / guests).toLocaleString()}` : "$0";

    // Allocation Table
    categoryBudgetTable.innerHTML = `<tr><th>Category</th><th>Planned ($)</th><th>Actual Spent</th></tr>`;
    Object.keys(categories).forEach(c => {
        const row = categoryBudgetTable.insertRow();
        row.innerHTML = `
            <td><i data-lucide="${catIcons[c]}" style="width:14px; vertical-align:middle; margin-right:8px; color:#be185d"></i> ${c}</td>
            <td><input type="number" class="edit-planned" data-cat="${c}" value="${categories[c]}" style="width:110px; padding:6px; border:1px solid #ddd; border-radius:6px;"></td>
            <td style="font-weight:600">$${getSpent(c).toLocaleString()}</td>
        `;
    });

    // History Table
    expenseTable.innerHTML = `<tr><th>Description</th><th>Category</th><th>Amount</th><th class="no-print"></th></tr>`;
    expenses.forEach((e, i) => {
        const row = expenseTable.insertRow();
        row.innerHTML = `<td>${e.desc}</td><td>${e.cat}</td><td>$${e.amount.toLocaleString()}</td>
        <td class="no-print" style="text-align:right;"><button onclick="deleteExp(${i})" style="padding:6px 12px; background:#fee2e2; color:#ef4444; font-size:11px; border-radius:6px; border:none;">Remove</button></td>`;
    });

    // Spending Progress with Restored Status Messages
    categoryProgress.innerHTML = "";
    Object.keys(categories).forEach(c => {
        const s = getSpent(c);
        const limit = categories[c] || 1;
        const p = Math.min(100, (s / limit) * 100);
        
        let colorClass = "bg-safe";
        let statusMsg = "Safe";
        let statusClass = "status-safe";

        if (s > limit) {
            colorClass = "bg-danger";
            statusMsg = "Over Budget";
            statusClass = "status-danger";
        } else if (p > 80) {
            colorClass = "bg-warning";
            statusMsg = "Near Limit";
            statusClass = "status-warning";
        }

        const div = document.createElement("div");
        div.className = "progress-item";
        div.innerHTML = `
            <div class="p-label"><span>${c}</span><span>${Math.round(p)}%</span></div>
            <div class="p-bar"><div class="p-fill ${colorClass}" style="width:${p}%"></div></div>
            <div class="p-status-msg ${statusClass}">${statusMsg}</div>
        `;
        categoryProgress.appendChild(div);
    });

    if (window.lucide) lucide.createIcons();
    document.querySelectorAll(".edit-planned").forEach(input => {
        input.oninput = (e) => {
            categories[e.target.dataset.cat] = Number(e.target.value) || 0;
            refresh();
        };
    });
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

document.getElementById("exportExcel").onclick = () => {
    const wb = XLSX.utils.book_new();
    const summary = [
        ["WEDDING BUDGET REPORT", ""],
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

window.deleteExp = (i) => { expenses.splice(i, 1); refresh(); };
window.onload = refresh;
totalBudgetInput.oninput = refresh;
document.querySelectorAll(".guestGroup").forEach(i => i.oninput = refresh);
