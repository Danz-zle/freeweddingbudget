const totalBudgetInput = document.getElementById("totalBudget");
const printTotalBudget = document.getElementById("printTotalBudget");
const remainingBudgetText = document.getElementById("remainingBudget");
const insightsBox = document.getElementById("insights");
const categoryBudgetTable = document.getElementById("categoryBudgetTable");
const expenseTable = document.getElementById("expenseTable");
const categoryProgress = document.getElementById("categoryProgress");
const guestInputs = document.querySelectorAll(".guestGroup");
const totalGuestsText = document.getElementById("totalGuests");
const actualCostText = document.getElementById("actualCostPerGuest");
const spendingLabel = document.getElementById("spendingLabel");
const spendingStatus = document.getElementById("spendingStatus");
const progressFill = document.getElementById("progressFill");
const addExpenseBtn = document.getElementById("addExpense");
const exportCsvBtn = document.getElementById("exportCsv");
const exportExcelBtn = document.getElementById("exportExcel");

/* ===== DATA ===== */
let categories = {
  Venue: 8000,
  Catering: 12000,
  Photography: 4000,
  Decor: 3000,
  Entertainment: 3000
};

let expenses = [];

/* ===== HELPERS ===== */
const totalSpent = () => expenses.reduce((s,e)=>s+e.amount,0);
const totalGuests = () => {
  let t=0; guestInputs.forEach(g=>t+=Number(g.value)||0); return t;
};

/* ===== CATEGORY BUDGET ===== */
function renderCategoryBudgets() {
  categoryBudgetTable.innerHTML="";
  Object.keys(categories).forEach(cat=>{
    categoryBudgetTable.innerHTML+=`
      <tr>
        <td>${cat}</td>
        <td><input type="number" value="${categories[cat]}"
          oninput="updateCatBudget('${cat}',this.value)"></td>
      </tr>`;
  });
}
window.updateCatBudget=(cat,val)=>{categories[cat]=Number(val)||0;updateCosts();};

/* ===== EXPENSES ===== */
function renderExpenses(){
  expenseTable.innerHTML="";
  expenses.forEach(e=>{
    expenseTable.innerHTML+=`
      <tr>
        <td><input value="${e.desc}" oninput="updateDesc('${e.id}',this.value)"></td>
        <td>
          <select onchange="updateCat('${e.id}',this.value)">
            ${Object.keys(categories).map(c=>`<option ${c===e.cat?'selected':''}>${c}</option>`).join("")}
          </select>
        </td>
        <td><input type="number" value="${e.amount}" oninput="updateAmt('${e.id}',this.value)"></td>
        <td class="no-print"><button onclick="removeExp('${e.id}')">X</button></td>
      </tr>`;
  });
}

addExpenseBtn.onclick=()=>{
  expenses.push({id:crypto.randomUUID(),desc:"",cat:"Venue",amount:0});
  renderExpenses();updateCosts();
};
window.updateDesc=(id,v)=>expenses.find(e=>e.id===id).desc=v;
window.updateCat=(id,v)=>{expenses.find(e=>e.id===id).cat=v;updateCosts();};
window.updateAmt=(id,v)=>{expenses.find(e=>e.id===id).amount=Number(v)||0;updateCosts();};
window.removeExp=id=>{expenses=expenses.filter(e=>e.id!==id);renderExpenses();updateCosts();};

