(function () {
  'use strict';

  const storageKey = 'accessibleFinanceCashFlowV1';
  const maximumRows = 12;
  const expenseColors = ['#c8822a', '#3f7f66', '#526d96', '#8f6f55', '#7b8172', '#a45f52', '#607f87', '#9a7d3f', '#736b8e', '#6c7461', '#a06472', '#657c54'];
  const defaultPlan = {
    period: 'monthly',
    currency: 'CAD',
    income: [
      { id: 'income-salary', name: 'Take-home pay', amount: 4500 },
      { id: 'income-side', name: 'Side income', amount: 500 },
      { id: 'income-other', name: 'Other income', amount: 0 },
    ],
    expenses: [
      { id: 'expense-housing', name: 'Housing', amount: 1650, kind: 'spending' },
      { id: 'expense-groceries', name: 'Groceries', amount: 550, kind: 'spending' },
      { id: 'expense-transport', name: 'Transportation', amount: 450, kind: 'spending' },
      { id: 'expense-utilities', name: 'Utilities', amount: 250, kind: 'spending' },
      { id: 'expense-debt', name: 'Debt payments', amount: 300, kind: 'debt' },
      { id: 'expense-lifestyle', name: 'Lifestyle', amount: 500, kind: 'spending' },
      { id: 'expense-savings', name: 'Savings & investing', amount: 900, kind: 'saving' },
      { id: 'expense-other', name: 'Other spending', amount: 200, kind: 'spending' },
    ],
  };

  const elements = {
    form: document.getElementById('cashFlowForm'),
    incomeRows: document.getElementById('incomeRows'),
    expenseRows: document.getElementById('expenseRows'),
    incomeTotal: document.getElementById('incomeTotal'),
    expenseTotal: document.getElementById('expenseTotal'),
    addIncome: document.getElementById('addIncome'),
    addExpense: document.getElementById('addExpense'),
    reset: document.getElementById('resetPlan'),
    chart: document.getElementById('sankeyChart'),
    chartFrame: document.getElementById('sankeyFrame'),
    chartEmpty: document.getElementById('chartEmpty'),
    chartError: document.getElementById('chartError'),
    chartLoading: document.getElementById('chartLoading'),
    chartRetry: document.getElementById('retryChart'),
    chartDescription: document.getElementById('sankeyDescription'),
    dataRows: document.getElementById('cashFlowDataRows'),
    chartPeriod: document.getElementById('chartPeriod'),
    flowStatus: document.getElementById('flowStatus'),
    summaryIncome: document.getElementById('summaryIncome'),
    summaryExpenses: document.getElementById('summaryExpenses'),
    summaryBalance: document.getElementById('summaryBalance'),
    balanceLabel: document.getElementById('balanceLabel'),
    savingsRate: document.getElementById('savingsRate'),
    savingsNote: document.getElementById('savingsNote'),
    largestExpense: document.getElementById('largestExpense'),
    largestExpenseNote: document.getElementById('largestExpenseNote'),
    cashPosition: document.getElementById('cashPosition'),
    cashPositionNote: document.getElementById('cashPositionNote'),
    breakdown: document.getElementById('expenseBreakdown'),
    breakdownBasis: document.getElementById('breakdownBasis'),
  };

  if (!elements.form || !elements.chart) return;

  function cloneDefaults() {
    return JSON.parse(JSON.stringify(defaultPlan));
  }

  function currentEdition() {
    const requested = new URLSearchParams(window.location.search).get('edition');
    if (requested === 'us' || requested === 'ca') return requested;
    try {
      const stored = window.localStorage.getItem('accessibleFinanceRegion');
      return stored === 'us' ? 'us' : 'ca';
    } catch {
      return 'ca';
    }
  }

  function validRow(row, prefix, index) {
    // One-time migration keeps old savings classifications, then saves an explicit
    // kind. Renaming a row after migration never changes its classification.
    const kind = ['spending', 'saving', 'debt'].includes(row?.kind) ? row.kind
      : /(sav|invest|retire|emergency fund)/i.test(row?.name || '') ? 'saving'
        : /debt|loan|credit card/i.test(row?.name || '') ? 'debt' : 'spending';
    return {
      id: typeof row?.id === 'string' && row.id ? row.id : `${prefix}-${Date.now()}-${index}`,
      name: typeof row?.name === 'string' ? row.name.slice(0, 48) : '',
      amount: Number.isFinite(Number(row?.amount)) ? Math.max(0, Number(row.amount)) : 0,
      ...(prefix === 'expense' ? { kind } : {}),
    };
  }

  function loadState() {
    const fallback = cloneDefaults();
    fallback.currency = currentEdition() === 'us' ? 'USD' : 'CAD';

    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey));
      if (!saved || !Array.isArray(saved.income) || !Array.isArray(saved.expenses)) return fallback;
      return {
        period: saved.period === 'annual' ? 'annual' : 'monthly',
        currency: currentEdition() === 'us' ? 'USD' : 'CAD',
        income: saved.income.slice(0, maximumRows).map((row, index) => validRow(row, 'income', index)),
        expenses: saved.expenses.slice(0, maximumRows).map((row, index) => validRow(row, 'expense', index)),
      };
    } catch {
      return fallback;
    }
  }

  let state = loadState();
  let redrawTimer = null;
  let lastChartWidth = 0;
  const mapDetails = document.getElementById('cashFlowMap');
  let chartInView = !('IntersectionObserver' in window);
  let chartLoadState = 'idle';
  let latestChartData = null;

  function loadChartScript(source, isReady) {
    if (isReady()) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = source;
      script.async = true;
      script.dataset.cashFlowLibrary = '';
      let settled = false;
      const finish = (error) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        script.removeEventListener('load', onLoad);
        script.removeEventListener('error', onError);
        if (error) {
          script.remove();
          reject(error);
        } else resolve();
      };
      const onLoad = () => finish(isReady() ? null : new Error('The chart library is unavailable.'));
      const onError = () => finish(new Error('The chart library could not load.'));
      const timeout = window.setTimeout(() => finish(new Error('The chart library request timed out.')), 15000);
      script.addEventListener('load', onLoad);
      script.addEventListener('error', onError);
      document.head.appendChild(script);
    });
  }

  function loadChartLibraries() {
    if (chartLoadState === 'loading' || chartLoadState === 'ready') return;
    chartLoadState = 'loading';
    elements.chartLoading.hidden = false;
    elements.chartError.hidden = true;
    elements.chartFrame.setAttribute('aria-busy', 'true');
    // The form and its complete values table work without either library. On
    // phones the map is collapsed, so these downloads wait until it is opened.
    loadChartScript('https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js', () => typeof window.d3?.select === 'function')
      .then(() => loadChartScript('https://cdn.jsdelivr.net/npm/d3-sankey@0.12.3/dist/d3-sankey.min.js', () => typeof window.d3?.sankey === 'function'))
      .then(() => {
        chartLoadState = 'ready';
        elements.chartLoading.hidden = true;
        elements.chartFrame.setAttribute('aria-busy', 'false');
        renderChartIfVisible();
      })
      .catch(() => {
        chartLoadState = 'error';
        elements.chartLoading.hidden = true;
        elements.chartError.hidden = false;
        elements.chartFrame.setAttribute('aria-busy', 'false');
      });
  }

  function renderChartIfVisible() {
    if (!mapDetails?.open || !chartInView || !latestChartData) return;
    if (chartLoadState === 'ready') drawChart(...latestChartData);
    else if (chartLoadState === 'idle') loadChartLibraries();
  }

  function saveState() {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // The planner remains fully usable when storage is blocked.
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function numeric(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }

  function roundMoney(value) {
    return Math.round((numeric(value) + Number.EPSILON) * 100) / 100;
  }

  function total(rows) {
    return rows.reduce((sum, row) => sum + numeric(row.amount), 0);
  }

  function locale() {
    return state.currency === 'USD' ? 'en-US' : 'en-CA';
  }

  function formatMoney(value, options) {
    const absolute = Math.abs(value);
    const showCents = absolute > 0 && absolute < 100;
    return new Intl.NumberFormat(locale(), {
      style: 'currency',
      currency: state.currency,
      maximumFractionDigits: showCents ? 2 : 0,
      minimumFractionDigits: 0,
      ...(options || {}),
    }).format(value);
  }

  function formatCompact(value) {
    return new Intl.NumberFormat(locale(), {
      style: 'currency',
      currency: state.currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }

  function amountSymbol() {
    return '$';
  }

  function rowMarkup(row, type, index) {
    const groupName = type === 'income' ? 'Income' : 'Expense';
    const rowName = row.name.trim() || `${groupName} category ${index + 1}`;
    const longNameClass = row.name.trim().length > 16 ? ' flow-name-long' : '';
    return `
      <div class="flow-row" data-row-id="${escapeHtml(row.id)}">
        <label class="sr-only" for="${type}-name-${index}">${groupName} category ${index + 1} name</label>
        <input class="flow-name${longNameClass}" id="${type}-name-${index}" type="text" maxlength="48" value="${escapeHtml(row.name)}" data-type="${type}" data-field="name" data-id="${escapeHtml(row.id)}" aria-label="${groupName} category ${index + 1} name">
        <div class="amount-wrap">
          <span class="amount-symbol" aria-hidden="true">${amountSymbol()}</span>
          <label class="sr-only" for="${type}-amount-${index}">${escapeHtml(rowName)} amount</label>
          <input class="flow-amount" id="${type}-amount-${index}" type="number" inputmode="decimal" min="0" step="10" value="${row.amount || ''}" data-type="${type}" data-field="amount" data-id="${escapeHtml(row.id)}" aria-label="${escapeHtml(rowName)} amount">
        </div>
        <button class="remove-row" type="button" data-remove="${type}" data-id="${escapeHtml(row.id)}" aria-label="Remove ${escapeHtml(rowName)}" title="Remove category">&times;</button>
        ${type === 'expenses' ? `<label class="flow-kind-label" for="${type}-kind-${index}">Type
          <select id="${type}-kind-${index}" class="flow-kind" data-type="${type}" data-field="kind" data-id="${escapeHtml(row.id)}" aria-label="${escapeHtml(rowName)} type">
            <option value="spending"${row.kind === 'spending' ? ' selected' : ''}>Spending</option>
            <option value="saving"${row.kind === 'saving' ? ' selected' : ''}>Saving / investing</option>
            <option value="debt"${row.kind === 'debt' ? ' selected' : ''}>Debt payment</option>
          </select></label>` : ''}
      </div>`;
  }

  function renderRows(type, focusId) {
    const rows = type === 'income' ? state.income : state.expenses;
    const container = type === 'income' ? elements.incomeRows : elements.expenseRows;
    container.innerHTML = rows.map((row, index) => rowMarkup(row, type, index)).join('');
    const addButton = type === 'income' ? elements.addIncome : elements.addExpense;
    addButton.disabled = rows.length >= maximumRows;
    addButton.title = rows.length >= maximumRows ? `Maximum ${maximumRows} categories` : '';

    if (focusId) {
      window.requestAnimationFrame(() => {
        container.querySelector(`[data-field="name"][data-id="${CSS.escape(focusId)}"]`)?.focus();
      });
    }
  }

  function renderAllRows() {
    renderRows('income');
    renderRows('expenses');
  }

  function updateRow(type, id, field, value) {
    const rows = type === 'income' ? state.income : state.expenses;
    const row = rows.find((item) => item.id === id);
    if (!row) return;
    if (field === 'kind') {
      if (!['spending', 'saving', 'debt'].includes(value)) return;
      row.kind = value;
    } else {
      row[field] = field === 'amount' ? roundMoney(value) : String(value).slice(0, 48);
    }
    updateOutputs();
  }

  function handleRowInput(event) {
    const input = event.target.closest('[data-field][data-type][data-id]');
    if (!input) return;
    if (input.dataset.field === 'name') {
      const row = input.closest('.flow-row');
      const groupName = input.dataset.type === 'income' ? 'Income' : 'Expense';
      const name = input.value.trim() || `${groupName} category`;
      input.classList.toggle('flow-name-long', input.value.trim().length > 16);
      row?.querySelector('.flow-amount')?.setAttribute('aria-label', `${name} amount`);
      row?.querySelector('.flow-kind')?.setAttribute('aria-label', `${name} type`);
      row?.querySelector('.remove-row')?.setAttribute('aria-label', `Remove ${name}`);
    }
    updateRow(input.dataset.type, input.dataset.id, input.dataset.field, input.value);
  }

  function handleRemove(event) {
    const button = event.target.closest('[data-remove][data-id]');
    if (!button) return;
    const type = button.dataset.remove;
    const key = type === 'income' ? 'income' : 'expenses';
    state[key] = state[key].filter((row) => row.id !== button.dataset.id);
    renderRows(type);
    updateOutputs();
  }

  function addRow(type) {
    const key = type === 'income' ? 'income' : 'expenses';
    if (state[key].length >= maximumRows) return;
    const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    state[key].push({ id, name: type === 'income' ? 'New income' : 'New expense', amount: 0, ...(type === 'income' ? {} : { kind: 'spending' }) });
    renderRows(type, id);
    updateOutputs();
  }

  function changePeriod(nextPeriod) {
    if (nextPeriod === state.period) return;
    const factor = nextPeriod === 'annual' ? 12 : 1 / 12;
    [...state.income, ...state.expenses].forEach((row) => {
      row.amount = roundMoney(row.amount * factor);
    });
    state.period = nextPeriod;
    renderAllRows();
    updateOutputs();
  }

  function updateBreakdown(activeExpenses, expenseTotal) {
    if (!activeExpenses.length || expenseTotal <= 0) {
      elements.breakdown.innerHTML = '<p class="breakdown-empty">Add an expense amount to see the category breakdown.</p>';
      return;
    }

    const rows = [...activeExpenses].sort((a, b) => b.amount - a.amount);
    elements.breakdown.innerHTML = rows.map((row, index) => {
      const share = expenseTotal > 0 ? (row.amount / expenseTotal) * 100 : 0;
      return `
        <div class="breakdown-row">
          <span class="breakdown-name" title="${escapeHtml(row.name)}">${escapeHtml(row.name)}</span>
          <span class="breakdown-track"><span class="breakdown-fill" style="width:${Math.min(100, share).toFixed(2)}%;background:${expenseColors[index % expenseColors.length]}"></span></span>
          <span class="breakdown-value">${share.toFixed(0)}% &middot; ${escapeHtml(formatMoney(row.amount))}</span>
        </div>`;
    }).join('');
  }

  function nodeColor(node) {
    if (node.kind === 'income') return '#2d8a59';
    if (node.kind === 'available') return '#1a1816';
    if (node.kind === 'remaining') return '#526d96';
    if (node.kind === 'shortfall') return '#b34f48';
    return node.color || '#c8822a';
  }

  function shorten(value, maximum) {
    const text = String(value || 'Unnamed');
    return text.length > maximum ? `${text.slice(0, Math.max(1, maximum - 1)).trimEnd()}…` : text;
  }

  function drawChart(activeIncome, activeExpenses, incomeTotal, expenseTotal) {
    const balance = incomeTotal - expenseTotal;
    const chart = window.d3?.select ? window.d3.select(elements.chart) : null;
    if (!chart || typeof window.d3.sankey !== 'function') {
      elements.chartError.hidden = false;
      elements.chartEmpty.hidden = true;
      return;
    }

    elements.chartError.hidden = true;
    // Keep the nodes referenced by aria-labelledby attached during every redraw.
    chart.selectAll('g').remove();

    if (incomeTotal <= 0 && expenseTotal <= 0) {
      elements.chartEmpty.hidden = false;
      return;
    }
    elements.chartEmpty.hidden = true;

    const remaining = Math.max(0, balance);
    const shortfall = Math.max(0, -balance);
    const nodes = [];
    const links = [];

    activeIncome.forEach((row, index) => {
      const id = `income-${row.id}`;
      nodes.push({ id, name: row.name || 'Income', amount: row.amount, kind: 'income', order: index });
      links.push({ source: id, target: 'available-money', value: row.amount });
    });

    if (shortfall > 0) {
      nodes.push({ id: 'funding-shortfall', name: 'Funding shortfall', amount: shortfall, kind: 'shortfall', order: activeIncome.length + 1 });
      links.push({ source: 'funding-shortfall', target: 'available-money', value: shortfall });
    }

    nodes.push({ id: 'available-money', name: 'Available money', amount: Math.max(incomeTotal, expenseTotal), kind: 'available', order: 0 });

    activeExpenses.forEach((row, index) => {
      const id = `expense-${row.id}`;
      nodes.push({ id, name: row.name || 'Expense', amount: row.amount, kind: 'expense', color: expenseColors[index % expenseColors.length], order: index });
      links.push({ source: 'available-money', target: id, value: row.amount });
    });

    if (remaining > 0) {
      nodes.push({ id: 'money-remaining', name: 'Surplus', amount: remaining, kind: 'remaining', order: activeExpenses.length + 1 });
      links.push({ source: 'available-money', target: 'money-remaining', value: remaining });
    }

    const width = Math.max(310, Math.round(elements.chartFrame.clientWidth || 720));
    const compact = width < 520;
    const phone = width < 430;
    const sourceCount = activeIncome.length + (shortfall > 0 ? 1 : 0);
    const targetCount = activeExpenses.length + (remaining > 0 ? 1 : 0);
    const height = Math.max(phone ? 440 : compact ? 480 : 480, Math.max(sourceCount, targetCount) * (phone ? 40 : compact ? 46 : 48) + (phone ? 86 : 104));
    const left = phone ? 86 : compact ? 98 : 116;
    const right = phone ? 96 : compact ? 104 : 124;
    const chartTop = phone ? 60 : compact ? 70 : 74;

    chart
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('height', height)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const sankey = window.d3.sankey()
      .nodeId((node) => node.id)
      .nodeAlign(window.d3.sankeyJustify)
      .nodeWidth(phone ? 8 : compact ? 9 : 12)
      .nodePadding(phone ? 9 : compact ? 12 : 16)
      .nodeSort((a, b) => (a.order || 0) - (b.order || 0))
      .extent([[left, chartTop], [Math.max(left + 80, width - right), height - (phone ? 28 : 38)]]);

    const graph = sankey({
      nodes: nodes.map((node) => ({ ...node })),
      links: links.map((link) => ({ ...link })),
    });

    const linkLayer = chart.append('g').attr('aria-hidden', 'true');
    linkLayer.selectAll('path')
      .data(graph.links)
      .join('path')
      .attr('class', 'sankey-link')
      .attr('d', window.d3.sankeyLinkHorizontal())
      .attr('stroke', (link) => nodeColor(link.target))
      .attr('stroke-width', (link) => Math.max(1, link.width))
      .append('title')
      .text((link) => `${link.source.name} to ${link.target.name}: ${formatMoney(link.value)}`);

    const nodeLayer = chart.append('g').attr('class', 'sankey-nodes');
    const node = nodeLayer.selectAll('g')
      .data(graph.nodes)
      .join('g')
      .attr('class', 'sankey-node');

    node.append('rect')
      .attr('x', (item) => item.x0)
      .attr('y', (item) => item.y0)
      .attr('width', (item) => Math.max(1, item.x1 - item.x0))
      .attr('height', (item) => Math.max(1, item.y1 - item.y0))
      .attr('rx', 3)
      .attr('fill', (item) => nodeColor(item))
      .append('title')
      .text((item) => `${item.name}: ${formatMoney(item.amount)}`);

    const labels = node.append('text')
      .attr('class', 'sankey-label')
      .attr('x', (item) => {
        if (item.kind === 'available') return (item.x0 + item.x1) / 2;
        return item.depth === 0 ? item.x0 - 8 : item.x1 + 8;
      })
      .attr('y', (item) => item.kind === 'available' ? Math.max(22, item.y0 - 32) : ((item.y0 + item.y1) / 2) - 5)
      .attr('text-anchor', (item) => item.kind === 'available' ? 'middle' : (item.depth === 0 ? 'end' : 'start'));

    labels.append('tspan')
      .text((item) => shorten(item.name, phone ? 15 : compact ? 19 : 22));

    labels.append('tspan')
      .attr('class', (item) => `sankey-label-value${item.kind === 'available' ? ' is-available' : ''}`)
      .attr('x', (item) => {
        if (item.kind === 'available') return (item.x0 + item.x1) / 2;
        return item.depth === 0 ? item.x0 - 8 : item.x1 + 8;
      })
      .attr('dy', (item) => item.kind === 'available' ? (phone ? 14 : 17) : 13)
      .text((item) => formatCompact(item.amount));

    lastChartWidth = width;
  }

  function updateInsights(activeExpenses, incomeTotal, expenseTotal, balance) {
    const savingsAmount = activeExpenses
      .filter((row) => row.kind === 'saving')
      .reduce((sum, row) => sum + row.amount, 0);
    const savingsRate = incomeTotal > 0 ? (savingsAmount / incomeTotal) * 100 : 0;
    elements.savingsRate.textContent = `${savingsRate.toFixed(savingsRate >= 10 ? 0 : 1)}%`;
    elements.savingsNote.textContent = savingsAmount > 0
      ? `${formatMoney(savingsAmount)} is assigned to Saving / investing. Debt payments are excluded.`
      : 'Choose Saving / investing in a category’s Type menu to include it here.';

    const largest = [...activeExpenses].sort((a, b) => b.amount - a.amount)[0];
    elements.largestExpense.textContent = largest?.name || 'None';
    elements.largestExpenseNote.textContent = largest
      ? `${formatMoney(largest.amount)} or ${expenseTotal > 0 ? Math.round((largest.amount / expenseTotal) * 100) : 0}% of money out.`
      : 'Add outflows to compare categories.';

    if (balance > 0.005) {
      elements.cashPosition.textContent = 'Surplus';
      elements.cashPositionNote.textContent = `${formatMoney(balance)} is not yet assigned to an expense or savings goal.`;
    } else if (balance < -0.005) {
      elements.cashPosition.textContent = 'Funding shortfall';
      elements.cashPositionNote.textContent = `${formatMoney(Math.abs(balance))} would need reserves, borrowing, more income, or lower expenses.`;
    } else {
      elements.cashPosition.textContent = 'Balanced';
      elements.cashPositionNote.textContent = 'Entered income and expenses are equal.';
    }
  }

  function updateOutputs() {
    const activeIncome = state.income
      .map((row) => ({ ...row, amount: numeric(row.amount), name: row.name.trim() || 'Income' }))
      .filter((row) => row.amount > 0);
    const activeExpenses = state.expenses
      .map((row) => ({ ...row, amount: numeric(row.amount), name: row.name.trim() || 'Expense' }))
      .filter((row) => row.amount > 0);
    const incomeTotal = total(activeIncome);
    const expenseTotal = total(activeExpenses);
    const balance = incomeTotal - expenseTotal;
    const kindLabels = { spending: 'Spending', saving: 'Saving / investing', debt: 'Debt payment' };
    const tableRows = [
      ...activeIncome.map((row) => ({ ...row, label: 'Income' })),
      ...activeExpenses.map((row) => ({ ...row, label: kindLabels[row.kind] || 'Spending' })),
      { name: balance >= 0 ? 'Unassigned surplus' : 'Funding shortfall', label: 'Balance', amount: Math.abs(balance) },
    ];
    elements.dataRows.innerHTML = tableRows.map((row) => `<tr><th scope="row">${escapeHtml(row.name)}<span>${escapeHtml(row.label)}</span></th><td>${escapeHtml(formatMoney(row.amount))}</td></tr>`).join('');

    elements.incomeTotal.textContent = formatMoney(incomeTotal);
    elements.expenseTotal.textContent = formatMoney(expenseTotal);
    elements.summaryIncome.textContent = formatMoney(incomeTotal);
    elements.summaryExpenses.textContent = formatMoney(expenseTotal);
    elements.summaryBalance.textContent = formatMoney(Math.abs(balance));
    elements.summaryBalance.classList.toggle('positive', balance > 0.005);
    elements.summaryBalance.classList.toggle('negative', balance < -0.005);
    elements.chartPeriod.textContent = `${state.period === 'annual' ? 'Annual' : 'Monthly'} cash flow`;
    elements.breakdownBasis.textContent = `Share of ${state.period === 'annual' ? 'annual' : 'monthly'} money out`;

    if (balance > 0.005) {
      elements.balanceLabel.textContent = 'Surplus';
      elements.flowStatus.textContent = 'Surplus';
      elements.flowStatus.classList.remove('shortfall');
    } else if (balance < -0.005) {
      elements.balanceLabel.textContent = 'Shortfall';
      elements.flowStatus.textContent = 'Shortfall';
      elements.flowStatus.classList.add('shortfall');
    } else {
      elements.balanceLabel.textContent = 'Surplus';
      elements.flowStatus.textContent = 'Balanced';
      elements.flowStatus.classList.remove('shortfall');
    }

    updateBreakdown(activeExpenses, expenseTotal);
    updateInsights(activeExpenses, incomeTotal, expenseTotal, balance);
    const incomingNames = activeIncome.map((row) => row.name).join(', ') || 'no entered income';
    const outgoingNames = activeExpenses.map((row) => row.name).join(', ') || 'no entered expenses';
    elements.chartDescription.textContent = `${formatMoney(incomeTotal)} enters from ${incomingNames}. ${formatMoney(expenseTotal)} flows to ${outgoingNames}. ${balance >= 0 ? formatMoney(balance) + ' is shown as surplus.' : formatMoney(Math.abs(balance)) + ' is shown as a funding shortfall.'} Full values are in the cash-flow table.`;
    latestChartData = [activeIncome, activeExpenses, incomeTotal, expenseTotal];
    renderChartIfVisible();
    saveState();
  }

  elements.incomeRows.addEventListener('input', handleRowInput);
  elements.expenseRows.addEventListener('input', handleRowInput);
  elements.expenseRows.addEventListener('change', handleRowInput);
  elements.incomeRows.addEventListener('click', handleRemove);
  elements.expenseRows.addEventListener('click', handleRemove);
  elements.addIncome.addEventListener('click', () => addRow('income'));
  elements.addExpense.addEventListener('click', () => addRow('expenses'));
  elements.form.addEventListener('change', (event) => {
    if (event.target.name === 'period') changePeriod(event.target.value);
  });
  elements.form.addEventListener('submit', (event) => event.preventDefault());
  elements.reset.addEventListener('click', () => {
    state = cloneDefaults();
    state.currency = currentEdition() === 'us' ? 'USD' : 'CAD';
    document.querySelector('input[name="period"][value="monthly"]').checked = true;
    renderAllRows();
    updateOutputs();
  });

  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(() => {
      if (!mapDetails?.open || !chartInView || chartLoadState !== 'ready') return;
      const width = Math.round(elements.chartFrame.clientWidth || 0);
      if (!width || Math.abs(width - lastChartWidth) < 2) return;
      window.clearTimeout(redrawTimer);
      redrawTimer = window.setTimeout(renderChartIfVisible, 80);
    });
    observer.observe(elements.chartFrame);
  } else {
    window.addEventListener('resize', () => {
      if (!mapDetails?.open || !chartInView || chartLoadState !== 'ready') return;
      window.clearTimeout(redrawTimer);
      redrawTimer = window.setTimeout(renderChartIfVisible, 120);
    });
  }

  document.querySelector(`input[name="period"][value="${state.period}"]`).checked = true;
  const narrowScreen = window.matchMedia('(max-width: 600px)').matches;
  // Start closed in HTML so phones never paint a tall map and then collapse it.
  if (mapDetails && !narrowScreen) mapDetails.open = true;
  let previousMapOpen = Boolean(mapDetails?.open);
  const valuesDetails = document.getElementById('cashFlowValues');
  if (valuesDetails && !narrowScreen) valuesDetails.open = false;
  mapDetails?.addEventListener('toggle', () => {
    const userOpenedMap = mapDetails.open && !previousMapOpen;
    previousMapOpen = mapDetails.open;
    if (mapDetails.open) {
      if (userOpenedMap && chartLoadState === 'idle') loadChartLibraries();
      renderChartIfVisible();
    }
  });
  elements.chartRetry?.addEventListener('click', () => {
    mapDetails?.querySelector('summary')?.focus({ preventScroll: true });
    loadChartLibraries();
  });
  if ('IntersectionObserver' in window && mapDetails) {
    const observer = new window.IntersectionObserver((entries) => {
      chartInView = entries.some((entry) => entry.isIntersecting);
      renderChartIfVisible();
    }, { rootMargin: '120px' });
    observer.observe(mapDetails);
  }
  renderAllRows();
  updateOutputs();
})();
