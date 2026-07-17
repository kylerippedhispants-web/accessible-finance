(function () {
  'use strict';

  const form = document.getElementById('fireForm');
  if (!form) return;

  const money = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
  const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
  const inputIds = [
    'currentAge',
    'targetAge',
    'annualIncome',
    'annualSpending',
    'currentInvestments',
    'annualInvesting',
    'realReturn',
    'withdrawalRate',
    'socialSecurity',
    'benefitAge',
  ];

  function value(id) {
    const parsed = Number.parseFloat(document.getElementById(id)?.value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function clamp(valueToClamp, min, max) {
    return Math.min(Math.max(valueToClamp, min), max);
  }

  function formatMoney(valueToFormat) {
    return money.format(Math.round(Math.max(0, valueToFormat || 0)));
  }

  function futureValue(start, annualContribution, rate, years) {
    const duration = Math.max(0, years);
    if (!duration) return start;
    if (Math.abs(rate) < 0.00001) return start + (annualContribution * duration);
    const growth = Math.pow(1 + rate, duration);
    return (start * growth) + (annualContribution * ((growth - 1) / rate));
  }

  function requiredAnnualContribution(target, start, rate, years) {
    if (years <= 0) return start >= target ? 0 : Infinity;
    const remaining = target - (start * Math.pow(1 + rate, years));
    if (remaining <= 0) return 0;
    const factor = Math.abs(rate) < 0.00001
      ? years
      : (Math.pow(1 + rate, years) - 1) / rate;
    return remaining / factor;
  }

  function projectionAges(currentAge, targetAge) {
    const start = Math.round(currentAge);
    const end = Math.max(start, Math.round(targetAge));
    const ages = new Set([start, end]);
    for (let age = start + 5; age < end; age += 5) ages.add(age);
    return Array.from(ages).sort((a, b) => a - b).slice(0, 9);
  }

  function update() {
    const currentAge = clamp(value('currentAge'), 18, 90);
    const targetAge = clamp(value('targetAge'), currentAge, 95);
    const income = Math.max(0, value('annualIncome'));
    const spending = Math.max(0, value('annualSpending'));
    const current = Math.max(0, value('currentInvestments'));
    const annual = Math.max(0, value('annualInvesting'));
    const rate = clamp(value('realReturn') / 100, -0.1, 0.15);
    const withdrawal = clamp(value('withdrawalRate') / 100, 0.02, 0.08);
    const socialSecurity = Math.max(0, value('socialSecurity'));
    const benefitAge = clamp(value('benefitAge'), 62, 70);
    const years = Math.max(0, targetAge - currentAge);

    const target = spending / withdrawal;
    const projected = futureValue(current, annual, rate, years);
    const gap = projected - target;
    const funded = target > 0 ? clamp((current / target) * 100, 0, 100) : 100;
    const requiredAnnual = requiredAnnualContribution(target, current, rate, years);
    const extraMonthly = Number.isFinite(requiredAnnual)
      ? Math.max(0, requiredAnnual - annual) / 12
      : Infinity;
    const investingRate = income > 0 ? clamp((annual / income) * 100, 0, 100) : 0;
    const laterTarget = Math.max(0, spending - socialSecurity) / withdrawal;

    let fireAge = null;
    for (let age = Math.ceil(currentAge); age <= 100; age += 1) {
      if (futureValue(current, annual, rate, age - currentAge) >= target) {
        fireAge = age;
        break;
      }
    }

    document.getElementById('fireNumber').textContent = formatMoney(target);
    document.getElementById('fireSummary').textContent = `${formatMoney(spending)} of annual spending at a ${(withdrawal * 100).toFixed(1).replace('.0', '')}% withdrawal rate.`;
    document.getElementById('fundedToday').textContent = `${number.format(funded)}%`;
    document.getElementById('targetPortfolio').textContent = formatMoney(projected);
    document.getElementById('targetGap').textContent = `${gap >= 0 ? '+' : '-'}${formatMoney(Math.abs(gap))}`;
    document.getElementById('targetGap').classList.toggle('positive', gap >= 0);
    document.getElementById('estimatedAge').textContent = fireAge ? String(fireAge) : 'After 100';
    document.getElementById('extraMonthly').textContent = Number.isFinite(extraMonthly) ? formatMoney(extraMonthly) : 'N/A';
    document.getElementById('savingsRate').textContent = `${number.format(investingRate)}%`;
    document.getElementById('fireProgress').style.width = `${funded}%`;
    document.getElementById('benefitNote').textContent = socialSecurity > 0
      ? `Starting around age ${number.format(benefitAge)}, the entered ${formatMoney(socialSecurity)} annual benefit could lower a later-life portfolio target to roughly ${formatMoney(laterTarget)}. It does not fund the earlier bridge years.`
      : 'Add your own Social Security estimate for later-life context. The base FIRE number still funds the bridge years without it.';

    document.getElementById('projectionRows').innerHTML = projectionAges(currentAge, targetAge).map((age) => {
      const balance = futureValue(current, annual, rate, age - currentAge);
      const progress = target > 0 ? (balance / target) * 100 : 100;
      const note = balance >= target
        ? 'At or above the base target'
        : (age === Math.round(targetAge) ? 'Selected target age' : 'Accumulation years');
      return `<tr><td><strong>${age}</strong></td><td>${formatMoney(balance)}</td><td>${number.format(progress)}%</td><td>${note}</td></tr>`;
    }).join('');
  }

  inputIds.forEach((id) => {
    const field = document.getElementById(id);
    field?.addEventListener('input', update);
    field?.addEventListener('change', update);
  });
  form.addEventListener('submit', (event) => event.preventDefault());
  update();
})();