/* ===== CATEGORY PROGRESS (✅ COLOR-CORRECT BARS) ===== */
function renderCategoryProgress(){
  categoryProgress.innerHTML="";

  Object.keys(categories).forEach(cat=>{
    const planned = categories[cat];
    const spent = expenses.filter(e=>e.cat===cat).reduce((s,e)=>s+e.amount,0);
    const pct = planned ? Math.round(spent/planned*100) : 0;

    let textClass = "cat-ok";
    let barColor = "#16a34a"; // green

    if (pct > 50 && pct <= 80) {
      textClass = "cat-warn";
      barColor = "#f59e0b"; // orange
    }
    if (pct > 80) {
      textClass = "cat-danger";
      barColor = "#dc2626"; // red
    }

    categoryProgress.innerHTML += `
      <div class="${textClass}">
        <strong>${cat}</strong>: ${spent} / ${planned} (${pct}%)
        <div class="progress-bar">
          <div class="progress-fill"
               style="width:${Math.min(pct,100)}%; background:${barColor}">
          </div>
        </div>
      </div>
    `;
  });
}

/* ===== INSIGHTS ===== */
function renderInsights(){
  insightsBox.className="";
  const totalPlanned=Object.values(categories).reduce((s,v)=>s+v,0);
  const budget=Number(totalBudgetInput.value)||0;
  if(totalPlanned>budget){
    insightsBox.className="insight-warning";
    insightsBox.textContent=`⚠️ Planned budgets exceed total by ${totalPlanned-budget}`;
    return;
  }
  insightsBox.textContent="✅ Your budget planning is under control.";
}

/* ===== OVERALL ===== */
function updateCosts(){
  const budget = Number(totalBudgetInput.value) || 0;
  const spent = totalSpent();
  const guests = totalGuests();

  printTotalBudget.textContent = budget;
  remainingBudgetText.textContent = budget - spent;
  totalGuestsText.textContent = guests;
  actualCostText.textContent = guests ? Math.round(spent / guests) : 0;

  const pct = budget ? Math.round(spent / budget * 100) : 0;

  spendingLabel.textContent = `${spent} / ${budget} (${pct}%)`;
  spendingStatus.textContent =
    pct >= 90 ? "❌ Over Budget Risk" :
    pct >= 70 ? "⚠️ Approaching Budget Limit" :
    "✅ Spending Under Control";

  /* ✅ OVERALL BAR COLOR LOGIC */
  let barColor = "#16a34a"; // green

  if (pct > 50 && pct <= 80) {
    barColor = "#f59e0b"; // orange
  }
  if (pct > 80) {
    barColor = "#dc2626"; // red
  }

  progressFill.style.width = `${Math.min(pct,100)}%`;
  progressFill.style.background = barColor;

  renderCategoryProgress();
  renderInsights();
}

/* ===== CSV ===== */
exportCsvBtn.onclick=()=>{
  let csv="Description,Category,Amount\n";
  expenses.forEach(e=>csv+=`${e.desc},${e.cat},${e.amount}\n`);
  const blob=new Blob([csv],{type:"text/csv"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="wedding-budget.csv";
  a.click();
};

/* ===== EXCEL (4 SHEETS) ===== */
exportExcelBtn.onclick=()=>{
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,
    XLSX.utils.json_to_sheet([
      {Metric:"Total Budget",Value:Number(totalBudgetInput.value)||0},
      {Metric:"Total Spent",Value:totalSpent()},
      {Metric:"Remaining Budget",Value:(Number(totalBudgetInput.value)||0)-totalSpent()},
      {Metric:"Total Guests",Value:totalGuests()},
      {Metric:"Actual Cost per Guest",Value:totalGuests()?Math.round(totalSpent()/totalGuests()):0}
    ]),
    "Summary"
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(Object.keys(categories).map(c=>({Category:c,PlannedBudget:categories[c]}))),
    "Categories"
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenses), "Expenses");
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      Array.from(guestInputs).map((g,i)=>({Group:["Family","Friends","Colleagues","Others"][i],Guests:Number(g.value)||0}))
    ),
    "Guests"
  );
  XLSX.writeFile(wb,"wedding-budget.xlsx");
};

/* ===== INIT ===== */
guestInputs.forEach(g=>g.oninput=updateCosts);
totalBudgetInput.oninput=updateCosts;
renderCategoryBudgets();
renderExpenses();
updateCosts();
``