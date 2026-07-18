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

  // Lower-bound rate schedules from the 2026 state individual income-tax table.
  // State taxable income, deductions, credits, and filing-status rules vary; the
  // calculator explains the simplified treatment alongside every estimate.
  const stateTaxData = {
    AL: { label: 'Alabama', brackets: [[0, 0.02], [500, 0.04], [3000, 0.05]] },
    AK: { label: 'Alaska', noTax: true },
    AZ: { label: 'Arizona', brackets: [[0, 0.025]] },
    AR: { label: 'Arkansas', brackets: [[0, 0.02], [4600, 0.039]], note: 'Arkansas uses separate tables for some taxpayers with income of $92,300 or less; those tables are not modeled.' },
    CA: { label: 'California', brackets: [[0, 0.01], [11079, 0.02], [26264, 0.04], [41452, 0.06], [57542, 0.08], [72724, 0.093], [371479, 0.103], [445771, 0.113], [742953, 0.123], [1000000, 0.133]], note: 'The published California thresholds use the latest inflation-adjusted brackets available in the 2026 source table.' },
    CO: { label: 'Colorado', brackets: [[0, 0.044]] },
    CT: { label: 'Connecticut', brackets: [[0, 0.02], [10000, 0.045], [50000, 0.055], [100000, 0.06], [200000, 0.065], [250000, 0.069], [500000, 0.0699]], note: 'Connecticut tax-benefit recapture is not modeled.' },
    DE: { label: 'Delaware', brackets: [[0, 0], [2000, 0.022], [5000, 0.039], [10000, 0.048], [20000, 0.052], [25000, 0.0555], [60000, 0.066]] },
    DC: { label: 'District of Columbia', brackets: [[0, 0.04], [10000, 0.06], [40000, 0.065], [60000, 0.085], [250000, 0.0925], [500000, 0.0975], [1000000, 0.1075]] },
    FL: { label: 'Florida', noTax: true },
    GA: { label: 'Georgia', brackets: [[0, 0.0519]] },
    HI: { label: 'Hawaii', brackets: [[0, 0.014], [9600, 0.032], [14400, 0.055], [19200, 0.064], [24000, 0.068], [36000, 0.072], [48000, 0.076], [125000, 0.079], [175000, 0.0825], [225000, 0.09], [275000, 0.10], [325000, 0.11]] },
    ID: { label: 'Idaho', brackets: [[0, 0], [4811, 0.053]] },
    IL: { label: 'Illinois', brackets: [[0, 0.0495]] },
    IN: { label: 'Indiana', brackets: [[0, 0.0295]] },
    IA: { label: 'Iowa', brackets: [[0, 0.038]] },
    KS: { label: 'Kansas', brackets: [[0, 0.052], [23000, 0.0558]] },
    KY: { label: 'Kentucky', brackets: [[0, 0.035]] },
    LA: { label: 'Louisiana', brackets: [[0, 0.03]] },
    ME: { label: 'Maine', brackets: [[0, 0.058], [27399, 0.0675], [64849, 0.0715], [1000000, 0.0915]] },
    MD: { label: 'Maryland', brackets: [[0, 0.02], [1000, 0.03], [2000, 0.04], [3000, 0.0475], [100000, 0.05], [125000, 0.0525], [150000, 0.055], [250000, 0.0575], [500000, 0.0625], [1000000, 0.065]], note: 'Maryland county income taxes are not included.' },
    MA: { label: 'Massachusetts', brackets: [[0, 0.05], [1083150, 0.09]] },
    MI: { label: 'Michigan', brackets: [[0, 0.0425]] },
    MN: { label: 'Minnesota', brackets: [[0, 0.0535], [33310, 0.068], [109430, 0.0785], [203150, 0.0985]] },
    MS: { label: 'Mississippi', brackets: [[0, 0], [10000, 0.04]] },
    MO: { label: 'Missouri', brackets: [[0, 0], [1348, 0.02], [2696, 0.025], [4044, 0.03], [5392, 0.035], [6740, 0.04], [8088, 0.045], [9436, 0.047]] },
    MT: { label: 'Montana', brackets: [[0, 0.047], [47500, 0.0565]] },
    NE: { label: 'Nebraska', brackets: [[0, 0.0246], [4130, 0.0351], [24760, 0.0455]] },
    NV: { label: 'Nevada', noTax: true },
    NH: { label: 'New Hampshire', noTax: true },
    NJ: { label: 'New Jersey', brackets: [[0, 0.014], [20000, 0.0175], [35000, 0.035], [40000, 0.05525], [75000, 0.0637], [500000, 0.0897], [1000000, 0.1075]] },
    NM: { label: 'New Mexico', brackets: [[0, 0.015], [5500, 0.032], [16500, 0.043], [33500, 0.047], [66500, 0.049], [210000, 0.059]] },
    NY: { label: 'New York', brackets: [[0, 0.039], [8500, 0.044], [11700, 0.0515], [13900, 0.054], [80650, 0.059], [215400, 0.0685], [1077550, 0.0965], [5000000, 0.103], [25000000, 0.109]], note: 'New York tax-benefit recapture and New York City and Yonkers income taxes are not modeled.' },
    NC: { label: 'North Carolina', brackets: [[0, 0.0399]] },
    ND: { label: 'North Dakota', brackets: [[0, 0], [48475, 0.0195], [244825, 0.025]] },
    OH: { label: 'Ohio', brackets: [[0, 0], [26050, 0.0275]], note: 'Ohio municipal income taxes are not included.' },
    OK: { label: 'Oklahoma', brackets: [[0, 0], [3750, 0.025], [4900, 0.035], [7200, 0.045]] },
    OR: { label: 'Oregon', brackets: [[0, 0.0475], [4550, 0.0675], [11400, 0.0875], [125000, 0.099]], note: 'Oregon local and regional payroll or income taxes are not included.' },
    PA: { label: 'Pennsylvania', brackets: [[0, 0.0307]], note: 'Pennsylvania local earned-income taxes are not included.' },
    RI: { label: 'Rhode Island', brackets: [[0, 0.0375], [82050, 0.0475], [186450, 0.0599]] },
    SC: { label: 'South Carolina', brackets: [[0, 0.0199], [29999, 0.0521]] },
    SD: { label: 'South Dakota', noTax: true },
    TN: { label: 'Tennessee', noTax: true },
    TX: { label: 'Texas', noTax: true },
    UT: { label: 'Utah', brackets: [[0, 0.0445]] },
    VT: { label: 'Vermont', brackets: [[0, 0.0335], [49400, 0.066], [119700, 0.076], [249700, 0.0875]] },
    VA: { label: 'Virginia', brackets: [[0, 0.02], [3000, 0.03], [5000, 0.05], [17000, 0.0575]] },
    WA: { label: 'Washington', noTax: true, note: 'Washington taxes certain capital gains, but it does not levy a broad individual income tax on ordinary wage income. Capital gains are not modeled.' },
    WV: { label: 'West Virginia', brackets: [[0, 0.0211], [10000, 0.0281], [25000, 0.0316], [40000, 0.0422], [60000, 0.0458]] },
    WI: { label: 'Wisconsin', brackets: [[0, 0.035], [15110, 0.044], [51950, 0.053], [332720, 0.0765]] },
    WY: { label: 'Wyoming', noTax: true },
  };

  const stateBracketScale = {
    single: 1,
    marriedJoint: 2,
    headOfHousehold: 1.5,
    marriedSeparate: 1,
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

  function calculateThresholdTax(taxableIncome, brackets) {
    let total = 0;
    const rows = [];

    brackets.forEach(([lower, rate], index) => {
      const upper = brackets[index + 1]?.[0] ?? Infinity;
      const amount = Math.max(0, Math.min(taxableIncome, upper) - lower);
      if (amount > 0) {
        const layerTax = amount * rate;
        total += layerTax;
        rows.push({ rate, amount, tax: layerTax });
      }
    });

    return { total, rows };
  }

  function scaledStateBrackets(brackets, statusKey) {
    const scale = stateBracketScale[statusKey] || 1;
    return brackets.map(([lower, rate]) => [lower * scale, rate]);
  }

  function marginalRate(taxableIncome, brackets) {
    if (taxableIncome <= 0) return 0;
    return (brackets.find(([upper]) => taxableIncome <= upper) || brackets[brackets.length - 1])[1];
  }

  function thresholdMarginalRate(taxableIncome, brackets) {
    if (taxableIncome <= 0) return 0;
    return brackets.reduce((currentRate, [lower, rate]) => (
      taxableIncome > lower ? rate : currentRate
    ), 0);
  }

  function formatMoney(amount) {
    return money.format(Math.round(Math.max(0, amount || 0)));
  }

  function update() {
    const statusKey = document.getElementById('filingStatus').value;
    const status = taxData[statusKey];
    const stateKey = document.getElementById('state').value;
    const selectedState = stateTaxData[stateKey] || null;
    const hasStateIncomeTax = Boolean(selectedState && !selectedState.noTax);
    const gross = value('grossIncome');
    const workplace = value('workplaceContributions');
    const hsa = value('hsaContributions');
    const other = value('otherAdjustments');
    const itemized = value('itemizedDeductions');
    const enteredStateDeductions = value('stateDeductions');
    const enteredAdjustments = workplace + hsa + other;
    const adjustments = Math.min(gross, enteredAdjustments);
    const agi = Math.max(0, gross - adjustments);
    const deduction = Math.max(status.standardDeduction, itemized);
    const taxable = Math.max(0, agi - deduction);
    const federalCalculation = calculateBracketTax(taxable, status.brackets);
    const federalMarginal = marginalRate(taxable, status.brackets);

    const stateDeductions = Math.min(agi, enteredStateDeductions);
    const stateTaxable = hasStateIncomeTax ? Math.max(0, agi - stateDeductions) : 0;
    const stateBrackets = hasStateIncomeTax
      ? scaledStateBrackets(selectedState.brackets, statusKey)
      : [];
    const stateCalculation = hasStateIncomeTax
      ? calculateThresholdTax(stateTaxable, stateBrackets)
      : { total: 0, rows: [] };
    const stateMarginal = hasStateIncomeTax
      ? thresholdMarginalRate(stateTaxable, stateBrackets)
      : 0;

    const totalTax = federalCalculation.total + stateCalculation.total;
    const effective = gross > 0 ? totalTax / gross : 0;
    const cashContributions = Math.min(gross, workplace + hsa);
    const afterIncomeTax = Math.max(0, gross - cashContributions - totalTax);

    const baselineAgi = Math.max(0, gross - Math.min(gross, other));
    const baselineTaxable = Math.max(0, baselineAgi - deduction);
    const baselineFederalTax = calculateBracketTax(baselineTaxable, status.brackets).total;
    const baselineStateTaxable = hasStateIncomeTax
      ? Math.max(0, baselineAgi - Math.min(baselineAgi, enteredStateDeductions))
      : 0;
    const baselineStateTax = hasStateIncomeTax
      ? calculateThresholdTax(baselineStateTaxable, stateBrackets).total
      : 0;
    const contributionSavings = Math.max(
      0,
      baselineFederalTax + baselineStateTax - totalTax,
    );

    const stateDeductionInput = document.getElementById('stateDeductions');
    stateDeductionInput.disabled = !hasStateIncomeTax;
    document.getElementById('stateHelp').textContent = selectedState
      ? (selectedState.noTax
        ? `${selectedState.label} has no broad individual income tax on ordinary wage income.`
        : `Add a simplified ${selectedState.label} estimate using its published 2026 rate schedule.`)
      : 'Choose a state to add its simplified 2026 income-tax estimate.';
    document.getElementById('stateDeductionHelp').textContent = hasStateIncomeTax
      ? `Optional. Enter ${selectedState.label} deductions and exemptions to subtract from adjusted gross income.`
      : 'Available after selecting a state that levies a broad individual income tax.';

    const resultLabel = selectedState ? selectedState.label : 'Federal only';
    document.getElementById('resultStatus').textContent = `${status.label} - ${resultLabel}`;
    document.getElementById('totalTax').textContent = formatMoney(totalTax);
    document.getElementById('federalTax').textContent = formatMoney(federalCalculation.total);
    document.getElementById('stateTax').textContent = selectedState
      ? formatMoney(stateCalculation.total)
      : 'N/A';
    document.getElementById('taxSummary').textContent = selectedState
      ? (selectedState.noTax
        ? `${formatMoney(federalCalculation.total)} federal tax; ${selectedState.label} has no broad tax on ordinary income.`
        : `${formatMoney(federalCalculation.total)} federal + ${formatMoney(stateCalculation.total)} ${selectedState.label} income tax.`)
      : 'Federal estimate only. Select a state to add a state income-tax estimate.';
    document.getElementById('adjustedIncome').textContent = formatMoney(agi);
    document.getElementById('deductionUsed').textContent = formatMoney(deduction);
    document.getElementById('taxableIncome').textContent = formatMoney(taxable);
    document.getElementById('stateTaxableIncome').textContent = hasStateIncomeTax
      ? formatMoney(stateTaxable)
      : 'N/A';
    document.getElementById('marginalRate').textContent = percent.format(federalMarginal);
    document.getElementById('stateMarginalRate').textContent = hasStateIncomeTax
      ? percent.format(stateMarginal)
      : 'N/A';
    document.getElementById('effectiveRate').textContent = percent.format(effective);
    document.getElementById('contributionSavings').textContent = formatMoney(contributionSavings);
    document.getElementById('afterIncomeTax').textContent = formatMoney(afterIncomeTax);
    document.getElementById('taxShareBar').style.width = `${Math.min(100, effective * 100)}%`;

    document.getElementById('bracketRows').innerHTML = federalCalculation.rows.length
      ? federalCalculation.rows.map((row) => `<tr><td><strong>${percent.format(row.rate)}</strong></td><td>${formatMoney(row.amount)}</td><td>${formatMoney(row.tax)}</td></tr>`).join('')
      : '<tr><td><strong>0%</strong></td><td>$0</td><td>$0</td></tr>';

    const stateBreakdownTitle = document.getElementById('stateBreakdownTitle');
    const stateBreakdownLabel = document.getElementById('stateBreakdownLabel');
    const stateBracketRows = document.getElementById('stateBracketRows');
    const stateMethodNote = document.getElementById('stateMethodNote');

    if (!selectedState) {
      stateBreakdownTitle.textContent = 'State bracket breakdown';
      stateBreakdownLabel.textContent = 'Select a state to calculate';
      stateBracketRows.innerHTML = '<tr><td><strong>N/A</strong></td><td>Select a state</td><td>$0</td></tr>';
      stateMethodNote.textContent = 'Choose a state above to add a simplified state income-tax estimate.';
    } else if (selectedState.noTax) {
      stateBreakdownTitle.textContent = `${selectedState.label} income tax`;
      stateBreakdownLabel.textContent = 'No broad tax on ordinary income';
      stateBracketRows.innerHTML = '<tr><td><strong>0%</strong></td><td>Ordinary wage income</td><td>$0</td></tr>';
      stateMethodNote.textContent = selectedState.note || `${selectedState.label} does not levy a broad individual income tax on ordinary wage income. Capital gains, payroll, sales, property, and local taxes are not modeled.`;
    } else {
      stateBreakdownTitle.textContent = `${selectedState.label} bracket breakdown`;
      stateBreakdownLabel.textContent = statusKey === 'single' || statusKey === 'marriedSeparate'
        ? 'Published single-filer schedule'
        : `Approximate ${status.label.toLowerCase()} schedule`;
      stateBracketRows.innerHTML = stateCalculation.rows.length
        ? stateCalculation.rows.map((row) => `<tr><td><strong>${percent.format(row.rate)}</strong></td><td>${formatMoney(row.amount)}</td><td>${formatMoney(row.tax)}</td></tr>`).join('')
        : '<tr><td><strong>0%</strong></td><td>$0</td><td>$0</td></tr>';

      const filingNote = statusKey === 'single' || statusKey === 'marriedSeparate'
        ? ''
        : ` Bracket widths are scaled as an approximation for ${status.label.toLowerCase()}.`;
      const stateNote = selectedState.note ? ` ${selectedState.note}` : '';
      stateMethodNote.textContent = `This simplified ${selectedState.label} estimate applies its published 2026 ordinary-income rates to federal adjusted gross income less the state deductions entered above.${filingNote} Credits, local taxes, and special state adjustments are excluded.${stateNote}`;
    }
  }

  form.querySelectorAll('input, select').forEach((field) => {
    field.addEventListener('input', update);
    field.addEventListener('change', update);
  });
  form.addEventListener('submit', (event) => event.preventDefault());
  form.addEventListener('reset', () => window.setTimeout(update, 0));
  update();
})();
