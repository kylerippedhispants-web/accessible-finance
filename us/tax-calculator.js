(function () {
  'use strict';

  const taxData = {
    single: {
      label: 'Single',
      standardDeduction: 16100,
      brackets: [[12400, 0.10], [50400, 0.12], [105700, 0.22], [201775, 0.24], [256225, 0.32], [640600, 0.35], [Infinity, 0.37]],
      capitalGainsThresholds: [49450, 545500],
      niitThreshold: 200000,
    },
    marriedJoint: {
      label: 'Married filing jointly',
      standardDeduction: 32200,
      brackets: [[24800, 0.10], [100800, 0.12], [211400, 0.22], [403550, 0.24], [512450, 0.32], [768700, 0.35], [Infinity, 0.37]],
      capitalGainsThresholds: [98900, 613700],
      niitThreshold: 250000,
    },
    headOfHousehold: {
      label: 'Head of household',
      standardDeduction: 24150,
      brackets: [[17700, 0.10], [67450, 0.12], [105700, 0.22], [201750, 0.24], [256200, 0.32], [640600, 0.35], [Infinity, 0.37]],
      capitalGainsThresholds: [66200, 579600],
      niitThreshold: 200000,
    },
    marriedSeparate: {
      label: 'Married filing separately',
      standardDeduction: 16100,
      brackets: [[12400, 0.10], [50400, 0.12], [105700, 0.22], [201775, 0.24], [256225, 0.32], [384350, 0.35], [Infinity, 0.37]],
      capitalGainsThresholds: [49450, 306850],
      niitThreshold: 125000,
    },
  };

  // Verified rate coverage, checked 2026-10-20. No guessed filing-status multipliers.
  // Missing schedules are deliberately unavailable, not zero-tax estimates.
  const stateTaxData = {
    "AL": {
      "label": "Alabama"
    },
    "AK": {
      "label": "Alaska",
      "noTax": true,
      "source": "https://treasury.dor.alaska.gov/docs/treasurydivisionlibraries/debt-management/meetings-minutes/packets/2023_06_01_sbc_packet.pdf"
    },
    "AZ": {
      "label": "Arizona"
    },
    "AR": {
      "label": "Arkansas"
    },
    "CA": {
      "label": "California"
    },
    "CO": {
      "label": "Colorado"
    },
    "CT": {
      "label": "Connecticut"
    },
    "DE": {
      "label": "Delaware"
    },
    "DC": {
      "label": "District of Columbia"
    },
    "FL": {
      "label": "Florida",
      "noTax": true,
      "source": "https://floridarevenue.com/faq/Pages/FAQDetails.aspx?FAQID=1466"
    },
    "GA": {
      "label": "Georgia"
    },
    "HI": {
      "label": "Hawaii"
    },
    "ID": {
      "label": "Idaho"
    },
    "IL": {
      "label": "Illinois",
      "brackets": [
        [
          0,
          0.0495
        ]
      ],
      "source": "https://tax.illinois.gov/research/taxrates/income.html",
      "note": "Illinois exemptions and additions or subtractions must be entered by you; they are not calculated automatically."
    },
    "IN": {
      "label": "Indiana"
    },
    "IA": {
      "label": "Iowa"
    },
    "KS": {
      "label": "Kansas"
    },
    "KY": {
      "label": "Kentucky"
    },
    "LA": {
      "label": "Louisiana"
    },
    "ME": {
      "label": "Maine"
    },
    "MD": {
      "label": "Maryland"
    },
    "MA": {
      "label": "Massachusetts"
    },
    "MI": {
      "label": "Michigan",
      "brackets": [
        [
          0,
          0.0425
        ]
      ],
      "source": "https://www.michigan.gov/treasury/reference/taxpayer-notices/2026/04/15/425-income-tax-rate-for-individuals-and-fiduciaries-in-2026-tax-year",
      "note": "Michigan exemptions and additions or subtractions must be entered by you. City taxes are excluded."
    },
    "MN": {
      "label": "Minnesota"
    },
    "MS": {
      "label": "Mississippi"
    },
    "MO": {
      "label": "Missouri"
    },
    "MT": {
      "label": "Montana"
    },
    "NE": {
      "label": "Nebraska"
    },
    "NV": {
      "label": "Nevada",
      "noTax": true,
      "source": "https://tax.nv.gov/wp-content/uploads/2025/01/20250122-CLGF-Packet.pdf"
    },
    "NH": {
      "label": "New Hampshire",
      "noTax": true,
      "source": "https://www.revenue.nh.gov/news-and-media/repeal-nh-interest-and-dividends-tax-now-effect"
    },
    "NJ": {
      "label": "New Jersey"
    },
    "NM": {
      "label": "New Mexico"
    },
    "NY": {
      "label": "New York"
    },
    "NC": {
      "label": "North Carolina",
      "brackets": [
        [
          0,
          0.0399
        ]
      ],
      "source": "https://www.ncdor.gov/taxes-forms/individual-income-tax/tax-rate-schedules",
      "note": "North Carolina deductions and additions or subtractions must be entered by you; they are not calculated automatically."
    },
    "ND": {
      "label": "North Dakota"
    },
    "OH": {
      "label": "Ohio",
      "brackets": [
        [
          0,
          0
        ],
        [
          26050,
          0.0275
        ]
      ],
      "threshold": 26050,
      "baseAboveThreshold": 332,
      "source": "https://codes.ohio.gov/ohio-revised-code/section-5747.02",
      "note": "Ohio nonbusiness income only. Above $26,050 the 2026 statute adds $332 before applying 2.75% to the excess. Business income, municipal and school district tax, exemptions, and credits need separate treatment."
    },
    "OK": {
      "label": "Oklahoma"
    },
    "OR": {
      "label": "Oregon"
    },
    "PA": {
      "label": "Pennsylvania"
    },
    "RI": {
      "label": "Rhode Island",
      "brackets": [
        [
          0,
          0.0375
        ],
        [
          82050,
          0.0475
        ],
        [
          186450,
          0.0599
        ]
      ],
      "source": "https://tax.ri.gov/sites/g/files/xkgbur541/files/2025-11/ADV_2025_22_Inflation_Adjustments.pdf",
      "note": "Rhode Island uses the same rate schedule for all filing statuses. Its deduction and exemption amounts and their phase-outs are not calculated automatically."
    },
    "SC": {
      "label": "South Carolina"
    },
    "SD": {
      "label": "South Dakota",
      "noTax": true,
      "source": "https://dor.sd.gov/media/kavh1fzg/2026-1_sales-use-tax-guide.pdf"
    },
    "TN": {
      "label": "Tennessee",
      "noTax": true,
      "source": "https://www.tn.gov/revenue/taxes/hall-income-tax.html"
    },
    "TX": {
      "label": "Texas",
      "noTax": true,
      "source": "https://comptroller.texas.gov/taxes/property-tax/docs/96-298-25.pdf"
    },
    "UT": {
      "label": "Utah"
    },
    "VT": {
      "label": "Vermont"
    },
    "VA": {
      "label": "Virginia"
    },
    "WA": {
      "label": "Washington",
      "noTax": true,
      "specialGains": true,
      "source": "https://dor.wa.gov/taxes-rates/other-taxes/capital-gains-tax",
      "note": "Washington has a separate tax on certain long-term gains. When gains are entered, this calculator withholds a state total because it does not model that tax."
    },
    "WV": {
      "label": "West Virginia"
    },
    "WI": {
      "label": "Wisconsin"
    },
    "WY": {
      "label": "Wyoming",
      "noTax": true,
      "source": "https://www.wyoleg.gov/InterimCommittee/2021/03-20210510Policy-Brief-Wyoming-Tax-Capacity-LCCC-WCBEA-1.pdf"
    }
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

  function calculateCapitalGainsTax(ordinaryTaxableIncome, longTermGain, thresholds) {
    const [zeroRateLimit, fifteenRateLimit] = thresholds;
    const gainStart = ordinaryTaxableIncome;
    const gainEnd = ordinaryTaxableIncome + longTermGain;
    const layers = [
      { label: 'Long-term gain', lower: 0, upper: zeroRateLimit, rate: 0 },
      { label: 'Long-term gain', lower: zeroRateLimit, upper: fifteenRateLimit, rate: 0.15 },
      { label: 'Long-term gain', lower: fifteenRateLimit, upper: Infinity, rate: 0.20 },
    ];
    let total = 0;
    const rows = [];

    layers.forEach((layer) => {
      const amount = Math.max(
        0,
        Math.min(gainEnd, layer.upper) - Math.max(gainStart, layer.lower),
      );
      if (amount <= 0) return;
      const tax = amount * layer.rate;
      total += tax;
      rows.push({ label: layer.label, rate: layer.rate, amount, tax });
    });

    return { total, rows };
  }

  function calculateFederalScenario({
    ordinaryIncome,
    longTermGain,
    adjustments,
    deduction,
    status,
  }) {
    const totalIncome = ordinaryIncome + longTermGain;
    const adjustedGrossIncome = Math.max(0, totalIncome - Math.min(totalIncome, adjustments));
    const taxableIncome = Math.max(0, adjustedGrossIncome - deduction);
    const taxableLongTermGain = Math.min(longTermGain, taxableIncome);
    const taxableOrdinaryIncome = Math.max(0, taxableIncome - taxableLongTermGain);
    const ordinaryCalculation = calculateBracketTax(taxableOrdinaryIncome, status.brackets);
    const capitalGainsCalculation = calculateCapitalGainsTax(
      taxableOrdinaryIncome,
      taxableLongTermGain,
      status.capitalGainsThresholds,
    );
    const preferentialTax = ordinaryCalculation.total + capitalGainsCalculation.total;
    const regularTax = calculateBracketTax(taxableIncome, status.brackets).total;
    const baseTax = Math.min(preferentialTax, regularTax);

    return {
      adjustedGrossIncome,
      taxableIncome,
      taxableOrdinaryIncome,
      taxableLongTermGain,
      ordinaryCalculation,
      capitalGainsCalculation,
      regularMethodAdjustment: Math.min(0, regularTax - preferentialTax),
      baseTax,
    };
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

  function calculateStateTax(taxableIncome, state) {
    const calculation = calculateThresholdTax(taxableIncome, state.brackets);
    if (state.baseAboveThreshold && taxableIncome > state.threshold) {
      calculation.total += state.baseAboveThreshold;
      calculation.rows.unshift({ rate: null, amount: null, tax: state.baseAboveThreshold });
    }
    return calculation;
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

  function formatSignedMoney(amount) {
    return money.format(Math.round(amount || 0));
  }

  function update() {
    const statusKey = document.getElementById('filingStatus').value;
    const status = taxData[statusKey];
    const stateKey = document.getElementById('state').value;
    const selectedState = stateTaxData[stateKey] || null;
    const hasStateIncomeTax = Boolean(selectedState?.brackets);
    const gross = value('grossIncome');
    const shortTermGains = value('shortTermGains');
    const longTermGains = value('longTermGains');
    const stateUnavailable = Boolean(selectedState && (
      (!selectedState.noTax && !selectedState.brackets)
      || (selectedState.specialGains && longTermGains > 0)
    ));
    const workplace = value('workplaceContributions');
    const hsa = value('hsaContributions');
    const other = value('otherAdjustments');
    const itemized = value('itemizedDeductions');
    const enteredStateDeductions = value('stateDeductions');
    const enteredAdjustments = workplace + hsa + other;
    const deduction = Math.max(status.standardDeduction, itemized);
    const federalScenario = calculateFederalScenario({
      ordinaryIncome: gross + shortTermGains,
      longTermGain: longTermGains,
      adjustments: enteredAdjustments,
      deduction,
      status,
    });
    const {
      adjustedGrossIncome: agi,
      taxableIncome: taxable,
      taxableOrdinaryIncome,
      ordinaryCalculation,
      capitalGainsCalculation,
      regularMethodAdjustment,
      baseTax,
    } = federalScenario;
    const netInvestmentIncome = shortTermGains + longTermGains;
    const niitBase = Math.min(
      netInvestmentIncome,
      Math.max(0, agi - status.niitThreshold),
    );
    const niit = niitBase * 0.038;
    const federalTax = baseTax + niit;
    const federalMarginal = marginalRate(taxableOrdinaryIncome, status.brackets);

    const stateDeductions = Math.min(agi, enteredStateDeductions);
    const stateOverride = document.getElementById('stateTaxableOverride');
    const hasStateOverride = hasStateIncomeTax && stateOverride.value.trim() !== '';
    const stateTaxable = hasStateIncomeTax
      ? (hasStateOverride ? value('stateTaxableOverride') : Math.max(0, agi - stateDeductions))
      : 0;
    const stateBrackets = hasStateIncomeTax
      ? selectedState.brackets
      : [];
    const stateCalculation = hasStateIncomeTax
      ? calculateStateTax(stateTaxable, selectedState)
      : { total: 0, rows: [] };
    const stateMarginal = hasStateIncomeTax
      ? thresholdMarginalRate(stateTaxable, stateBrackets)
      : 0;

    const enteredIncome = gross + shortTermGains + longTermGains;
    const totalTax = federalTax + stateCalculation.total;
    const effective = enteredIncome > 0 ? totalTax / enteredIncome : 0;
    const cashContributions = Math.min(gross, workplace + hsa);
    const afterIncomeTax = Math.max(0, enteredIncome - cashContributions - totalTax);

    const noGainScenario = calculateFederalScenario({
      ordinaryIncome: gross,
      longTermGain: 0,
      adjustments: enteredAdjustments,
      deduction,
      status,
    });
    const noGainStateTaxable = hasStateIncomeTax
      ? Math.max(
        0,
        noGainScenario.adjustedGrossIncome
          - Math.min(noGainScenario.adjustedGrossIncome, enteredStateDeductions),
      )
      : 0;
    const noGainStateTax = hasStateIncomeTax
      ? calculateStateTax(noGainStateTaxable, selectedState).total
      : 0;
    const capitalGainsTax = Math.max(
      0,
      federalTax + stateCalculation.total - noGainScenario.baseTax - noGainStateTax,
    );

    const contributionBaseline = calculateFederalScenario({
      ordinaryIncome: gross + shortTermGains,
      longTermGain: longTermGains,
      adjustments: other,
      deduction,
      status,
    });
    const contributionBaselineNiitBase = Math.min(
      netInvestmentIncome,
      Math.max(0, contributionBaseline.adjustedGrossIncome - status.niitThreshold),
    );
    const contributionBaselineFederalTax = contributionBaseline.baseTax
      + (contributionBaselineNiitBase * 0.038);
    const contributionBaselineStateTaxable = hasStateIncomeTax
      ? Math.max(
        0,
        contributionBaseline.adjustedGrossIncome
          - Math.min(contributionBaseline.adjustedGrossIncome, enteredStateDeductions),
      )
      : 0;
    const contributionBaselineStateTax = hasStateIncomeTax
      ? calculateStateTax(contributionBaselineStateTaxable, selectedState).total
      : 0;
    const contributionSavings = Math.max(
      0,
      contributionBaselineFederalTax + contributionBaselineStateTax - totalTax,
    );

    const stateDeductionInput = document.getElementById('stateDeductions');
    stateDeductionInput.disabled = !hasStateIncomeTax || hasStateOverride;
    stateOverride.disabled = !hasStateIncomeTax;
    document.getElementById('stateHelp').textContent = stateUnavailable
      ? `${selectedState.label}: state estimate unavailable. The result below includes federal tax only, not a zero state-tax bill.`
      : selectedState
        ? (selectedState.noTax
          ? `${selectedState.label} has no broad individual income tax on ordinary wage income.`
          : `${selectedState.label}: verified 2026 rate schedule, before credits. Enter state deductions or your known state taxable income.`)
        : 'State estimates cover Illinois, Michigan, North Carolina, Ohio and Rhode Island, plus states without a broad individual income tax. Other states show federal tax only.';
    document.getElementById('stateDeductionHelp').textContent = hasStateOverride
      ? 'Not used while you enter state taxable income directly.'
      : hasStateIncomeTax
        ? `Enter eligible ${selectedState.label} deductions and exemptions. They are not automatically included. Use the direct taxable-income field if state additions or other adjustments apply.`
        : 'Available for a supported state rate schedule.';
    const sourceLink = document.getElementById('stateSource');
    sourceLink.hidden = !selectedState?.source;
    if (selectedState?.source) {
      sourceLink.href = selectedState.source;
      sourceLink.textContent = `${selectedState.label}: official source (checked October 20, 2026)`;
    }

    const resultLabel = stateUnavailable ? `Federal only — ${selectedState.label} excluded` : selectedState ? selectedState.label : 'Federal only';
    document.getElementById('resultStatus').textContent = `${status.label} — ${resultLabel}`;
    document.getElementById('afterIncomeTaxLabel').textContent = stateUnavailable || !selectedState
      ? 'Income after entered contributions and federal tax only — state and payroll taxes excluded'
      : 'Income after entered contributions and modeled income tax — payroll and local taxes excluded';
    document.getElementById('effectiveRateLabel').textContent = stateUnavailable || !selectedState
      ? 'Federal effective rate' : 'Modeled effective rate';
    document.getElementById('totalTax').textContent = formatMoney(totalTax);
    document.getElementById('federalTax').textContent = formatMoney(federalTax);
    document.getElementById('stateTax').textContent = stateUnavailable ? 'Not estimated' : selectedState ? formatMoney(stateCalculation.total) : 'Not selected';
    document.getElementById('capitalGainsTax').textContent = hasStateOverride ? 'Not compared*' : formatMoney(capitalGainsTax);
    document.getElementById('niitTax').textContent = formatMoney(niit);
    if (stateUnavailable) {
      document.getElementById('taxSummary').textContent = `Federal estimate only. ${selectedState.label} tax is not included. A missing estimate does not mean no state tax is due.`;
    } else if (selectedState) {
      const modeledTaxSummary = selectedState.noTax
        ? `${formatMoney(federalTax)} federal tax. ${selectedState.label} has no broad individual income tax in this model.`
        : `${formatMoney(federalTax)} federal + ${formatMoney(stateCalculation.total)} estimated ${selectedState.label} income tax.`;
      document.getElementById('taxSummary').textContent = netInvestmentIncome > 0 && !hasStateOverride
        ? `${modeledTaxSummary} Entered gains add approximately ${formatMoney(capitalGainsTax)} across the modeled taxes.`
        : modeledTaxSummary;
    } else {
      document.getElementById('taxSummary').textContent = netInvestmentIncome > 0
        ? `Federal estimate includes approximately ${formatMoney(capitalGainsTax)} attributable to the entered gains. Select a state to add a simplified state estimate.`
        : 'Federal estimate only. Select a state to add a state income-tax estimate.';
    }
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
    document.getElementById('contributionSavings').textContent = hasStateOverride ? 'Not compared*' : formatMoney(contributionSavings);
    document.getElementById('afterIncomeTax').textContent = formatMoney(afterIncomeTax);
    document.getElementById('taxShareBar').style.width = `${Math.min(100, effective * 100)}%`;

    const federalRows = [
      ...ordinaryCalculation.rows.map((row) => ({ ...row, label: 'Ordinary income' })),
      ...capitalGainsCalculation.rows,
    ];
    if (regularMethodAdjustment < 0) {
      federalRows.push({
        label: 'Regular-tax limit',
        rate: null,
        amount: 0,
        tax: regularMethodAdjustment,
      });
    }
    if (niit > 0) {
      federalRows.push({
        label: 'Net investment income tax',
        rate: 0.038,
        amount: niitBase,
        tax: niit,
      });
    }
    document.getElementById('bracketRows').innerHTML = federalRows.length
      ? federalRows.map((row) => `<tr><td>${row.label}</td><td><strong>${row.rate === null ? 'Limit' : percent.format(row.rate)}</strong></td><td>${formatMoney(row.amount)}</td><td>${formatSignedMoney(row.tax)}</td></tr>`).join('')
      : '<tr><td>Ordinary income</td><td><strong>0%</strong></td><td>$0</td><td>$0</td></tr>';

    const stateBreakdownTitle = document.getElementById('stateBreakdownTitle');
    const stateBreakdownLabel = document.getElementById('stateBreakdownLabel');
    const stateBracketRows = document.getElementById('stateBracketRows');
    const stateMethodNote = document.getElementById('stateMethodNote');

    if (!selectedState) {
      stateBreakdownTitle.textContent = 'State bracket breakdown';
      stateBreakdownLabel.textContent = 'Select a state to calculate';
      stateBracketRows.innerHTML = '<tr><td><strong>N/A</strong></td><td>Select a state</td><td>$0</td></tr>';
      stateMethodNote.textContent = 'Choose a state above to add a simplified state income-tax estimate.';
    } else if (stateUnavailable) {
      stateBreakdownTitle.textContent = `${selectedState.label} state tax not estimated`;
      stateBreakdownLabel.textContent = 'Federal-only result';
      stateBracketRows.innerHTML = '<tr><td colspan="3">State estimate unavailable — not $0.</td></tr>';
      stateMethodNote.textContent = selectedState.note || 'A verified 2026 schedule for this state is not included. Use its revenue department guidance to calculate state tax separately.';
    } else if (selectedState.noTax) {
      stateBreakdownTitle.textContent = `${selectedState.label} income tax`;
      stateBreakdownLabel.textContent = 'No broad tax on ordinary income';
      stateBracketRows.innerHTML = '<tr><td><strong>0%</strong></td><td>Ordinary wage income</td><td>$0</td></tr>';
      stateMethodNote.textContent = selectedState.note || `${selectedState.label} does not levy a broad individual income tax. Payroll, sales, property, local, and special capital-gains taxes are not modeled.`;
    } else {
      stateBreakdownTitle.textContent = `${selectedState.label} bracket breakdown`;
      stateBreakdownLabel.textContent = 'Verified 2026 schedule — all filing statuses';
      stateBracketRows.innerHTML = stateCalculation.rows.length
        ? stateCalculation.rows.map((row) => `<tr><td><strong>${row.rate === null ? 'Statutory base' : percent.format(row.rate)}</strong></td><td>${row.amount === null ? 'Above $26,050 threshold' : formatMoney(row.amount)}</td><td>${formatMoney(row.tax)}</td></tr>`).join('')
        : '<tr><td><strong>0%</strong></td><td>$0</td><td>$0</td></tr>';
      const basis = hasStateOverride ? 'the state taxable income you entered' : 'the federal adjusted-income estimate less your entered state deductions';
      stateMethodNote.textContent = `This bracket calculation applies ${selectedState.label}'s verified 2026 rates to ${basis}. Credits and local taxes are excluded. ${selectedState.note || ''}${hasStateOverride ? ' *Gains and contribution savings are not compared because the direct state taxable amount does not describe those alternative scenarios.' : ''}`;

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
