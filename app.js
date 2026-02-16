let trades = JSON.parse(localStorage.getItem("trades")) || [];
let editingIndex = null;
let currentPage = 1;
const perPage = 2;

const modal = document.getElementById("tradeModal");

document.getElementById("openFormBtn").onclick = () => {
  modal.style.display = "block";
  clearForm();
};

document.getElementById("closeModal").onclick = () => {
  modal.style.display = "none";
};

document.getElementById("saveTradeBtn").onclick = saveTrade;

function saveTrade() {
  const buyDate = document.getElementById("buyDate").value;
  const asset = document.getElementById("asset").value.trim();
  const buyPrice = parseFloat(document.getElementById("buyPrice").value);
  const unitsBought = parseFloat(document.getElementById("unitsBought").value);

  if (!buyDate || !asset || !buyPrice || !unitsBought) {
    alert("⚠ Please fill required fields");
    return;
  }

  const sellDate = document.getElementById("sellDate").value;
  const sellPrice = parseFloat(document.getElementById("sellPrice").value) || 0;
  const unitsSold = parseFloat(document.getElementById("unitsSold").value) || 0;

  const trade = { buyDate, asset, buyPrice, unitsBought, sellDate, sellPrice, unitsSold };

  if (editingIndex !== null) {
    trades[editingIndex] = trade;
    editingIndex = null;
  } else {
    trades.push(trade);
  }

  localStorage.setItem("trades", JSON.stringify(trades));
  modal.style.display = "none";
  renderTrades();
}

function calculateTrade(trade) {
  const invested = trade.buyPrice * trade.unitsBought;
  const returned = trade.sellPrice * trade.unitsSold;
  const remaining = trade.unitsBought - trade.unitsSold;
  const profit = (trade.sellPrice - trade.buyPrice) * trade.unitsSold;
  const status = remaining === 0 ? "Closed" : "Open";

  return { invested, returned, remaining, profit, status };
}

function renderTrades() {
  const history = document.getElementById("history");
  history.innerHTML = "";

  const start = (currentPage - 1) * perPage;
  const pageTrades = trades.slice(start, start + perPage);

  pageTrades.forEach((trade, i) => {
    const calc = calculateTrade(trade);
    const index = start + i;

    history.innerHTML += `
      <div class="trade">
        <strong>${trade.asset}</strong> - <em>${calc.status}</em><br>
        Buy: ₦${trade.buyPrice} × ${trade.unitsBought}<br>
        Sold: ₦${trade.sellPrice || "-"} × ${trade.unitsSold || "-"}<br>
        Remaining: ${calc.remaining}<br>
        <span class="${calc.profit >= 0 ? "profit" : "loss"}">
          Profit/Loss: ₦${calc.profit.toFixed(2)}
        </span><br>
        <button onclick="editTrade(${index})">✏ Edit</button>
        <button onclick="confirmDelete(${index})" style="background:red;color:white;">
          🗑 Delete
        </button>
      </div>`;
  });

  updateSummary();
  updatePagination();
  updateCharts();
}

function editTrade(index) {
  const trade = trades[index];
  editingIndex = index;
  modal.style.display = "block";

  buyDate.value = trade.buyDate;
  asset.value = trade.asset;
  buyPrice.value = trade.buyPrice;
  unitsBought.value = trade.unitsBought;
  sellDate.value = trade.sellDate;
  sellPrice.value = trade.sellPrice;
  unitsSold.value = trade.unitsSold;
}

function confirmDelete(index) {
  if (confirm("Delete this trade? This cannot be undone.")) {
    trades.splice(index, 1);
    localStorage.setItem("trades", JSON.stringify(trades));
    renderTrades();
  }
}

function updateSummary() {
  let totalInvested = 0;
  let totalProfit = 0;

  trades.forEach(trade => {
    const calc = calculateTrade(trade);
    totalInvested += calc.invested;
    totalProfit += calc.profit;
  });

  document.getElementById("totalInvested").textContent = totalInvested.toFixed(2);
  document.getElementById("totalProfit").textContent = totalProfit.toFixed(2);
}

function updatePagination() {
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  prevBtn.style.display = currentPage === 1 ? "none" : "inline-block";
  nextBtn.style.display = trades.length > currentPage * perPage ? "inline-block" : "none";
}

prevBtn.onclick = () => { currentPage--; renderTrades(); };
nextBtn.onclick = () => { currentPage++; renderTrades(); };

let profitChart, valueChart, cumulativeChart;

function updateCharts() {
  const labels = trades.map(t => t.asset);
  const profits = trades.map(t => calculateTrade(t).profit);
  const invested = trades.map(t => calculateTrade(t).invested);
  const returned = trades.map(t => calculateTrade(t).returned);

  const cumulative = [];
  profits.reduce((acc, val, i) => cumulative[i] = acc + val, 0);

  if (profitChart) profitChart.destroy();
  if (valueChart) valueChart.destroy();
  if (cumulativeChart) cumulativeChart.destroy();

  profitChart = new Chart(profitChartCanvas, {
    type: "bar",
    data: { labels, datasets: [{ label: "Profit/Loss", data: profits }] }
  });

  valueChart = new Chart(valueChartCanvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Invested", data: invested },
        { label: "Returned", data: returned }
      ]
    }
  });

  cumulativeChart = new Chart(cumulativeChartCanvas, {
    type: "line",
    data: { labels, datasets: [{ label: "Cumulative Profit", data: cumulative }] }
  });
}

function clearForm() {
  document.querySelectorAll("input").forEach(i => i.value = "");
}

renderTrades();