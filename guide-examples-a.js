(function () {
  'use strict';

  // Original teaching examples. Rates and prices are hypothetical, not forecasts.
  window.AccessibleFinanceWorkedExamplesA = {
    'investing-vs-speculating': {
      title: 'Two purchases, two reasons for buying',
      introduction: 'Maya has $1,000 for a long-term goal. Before choosing an investment, she writes down two possible reasons for buying.',
      steps: [
        { label: 'Describe the investment case', body: 'One option is a diversified fund held for 20 years. The reason for owning it is participation in the earnings and growth of many businesses, with losses still possible.' },
        { label: 'Describe the speculative case', body: 'Another option is one stock at $10 because an online group expects $15 next week. Buying 100 shares uses the same $1,000, but the plan depends on a rapid price move.' },
        { label: 'Write down the downside', body: 'If that stock falls to $6, the holding is worth 100 × $6 = $600. A $400 loss has to fit the purpose of the money, regardless of how exciting the original story sounded.' }
      ],
      result: 'The amount invested does not identify the activity. The source of the expected return, concentration, and holding period explain the difference.',
      assumptions: 'Fictional choices and stock prices; no fees or tax. A diversified fund can also lose value. The example does not recommend either purchase.',
      visual: {
        type: 'compare', title: 'What must go right?',
        description: 'The investment case relies on many businesses over 20 years. The speculative case relies on a price jump in one stock next week.',
        items: [
          { label: 'Diversified fund', value: '20-year goal', detail: 'Return depends on many businesses over time.' },
          { label: 'Single-stock trade', value: 'Next week', detail: 'Return depends on a near-term price jump.' }
        ]
      }
    },
    'why-investing-exists': {
      title: 'Follow the money from issue to resale',
      introduction: 'A fictional company sells a new bond for $1,000 to help buy equipment. A year later, its investor sells that bond to someone else for $980.',
      steps: [
        { label: 'At the original issue', body: 'The first investor pays $1,000 to the company. The company receives new funding and owes the payments written into the bond agreement.' },
        { label: 'At the later resale', body: 'The new buyer pays $980 to the first investor. The company does not receive another $980; the existing bond has changed owners.' },
        { label: 'Identify the claim', body: 'The new owner now holds the right to the remaining bond payments. Whether those payments arrive still depends on the borrower meeting its obligations.' }
      ],
      result: 'An original issue supplies capital to the issuer. A later market trade transfers an existing investment between owners.',
      assumptions: 'Fictional bond and resale price. Interest, accrued interest, fees, and tax are omitted to isolate where the purchase money goes.',
      visual: {
        type: 'flow', title: 'Where the purchase money goes',
        description: 'At issue, $1,000 moves from the first investor to the company. At resale, $980 moves from the second investor to the first investor; the company receives no new money.',
        items: [
          { label: 'Original issue', value: '$1,000', detail: 'First investor pays the company.' },
          { label: 'Later resale', value: '$980', detail: 'Second investor pays the first investor.' },
          { label: 'Company at resale', value: '$0 new funding', detail: 'The existing bond changes owners.' }
        ]
      },
      sources: [{ label: 'Investor.gov: Bonds', url: 'https://www.investor.gov/introduction-investing/investing-basics/investment-products/bonds-or-fixed-income-products/bonds' }]
    },
    'how-markets-work': {
      title: 'Why 50 units can cost more than the quote',
      introduction: 'You want to buy 50 units of a fictional fund. The order book has 30 units for sale at $20 and another 20 at $20.10.',
      steps: [
        { label: 'Read the available prices', body: 'The lowest ask is $20, but only 30 units are available at that price. The displayed quote does not cover the entire order.' },
        { label: 'Calculate a market purchase', body: 'If those offers remain available, 30 × $20 plus 20 × $20.10 costs $1,002. The average price is $1,002 ÷ 50 = $20.04 per unit.' },
        { label: 'Compare a $20 limit', body: 'A buy limit of $20 can fill the first 30 units for $600 in this example. The remaining 20 wait for a seller at $20 or less, or expire or are cancelled.' }
      ],
      result: 'A market order prioritizes execution. A limit order controls the maximum purchase price but may leave part or all of the order unfilled.',
      assumptions: 'Illustrative order book held constant during execution, with no competing orders, fees, or tax. Real quotes can change before an order arrives.',
      visual: {
        type: 'compare', title: 'Same order size, different control',
        description: 'The market purchase fills 50 units for $1,002. A $20 limit fills only 30 units for $600 while the other 20 remain unfilled under the stated offers.',
        items: [
          { label: 'Market purchase', value: '50 units / $1,002', detail: 'Some units fill above the lowest ask.' },
          { label: '$20 buy limit', value: '30 units / $600', detail: '20 units remain unfilled at these prices.' }
        ]
      },
      sources: [{ label: 'Investor.gov: Types of Orders', url: 'https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/types-orders' }]
    },
    'what-risk-means': {
      title: 'A market loss becomes a goal shortfall',
      introduction: 'Noah needs $12,000 for tuition in one year and puts the whole amount into stocks. Consider what a 25% decline would mean for that deadline.',
      steps: [
        { label: 'Translate the percentage', body: 'A 25% loss on $12,000 is $3,000. The remaining portfolio is $12,000 × 0.75 = $9,000.' },
        { label: 'Compare with the bill', body: 'Tuition still costs $12,000 in this example. The $3,000 gap must come from other savings, new income, borrowing, or a change in the education plan.' },
        { label: 'Check the recovery required', body: 'Growing $9,000 back to $12,000 requires a gain of $3,000 ÷ $9,000, or about 33.3%. A 25% rebound would reach only $11,250.' }
      ],
      result: 'Risk becomes easier to judge when it is expressed as a missed goal and a deadline, rather than only a fluctuating chart.',
      assumptions: 'Hypothetical 25% decline and unchanged tuition bill; no deposits, fees, tax, or distributions. Neither the decline nor a recovery is predicted.',
      visual: {
        type: 'bars', title: 'The tuition deadline stays the same', unit: '$',
        description: 'The tuition goal is $12,000; after the hypothetical 25% loss, only $9,000 remains, leaving a $3,000 shortfall.',
        items: [
          { label: 'Tuition goal', value: 12000, detail: 'Amount due in one year.' },
          { label: 'After a 25% loss', value: 9000, detail: '$3,000 below the goal.' }
        ]
      }
    },
    'risk-and-return': {
      title: 'An expected return is not an available balance',
      introduction: 'Imagine a $10,000 investment with only two possible one-year outcomes: a 20% gain or a 10% loss, each assigned a 50% chance.',
      steps: [
        { label: 'Work out both outcomes', body: 'A 20% gain leaves $12,000. A 10% loss leaves $9,000. Both belong in the decision, even though one is more appealing.' },
        { label: 'Calculate the expected result', body: 'The probability-weighted balance is 0.50 × $12,000 + 0.50 × $9,000 = $10,500. That corresponds to an expected return of 5%.' },
        { label: 'Separate average from outcome', body: 'In this deliberately simple model, the investor receives either $12,000 or $9,000, never $10,500. A bill for $10,500 is not covered in the losing outcome.' }
      ],
      result: 'A positive expected return can coexist with a meaningful chance of loss. Averages help compare scenarios; they cannot guarantee a spending amount.',
      assumptions: 'Invented probabilities and outcomes for teaching only. Real investments have many possible outcomes, and their probabilities are uncertain. Fees and tax are excluded.',
      visual: {
        type: 'bars', title: 'Possible outcomes versus the average', unit: '$',
        description: 'The two possible balances are $12,000 and $9,000. Their equally weighted average is $10,500, which is not itself an outcome in this model.',
        items: [
          { label: 'Gain outcome', value: 12000, detail: '50% assumed chance; +20%.' },
          { label: 'Loss outcome', value: 9000, detail: '50% assumed chance; −10%.' },
          { label: 'Weighted average', value: 10500, detail: 'A calculation, not a guaranteed balance.' }
        ]
      }
    },
    'time-in-market': {
      title: 'Selling the decline and missing the rebound',
      introduction: 'An investor owns 10 fund units bought at $100 each. In a fictional price sequence, the fund falls to $80 and later returns to $100.',
      steps: [
        { label: 'See the decline', body: 'At $80 per unit, the 10 units are worth $800. The investor sells all of them after the decline.' },
        { label: 'Wait for reassurance', body: 'The price returns to $100 while the investor remains in cash. Buying back with $800 now purchases only 8 units.' },
        { label: 'Compare the holdings', body: 'Holding throughout would leave 10 units worth $1,000 at this final price. The sale and later repurchase leave 8 units worth $800: 20% fewer units.' }
      ],
      result: 'Getting out is only half of a timing decision. The return date can matter just as much as the exit date.',
      assumptions: 'One invented fall-and-recovery path, no dividends, cash interest, fees, tax, or new deposits. Prices could instead keep falling; this is not proof that holding always wins.',
      visual: {
        type: 'flow', title: 'How the unit count shrinks',
        description: 'Ten units at $100 fall to $80 and are sold for $800. After the price recovers to $100, that $800 buys only eight units.',
        items: [
          { label: 'Before the decline', value: '10 units', detail: '10 × $100 = $1,000.' },
          { label: 'Sell at $80', value: '$800 cash', detail: '10 × $80 = $800.' },
          { label: 'Buy back at $100', value: '8 units', detail: '$800 ÷ $100 = 8.' }
        ]
      }
    },
    'inflation-and-cash': {
      title: 'Read one savings balance in two ways',
      introduction: 'A $5,000 cash balance earns a hypothetical 2% each year for five years, while the prices of the things it buys rise by 3% a year.',
      steps: [
        { label: 'Calculate the account balance', body: 'With annual compounding, $5,000 × 1.02⁵ is about $5,520. The statement shows a gain of about $520.' },
        { label: 'Adjust for higher prices', body: 'Over the same five years, the price level multiplies by 1.03⁵. Dividing $5,520.40 by that factor gives about $4,762 in today\'s purchasing power.' },
        { label: 'Compare with idle cash', body: 'At 0% interest, the balance would still show $5,000, but its purchasing power would be about $4,313. Earning interest narrows the gap without fully closing it in this scenario.' }
      ],
      result: 'A rising dollar balance can still buy less. Emergency cash may be worth holding for stability, but its return should be read alongside inflation.',
      assumptions: 'Hypothetical constant annual rates, annual compounding, no deposits, withdrawals, fees, or tax. All chart amounts are in today\'s dollars and rounded to the nearest dollar.',
      visual: {
        type: 'bars', title: 'Purchasing power after five years', unit: '$',
        description: 'Starting purchasing power is $5,000. After five years of 3% inflation, cash earning 2% has about $4,762 of purchasing power; cash earning nothing has about $4,313.',
        items: [
          { label: 'Starting value', value: 5000, detail: 'Today\'s purchasing power.' },
          { label: 'Cash earning 2%', value: 4762, detail: 'After five years at 3% inflation.' },
          { label: 'Cash earning 0%', value: 4313, detail: 'After five years at 3% inflation.' }
        ]
      }
    },
    'compound-interest': {
      title: 'Watch $1,000 compound, one year at a time',
      introduction: 'Start with $1,000 and use a hypothetical 5% annual return. Leave each year\'s return in the account, without adding more money.',
      steps: [
        { label: 'Year one: earn on the deposit', body: '$1,000 × 5% = $50. The balance becomes $1,050.' },
        { label: 'Year two: earn on the larger balance', body: '$1,050 × 5% = $52.50. The balance becomes $1,102.50. That extra $2.50 comes from growth on the first year\'s return.' },
        { label: 'Year three: repeat the process', body: '$1,102.50 × 5% = $55.125. The balance becomes $1,157.625, or $1,157.63 rounded at the end.' }
      ],
      result: 'Earning $50 on the original deposit each year would give $1,150 after three years. Reinvesting the returns adds another $7.63 in this simplified example.',
      assumptions: 'Constant hypothetical 5% annual return, compounded annually, with no intermediate rounding, contributions, fees, tax, or inflation adjustment. Market returns are not steady or guaranteed.',
      visual: {
        type: 'bars', title: 'The balance that earns the next return', unit: '$',
        description: 'With $1,000 initially and a constant 5% annual return, the year-end balances are $1,050, $1,102.50, and $1,157.63.',
        items: [
          { label: 'End of year 1', value: 1050, detail: '$50 earned during year 1.' },
          { label: 'End of year 2', value: 1102.5, detail: '$52.50 earned during year 2.' },
          { label: 'End of year 3', value: 1157.63, detail: 'About $55.13 earned during year 3.' }
        ]
      }
    },
    'starting-early': {
      title: 'The same $1,000 with ten more years',
      introduction: 'Compare one $1,000 deposit made at age 30 with the same deposit made at age 40. Both are measured at age 55 using a hypothetical 5% annual return.',
      steps: [
        { label: 'Give the early deposit 25 years', body: '$1,000 × 1.05²⁵ is about $3,386 at age 55.' },
        { label: 'Give the later deposit 15 years', body: '$1,000 × 1.05¹⁵ is about $2,079 at the same age.' },
        { label: 'Identify what changed', body: 'The starting deposit and assumed rate are identical. Ten extra compounding years create a difference of about $1,307; no extra contribution was required in this comparison.' }
      ],
      result: 'Earlier money has more time to work. If starting early was not possible, the useful next step is a sustainable plan from today, not trying to compensate with excessive risk.',
      assumptions: 'One deposit only; constant hypothetical 5% annual return, annual compounding, no fees, tax, or inflation. Values are rounded. This isolates time, not anyone\'s actual retirement outcome.',
      visual: {
        type: 'bars', title: 'Value at age 55', unit: '$',
        description: 'At an assumed 5% annual return, $1,000 deposited at age 30 grows to about $3,386 by age 55; the same deposit at age 40 grows to about $2,079.',
        items: [
          { label: 'Deposit at age 30', value: 3386, detail: '25 years to compound.' },
          { label: 'Deposit at age 40', value: 2079, detail: '15 years to compound.' }
        ]
      }
    },
    'dollar-cost-averaging': {
      title: 'Three $200 deposits buy different amounts',
      introduction: 'A fictional fund costs $20, then $10, then $25 on three monthly purchase dates. An investor contributes $200 on each date.',
      steps: [
        { label: 'Divide dollars by price', body: 'The purchases buy $200 ÷ $20 = 10 units, $200 ÷ $10 = 20 units, and $200 ÷ $25 = 8 units.' },
        { label: 'Add the units', body: 'The investor has contributed $600 and owns 10 + 20 + 8 = 38 units.' },
        { label: 'Calculate the average cost', body: '$600 ÷ 38 = about $15.79 per unit. This is a cost per unit, not the simple average of the three quoted prices.' }
      ],
      result: 'A fixed contribution buys more units when prices are lower and fewer when prices are higher. It does not prevent losses or guarantee a better result than investing a lump sum.',
      assumptions: 'Invented prices, three purchases, no fees, distributions, tax, or currency conversion. The price path is an illustration, not a forecast or evidence that one schedule always wins.',
      visual: {
        type: 'bars', title: 'Units bought with each $200 deposit', unit: 'units',
        description: 'The same $200 buys 10 units at $20, 20 units at $10, and 8 units at $25, for 38 units in total.',
        items: [
          { label: 'Month 1: $20 each', value: 10, detail: '$200 ÷ $20.' },
          { label: 'Month 2: $10 each', value: 20, detail: '$200 ÷ $10.' },
          { label: 'Month 3: $25 each', value: 8, detail: '$200 ÷ $25.' }
        ]
      },
      sources: [{ label: 'Investor.gov: Dollar Cost Averaging', url: 'https://www.investor.gov/introduction-investing/investing-basics/glossary/dollar-cost-averaging' }]
    },
    'dividend-reinvestment': {
      title: 'Reinvesting a $40 cash dividend',
      introduction: 'An investor owns 100 shares and receives a fictional $0.40 dividend per share. On the reinvestment date, shares trade at $20.',
      steps: [
        { label: 'Calculate the payment', body: '100 shares × $0.40 per share = $40 in cash.' },
        { label: 'Use the payment to buy shares', body: 'At $20 each, $40 buys 2 more shares. The investor now owns 102 shares and has used all of the dividend cash.' },
        { label: 'Check a later payment', body: 'If a later dividend were also $0.40 per share, 102 shares would produce $40.80 instead of $40. The extra $0.80 comes from the two additional shares.' }
      ],
      result: 'Reinvestment increases the number of shares participating in future gains, losses, and distributions. A dividend is not free extra wealth: total return includes both the payment and share-price changes.',
      assumptions: 'Fictional dividends and reinvestment price, no fees or tax. The next dividend is assumed only to show the arithmetic; it can be cut or cancelled. This is not a total-return calculation.',
      visual: {
        type: 'flow', title: 'From cash payment to extra shares',
        description: 'A $0.40 payment on 100 shares provides $40. Reinvesting at $20 buys two shares, increasing the holding to 102 shares.',
        items: [
          { label: 'Receive the dividend', value: '$40 cash', detail: '100 shares × $0.40.' },
          { label: 'Reinvest at $20', value: '2 more shares', detail: '$40 ÷ $20.' },
          { label: 'New holding', value: '102 shares', detail: 'Future payments and prices can change.' }
        ]
      },
      sources: [{ label: 'Investor.gov: Stocks', url: 'https://www.investor.gov/introduction-investing/investing-basics/investment-products/stocks' }]
    },
    'rule-of-72': {
      title: 'Check the shortcut against the formula',
      introduction: 'The Rule of 72 estimates how long money takes to double by dividing 72 by an annual growth rate expressed as a percentage.',
      steps: [
        { label: 'Try a 6% rate', body: '72 ÷ 6 = 12 years. A $2,000 starting amount would be roughly $4,000 after that time if the rate stayed constant.' },
        { label: 'Compare the exact result', body: 'The exact doubling time with annual compounding is log(2) ÷ log(1.06), about 11.90 years. The shortcut is close here, but not exact.' },
        { label: 'Test another assumption', body: 'At 4%, the shortcut gives 18 years and the formula about 17.67. At 8%, they give 9 years and about 9.01. A different rate changes the estimate substantially.' }
      ],
      result: 'Use the rule for a quick sense check, then use a calculator for a plan with contributions, changing returns, fees, or tax.',
      assumptions: 'Constant hypothetical positive annual rates and annual compounding; no deposits, withdrawals, fees, tax, or inflation. The rule estimates time, not the likelihood of earning a rate.',
      visual: {
        type: 'compare', title: 'Rule of 72 versus exact doubling time',
        description: 'At 4%: 18 years by the shortcut, 17.67 exact. At 6%: 12 years versus 11.90. At 8%: 9 years versus 9.01.',
        items: [
          { label: 'At 4% a year', value: '18 years', detail: 'Exact: about 17.67 years.' },
          { label: 'At 6% a year', value: '12 years', detail: 'Exact: about 11.90 years.' },
          { label: 'At 8% a year', value: '9 years', detail: 'Exact: about 9.01 years.' }
        ]
      }
    },
    'investment-fees': {
      title: 'A small annual fee gap over 20 years',
      introduction: 'Compare two fictional investments starting at $10,000, each earning 6% a year before fees. One charges 0.20% annually and the other 1.50%.',
      steps: [
        { label: 'Use comparable net rates', body: 'In this simplified model, subtract the annual fee from the gross return: 6% − 0.20% = 5.80%, and 6% − 1.50% = 4.50%.' },
        { label: 'Compound each balance', body: 'After 20 years, $10,000 × 1.058²⁰ is about $30,883. At 4.50%, $10,000 × 1.045²⁰ is about $24,117.' },
        { label: 'Interpret the difference', body: 'Using the unrounded balances, the ending gap is about $6,765. It reflects the recurring charges and the growth that the amounts deducted could otherwise have earned.' }
      ],
      result: 'An annual percentage can look small while its long-term dollar effect is large. Compare like-for-like investments and the services included, not fees in isolation.',
      assumptions: 'Hypothetical constant gross returns, fee deducted as percentage points from the annual rate, annual compounding, no contributions, tax, or inflation. Actual funds accrue fees differently. Rounded ending balances are shown.',
      visual: {
        type: 'bars', title: 'Hypothetical balance after 20 years', unit: '$',
        description: 'Under the simplified assumptions, the 0.20% annual-fee investment ends at about $30,883; the 1.50% annual-fee investment ends at about $24,117.',
        items: [
          { label: '0.20% annual fee', value: 30883, detail: '5.80% net rate in this model.' },
          { label: '1.50% annual fee', value: 24117, detail: '4.50% net rate in this model.' }
        ]
      },
      sources: [{ label: 'Investor.gov: Understanding Fees', url: 'https://www.investor.gov/introduction-investing/getting-started/understanding-fees' }]
    },
    'taxes-and-compounding': {
      title: 'How yearly tax changes the compounding base',
      introduction: 'Imagine $10,000 earning 4% annual interest for ten years. Compare a taxable account with a TFSA, assuming the saver is eligible and has enough verified contribution room.',
      steps: [
        { label: 'Model the taxable interest', body: 'At an assumed 30% tax rate on interest, the first year\'s $400 interest creates $120 of tax. Paying that tax from the account leaves $280 to reinvest, a net rate of 2.8%.' },
        { label: 'Model tax-free interest', body: 'For ordinary eligible interest earned inside the TFSA, the full $400 remains to compound. The model keeps the 4% rate.' },
        { label: 'Compare after ten years', body: '$10,000 × 1.028¹⁰ is about $13,180 in the taxable account. $10,000 × 1.04¹⁰ is about $14,802 in the TFSA, a difference of about $1,622.' }
      ],
      result: 'Tax treatment changes how much stays invested. This comparison concerns interest; dividends, capital gains, and RRSP contributions and withdrawals need different calculations.',
      assumptions: 'Hypothetical fixed 4% annual interest and 30% tax on all taxable interest, tax paid from the account annually, annual compounding, no fees or inflation. TFSA eligibility, sufficient room, and ordinary qualified investments are assumed; 30% is not a universal tax rate.',
      visual: {
        type: 'bars', title: 'The same interest rate, different tax treatment', unit: '$',
        description: 'After ten years, the assumed taxable account holds about $13,180 at 2.8% after annual tax; the TFSA holds about $14,802 at 4%.',
        items: [
          { label: 'Taxable interest', value: 13180, detail: '2.8% after assumed annual tax.' },
          { label: 'TFSA interest', value: 14802, detail: '4% retained under the stated assumptions.' }
        ]
      },
      sources: [{ label: 'Canada Revenue Agency: What is a TFSA', url: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/tax-free-savings-account/what.html' }]
    },
    'stocks-explained': {
      title: 'Add the price change and the cash dividend',
      introduction: 'An investor buys 100 shares of a fictional company for $20 each. A year later the shares trade at $22, and the investor has received $50 in dividends.',
      steps: [
        { label: 'Record the original cost', body: '100 × $20 = $2,000 invested.' },
        { label: 'Add both sources of return', body: 'The shares are worth 100 × $22 = $2,200. Add the $50 cash dividend for total value of $2,250, assuming it was kept in cash.' },
        { label: 'Calculate the percentage', body: 'The $250 gain divided by the $2,000 cost is 12.5%. Looking only at the price change would report 10% and miss the cash payment.' }
      ],
      result: 'Total return includes price changes and distributions. A dividend-paying stock can still have a negative total return if its price falls enough.',
      assumptions: 'Fictional prices and dividend, no reinvestment, fees, tax, or cash interest. The $22 final price already reflects all market changes during the period; dividends are not guaranteed.',
      visual: {
        type: 'flow', title: 'Build the total-return calculation',
        description: 'A $2,000 purchase ends with $2,200 in shares plus $50 cash, for $2,250 total value and a 12.5% gain before fees and tax.',
        items: [
          { label: 'Original purchase', value: '$2,000', detail: '100 shares at $20.' },
          { label: 'Ending total value', value: '$2,250', detail: '$2,200 shares + $50 cash.' },
          { label: 'Total return', value: '12.5%', detail: '$250 gain ÷ $2,000 cost.' }
        ]
      },
      sources: [{ label: 'Investor.gov: Stocks', url: 'https://www.investor.gov/introduction-investing/investing-basics/investment-products/stocks' }]
    },
    'bonds-explained': {
      title: 'Separate bond interest from principal repayment',
      introduction: 'A fictional three-year bond is bought for its $1,000 face value. It pays a 4% coupon once a year and returns principal at maturity.',
      steps: [
        { label: 'Calculate the annual coupon', body: '$1,000 × 4% = $40 in interest each year, if the issuer makes the promised payments.' },
        { label: 'List the payment dates', body: 'The investor receives $40 at the end of year one, $40 at the end of year two, and $1,040 at the end of year three.' },
        { label: 'Separate return from repayment', body: 'Total cash received is $1,120, but $1,000 is simply the original principal coming back. The interest earned is $120 before fees and tax.' }
      ],
      result: 'A large maturity payment is mostly repayment, not profit. Selling before maturity introduces a market price that may differ from $1,000.',
      assumptions: 'Bond bought at face value, annual fixed coupon, held to maturity, issuer pays in full, no reinvestment of coupons, fees, tax, or inflation. This is not a forecast of bond-fund returns.',
      visual: {
        type: 'flow', title: 'A three-year bond payment schedule',
        description: 'The promised payments are $40 at year one, $40 at year two, and $1,040 at year three. The final payment includes $1,000 of original principal.',
        items: [
          { label: 'End of year 1', value: '$40', detail: 'Interest payment.' },
          { label: 'End of year 2', value: '$40', detail: 'Interest payment.' },
          { label: 'End of year 3', value: '$1,040', detail: '$40 interest + $1,000 principal.' }
        ]
      },
      sources: [{ label: 'Investor.gov: Bonds', url: 'https://www.investor.gov/introduction-investing/investing-basics/investment-products/bonds-or-fixed-income-products/bonds' }]
    },
    'mutual-funds-vs-etfs': {
      title: 'What happens to a $250 purchase?',
      introduction: 'Compare two fictional funds with similar holdings. One accepts mutual-fund dollar orders; the other is an ETF purchased through a broker that allows only whole units.',
      steps: [
        { label: 'Place a mutual-fund dollar order', body: 'A $250 order receives units at the next applicable net asset value. If that price is $25, it buys 10 units; a different price changes the number of units.' },
        { label: 'Price an ETF order', body: 'If the ETF executes at $24, 10 whole units cost $240. The remaining $10 stays as cash because this example\'s broker does not support fractional units.' },
        { label: 'Compare the useful features', body: 'Both purchases can provide diversified exposure. Check the actual holdings, ongoing fees, trading costs, fractional-unit support, and automatic-purchase options before choosing.' }
      ],
      result: 'The wrapper changes how a purchase happens. The underlying holdings and total costs determine much of what the investment does for the plan.',
      assumptions: 'Fictional funds and execution prices, no sales charges, commissions, spreads, tax, or later price changes. Fractional ETF purchases are available at some brokers; this example assumes they are not.',
      visual: {
        type: 'compare', title: 'One $250 budget, two purchase methods',
        description: 'At an assumed $25 mutual-fund price, all $250 buys ten units. At a $24 ETF execution price with whole units only, ten units cost $240 and $10 remains cash.',
        items: [
          { label: 'Mutual-fund order', value: '10 units / $250', detail: 'Calculated at the applicable $25 NAV.' },
          { label: 'ETF order', value: '10 units / $240', detail: '$24 execution price; $10 cash remains.' }
        ]
      },
      sources: [
        { label: 'Investor.gov: Mutual Funds', url: 'https://www.investor.gov/introduction-investing/investing-basics/investment-products/mutual-funds-and-exchange-traded-funds-etfs/mutual-funds' },
        { label: 'Investor.gov: Exchange-Traded Funds', url: 'https://www.investor.gov/introduction-investing/investing-basics/investment-products/mutual-funds-and-exchange-traded-2' }
      ]
    },
    'index-funds': {
      title: 'Look inside a weighted index',
      introduction: 'A tiny fictional index has only three companies, with weights of 50%, 30%, and 20%. A fund that exactly tracks it receives a $1,000 investment.',
      steps: [
        { label: 'Translate weights into dollars', body: 'The exposure is $500 to Company A, $300 to Company B, and $200 to Company C. Each dollar follows the index weights.' },
        { label: 'Test one company\'s decline', body: 'If Company A falls 20% while the others stay unchanged, its $500 portion loses $100. The whole investment falls from $1,000 to $900, or 10%.' },
        { label: 'Read the concentration', body: 'There are three company names, but half the money depends on one. A larger index can also place substantial weight in its biggest constituents.' }
      ],
      result: 'The index label describes a set of rules. Check the weights to understand how much each company, country, or sector matters.',
      assumptions: 'Toy index, exact tracking, unchanged share counts, no distributions, fees, tax, or rebalancing during the decline. Real broad indexes typically contain far more holdings.',
      visual: {
        type: 'bars', title: 'Where the $1,000 is exposed', unit: '$',
        description: 'The fictional index places $500 in Company A, $300 in Company B, and $200 in Company C. Company A accounts for half the investment.',
        items: [
          { label: 'Company A', value: 500, detail: '50% of the index.' },
          { label: 'Company B', value: 300, detail: '30% of the index.' },
          { label: 'Company C', value: 200, detail: '20% of the index.' }
        ]
      },
      sources: [{ label: 'Investor.gov: Index Funds', url: 'https://www.investor.gov/introduction-investing/investing-basics/investment-products/mutual-funds-and-exchange-traded-4' }]
    },
    'active-vs-passive': {
      title: 'Compare returns after the cost hurdle',
      introduction: 'Two fictional funds cover the same market and take comparable risk. The index earns 6% before costs; an active fund earns 7.2% before costs.',
      steps: [
        { label: 'Subtract the passive fund\'s cost', body: 'At an assumed 0.2% annual cost, the passive result is approximately 6% − 0.2% = 5.8%.' },
        { label: 'Subtract the active fund\'s cost', body: 'At an assumed 1.5% annual cost, the active result is approximately 7.2% − 1.5% = 5.7%.' },
        { label: 'Find the hurdle', body: 'The active fund would need about 7.3% before costs to match the passive fund\'s 5.8% net result in this simplified comparison, and more to beat it.' }
      ],
      result: 'A higher gross return can still leave the investor with less. This one-year example explains the arithmetic; it does not establish which manager will perform better.',
      assumptions: 'Fictional returns and costs, same market and comparable risk, percentage-point fee subtraction, no tax, trading costs, or deposits. Actual fund returns and fee accrual differ.',
      visual: {
        type: 'compare', title: 'Gross performance is only the start',
        description: 'The passive fund earns 6% before a 0.2% cost, leaving about 5.8%. The active fund earns 7.2% before a 1.5% cost, leaving about 5.7%.',
        items: [
          { label: 'Passive example', value: '5.8% net', detail: '6.0% gross − 0.2% cost.' },
          { label: 'Active example', value: '5.7% net', detail: '7.2% gross − 1.5% cost.' }
        ]
      },
      sources: [{ label: 'Investor.gov: Understanding Fees', url: 'https://www.investor.gov/introduction-investing/getting-started/understanding-fees' }]
    },
    'diversification': {
      title: 'One company falls: how much is at stake?',
      introduction: 'Compare $10,000 in one company with $10,000 divided equally among 20 companies. In this controlled example, only that one company falls 50%.',
      steps: [
        { label: 'Calculate the concentrated loss', body: 'If the whole $10,000 is in the falling company, a 50% loss removes $5,000 and leaves $5,000.' },
        { label: 'Calculate the spread-out loss', body: 'In the 20-company version, each starts at $500. The same company\'s 50% fall loses $250, leaving a total of $9,750 if all other holdings remain unchanged.' },
        { label: 'Recognize the limit', body: 'The smaller loss comes from limiting one company\'s weight. If many companies fall together, the diversified portfolio can still suffer a large decline.' }
      ],
      result: 'Diversification reduces dependence on one outcome. It does not remove market risk, and 20 companies from the same industry may still share many risks.',
      assumptions: 'Hypothetical equal-weight portfolio, only one company changes price, no fees, tax, distributions, or rebalancing. Twenty is an illustration, not a recommended number of holdings.',
      visual: {
        type: 'bars', title: 'Balance after the same company loses 50%', unit: '$',
        description: 'The single-company portfolio falls to $5,000. The equal-weight 20-company portfolio falls to $9,750 when only that company loses value.',
        items: [
          { label: 'One company', value: 5000, detail: '$5,000 loss on a $10,000 portfolio.' },
          { label: '20 equal holdings', value: 9750, detail: '$250 loss if the other 19 stay flat.' }
        ]
      }
    },
    'open-brokerage-account': {
      title: 'Price the first transfer before repeating it',
      introduction: 'A beginner plans to invest $250. A fictional platform charges $5 for the purchase and 1.5% to convert the original deposit into another currency.',
      steps: [
        { label: 'Calculate the conversion cost', body: '$250 × 1.5% = $3.75. This example treats that fee as a deduction from the original deposit.' },
        { label: 'Add the purchase fee', body: '$3.75 + $5 = $8.75 in initial costs. The amount left to invest is $250 − $8.75 = $241.25.' },
        { label: 'Compare before automating', body: 'The $8.75 cost is 3.5% of the original $250. Compare account fees, currency needs, purchase frequency, and suitable local-currency alternatives before repeating the transfer.' }
      ],
      result: 'Small-dollar investing makes fixed transaction costs especially visible. Confirm the real provider\'s schedule and verify the firm\'s registration before funding an account.',
      assumptions: 'Fictional fee schedule, both fees measured in the deposit currency, conversion fee based on $250, no exchange-rate movement, spreads, tax, or other charges. No specific platform is recommended.',
      visual: {
        type: 'flow', title: 'Follow the first $250',
        description: 'The original $250 deposit loses $3.75 to conversion and $5 to the purchase fee, leaving $241.25 to invest.',
        items: [
          { label: 'Starting deposit', value: '$250', detail: 'The planned first contribution.' },
          { label: 'Initial costs', value: '$8.75', detail: '$3.75 conversion + $5 purchase fee.' },
          { label: 'Left to invest', value: '$241.25', detail: '96.5% of the original deposit.' }
        ]
      },
      sources: [{ label: 'Investor.gov: Understanding Fees', url: 'https://www.investor.gov/introduction-investing/getting-started/understanding-fees' }]
    }
  };
}());
