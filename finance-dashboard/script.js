const defaultTransactions = [
  { id: 1, date: '2026-03-02', amount: 45000, category: 'Salary', type: 'income', description: 'Monthly salary credited' },
  { id: 2, date: '2026-03-04', amount: 2200, category: 'Food', type: 'expense', description: 'Dining and groceries' },
  { id: 3, date: '2026-03-06', amount: 4000, category: 'Freelance', type: 'income', description: 'Landing page client project' },
  { id: 4, date: '2026-03-09', amount: 1800, category: 'Transport', type: 'expense', description: 'Fuel and travel' },
  { id: 5, date: '2026-03-12', amount: 5200, category: 'Rent', type: 'expense', description: 'Room rent paid' },
  { id: 6, date: '2026-03-15', amount: 1500, category: 'Shopping', type: 'expense', description: 'Clothes and essentials' },
  { id: 7, date: '2026-03-18', amount: 3500, category: 'Bonus', type: 'income', description: 'Performance bonus' },
  { id: 8, date: '2026-03-20', amount: 2600, category: 'Utilities', type: 'expense', description: 'Electricity and internet bills' },
  { id: 9, date: '2026-03-24', amount: 3000, category: 'Investment', type: 'expense', description: 'Mutual fund SIP' },
  { id: 10, date: '2026-03-28', amount: 2000, category: 'Entertainment', type: 'expense', description: 'Movies and outings' },
  { id: 11, date: '2026-04-01', amount: 47000, category: 'Salary', type: 'income', description: 'April salary credited' },
  { id: 12, date: '2026-04-02', amount: 1400, category: 'Food', type: 'expense', description: 'Restaurant and snacks' }
];

let transactions = JSON.parse(localStorage.getItem('financeTransactions')) || defaultTransactions;
let selectedRole = localStorage.getItem('financeRole') || 'viewer';
let editingId = null;

const totalBalanceEl = document.getElementById('totalBalance');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpensesEl = document.getElementById('totalExpenses');
const transactionTableBody = document.getElementById('transactionTableBody');
const emptyState = document.getElementById('emptyState');
const roleSelect = document.getElementById('roleSelect');
const openAddModal = document.getElementById('openAddModal');
const transactionModal = document.getElementById('transactionModal');
const closeModal = document.getElementById('closeModal');
const saveTransaction = document.getElementById('saveTransaction');
const modalTitle = document.getElementById('modalTitle');
const insightList = document.getElementById('insightList');

const txnDate = document.getElementById('txnDate');
const txnCategory = document.getElementById('txnCategory');
const txnType = document.getElementById('txnType');
const txnAmount = document.getElementById('txnAmount');
const txnDescription = document.getElementById('txnDescription');

const searchInput = document.getElementById('searchInput');
const filterType = document.getElementById('filterType');
const sortBy = document.getElementById('sortBy');
const resetFilters = document.getElementById('resetFilters');

roleSelect.value = selectedRole;

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
}

function saveToLocalStorage() {
  localStorage.setItem('financeTransactions', JSON.stringify(transactions));
  localStorage.setItem('financeRole', selectedRole);
}

function calculateSummary() {
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = income - expenses;

  totalIncomeEl.textContent = formatCurrency(income);
  totalExpensesEl.textContent = formatCurrency(expenses);
  totalBalanceEl.textContent = formatCurrency(balance);
}

function getFilteredTransactions() {
  const search = searchInput.value.toLowerCase().trim();
  const typeFilter = filterType.value;
  const sort = sortBy.value;

  let filtered = [...transactions].filter(txn => {
    const matchesSearch =
      txn.category.toLowerCase().includes(search) ||
      txn.description.toLowerCase().includes(search) ||
      txn.date.includes(search);

    const matchesType = typeFilter === 'all' || txn.type === typeFilter;
    return matchesSearch && matchesType;
  });

  filtered.sort((a, b) => {
    if (sort === 'latest') return new Date(b.date) - new Date(a.date);
    if (sort === 'oldest') return new Date(a.date) - new Date(b.date);
    if (sort === 'high') return b.amount - a.amount;
    if (sort === 'low') return a.amount - b.amount;
    return 0;
  });

  return filtered;
}

