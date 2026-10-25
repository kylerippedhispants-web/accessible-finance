(function () {
  'use strict';

  window.AccessibleFinanceWorkedExamplesB = {
    'first-investment-framework': {
      title: 'Give a $6,000 balance three different jobs',
      introduction: 'Alex has $6,000 saved, a tuition bill next year, and a retirement goal decades away. One product does not need to serve all three purposes.',
      steps: [
        { label: 'Protect the reserve', body: 'Alex assigns $3,000 to an emergency reserve that needs ready access. This amount comes from Alex’s own expenses and circumstances.' },
        { label: 'Set aside the known bill', body: 'Another $2,000 is needed for tuition in 12 months. Alex compares stable savings options instead of depending on a stock-market gain before the bill arrives.' },
        { label: 'Choose for the remaining goal', body: 'That leaves $6,000 − $3,000 − $2,000 = $1,000 for the long-term goal. Alex can now compare an eligible account, suitable asset mix, and costs for that money.' }
      ],
      result: 'Only the remaining $1,000 is being considered for long-term investing. The account and product come after the purpose of the money.',
      assumptions: 'Fictional household with no omitted bills or urgent high-interest debt. The reserve and split are examples, not recommended amounts for everyone.',
      visual: { type: 'compare', title: 'Same savings, different timelines', description: 'Of $6,000, $3,000 is an accessible emergency reserve, $2,000 is for tuition in one year, and $1,000 is for a long-term goal.', items: [
        { label: 'Emergency reserve', value: '$3,000', detail: 'Available when needed' },
        { label: 'Tuition', value: '$2,000', detail: 'Needed in 12 months' },
        { label: 'Long-term goal', value: '$1,000', detail: 'A separate investment decision' }
      ] }
    },
    'how-much-to-invest': {
      title: 'Find a contribution that leaves room for real life',
      introduction: 'Morgan takes home $3,600 a month. Before choosing an investment amount, Morgan gives the rest of the budget a job.',
      steps: [
        { label: 'Cover commitments', body: 'Essentials and minimum debt payments total $2,400. Annual bills need another $300 a month, and short-term savings need $400.' },
        { label: 'Find the actual remainder', body: '$3,600 − $2,400 − $300 − $400 = $500 remains. Treating the full $1,200 after essentials as available would miss two real obligations.' },
        { label: 'Leave a margin', body: 'Morgan keeps $200 of the remainder as a monthly buffer and starts a $300 investment contribution. The amount can be reviewed after a few months of actual spending.' }
      ],
      result: 'The initial contribution is $300, with $200 left for variation. A sustainable amount is more useful than an ambitious transfer that must keep being reversed.',
      assumptions: 'Fictional monthly budget with an existing emergency reserve. Employer matching, high-interest debt, taxes, and any other obligations must be considered separately.',
      visual: { type: 'bars', unit: '$', title: 'What happens to the $500 remainder?', description: 'The $500 monthly remainder is divided into a $300 investment contribution and a $200 buffer.', items: [
        { label: 'Investing', value: 300, detail: 'Initial monthly contribution' },
        { label: 'Buffer', value: 200, detail: 'Room for variable spending' }
      ] }
    },
    'registered-accounts': {
      title: 'A TFSA label does not tell you what is inside',
      introduction: 'Three people each put $1,000 into a TFSA, but choose different eligible holdings. Their tax account has the same name; their investment risks do not.',
      steps: [
        { label: 'Name the account', body: 'All three have verified at least $1,000 of unused personal TFSA room and are eligible to contribute. The account supplies the tax rules.' },
        { label: 'Name the holding', body: 'One holds accessible savings, one buys a non-redeemable one-year GIC, and one buys a stock fund. These are different uses of the same account type.' },
        { label: 'Check access and uncertainty', body: 'The saver checks withdrawal terms and deposit protection; the GIC holder checks the lock-in and issuer; the fund holder accepts that the market value can fall.' }
      ],
      result: 'Choose the account and the holding as two separate decisions. Opening a TFSA does not automatically invest the money or make a risky holding safe.',
      assumptions: 'Hypothetical eligible Canadian residents and eligible holdings. Product terms, coverage, contribution room, and suitability require separate verification.',
      visual: { type: 'compare', title: 'One account type, three holdings', description: 'Each TFSA holds $1,000, but accessible savings, a locked-in GIC, and a stock fund have different access and risk characteristics.', items: [
        { label: 'Savings in a TFSA', value: '$1,000', detail: 'Check access and deposit protection' },
        { label: 'GIC in a TFSA', value: '$1,000', detail: 'Check maturity and withdrawal restrictions' },
        { label: 'Stock fund in a TFSA', value: '$1,000', detail: 'Market value can rise or fall' }
      ] },
      sources: [{ label: 'CRA: What is a TFSA?', url: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/tax-free-savings-account/what.html' }]
    },
    'automatic-contributions': {
      title: 'Every two weeks is not twice a month',
      introduction: 'Jamie wants to automate $100 after each paycheque. The yearly total depends on how often those paycheques arrive.',
      steps: [
        { label: 'Count the deposits', body: 'In a year with 26 biweekly paycheques, $100 × 26 = $2,600. Two $100 transfers each month would instead produce $100 × 24 = $2,400.' },
        { label: 'Fit the calendar', body: 'Jamie checks the actual pay calendar and schedules the transfer after the deposit clears. The difference between these schedules is $200 a year.' },
        { label: 'Check the full system', body: 'Jamie confirms that the transfer also triggers the intended purchase, leaves a bank buffer, and remains within available registered-account room.' }
      ],
      result: 'The same $100 instruction can mean $2,400 or $2,600 a year. Match the schedule to both the cash flow and the annual contribution plan.',
      assumptions: 'No missed deposits, investment returns, or fees. This example uses a calendar with 26 biweekly pay dates; check the actual number in your year.',
      visual: { type: 'bars', unit: '$', title: 'Annual deposits at $100 each', description: 'Twenty-four twice-monthly deposits total $2,400; 26 biweekly deposits total $2,600.', items: [
        { label: 'Twice a month', value: 2400, detail: '24 deposits × $100' },
        { label: 'Every two weeks', value: 2600, detail: '26 deposits × $100' }
      ] }
    },
    'beginner-investing-mistakes': {
      title: 'Four funds can still share the same big bet',
      introduction: 'Riley puts $500 into each of four funds and assumes that four names mean broad diversification. A look at their holdings tells a different story.',
      steps: [
        { label: 'Look through the labels', body: 'The same company represents 40%, 30%, 20%, and 10% of the four funds. Each $500 purchase therefore includes $200, $150, $100, and $50 of that company.' },
        { label: 'Add the overlap', body: '$200 + $150 + $100 + $50 = $500 exposed to one company. Across the $2,000 portfolio, that is $500 ÷ $2,000 = 25%.' },
        { label: 'Compare with the intended risk', body: 'Riley reviews the underlying holdings and sectors before adding another fund. More fund names do not necessarily reduce the concentration.' }
      ],
      result: 'One quarter of this portfolio depends on the same company, despite owning four funds. Check what you own through each fund, not just how many funds you own.',
      assumptions: 'Invented funds and fixed holdings at one point in time. No leverage, derivatives, fees, or changes in market value are included.',
      visual: { type: 'bars', unit: '$', title: 'Exposure to the same company', description: 'The four funds hold $200, $150, $100, and $50 of the same company, adding to $500 of a $2,000 portfolio.', items: [
        { label: 'Fund A', value: 200, detail: '40% of a $500 holding' },
        { label: 'Fund B', value: 150, detail: '30% of a $500 holding' },
        { label: 'Fund C', value: 100, detail: '20% of a $500 holding' },
        { label: 'Fund D', value: 50, detail: '10% of a $500 holding' }
      ] }
    },
    'bear-markets': {
      title: 'Why a 30% decline needs more than a 30% recovery',
      introduction: 'A hypothetical $10,000 portfolio loses 30%. The recovery percentage is measured from the smaller balance left afterward.',
      steps: [
        { label: 'Calculate the loss', body: '$10,000 × 30% = $3,000 lost, leaving $7,000. This is a change in portfolio value, before any contributions or withdrawals.' },
        { label: 'Try a 30% gain', body: 'A 30% gain on $7,000 adds $2,100. The balance reaches $9,100, which is still $900 below the starting value.' },
        { label: 'Find the required gain', body: 'To return from $7,000 to $10,000 requires $3,000 ÷ $7,000 ≈ 42.9%. A recovery is possible, but neither its size nor its timing is guaranteed.' }
      ],
      result: 'Equal percentage losses and gains do not cancel. This is why a decline should be considered in dollars and in relation to your withdrawal date.',
      assumptions: 'Simple hypothetical price changes with no income, fees, tax, deposits, withdrawals, or inflation. This does not predict a market recovery.',
      visual: { type: 'bars', unit: '$', title: 'The same percentage, a different base', description: 'The portfolio begins at $10,000, falls 30% to $7,000, then gains 30% to $9,100, still below its starting value.', items: [
        { label: 'Before the decline', value: 10000, detail: 'Starting balance' },
        { label: 'After a 30% loss', value: 7000, detail: '$3,000 below the start' },
        { label: 'Then a 30% gain', value: 9100, detail: 'Still $900 below the start' }
      ] }
    },
    'tfsa-explained': {
      title: 'Track room separately from the account balance',
      introduction: 'Sam has $5,000 of verified unused TFSA room. A contribution and a later withdrawal affect that room on different schedules.',
      steps: [
        { label: 'Record the contribution', body: 'Sam contributes $3,000. Remaining room is $5,000 − $3,000 = $2,000, regardless of what the investments later earn or lose.' },
        { label: 'Record the withdrawal', body: 'Sam withdraws $1,000 later in the same year. The available room stays at $2,000: this withdrawal does not immediately create new room.' },
        { label: 'Carry the records forward', body: 'With no other transactions, the next January starts with $2,000 unused room plus the $1,000 withdrawal, before adding any new annual room Sam is eligible for.' }
      ],
      result: 'Sam can still contribute $2,000 this year, not $3,000. The withdrawn $1,000 is added back the following calendar year.',
      assumptions: 'Hypothetical Canadian resident eligible to contribute throughout, with no excess contributions, transfers, or special distributions. Use records from every TFSA; CRA figures may lag recent activity.',
      visual: { type: 'flow', title: 'A withdrawal does not refill room immediately', description: 'Available room begins at $5,000, falls to $2,000 after a $3,000 contribution, and remains $2,000 after a $1,000 same-year withdrawal.', items: [
        { label: 'Before contributing', value: '$5,000 room', detail: 'Verified unused room' },
        { label: 'After contributing', value: '$2,000 room', detail: '$3,000 contribution used room' },
        { label: 'After withdrawing', value: '$2,000 room', detail: '$1,000 is added back next calendar year' }
      ] },
      sources: [{ label: 'CRA: How TFSA withdrawals affect contribution room', url: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/tax-free-savings-account/withdraw.html' }]
    },
    'rrsp-explained': {
      title: 'Separate the contribution from its tax effect',
      introduction: 'Taylor contributes $4,000 to an RRSP and can deduct the full amount. Assume the entire deduction reduces income otherwise taxed at a combined 30% marginal rate.',
      steps: [
        { label: 'Calculate the deduction’s effect', body: '$4,000 × 30% = $1,200 less income tax in this simplified example. The $4,000 contribution remains in the RRSP.' },
        { label: 'Find the after-tax cash cost', body: 'After accounting for that tax reduction, the $4,000 contribution costs $2,800. A refund is not guaranteed: the tax return also includes tax already paid and other amounts owing.' },
        { label: 'Remember the later tax', body: 'If $4,000 were later withdrawn and fully taxed at an assumed 25% rate, $1,000 would be tax and $3,000 would remain. Withholding is only a payment toward the final tax bill.' }
      ],
      result: 'An RRSP changes when tax is paid. Treat the deduction and eventual withdrawal tax as parts of one decision, not as a tax-free investment bonus.',
      assumptions: 'Sufficient contribution and deduction room; no investment change, benefit clawbacks, special withdrawal program, or bracket crossing. Both tax rates are illustrative, not Canadian tax estimates.',
      visual: { type: 'compare', title: 'A $4,000 deductible contribution', description: 'At an assumed 30% marginal rate, a $4,000 deductible contribution reduces tax by $1,200, leaving an after-tax cash cost of $2,800.', items: [
        { label: 'Into the RRSP', value: '$4,000', detail: 'Contribution, with sufficient room' },
        { label: 'Tax reduction', value: '$1,200', detail: '$4,000 × illustrative 30% rate' },
        { label: 'After-tax cash cost', value: '$2,800', detail: '$4,000 minus the tax reduction' }
      ] },
      sources: [
        { label: 'CRA: Registered Retirement Savings Plan', url: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/registered-retirement-savings-plan-rrsp.html' },
        { label: 'CRA: Making RRSP withdrawals', url: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/making-withdrawals.html' }
      ]
    },
    'tfsa-vs-rrsp': {
      title: 'Compare the same amount of pre-tax income',
      introduction: 'Begin with $1,000 of pre-tax income and an assumed 30% tax rate. Comparing a $1,000 TFSA balance directly with a $1,000 RRSP balance misses the tax still owed on the RRSP.',
      steps: [
        { label: 'Use equal starting resources', body: 'The TFSA route starts with $700 after paying $300 tax. The RRSP route invests the full $1,000 when the contribution is fully deductible and the tax benefit is fully included in the comparison.' },
        { label: 'Apply the same growth', body: 'Assume both holdings double over an unspecified period. The TFSA becomes $1,400. The RRSP becomes $2,000 before withdrawal tax.' },
        { label: 'Compare spendable amounts', body: 'At 30% withdrawal tax, the RRSP leaves $1,400 too. At 20%, it leaves $1,600; at 40%, it leaves $1,200. The future tax rate changes the comparison.' }
      ],
      result: 'With the same tax rate and equivalent starting resources, the simplified results match. Different tax rates, access needs, and benefit effects can change the practical choice.',
      assumptions: 'Both accounts have sufficient room and identical investments and fees. Doubling is hypothetical, with no promised return or timeline. No benefit effects, taxes outside these accounts, or withdrawal restrictions are modelled.',
      visual: { type: 'bars', unit: '$', title: 'Spendable money after the same growth', description: 'The TFSA leaves $1,400. The RRSP leaves $1,600 at 20% withdrawal tax, $1,400 at 30%, or $1,200 at 40%. All start from the same $1,000 of pre-tax income.', items: [
        { label: 'TFSA', value: 1400, detail: '$700 doubles; withdrawal is tax-free' },
        { label: 'RRSP at 20% tax', value: 1600, detail: '$2,000 less $400 tax' },
        { label: 'RRSP at 30% tax', value: 1400, detail: '$2,000 less $600 tax' },
        { label: 'RRSP at 40% tax', value: 1200, detail: '$2,000 less $800 tax' }
      ] },
      sources: [
        { label: 'CRA: What is a TFSA?', url: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/tax-free-savings-account/what.html' },
        { label: 'CRA: Making RRSP withdrawals', url: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/making-withdrawals.html' }
      ]
    },
    'fhsa-explained': {
      title: 'Follow a contribution through to a qualifying purchase',
      introduction: 'Avery is eligible for an FHSA, has $3,000 of available participation room, and contributes $3,000 in cash for a first-home goal.',
      steps: [
        { label: 'Calculate an illustrative deduction', body: 'If the full $3,000 is deductible against income taxed at a combined 30% marginal rate, the simplified tax reduction is $900. An RRSP-to-FHSA transfer would not create the same new deduction.' },
        { label: 'Keep the purchase date in view', body: 'Suppose the account later contains $3,150 after earning $150. The holding still needs to suit the purchase timeline; the FHSA label does not prevent investment losses.' },
        { label: 'Confirm withdrawal conditions', body: 'If Avery meets every qualifying-withdrawal condition and completes the required process, the $3,150 can be withdrawn tax-free without repayment. A non-qualifying withdrawal is generally taxable.' }
      ],
      result: 'In this example, the $900 tax reduction and the $3,150 qualifying withdrawal are separate benefits at different points in the process.',
      assumptions: 'Fictional eligible first-time buyer with verified room, a deductible cash contribution, and no excess amount. The 30% rate and $150 growth are hypothetical; the example does not confirm anyone’s eligibility.',
      visual: { type: 'flow', title: 'Contribution to qualifying withdrawal', description: 'Avery contributes $3,000, receives an illustrative $900 tax reduction, and later withdraws a $3,150 balance tax-free if all qualifying conditions are met.', items: [
        { label: 'Cash contribution', value: '$3,000', detail: 'Eligibility and room checked first' },
        { label: 'Illustrative tax effect', value: '$900 less tax', detail: 'Full deduction at an assumed 30% rate' },
        { label: 'Qualifying withdrawal', value: '$3,150', detail: 'Tax-free only when all conditions are met' }
      ] },
      sources: [
        { label: 'CRA: Tax deductions for FHSA contributions', url: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/first-home-savings-account/tax-deductions-fhsa-contributions.html' },
        { label: 'CRA: Qualifying FHSA withdrawals', url: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/first-home-savings-account/withdrawals-transfers-out-your-fhsas.html' }
      ]
    },
    'cpp-explained': {
      title: 'Compare CPP start ages using a personal estimate',
      introduction: 'Use a hypothetical age-65 CPP estimate of $1,000 a month to isolate the start-age adjustment. This is not the maximum or average pension.',
      steps: [
        { label: 'Start with the age-65 amount', body: 'At age 65, this example pays $1,000 a month before tax. A real estimate depends on the person’s contribution history and other applicable rules.' },
        { label: 'Apply an earlier start', body: 'Starting 60 months earlier at age 60 reduces the amount by 60 × 0.6% = 36%. The illustration becomes $1,000 × 64% = $640 a month.' },
        { label: 'Apply a later start', body: 'Starting 60 months later at age 70 increases the amount by 60 × 0.7% = 42%. The illustration becomes $1,420 a month, but no CPP payments arrive during the five-year wait.' }
      ],
      result: 'The largest monthly payment is not automatically the best start date. Compare the income needed while waiting, health, taxes, other benefits, and the personal pension estimate.',
      assumptions: 'Only the start-age factor is varied. No additional contributions, inflation indexing, tax, survivor benefits, or changes to the underlying age-65 estimate are included. This is not a break-even calculation.',
      visual: { type: 'bars', unit: '$', title: 'Illustrative monthly CPP by start age', description: 'Holding the underlying age-65 estimate at $1,000 and varying only the start-age factor gives $640 at 60, $1,000 at 65, and $1,420 at 70.', items: [
        { label: 'Start at 60', value: 640, detail: '36% reduction from the age-65 base' },
        { label: 'Start at 65', value: 1000, detail: 'Hypothetical personal base amount' },
        { label: 'Start at 70', value: 1420, detail: '42% increase; five years of payments forgone' }
      ] },
      sources: [{ label: 'Service Canada: When to start your CPP retirement pension', url: 'https://www.canada.ca/en/services/benefits/publicpensions/cpp/when-start.html' }]
    },
    'disability-investing-canada': {
      title: 'Why an RDSP withdrawal needs a repayment check',
      introduction: 'Consider an eligible, DTC-approved 40-year-old whose RDSP issuer confirms that $5,000 of recent grants and bonds is subject to repayment. They are considering a $600 withdrawal.',
      steps: [
        { label: 'Check which rule applies', body: 'Assume the ordinary proportional repayment rule applies and no exception is available. The plan must repay $3 of affected grants or bonds for each $1 withdrawn, up to the applicable amount.' },
        { label: 'Calculate the repayment', body: '$600 × 3 = $1,800. That is below the $5,000 repayment amount confirmed by the issuer, so the full $1,800 is repaid in this example.' },
        { label: 'Measure the total effect', body: 'The plan loses $600 paid out plus $1,800 repaid to government: $2,400 in total. Tax on the payment and any provincial benefit effect must be checked separately.' }
      ],
      result: 'A $600 withdrawal can reduce this RDSP by $2,400. Obtain the issuer’s calculation before withdrawing; the amount visible in the account is not the same as cash available without consequences.',
      assumptions: 'Illustration of the ordinary rule for this stated situation only. Actual repayment depends on age, DTC status, grant and bond dates, exceptions, and issuer records. No tax calculation is included.',
      visual: { type: 'bars', unit: '$', title: 'A withdrawal has two parts', description: 'In this hypothetical RDSP withdrawal, $600 is paid out and $1,800 of grants or bonds is repaid, reducing the plan by $2,400 in total.', items: [
        { label: 'Payment out', value: 600, detail: 'Before any tax on the payment' },
        { label: 'Grant/bond repayment', value: 1800, detail: '$3 repaid for each $1 withdrawn' }
      ] },
      sources: [{ label: 'ESDC: Withdraw money from an RDSP', url: 'https://www.canada.ca/en/employment-social-development/programs/disability/savings/withdraw.html' }]
    },
    'investor-behaviour': {
      title: 'Turn an exciting headline into a written decision',
      introduction: 'Casey’s plan calls for a $300 monthly diversified investment. A headline creates an urge to put $900 into one company immediately.',
      steps: [
        { label: 'Make the change visible', body: 'The proposed trade is three times the planned monthly amount. It needs $600 beyond the $300 already budgeted and replaces diversification with one-company exposure.' },
        { label: 'Pause and name the reason', body: 'Casey follows a personal 24-hour pause rule and writes down the expected source of return, holding period, possible loss, and which goal would fund the extra $600.' },
        { label: 'Compare with the plan', body: 'Nothing about Casey’s income, goal, or evidence has changed; only the headline feels urgent. Casey keeps the scheduled contribution and records why the unplanned trade was declined.' }
      ],
      result: 'A written check makes the hidden trade-off visible. It does not prove the company will rise or fall; it keeps excitement from silently rewriting the household plan.',
      assumptions: 'Fictional decision process, not a recommendation about any security. A 24-hour pause is an example of a personal guardrail, not a rule that prevents every mistake.',
      visual: { type: 'flow', title: 'From impulse to an explicit choice', description: 'Casey compares a $300 planned contribution with a $900 impulse trade, then pauses to review the extra $600 and the added concentration.', items: [
        { label: 'Written plan', value: '$300', detail: 'Scheduled diversified contribution' },
        { label: 'Headline impulse', value: '$900', detail: '$600 extra and one-company risk' },
        { label: 'Decision check', value: 'Pause and review', detail: 'Name the evidence and the goal paying for it' }
      ] }
    },
    'asset-allocation': {
      title: 'Turn a 60/40 label into a dollar stress test',
      introduction: 'A fictional $10,000 portfolio holds 60% in stocks and 40% in bonds. A stress test shows what that mix could mean in dollars.',
      steps: [
        { label: 'Translate the mix', body: 'Stocks begin at $6,000 and bonds at $4,000. The allocation describes the amounts exposed to each type of investment.' },
        { label: 'Apply one imagined scenario', body: 'Suppose stocks fall 30% while bonds gain 2%. Stocks become $4,200, and bonds become $4,080.' },
        { label: 'Review the combined result', body: '$4,200 + $4,080 = $8,280. The portfolio is down $1,720, or 17.2%, despite the bond gain. Ask whether the goal and household could tolerate that loss.' }
      ],
      result: 'A stock/bond mix changes the size of this hypothetical decline; it does not remove losses. Test several scenarios, including one in which both assets fall.',
      assumptions: 'Illustrative allocation and one-period returns, with no contributions, withdrawals, fees, tax, or rebalancing during the period. Neither the mix nor the returns are recommendations or forecasts.',
      visual: { type: 'bars', unit: '$', title: 'The portfolio before and after the scenario', description: 'A $10,000 portfolio split 60/40 ends at $8,280 when stocks lose 30% and bonds gain 2%, a 17.2% total decline.', items: [
        { label: 'Starting portfolio', value: 10000, detail: '$6,000 stocks + $4,000 bonds' },
        { label: 'After the scenario', value: 8280, detail: '$4,200 stocks + $4,080 bonds' }
      ] }
    },
    'rebalancing': {
      title: 'Use a contribution to restore the target mix',
      introduction: 'A portfolio with a 60% stock and 40% bond target now holds $7,200 in stocks and $3,800 in bonds. The owner has $1,000 of new money to invest.',
      steps: [
        { label: 'Measure the drift', body: 'The total is $11,000. Stocks are $7,200 ÷ $11,000 ≈ 65.5%, above the 60% target.' },
        { label: 'Try the new money first', body: 'Putting the full $1,000 contribution into bonds brings bonds to $4,800 and the total portfolio to $12,000.' },
        { label: 'Check the new weights', body: '$7,200 ÷ $12,000 = 60% stocks, and $4,800 ÷ $12,000 = 40% bonds. This particular contribution restores the target without selling anything.' }
      ],
      result: 'New money can sometimes rebalance a portfolio on its own. The useful contribution amount depends on the actual drift and available cash, not a prediction of which asset wins next.',
      assumptions: 'A chosen target already exists, prices stay fixed during the calculation, and the $1,000 is genuinely available. No fees, tax, minimum purchase sizes, or account restrictions are modelled.',
      visual: { type: 'compare', title: 'Rebalancing with new money', description: 'Before the contribution, stocks are $7,200 and bonds $3,800. Adding $1,000 to bonds makes the portfolio $7,200 stocks and $4,800 bonds, restoring a 60/40 mix.', items: [
        { label: 'Before contributing', value: '65.5% / 34.5%', detail: '$7,200 stocks + $3,800 bonds' },
        { label: 'New money to bonds', value: '$1,000', detail: 'No sale is needed in this example' },
        { label: 'After contributing', value: '60% / 40%', detail: '$7,200 stocks + $4,800 bonds' }
      ] }
    },
    'bonds-in-portfolio': {
      title: 'Bonds can help even when they also lose value',
      introduction: 'Compare two hypothetical $50,000 portfolios during a period when stocks lose 20% and bonds lose 5%. One owns only stocks; the other starts with $30,000 in stocks and $20,000 in bonds.',
      steps: [
        { label: 'Calculate the all-stock result', body: '$50,000 × 80% = $40,000. The all-stock portfolio loses $10,000 in this scenario.' },
        { label: 'Calculate the mixed result', body: 'Stocks in the mixed portfolio become $24,000, while bonds become $19,000. Together they total $43,000.' },
        { label: 'Compare the losses', body: 'The mixed portfolio loses $7,000, or 14%, versus 20% for the all-stock portfolio. Bonds did not rise; they simply fell less in this particular scenario.' }
      ],
      result: 'A bond allocation can change the overall outcome without guaranteeing a positive return. Its effect depends on what the bonds actually hold and how both markets behave.',
      assumptions: 'Invented single-period returns, no deposits, withdrawals, fees, taxes, or rebalancing. A different bond type or market scenario can produce a different result, including a larger loss.',
      visual: { type: 'bars', unit: '$', title: 'Same starting balance, different losses', description: 'Both portfolios start at $50,000. With stocks down 20% and bonds down 5%, the 60/40 portfolio ends at $43,000 and the all-stock portfolio at $40,000.', items: [
        { label: 'Starting balance', value: 50000, detail: 'The same for both portfolios' },
        { label: '60/40 portfolio', value: 43000, detail: '14% loss in this scenario' },
        { label: 'All-stock portfolio', value: 40000, detail: '20% loss in this scenario' }
      ] }
    },
    'inflation-erodes-savings': {
      title: 'Update the cost of a goal as well as the savings',
      introduction: 'A purchase costs $8,000 today and is planned for three years from now. Suppose its price rises 3% a year while the savings earn 2% a year after tax and fees.',
      steps: [
        { label: 'Project the purchase price', body: '$8,000 × 1.03 × 1.03 × 1.03 ≈ $8,742. That is the future goal cost under this price assumption.' },
        { label: 'Project the savings', body: '$8,000 × 1.02 × 1.02 × 1.02 ≈ $8,490. The account balance grows, but more slowly than the price of the purchase.' },
        { label: 'Find the gap', body: 'The difference is about $252 after three years. Revising the contribution plan or purchase budget addresses that gap without pretending the original $8,000 target is still enough.' }
      ],
      result: 'A growing account balance can still fall behind a goal. Review the price of the thing you want to buy, not only the amount saved.',
      assumptions: 'Constant hypothetical annual rates, annual compounding, no extra deposits, and rounding to the nearest dollar. The purchase’s actual price may change differently from broad inflation.',
      visual: { type: 'bars', unit: '$', title: 'After three hypothetical years', description: 'An $8,000 purchase growing at 3% annually costs about $8,742 after three years. Savings growing at 2% reach about $8,490, leaving a roughly $252 gap.', items: [
        { label: 'Savings balance', value: 8490, detail: '2% annual growth after tax and fees' },
        { label: 'Purchase price', value: 8742, detail: '3% annual price increase' }
      ] }
    },
    'index-vs-active-funds': {
      title: 'Start a fund comparison with the same gross return',
      introduction: 'Two imaginary funds provide similar market exposure. Each starts with $20,000 and earns 7% before costs in a simplified one-year comparison.',
      steps: [
        { label: 'Subtract the illustrative costs', body: 'Approximate annual costs are 0.2% for the index fund and 1.2% for the active fund. Subtracting those from 7% gives simplified net returns of 6.8% and 5.8%.' },
        { label: 'Translate into dollars', body: '$20,000 × 1.068 = $21,360 for the index example; $20,000 × 1.058 = $21,160 for the active example. The gap is $200.' },
        { label: 'Identify what needs evidence', body: 'With these costs, the active fund needs about 8% gross to match the index fund’s 6.8% net result. Research should examine whether the strategy justifies that extra hurdle and risk.' }
      ],
      result: 'Costs create a hurdle, not a guaranteed winner. Compare similar exposure, risks, services, and returns after fees instead of choosing whichever fund recently led.',
      assumptions: 'Hypothetical funds and returns. Fee subtraction is a simplified approximation; real expenses accrue over time on changing assets. No tax, trading costs, advice charges, or deposits are included.',
      visual: { type: 'bars', unit: '$', title: 'Illustrative balance after one year', description: 'At the same 7% gross return, a $20,000 investment ends at approximately $21,360 after a 0.2% cost or $21,160 after a 1.2% cost.', items: [
        { label: 'Index example', value: 21360, detail: '7% gross minus 0.2% costs' },
        { label: 'Active example', value: 21160, detail: '7% gross minus 1.2% costs' }
      ] }
    },
    'expense-ratios-mers': {
      title: 'Put two fund fees on the same $60,000 balance',
      introduction: 'A fee percentage is easier to assess after translating it into a rough annual dollar cost. Compare a 0.25% MER with a 1.75% MER on the same balance.',
      steps: [
        { label: 'Convert the lower percentage', body: '0.25% is 0.0025 as a decimal. $60,000 × 0.0025 = about $150 a year.' },
        { label: 'Convert the higher percentage', body: '1.75% is 0.0175. $60,000 × 0.0175 = about $1,050 a year.' },
        { label: 'Ask what the difference buys', body: '$1,050 − $150 = $900 a year at this balance. Compare the funds’ exposure and included service, then check for any separate advice, account, trading, or currency costs.' }
      ],
      result: 'The fee gap is about $900 each year on an unchanged $60,000 balance. Check what is included before deciding whether the higher cost offers value.',
      assumptions: 'Hypothetical MERs applied to a constant balance for a rough annual estimate. Real expenses accrue inside the fund on changing assets; these are not additional bills to subtract from returns already reported after MER.',
      visual: { type: 'bars', unit: '$', title: 'Approximate annual MER cost', description: 'On a constant $60,000 balance, a 0.25% MER costs about $150 annually and a 1.75% MER costs about $1,050, a $900 difference.', items: [
        { label: '0.25% MER', value: 150, detail: '$60,000 × 0.0025' },
        { label: '1.75% MER', value: 1050, detail: '$60,000 × 0.0175' }
      ] }
    },
    'market-drops-plan': {
      title: 'Use a prewritten rule after a decline',
      introduction: 'A fictional investor starts with $6,000 in stocks and $4,000 in bonds, targeting 60/40. Their written rule calls for a review if stocks fall below 55% of the portfolio.',
      steps: [
        { label: 'Measure what changed', body: 'Stocks fall 25% to $4,500 while bonds remain $4,000. The $8,500 portfolio is now about 52.9% stocks, which triggers the planned review.' },
        { label: 'Check the household first', body: 'The investor confirms that near-term cash needs, the emergency reserve, and the long-term goal are unchanged. A changed personal situation would require more than a mechanical rebalance.' },
        { label: 'Calculate a possible rebalance', body: 'A 60% stock target on $8,500 is $5,100. Moving $600 from bonds to stocks would produce $5,100 and $3,400, restoring 60/40 before costs and tax.' }
      ],
      result: 'The calculation follows a rule set before the decline. It says nothing about where the market bottom is, and it does not guarantee a better return.',
      assumptions: 'Hypothetical target and review threshold, unchanged bond value, no cash flows, and immediate trades at fixed values. Costs, taxes, and account restrictions may change the appropriate action.',
      visual: { type: 'compare', title: 'Review the allocation, not the headline', description: 'The portfolio starts at 60% stocks and 40% bonds. After a stock decline it is 52.9% stocks and 47.1% bonds. A hypothetical $600 transfer restores 60/40.', items: [
        { label: 'Before the drop', value: '60% / 40%', detail: '$6,000 stocks + $4,000 bonds' },
        { label: 'After the drop', value: '52.9% / 47.1%', detail: '$4,500 stocks + $4,000 bonds' },
        { label: 'After a $600 transfer', value: '60% / 40%', detail: '$5,100 stocks + $3,400 bonds' }
      ] }
    },
    'budgeting-without-rigidity': {
      title: 'Build one flexible spending number',
      introduction: 'Lee takes home $4,200 a month and wants a simple spending plan that remembers annual bills without tracking every coffee.',
      steps: [
        { label: 'Fund the commitments', body: 'Essentials and minimum debt payments total $2,500 a month. A $3,600 annual total for predictable irregular bills needs $3,600 ÷ 12 = $300 a month.' },
        { label: 'Fund the goals', body: 'Lee sets aside $500 a month for chosen savings goals. The remainder is $4,200 − $2,500 − $300 − $500 = $900 for flexible spending.' },
        { label: 'Translate carefully into weeks', body: '$900 × 12 ÷ 52 ≈ $208 a week on average. Dividing by four would give $225 and overlook that a year has more than 48 weeks.' }
      ],
      result: 'Lee can use one flexible weekly reference of about $208, while still checking monthly totals and the timing of bills. The categories support a decision instead of grading every purchase.',
      assumptions: 'Fictional stable income and a full-year budget. Weekly figure is rounded and represents an annual average; individual months and bill dates still need enough cash available.',
      visual: { type: 'bars', unit: '$', title: 'A simple plan for $4,200 a month', description: 'The monthly budget assigns $2,500 to essentials, $300 to irregular bills, $500 to goals, and $900 to flexible spending.', items: [
        { label: 'Essentials', value: 2500, detail: 'Includes minimum debt payments' },
        { label: 'Irregular bills', value: 300, detail: '$3,600 annual total divided by 12' },
        { label: 'Savings goals', value: 500, detail: 'Chosen priorities' },
        { label: 'Flexible spending', value: 900, detail: 'About $208 a week, averaged over a year' }
      ] },
      sources: [{ label: 'FCAC: Making a budget', url: 'https://www.canada.ca/en/financial-consumer-agency/services/make-budget.html' }]
    }
  };
}());
