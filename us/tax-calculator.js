(function () {
  'use strict';

  const taxData = {
    single: {
      label: 'Single',
      standardDeduction: 16100,
      brackets: [[12400, 0.10], [50400, 0.12], [105700, 0.22], [201775, 0.24], [256225, 0.32], [640600, 0.35], [Infinity, 0.37]],
    },
    marriedJoint: {
      label: 'Married filing jointly',
      standardDeduction: 32200,
      brackets: [[24800, 0.10], [100800, 0.12], [211400, 0.22], [403550, 0.24], [512450, 0.32], [768700, 0.35], [Infinity, 0.37]],
    },
    headOfHousehold: {
      label: 'Head of household',
      standardDeduction: 24150,
      brackets: [[17700, 0.10], [67450, 0.12], [105700, 0.22], [201750, 0.24], [256200, 0.32], [640600, 0.35], [Infinity, 0.37]],
    },
    marriedSeparate: {
      label: 'Married filing separately',
      standardDeduction: 16100,
      brackets: [[12400, 0.10], [50400, 0.12], [105700, 0.22], [201775, 0.24], [256225, 0.32], [384350, 0.35], [Infinity, 0.37]],
    },
  };

  const form = document.getElementById('taxForm');
  if (!form) return;

  const money = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
  const percent = new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: 1,
  });

  function value(id) {
    const parsed = Number.parseFloat(document.getElementById(id)?.value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }

  function calculateBracketTax(taxableIncome, brackets) {
    let previous = 0;
    let total = 0;
    const rows = [];

    for (const [upper, rate] of brackets) {
      const amount = Math.max(0, Math.min(taxableIncome, upper) - previous);
      if (amount > 0) {
        const layerTax = amount * rate;
        total += layerTax;
        rows.push({ rate, amount, tax: layerTax });
      }
      if (taxableIncome <= upper) break;
      previous = upper;
    }
    return { total, rows };
  }

  function marginalRate(taxableIncome, brackets) {
    if (taxableIncome <= 0) return 0;
    return (brackets.find(([upper]) => taxableIncome <= upper) || brackets[brackets.length - 1])[1];
  }

  function formatMoney(amount) {
    return money.format(Math.round(Math.max(0, amount || 0)));
  }

  function update() {
    const statusKey = document.getElementById('filingStatus').value;
    const status = taxData[statusKey];
    const gross = value('grossIncome');
    const workplace = value('workplaceContributions');
    const hsa = value('hsaContributions');
    const other = value('otherAdjustments');
    const itemized = value('itemizedDeductions');
    const enteredAdjustments = workplace + hsa + other;
    const adjustments = Math.min(gross, enteredAdjustments);
    const agi = Math.max(0, gross - adjustments);
    const deduction = Math.max(status.standardDeduction, itemized);
    const taxable = Math.max(0, agi - deduction);
    const calculation = calculateBracketTax(taxable, status.brackets);
    const marginal = marginalRate(taxable, status.brackets);
    const effective = gross > 0 ? calculation.total / gross : 0;
    const cashContributions = Math.min(gross, workplace + hsa);
    const afterFederal = Math.max(0, gross - cashContributions - calculation.total);

    const baselineAgi = Math.max(0, gross - Math.min(gross, other));
    const baselineTaxable = Math.max(0, baselineAgi - deduction);
    const baselineTax = calculateBracketTax(baselineTaxable, status.brackets).total;
    const contributionSavings = Math.max(0, baselineTax - calculation.total);

    document.getElementById('resultStatus').textContent = `${status.label} estimate`;
    document.getElementById('federalTax').textContent = formatMoney(calculation.total);
    document.getElementById('taxSummary').textContent = `${formatMoney(taxable)} of taxable ordinary income after the ${itemized > status.standardDeduction ? 'entered itemized' : 'standard'} deduction.`;
    document.getElementById('adjustedIncome').textContent = formatMoney(agi);
    document.getElementById('deductionUsed').textContent = formatMoney(deduction);
    document.getElementById('taxableIncome').textContent = formatMoney(taxable);
    document.getElementById('marginalRate').textContent = percent.format(marginal);
    document.getElementById('effectiveRate').textContent = percent.format(effective);
    document.getElementById('contributionSavings').textContent = formatMoney(contributionSavings);
    document.getElementById('afterFederal').textContent = formatMoney(afterFederal);
    document.getElementById('taxShareBar').style.width = `${Math.min(100, effective * 100)}%`;

    document.getElementById('bracketRows').innerHTML = calculation.rows.length
      ? calculation.rows.map((row) => `<tr><td><strong>${percent.format(row.rate)}</strong></td><td>${formatMoney(row.amount)}</td><td>${formatMoney(row.tax)}</td></tr>`).join('')
      : '<tr><td><strong>0%</strong></td><td>$0</td><td>$0</td></tr>';
  }

  form.querySelectorAll('input, select').forEach((field) => {
    field.addEventListener('input', update);
    field.addEventListener('change', update);
  });
  form.addEventListener('submit', (event) => event.preventDefault());
  form.addEventListener('reset', () => window.setTimeout(update, 0));
  update();
})();