function renderTransactions() {
  const filtered = getFilteredTransactions();
  transactionTableBody.innerHTML = '';

  if (!filtered.length) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  filtered.forEach(txn => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${txn.date}</td>
      <td>${txn.category}</td>
      <td>
        <span class="badge ${txn.type === 'income' ? 'badge-income' : 'badge-expense'}">
          ${txn.type}
        </span>
      </td>
      <td class="${txn.type === 'income' ? 'amount-income' : 'amount-expense'}">
        ${txn.type === 'income' ? '+' : '-'} ${formatCurrency(txn.amount)}
      </td>
      <td>${txn.description}</td>
      <td class="actions">
        ${selectedRole === 'admin'
          ? `
            <button class="secondary-btn" onclick="editTransaction(${txn.id})">Edit</button>
            <button class="danger-btn" onclick="deleteTransaction(${txn.id})">Delete</button>
          `
          : '<span style="color:#6b7280; font-size:12px;">View only</span>'
        }
      </td>
    `;
    transactionTableBody.appendChild(row);
  });
}

function getMonthlyData() {
  const monthlyMap = {};

  transactions.forEach(txn => {
    const month = new Date(txn.date).toLocaleString('en-US', { month: 'short' });
    if (!monthlyMap[month]) {
      monthlyMap[month] = { income: 0, expense: 0 };
    }
    monthlyMap[month][txn.type] += Number(txn.amount);
  });

  const labels = Object.keys(monthlyMap);
  const balances = labels.map(month => monthlyMap[month].income - monthlyMap[month].expense);

  return { labels, balances };
}

function drawTrendChart() {
  const canvas = document.getElementById('trendChart');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, rect.width, rect.height);

  const { labels, balances } = getMonthlyData();
  if (!labels.length) return;

  const padding = 40;
  const maxVal = Math.max(...balances, 1);
  const minVal = Math.min(...balances, 0);
  const chartW = rect.width - padding * 2;
  const chartH = rect.height - padding * 2;

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i++) {
    const y = padding + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(rect.width - padding, y);
    ctx.stroke();
  }

  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 3;
  ctx.beginPath();

  balances.forEach((value, index) => {
    const x = padding + (chartW / Math.max(labels.length - 1, 1)) * index;
    const y = padding + ((maxVal - value) / Math.max(maxVal - minVal, 1)) * chartH;

    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();

  balances.forEach((value, index) => {
    const x = padding + (chartW / Math.max(labels.length - 1, 1)) * index;
    const y = padding + ((maxVal - value) / Math.max(maxVal - minVal, 1)) * chartH;

    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.font = '12px Arial';
    ctx.fillText(labels[index], x - 10, rect.height - 12);
  });
}

function getCategoryExpenseData() {
  const expenseMap = {};

  transactions
    .filter(txn => txn.type === 'expense')
    .forEach(txn => {
      expenseMap[txn.category] = (expenseMap[txn.category] || 0) + Number(txn.amount);
    });

  return expenseMap;
}

function drawCategoryChart() {
  const canvas = document.getElementById('categoryChart');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, rect.width, rect.height);

  const data = getCategoryExpenseData();
  const entries = Object.entries(data);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  if (!entries.length || total === 0) {
    ctx.fillStyle = '#64748b';
    ctx.font = '14px Arial';
    ctx.fillText('No expense data available', 20, 40);
    return;
  }

  const colors = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0f766e', '#ea580c'];
  let startAngle = -Math.PI / 2;
  const centerX = rect.width / 2;
  const centerY = rect.height / 2 - 10;
  const radius = Math.min(rect.width, rect.height) / 3;

  entries.forEach(([label, value], index) => {
    const sliceAngle = (value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();
    startAngle += sliceAngle;
  });

  entries.forEach(([label, value], index) => {
    const y = rect.height - 70 + index * 18;
    ctx.fillStyle = colors[index % colors.length];
    ctx.fillRect(20, y, 12, 12);
    ctx.fillStyle = '#334155';
    ctx.font = '12px Arial';
    ctx.fillText(`${label} (${Math.round((value / total) * 100)}%)`, 40, y + 10);
  });
}

function renderInsights() {
  const expenses = transactions.filter(t => t.type === 'expense');
  const income = transactions.filter(t => t.type === 'income');
  const categoryTotals = {};

  expenses.forEach(item => {
    categoryTotals[item.category] = (categoryTotals[item.category] || 0) + Number(item.amount);
  });

  const highestCategoryEntry = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  const totalIncome = income.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const savingsRate = totalIncome ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  const currentMonth = 'Apr';
  const previousMonth = 'Mar';
  const monthly = getMonthlyData();
  const prevIndex = monthly.labels.indexOf(previousMonth);
  const currIndex = monthly.labels.indexOf(currentMonth);
  const prevBalance = prevIndex >= 0 ? monthly.balances[prevIndex] : 0;
  const currBalance = currIndex >= 0 ? monthly.balances[currIndex] : 0;

  const comparisonText = currBalance >= prevBalance
    ? `Balance improved by ${formatCurrency(currBalance - prevBalance)} compared to last month.`
    : `Balance dropped by ${formatCurrency(prevBalance - currBalance)} compared to last month.`;

  const insights = [
    {
      title: 'Highest Spending Category',
      text: highestCategoryEntry
        ? `${highestCategoryEntry[0]} is your top expense at ${formatCurrency(highestCategoryEntry[1])}.`
        : 'No expense category available yet.'
    },
    {
      title: 'Monthly Comparison',
      text: comparisonText
    },
    {
      title: 'Savings Observation',
      text: totalIncome > 0
        ? `You are currently saving ${savingsRate}% of your income based on recorded data.`
        : 'No income data available to compute savings rate.'
    }
  ];

  insightList.innerHTML = insights.map(item => `
    <div class="insight-item">
      <strong>${item.title}</strong>
      <span>${item.text}</span>
    </div>
  `).join('');
}

function openModal(edit = false, txn = null) {
  if (selectedRole !== 'admin') {
    alert('Only admin can add or edit transactions.');
    return;
  }

  transactionModal.classList.add('show');

  if (edit && txn) {
    editingId = txn.id;
    modalTitle.textContent = 'Edit Transaction';
    txnDate.value = txn.date;
    txnCategory.value = txn.category;
    txnType.value = txn.type;
    txnAmount.value = txn.amount;
    txnDescription.value = txn.description;
  } else {
    editingId = null;
    modalTitle.textContent = 'Add Transaction';
    txnDate.value = '';
    txnCategory.value = '';
    txnType.value = 'income';
    txnAmount.value = '';
    txnDescription.value = '';
  }
}

function closeModalFn() {
  transactionModal.classList.remove('show');
}

function addOrUpdateTransaction() {
  const date = txnDate.value;
  const category = txnCategory.value.trim();
  const type = txnType.value;
  const amount = Number(txnAmount.value);
  const description = txnDescription.value.trim();

  if (!date || !category || !amount || !description) {
    alert('Please fill all fields properly.');
    return;
  }

  if (editingId) {
    transactions = transactions.map(txn =>
      txn.id === editingId
        ? { ...txn, date, category, type, amount, description }
        : txn
    );
  } else {
    transactions.push({
      id: Date.now(),
      date,
      category,
      type,
      amount,
      description
    });
  }

  saveToLocalStorage();
  refreshUI();
  closeModalFn();
}

function editTransaction(id) {
  const txn = transactions.find(item => item.id === id);
  if (txn) openModal(true, txn);
}

function deleteTransaction(id) {
  if (selectedRole !== 'admin') {
    alert('Only admin can delete transactions.');
    return;
  }

  transactions = transactions.filter(item => item.id !== id);
  saveToLocalStorage();
  refreshUI();
}

window.editTransaction = editTransaction;
window.deleteTransaction = deleteTransaction;

function refreshUI() {
  calculateSummary();
  renderTransactions();
  renderInsights();

  setTimeout(() => {
    drawTrendChart();
    drawCategoryChart();
  }, 50);

  openAddModal.style.display = selectedRole === 'admin' ? 'inline-block' : 'none';
}

roleSelect.addEventListener('change', (e) => {
  selectedRole = e.target.value;
  saveToLocalStorage();
  refreshUI();
});

openAddModal.addEventListener('click', () => openModal(false));
closeModal.addEventListener('click', closeModalFn);
saveTransaction.addEventListener('click', addOrUpdateTransaction);

searchInput.addEventListener('input', renderTransactions);
filterType.addEventListener('change', renderTransactions);
sortBy.addEventListener('change', renderTransactions);

resetFilters.addEventListener('click', () => {
  searchInput.value = '';
  filterType.value = 'all';
  sortBy.value = 'latest';
  renderTransactions();
});

window.addEventListener('resize', () => {
  drawTrendChart();
  drawCategoryChart();
});

refreshUI();