(function () {
  'use strict';

  const INVESTOR_GOV = 'https://www.investor.gov/introduction-investing';
  const FEE_GUIDE = 'https://www.investor.gov/introduction-investing/getting-started/understanding-fees';
  const ASSET_ALLOCATION_GUIDE = 'https://www.investor.gov/introduction-investing/getting-started/asset-allocation';
  const DIVERSIFICATION_GUIDE = 'https://www.investor.gov/introduction-investing/investing-basics/glossary/diversification';
  const DCA_GUIDE = 'https://www.investor.gov/introduction-investing/investing-basics/glossary/dollar-cost-averaging';
  const COMPOUND_CALCULATOR = 'https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator';
  const TFSA_GUIDE = 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/tax-free-savings-account/what.html';
  const TFSA_WITHDRAWALS = 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/tax-free-savings-account/withdraw.html';
  const RRSP_GUIDE = 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/registered-retirement-savings-plan-rrsp.html';
  const FHSA_GUIDE = 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/first-home-savings-account.html';
  const CPP_GUIDE = 'https://www.canada.ca/en/services/benefits/publicpensions/cpp.html';
  const CPP_STATEMENT = 'https://www.canada.ca/en/services/benefits/publicpensions/cpp/statement-contributions.html';
  const RDSP_GUIDE = 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/registered-disability-savings-plan-rdsp.html';
  const DISABILITY_SAVINGS = 'https://www.canada.ca/en/employment-social-development/programs/disability/savings.html';
  const SEC_GAMESTOP_REPORT = 'https://www.sec.gov/file/staff-report-equity-options-market-struction-conditions-early-2021pdf';
  const FCAC_EMERGENCY_FUND = 'https://www.canada.ca/en/financial-consumer-agency/services/savings-investments/setting-up-emergency-funds.html';
  const FCAC_BUDGET_GUIDE = 'https://www.canada.ca/en/financial-consumer-agency/services/make-budget.html';
  const FCAC_GOAL_GUIDE = 'https://www.canada.ca/en/financial-consumer-agency/services/savings-investments/savings-investment-goals.html';
  const BANK_OF_CANADA_INFLATION = 'https://www.bankofcanada.ca/rates/related/inflation-calculator/';
  const STATCAN_CPI_2022 = 'https://www150.statcan.gc.ca/n1/daily-quotidien/230117/dq230117b-eng.htm';
  const SPIVA_CANADA_2025 = 'https://www.spglobal.com/spdji/en/spiva/article/spiva-canada/';
  const CRA_REGISTERED_LIMITS = 'https://www.canada.ca/en/revenue-agency/services/tax/registered-plans-administrators/pspa/mp-rrsp-dpsp-tfsa-limits-ympe.html';
  const CPP_WHEN_TO_START = 'https://www.canada.ca/en/services/benefits/publicpensions/cpp/when-start.html';

  const source = (label, url) => ({ label, url });
  const guide = (config) => Object.assign({
    level: 'Beginner',
    updated: 'July 2026',
    explanationTitle: 'How it works',
    exampleTitle: 'A practical example',
    pointsTitle: 'The essentials',
    sources: []
  }, config);

  const guides = {
    'investing-vs-speculating': guide({
      title: 'The Actual Difference Between Investing and Speculating',
      titleHtml: 'The actual difference between investing and <em>speculating</em>',
      deck: 'Both involve risk, but they rely on different reasons for expecting a return. Knowing which one you are doing leads to clearer decisions.',
      category: 'Fundamentals', minutes: 8,
      intro: [
        'Investing and speculating can look identical on a brokerage statement: money goes in, an asset is purchased, and the price moves. The meaningful difference is the logic underneath the purchase.',
        'An investment thesis connects a return to the productive value of an asset over time. A speculative thesis depends mainly on predicting what another buyer will pay next. Neither label guarantees an outcome, but each calls for a different time horizon and risk limit.'
      ],
      explanation: [
        'A diversified fund owns businesses that sell products, employ people, and may earn profits. A bond represents a promise to repay borrowed money with interest. Those assets have economic activity behind them. A short-term trade based only on a chart or online excitement relies much more heavily on price movement.',
        'The distinction is a spectrum, not a courtroom verdict. A researched individual stock can contain elements of both. The useful question is whether your expected return comes from durable cash flows and time, or from being right about a near-term price change.'
      ],
      points: [
        '<strong>Investing:</strong> usually diversified, long term, and tied to productive assets.',
        '<strong>Speculating:</strong> usually concentrated, price-driven, and dependent on timing.',
        '<strong>Honesty matters:</strong> calling a trade an investment does not change its risk.',
        '<strong>Position size matters:</strong> money needed for core goals should not depend on a single bet.'
      ],
      example: ['A monthly contribution to a broad-market index fund for a 25-year retirement goal is investing. Buying a stock after a viral post, with no valuation work and a plan to sell after a quick jump, is speculation. The same person can do both, but should not fund both from the same goal.'],
      actions: ['Write down why the asset should produce a return.', 'Name the intended holding period before buying.', 'Decide what evidence would prove the original thesis wrong.', 'Keep speculative positions separate from goal-based savings.'],
      caution: 'Excitement is not evidence, and a long holding period does not automatically turn a weak thesis into an investment. If a total loss would derail an important goal, the position is too large for that goal.',
      takeaway: 'Investing owns productive assets with a long-term plan. Speculating makes a narrower bet on price. Know which activity you are funding before you click buy.',
      related: ['what-risk-means', 'diversification', 'first-investment-framework'],
      sources: [source('Investor.gov: Introduction to Investing', INVESTOR_GOV)]
    }),

    'why-investing-exists': guide({
      title: 'Why Investing Exists - And What It Actually Does',
      titleHtml: 'Why investing exists - and what it <em>actually does</em>',
      deck: 'Investing connects people who have savings with businesses and governments that can put capital to productive use.',
      category: 'Fundamentals', minutes: 6,
      intro: [
        'Investing is more than a personal wealth strategy. It is one way an economy moves money from people who can set it aside today to organizations that need capital to build, hire, research, or operate.',
        'In return for giving up access to money and accepting uncertainty, investors seek compensation through interest, dividends, or growth in the value of what they own.'
      ],
      explanation: [
        'When a company issues shares, investors provide equity capital and receive ownership. When a government or company issues bonds, investors lend money under agreed terms. After issuance, markets let those securities change hands, which gives investors liquidity and helps establish prices.',
        'Returns are not created by a ticker symbol alone. Over long periods they are connected to business earnings, interest payments, economic growth, and the price originally paid.'
      ],
      points: ['Capital can fund expansion and public projects.', 'Investors accept delayed access and uncertainty in exchange for potential return.', 'Shares represent ownership; bonds represent lending.', 'Markets make ownership transferable, but they do not remove risk.'],
      example: ['A growing manufacturer wants a second facility. It can borrow by issuing bonds or sell part ownership through shares. Bondholders expect scheduled interest and repayment; shareholders participate in future gains or losses.'],
      actions: ['Ask what economic activity sits behind an investment.', 'Identify whether you are an owner, a lender, or both through a fund.', 'Match the investment horizon to when you need the money.'],
      caution: 'Useful economic activity does not guarantee a good investment. An excellent company can still be overpriced, and a borrower can fail to repay.',
      takeaway: 'Investing moves capital toward productive uses. Your potential return is compensation for time, uncertainty, and the risk that reality differs from the plan.',
      related: ['stocks-explained', 'bonds-explained', 'how-markets-work'],
      sources: [source('Investor.gov: Introduction to Investing', INVESTOR_GOV)]
    }),

    'how-markets-work': guide({
      title: 'How Markets Actually Work: A Plain-English Guide',
      titleHtml: 'How markets actually work, in <em>plain English</em>',
      deck: 'A market is a continuous negotiation between buyers and sellers. Prices move when their willingness to trade changes.',
      category: 'Fundamentals', minutes: 9,
      intro: [
        'A stock price is not an official declaration of what a company is worth. It is the latest price at which a willing buyer and seller completed a trade.',
        'Millions of participants continuously update their views using company results, interest rates, economic news, liquidity needs, and emotion. The displayed price is where those competing views briefly meet.'
      ],
      explanation: [
        'Buy orders state a price someone will pay; sell orders state a price someone will accept. The highest bid and lowest ask form the spread. A market order prioritizes execution, while a limit order sets a maximum purchase price or minimum sale price.',
        'Prices can change even when a company releases no news. A large seller, a change in interest-rate expectations, or a broad shift away from risk can alter the balance of orders.'
      ],
      points: ['The last trade is a price, not a promise.', 'Bid-ask spreads tend to be wider in less liquid securities.', 'Market orders trade quickly but do not guarantee the displayed quote.', 'New information matters through how it changes expectations, not just whether it sounds good or bad.'],
      example: ['A company reports higher profit, but its stock falls. That can happen when investors expected an even stronger result. The news was positive in isolation, but disappointing relative to the price already implied by expectations.'],
      actions: ['Use limit orders when price control matters.', 'Check trading volume and spreads before buying a thinly traded asset.', 'Avoid treating every daily move as a verdict on a long-term plan.'],
      caution: 'Fast markets can produce prices far from a recent quote. Complex order types and short-term trading add execution risk that beginners may not need.',
      takeaway: 'Markets are auctions for expectations. Prices move when the balance between buyers and sellers changes, not because a single authority resets them.',
      related: ['stocks-explained', 'investing-vs-speculating', 'investor-behaviour'],
      sources: [source('Investor.gov: Investing Basics', INVESTOR_GOV)]
    }),

    'what-risk-means': guide({
      title: 'What Risk Really Means in Investing',
      titleHtml: 'What <em>risk</em> really means in investing',
      deck: 'Risk is not one number. It includes permanent loss, temporary volatility, inflation, poor timing, and the chance that your plan cannot meet its goal.',
      category: 'Fundamentals', minutes: 7,
      intro: [
        'People often use risk as shorthand for prices moving down. That is visible and uncomfortable, but it is only one kind of risk.',
        'For a long-term investor, the deeper question is whether the portfolio can deliver the money needed, when it is needed, without requiring an intolerable decision along the way.'
      ],
      explanation: [
        'Market risk is the chance that broad prices decline. Concentration risk comes from depending on too few holdings. Inflation risk erodes purchasing power. Liquidity risk appears when an asset cannot be sold quickly at a fair price. Behaviour risk is the chance that panic or overconfidence breaks a sound plan.',
        'Capacity and tolerance are different. Capacity is the financial ability to absorb a loss; tolerance is the emotional ability to stay invested. A good plan must respect both.'
      ],
      points: ['Volatility is movement; permanent loss is damage that may not recover.', 'A safe-looking asset can still lose purchasing power to inflation.', 'Short time horizons reduce the ability to wait through a decline.', 'Diversification can reduce specific risks, but cannot eliminate all losses.'],
      example: ['A down payment needed next year faces serious timing risk in stocks, even if the owner is emotionally comfortable with volatility. Retirement money needed in 30 years faces more inflation risk if it stays entirely in cash.'],
      actions: ['Name the goal and withdrawal date.', 'List the risks most likely to prevent that goal.', 'Hold near-term needs in suitably stable and liquid assets.', 'Choose a portfolio you can realistically keep during a bad year.'],
      caution: 'Risk questionnaires are a starting point, not a complete plan. Your debts, job stability, dependants, and emergency savings also affect risk capacity.',
      takeaway: 'The right risk is not the highest risk you can endure. It is the mix of uncertainty your goal requires and your finances can support.',
      related: ['risk-and-return', 'diversification', 'asset-allocation'],
      sources: [source('Investor.gov: Introduction to Investing', INVESTOR_GOV)]
    }),

    'risk-and-return': guide({
      title: 'Risk and Return: The Relationship Nobody Explains Properly',
      titleHtml: 'Risk and return, <em>properly explained</em>',
      deck: 'Higher expected return is compensation for bearing uncertainty. It is not a reward automatically delivered to anyone who takes a bigger gamble.',
      category: 'Fundamentals', level: 'Intermediate', minutes: 9,
      intro: [
        'The phrase higher risk, higher return is incomplete. Higher risk may justify a higher <em>expected</em> return, but the outcome can still be worse or permanently negative.',
        'If risk reliably produced more money, it would not be risk. The possibility of underperformance is what makes the potential premium meaningful.'
      ],
      explanation: [
        'Investors often demand more potential return for accepting uncertain cash flows, long lockups, weak credit, or volatile prices. That demand can push risky asset prices lower today, increasing their prospective return if the underlying investment succeeds.',
        'Not every risk is compensated. Concentrating in one company adds avoidable risk, while owning a diversified equity market exposes an investor to broader economic risk that cannot be diversified away as easily.'
      ],
      points: ['Expected return is an average of possible outcomes, not a forecast.', 'Uncompensated concentration can add danger without improving the odds.', 'Time horizon changes how much short-term volatility a plan can absorb.', 'Fees and taxes reduce the return an investor actually keeps.'],
      example: ['Two portfolios may both average 6% in a simplified projection, but one can swing far more widely. If a withdrawal occurs during a deep decline, the path of returns matters, not just the average.'],
      actions: ['Separate expected return from guaranteed return.', 'Compare downside scenarios before comparing best cases.', 'Diversify risks that do not support a deliberate objective.', 'Evaluate results after fees, taxes, and inflation.'],
      caution: 'Recent strong performance can make risk look smaller than it is. A calm market does not prove an asset is safe.',
      takeaway: 'Return is the possible compensation for risk, not a prize for taking it. Take risks that serve the plan and avoid risks that merely make the portfolio fragile.',
      related: ['what-risk-means', 'asset-allocation', 'investment-fees'],
      sources: [source('Investor.gov: Introduction to Investing', INVESTOR_GOV)]
    }),

    'time-in-market': guide({
      title: 'Time in the Market vs. Timing the Market',
      titleHtml: 'Time in the market vs. <em>timing the market</em>',
      deck: 'Successful market timing requires two correct decisions: when to leave and when to return. A durable plan reduces the need to guess either one.',
      category: 'Fundamentals', minutes: 6,
      intro: [
        'Waiting for certainty feels cautious, but markets usually become reassuring only after prices have already moved. The best and worst days can occur close together, making repeated exits and re-entries difficult.',
        'Time in the market does not mean every dollar belongs in stocks immediately. It means long-term money follows a long-term allocation instead of reacting to headlines.'
      ],
      explanation: [
        'Compounding needs participation. Cash held while waiting for a perfect entry misses dividends and gains as well as losses. Once out, the investor must choose a new entry point while the news may still feel frightening.',
        'A planned asset mix, regular contributions, and scheduled rebalancing replace a prediction problem with a repeatable process.'
      ],
      points: ['Market timing requires a sell decision and a buy-back decision.', 'Strong rebound days often arrive when uncertainty remains high.', 'Money needed soon should not rely on market recovery.', 'Regular investing spreads entry points without claiming to predict them.'],
      example: ['An investor sells after a sharp decline and waits for conditions to improve. Prices rebound before the headlines do, so the investor either buys back higher or stays in cash. A preset allocation would have defined the response before emotions peaked.'],
      actions: ['Separate near-term cash needs from long-term investments.', 'Write rebalancing rules before volatility arrives.', 'Automate contributions on a sustainable schedule.', 'Review the plan on dates, not in response to alerts.'],
      caution: 'Staying invested is not an excuse to ignore a mismatched portfolio. If the allocation exceeds your capacity for loss, fix the plan thoughtfully rather than relying on willpower.',
      takeaway: 'You do not need to predict each turn. Keep long-term money invested according to a suitable allocation and let process replace repeated guesses.',
      related: ['dollar-cost-averaging', 'bear-markets', 'automatic-contributions'],
      sources: [source('Investor.gov: Introduction to Investing', INVESTOR_GOV)]
    }),

    'inflation-and-cash': guide({
      title: 'The Cost of Doing Nothing: Inflation and Your Cash',
      titleHtml: 'Inflation and the <em>cost of cash</em>',
      deck: 'Cash can protect a near-term dollar amount while still losing purchasing power. The right question is what the money must do and when.',
      category: 'Fundamentals', minutes: 6,
      intro: [
        'Cash is useful: it pays bills, supports emergencies, and avoids forced selling. Its weakness is that a stable account balance does not guarantee stable purchasing power.',
        'When prices rise faster than the interest earned after tax, the same dollars buy less over time. That loss is quiet, but it matters for goals measured in decades.'
      ],
      explanation: [
        'Real return is the return left after inflation. If an account earns 2% while prices rise 3%, purchasing power falls by roughly 1% before considering tax. The exact relationship compounds over time.',
        'This does not make cash bad. It makes cash a tool for liquidity and stability, while growth assets may be needed for longer horizons.'
      ],
      points: ['Nominal return is the number on the statement.', 'Real return adjusts for changing purchasing power.', 'Emergency funds value access and stability more than maximum return.', 'Long-term goals may need assets with better growth potential.'],
      example: ['A $10,000 emergency fund should remain accessible even if its real return is modest. A separate retirement contribution with a 30-year horizon can accept more fluctuation in pursuit of long-term growth.'],
      actions: ['Assign every cash balance a purpose.', 'Compare savings rates after fees and tax.', 'Keep short-term goals liquid.', 'Review whether long-term cash is waiting for a decision or serving a real need.'],
      caution: 'Do not chase a higher return with emergency money if access, principal stability, or deposit protection becomes unclear.',
      takeaway: 'Cash buys certainty and access; inflation is part of its cost. Hold enough for near-term resilience, then invest long-term money according to its horizon.',
      related: ['how-much-to-invest', 'what-risk-means', 'compound-interest'],
      sources: [source('Investor.gov: Introduction to Investing', INVESTOR_GOV)]
    }),

    'compound-interest': guide({
      title: 'Compound Interest: The Most Powerful Force in Investing',
      titleHtml: 'Compound interest: growth on <em>growth</em>',
      deck: 'Compounding happens when returns remain invested and begin producing returns of their own. Time gives the process room to accelerate.',
      category: 'Compounding', minutes: 7,
      intro: [
        'Simple growth earns a return only on the original amount. Compound growth earns on the original amount and on prior returns that remain invested.',
        'The early years can look unimpressive because the base is still small. Later, the accumulated returns may contribute more than new deposits.'
      ],
      explanation: [
        'Four variables drive a simple projection: starting balance, contribution amount, return, and time. Investors control contributions and time more directly than returns.',
        'Compounding also works in reverse. Fund fees, borrowing costs, and taxes can repeatedly reduce the base that would otherwise keep growing.'
      ],
      points: ['Reinvested returns enlarge the base for future growth.', 'More time can matter as much as a larger monthly deposit.', 'Higher projected returns come with uncertainty and should not be treated as promises.', 'Lower recurring costs leave more capital available to compound.'],
      example: ['At a hypothetical 6% annual return, $200 contributed monthly grows differently over 10 years than over 30 because the earliest deposits receive many more growth periods. Real markets will not deliver a smooth 6% each year.'],
      actions: ['Start with an affordable recurring amount.', 'Increase contributions when income rises.', 'Reinvest distributions when they are not needed for spending.', 'Model conservative, middle, and weak-return scenarios.'],
      caution: 'A compound-interest calculator is a planning illustration, not a forecast. Returns vary, and inflation, fees, and taxes affect what the ending amount can buy.',
      takeaway: 'Compounding rewards time, consistency, and low friction. The practical edge is not finding a magical rate; it is keeping a sound plan working for longer.',
      related: ['starting-early', 'automatic-contributions', 'investment-fees'],
      sources: [source('Investor.gov: Compound Interest Calculator', COMPOUND_CALCULATOR)]
    }),

    'starting-early': guide({
      title: 'Why Starting Early Matters More Than Starting Big',
      titleHtml: 'Why starting <em>early</em> matters more than starting big',
      deck: 'An early contribution has more opportunities to compound. A modest habit today can be more valuable than waiting for a perfect future budget.',
      category: 'Compounding', minutes: 6,
      intro: [
        'Many people postpone investing until they can contribute a meaningful amount. The overlooked asset is not the first deposit; it is the years that deposit can remain invested.',
        'Starting small also builds operating knowledge: how transfers work, how prices move, and how you react during declines.'
      ],
      explanation: [
        'A contribution made today receives every future compounding period. A larger contribution made much later has less time to generate returns on prior returns.',
        'This is not a reason to invest before high-interest debt or basic emergency needs are addressed. Starting early means beginning once the financial foundation can support it.'
      ],
      points: ['Time is one of the few investing inputs that cannot be recovered later.', 'A small automatic amount can establish the habit.', 'Contribution growth can follow income growth.', 'The starting asset mix still needs to fit the goal.'],
      example: ['Someone who begins with $50 per paycheque can learn and automate now, then raise the amount after a promotion. Waiting for a large surplus may mean losing both time and the habit.'],
      actions: ['Choose the smallest amount you can sustain.', 'Schedule it just after payday.', 'Set a calendar reminder to raise it annually.', 'Keep the account and investment simple enough to understand.'],
      caution: 'Do not use the value of starting early to create financial strain. High-interest debt and missing emergency savings can force withdrawals at the worst time.',
      takeaway: 'Start with a stable amount, not an impressive amount. Time and a habit that grows with you can do more than a delayed search for the perfect beginning.',
      related: ['compound-interest', 'automatic-contributions', 'how-much-to-invest'],
      sources: [source('Investor.gov: Compound Interest Calculator', COMPOUND_CALCULATOR)]
    }),

    'dollar-cost-averaging': guide({
      title: 'Dollar-Cost Averaging: The Strategy That Works by Default',
      titleHtml: 'Dollar-cost averaging: a strategy that works by <em>default</em>',
      deck: 'Investing equal amounts on a schedule buys more units when prices are lower and fewer when prices are higher.',
      category: 'Compounding', minutes: 7,
      intro: [
        'Dollar-cost averaging is a contribution method, not a guarantee of profit. Its strength is behavioural: it turns investing into a recurring process instead of a repeated debate about whether today is the perfect day.',
        'Most workers already receive income gradually, so scheduled investing naturally matches how money becomes available.'
      ],
      explanation: [
        'A fixed dollar contribution purchases a varying number of units. When the price is lower, the contribution buys more; when it is higher, it buys fewer. Over time this spreads purchases across many market conditions.',
        'For a lump sum already available, deliberately stretching purchases out can reduce immediate regret but may also leave money uninvested. That is a separate decision from investing each paycheque as it arrives.'
      ],
      points: ['The schedule removes some emotion from entry decisions.', 'It does not prevent losses in a declining market.', 'Automation supports consistency.', 'The underlying investment still needs to be diversified and suitable.'],
      example: ['A $300 monthly contribution buys 30 units at $10, 25 units at $12, and 37.5 units at $8. The purchase count adjusts without requiring a market forecast.'],
      actions: ['Align the transfer with payday.', 'Use an amount that leaves room for normal expenses.', 'Choose the investment before automating.', 'Review the amount periodically, not after every market move.'],
      caution: 'Averaging into a poor or highly concentrated investment does not repair its fundamentals. The method manages purchase timing, not asset quality.',
      takeaway: 'Dollar-cost averaging is valuable because it is repeatable. It replaces the hunt for a perfect entry with a schedule you can maintain.',
      related: ['automatic-contributions', 'time-in-market', 'compound-interest'],
      sources: [source('Investor.gov: Dollar-Cost Averaging', DCA_GUIDE)]
    }),

    'dividend-reinvestment': guide({
      title: 'Dividends and Reinvestment: The Quiet Growth Engine',
      titleHtml: 'Dividends and the quiet engine of <em>reinvestment</em>',
      deck: 'A dividend is cash distributed by a company or fund. Reinvesting it purchases more units, which can generate future distributions and growth.',
      category: 'Compounding', level: 'Intermediate', minutes: 8,
      intro: [
        'Dividends are one way an investment returns value to its owners. They are not free money: when cash leaves a company or fund, the asset price generally reflects that distribution.',
        'For an investor who does not need the income, reinvestment keeps the cash working and increases the number of units owned.'
      ],
      explanation: [
        'A dividend reinvestment plan, often called a DRIP, uses a distribution to buy additional shares or fund units. Those new units can receive later distributions, adding another route for compounding.',
        'Total return includes both price change and distributions. Comparing investments by yield alone ignores business quality, valuation, taxes, and the possibility that a dividend is reduced.'
      ],
      points: ['Dividends are part of total return, not an extra return on top of it.', 'Reinvestment increases units without a new cash deposit.', 'A high yield can signal risk rather than value.', 'Tax treatment depends on the investment and account type.'],
      example: ['A fund distributes $40 and the unit price is $20. Reinvestment buys two additional units. Those units participate in future gains, losses, and distributions.'],
      actions: ['Decide whether distributions are for spending or growth.', 'Check whether your brokerage supports automatic reinvestment.', 'Track adjusted cost information in taxable accounts.', 'Evaluate total return, not yield alone.'],
      caution: 'Companies can reduce or eliminate dividends. Concentrating in high-yield securities can sacrifice diversification and expose the portfolio to avoidable sector risk.',
      takeaway: 'Reinvested dividends can support compounding, but the durable decision is owning suitable assets at reasonable cost - not chasing the largest payout.',
      related: ['compound-interest', 'stocks-explained', 'taxes-and-compounding'],
      sources: [source('Investor.gov: Introduction to Investing', INVESTOR_GOV)]
    }),

    'rule-of-72': guide({
      title: 'The Rule of 72 and Other Back-of-the-Napkin Tricks',
      titleHtml: 'The Rule of 72 and other <em>quick estimates</em>',
      deck: 'Divide 72 by an annual growth rate to estimate how many years money may take to double. It is a shortcut, not a forecast.',
      category: 'Compounding', minutes: 5,
      intro: [
        'Good financial decisions do not always require a spreadsheet. Simple mental estimates can reveal whether an assumption is plausible before you model it precisely.',
        'The Rule of 72 works best for moderate, steady rates. Real investment returns vary from year to year, so the result is only an illustration.'
      ],
      explanation: [
        'At a hypothetical 6% annual rate, 72 divided by 6 suggests roughly 12 years to double. At 8%, the estimate is about 9 years. The same shortcut exposes costs: a recurring 3% drag has a large effect over roughly 24 years.',
        'Another useful check is real return: subtract inflation from a nominal return as a rough first estimate. Precise compounding uses division rather than simple subtraction, but the shortcut is useful for orientation.'
      ],
      points: ['72 divided by the rate estimates doubling time.', 'The rule assumes a positive and relatively steady compound rate.', 'It can illustrate growth, inflation, debt, or fee drag.', 'Use a calculator for actual planning decisions.'],
      example: ['A sales pitch assumes money will double every six years. The Rule of 72 implies a 12% annual compound return. That quick check should prompt questions about risk and whether the assumption is credible.'],
      actions: ['Use the rule to challenge return assumptions.', 'Run the same estimate for fees and inflation.', 'Confirm important decisions with a proper calculator.', 'Model a range instead of one optimistic rate.'],
      caution: 'The rule does not account for taxes, contributions, withdrawals, changing returns, or losses. Precision-looking projections can still be based on unrealistic inputs.',
      takeaway: 'Mental math is useful for spotting implausible claims. Treat the Rule of 72 as a first check, then use realistic scenario modelling.',
      related: ['compound-interest', 'investment-fees', 'inflation-and-cash'],
      sources: [source('Investor.gov: Compound Interest Calculator', COMPOUND_CALCULATOR)]
    }),

    'investment-fees': guide({
      title: 'Fees: Compound Interest in Reverse',
      titleHtml: 'Fees: compound interest in <em>reverse</em>',
      deck: 'A recurring fee reduces this year\'s return and the capital available to earn future returns. Small percentages can create large long-term differences.',
      category: 'Compounding', level: 'Intermediate', minutes: 8,
      intro: [
        'Investment costs are certain even when returns are not. That makes fees one of the few portfolio inputs an investor can compare before buying.',
        'The meaningful number is not whether a fee sounds small. It is how many dollars the fee removes over the full holding period, including growth those dollars no longer earn.'
      ],
      explanation: [
        'Funds may charge a management expense ratio. Accounts may also have trading commissions, advice fees, currency conversion costs, administration charges, or embedded sales costs. Some are visible on a statement; others are deducted inside the investment return.',
        'A higher-cost option can be worthwhile if it provides a service you value and use. The decision becomes clearer when the service and total cost are stated separately.'
      ],
      points: ['Ask for the total annual cost in dollars and percent.', 'Compare similar products on an after-fee basis.', 'Check trading and currency costs as well as fund expenses.', 'Understand what advice or service the fee purchases.'],
      example: ['On a $100,000 balance, a 1% annual fee starts near $1,000 per year before considering changes in value. That amount also loses its opportunity to compound in future years.'],
      actions: ['Read the fund facts or prospectus.', 'List every account, product, trading, and advice fee.', 'Calculate the cost at your current and expected future balance.', 'Avoid frequent trading that adds friction without a clear purpose.'],
      caution: 'Cheapest does not automatically mean suitable. Compare diversification, tracking, service, tax consequences, and switching costs before changing an existing holding.',
      takeaway: 'You cannot control the market, but you can understand what you pay. Keep costs intentional and make sure each fee buys something the plan actually needs.',
      related: ['active-vs-passive', 'mutual-funds-vs-etfs', 'compound-interest'],
      sources: [source('Investor.gov: Understanding Fees', FEE_GUIDE)]
    }),

    'taxes-and-compounding': guide({
      title: 'Taxes and Compounding: What Tax-Advantaged Really Means',
      titleHtml: 'Taxes, compounding, and what <em>tax-advantaged</em> means',
      deck: 'Account rules affect when tax is paid, whether a contribution is deductible, and how much capital remains available to grow.',
      category: 'Compounding', level: 'Intermediate', minutes: 10,
      intro: [
        'Investment choice and account choice are separate decisions. A TFSA, RRSP, or FHSA is a legal account structure; the cash or investments held inside it determine market risk.',
        'Tax advantages can support compounding because less money is lost to annual tax drag, but each account has eligibility, contribution, withdrawal, and recordkeeping rules.'
      ],
      explanation: [
        'TFSA contributions are not deductible, while eligible growth and withdrawals are generally tax-free. RRSP contributions may reduce taxable income, growth is generally tax-deferred, and withdrawals are usually taxable. An FHSA can combine deductible contributions with tax-free qualifying home withdrawals.',
        'The best sequence depends on the goal, income today, expected income later, available employer matching, and the flexibility needed.'
      ],
      points: ['The account is a container; it does not choose the investment.', 'Tax-free and tax-deferred are different benefits.', 'Contribution room and withdrawal rules must be tracked.', 'A tax deduction is most useful when it supports the broader plan.'],
      example: ['Two people can own the same balanced ETF but experience different tax treatment because one holds it in a TFSA and the other in a taxable account. The market exposure is the same; the account rules are not.'],
      actions: ['Start with the goal and expected withdrawal.', 'Confirm room using current records.', 'Capture any valuable employer match first.', 'Review beneficiary designations and account paperwork.'],
      caution: 'Tax rules change and individual circumstances matter. Verify current limits and consequences with the CRA or a qualified professional before acting.',
      takeaway: 'Tax-advantaged accounts improve the environment around an investment. Choose the container and the investment deliberately rather than treating either one as the complete plan.',
      related: ['registered-accounts', 'tfsa-vs-rrsp', 'fhsa-explained'],
      sources: [source('CRA: Tax-Free Savings Account', TFSA_GUIDE), source('CRA: Registered Retirement Savings Plan', RRSP_GUIDE), source('CRA: First Home Savings Account', FHSA_GUIDE)]
    }),

    'stocks-explained': guide({
      title: 'What Is a Stock, Really?',
      titleHtml: 'What is a <em>stock</em>, really?',
      deck: 'A share represents ownership in a company. Its return depends on the business, the price paid, and what future investors expect.',
      category: 'Asset Classes', minutes: 7,
      intro: [
        'Buying a stock means acquiring a small ownership interest in a corporation, not purchasing a moving line on a screen.',
        'Shareholders may benefit from business growth, dividends, or a higher market valuation. They also stand behind lenders if the company fails, so ownership carries meaningful risk.'
      ],
      explanation: [
        'Companies issue equity to raise capital without promising scheduled repayment. In exchange, shareholders receive a residual claim on the business and may receive voting rights, depending on the share class.',
        'The market price reflects expectations about future cash flows, risk, interest rates, and investor demand. A good company can be a poor investment if the purchase price assumes too much.'
      ],
      points: ['Common shares usually represent ownership and may carry votes.', 'Dividends are optional distributions, not guaranteed interest.', 'Shareholders can lose their full investment.', 'Diversified funds reduce dependence on one company.'],
      example: ['If a company has one million equal shares and you own 100, you own 0.01% of the equity. Your result depends on what the company earns and what buyers will pay for that claim in the future.'],
      actions: ['Know whether you own a company directly or through a fund.', 'Read what the business does and how it earns money.', 'Limit single-company exposure to an amount the plan can lose.', 'Compare the stock with a diversified alternative.'],
      caution: 'A familiar brand is not automatically a sound investment. Product quality, financial strength, valuation, and portfolio fit are separate questions.',
      takeaway: 'A stock is a claim on a real business. Treat it as ownership, then decide whether direct concentration or diversified exposure better serves the goal.',
      related: ['index-funds', 'diversification', 'bonds-explained'],
      sources: [source('Investor.gov: Introduction to Investing', INVESTOR_GOV)]
    }),

    'bonds-explained': guide({
      title: 'What Is a Bond? (And Why Should I Care?)',
      titleHtml: 'What is a <em>bond</em>, and why should you care?',
      deck: 'A bond is a loan to a government or company. Investors receive promised payments while accepting interest-rate, inflation, and credit risk.',
      category: 'Asset Classes', minutes: 7,
      intro: [
        'Bonds are often described as safe, but that word hides several moving parts. A bond promises interest and principal under defined terms; its market price can still rise or fall before maturity.',
        'In a portfolio, high-quality bonds may reduce volatility, fund nearer withdrawals, and provide assets that can be rebalanced into stocks after declines.'
      ],
      explanation: [
        'Bond prices generally move opposite to market interest rates because existing payments become more or less attractive relative to new bonds. Longer maturities usually react more to rate changes. Credit risk reflects the chance the borrower does not pay as promised.',
        'A bond fund holds many bonds and continually replaces maturities. It diversifies issuers but does not have one maturity date at which the fund price is guaranteed.'
      ],
      points: ['Coupon is the stated interest payment.', 'Yield reflects price as well as payments.', 'Duration estimates sensitivity to interest-rate changes.', 'Credit quality and maturity shape risk.'],
      example: ['If new comparable bonds begin paying more, an older lower-paying bond becomes less attractive and its resale price may fall. An investor holding an individual bond to maturity still depends on the issuer repaying it.'],
      actions: ['Define whether bonds are for stability, income, or a dated goal.', 'Check duration and credit quality, not just yield.', 'Use diversification when lending to corporate issuers.', 'Match near-term liabilities with suitably stable assets.'],
      caution: 'A high yield usually reflects higher risk. Bonds can lose money, and inflation can reduce the purchasing power of fixed payments.',
      takeaway: 'Bonds are portfolio tools, not risk-free placeholders. Choose their quality and maturity based on the job they need to perform.',
      related: ['asset-allocation', 'stocks-explained', 'what-risk-means'],
      sources: [source('Investor.gov: Introduction to Investing', INVESTOR_GOV)]
    }),

    'mutual-funds-vs-etfs': guide({
      title: 'Mutual Funds vs. ETFs: What Is the Actual Difference?',
      titleHtml: 'Mutual funds vs. ETFs: the <em>actual difference</em>',
      deck: 'Both can pool many investments into one product. The main differences involve how they trade, how they are priced, costs, and account features.',
      category: 'Asset Classes', minutes: 8,
      intro: [
        'Mutual funds and exchange-traded funds are wrappers that can hold stocks, bonds, or other assets. Either one can be broad and low-cost or narrow and expensive.',
        'The label alone does not reveal whether a fund is diversified, passive, tax-efficient, or appropriate.'
      ],
      explanation: [
        'Traditional mutual funds transact with the fund company at a calculated end-of-day net asset value. ETFs trade on an exchange throughout the day, so investors use market orders or limit orders and encounter bid-ask spreads.',
        'Some mutual funds support automatic dollar purchases and fractional units easily. ETFs may have lower expenses, but trading commissions, spreads, and currency conversion can change the comparison.'
      ],
      points: ['Compare the holdings and strategy before the wrapper.', 'Review MER, commissions, spreads, and advice costs.', 'Check minimum purchases and automation features.', 'Confirm whether the fund is active, indexed, or rules-based.'],
      example: ['A broad Canadian equity mutual fund and ETF may own nearly identical companies. If one includes advice and costs more, the useful question is whether that service is valuable to you - not whether all mutual funds or all ETFs are better.'],
      actions: ['Read the fund facts.', 'Compare benchmark, holdings, and total annual cost.', 'Check how distributions and automatic purchases are handled.', 'Use limit orders thoughtfully for less-liquid ETFs.'],
      caution: 'An ETF can be leveraged, concentrated, or complex. Exchange trading does not make the underlying assets diversified or low-risk.',
      takeaway: 'Choose the investment strategy first, then the wrapper that delivers it with suitable cost, convenience, and service.',
      related: ['index-funds', 'active-vs-passive', 'investment-fees'],
      sources: [source('Investor.gov: Understanding Fees', FEE_GUIDE)]
    }),

    'index-funds': guide({
      title: 'Index Funds: A Powerful Tool for Regular Investors',
      titleHtml: 'Index funds: broad ownership made <em>simple</em>',
      deck: 'An index fund follows a defined market benchmark instead of asking a manager to select each winner in advance.',
      category: 'Asset Classes', minutes: 8,
      intro: [
        'An index is a rule-based list used to describe part of a market. An index fund seeks to track that list, giving investors exposure to many securities in one holding.',
        'The appeal is not that every company succeeds. It is that the fund can own the broad result without requiring the investor to identify tomorrow\'s winners today.'
      ],
      explanation: [
        'Different indexes cover different markets: a country, sector, company size, or bond category. A fund may hold every index constituent or use a representative sample.',
        'Tracking is affected by fees, trading, taxes, and fund design. Two products using similar labels may follow different indexes and produce different exposure.'
      ],
      points: ['Indexing is a method, not a guarantee of diversification.', 'Broad indexes can reduce single-company dependence.', 'Costs and tracking difference matter.', 'The chosen index determines what you own and what you omit.'],
      example: ['A broad global stock index fund can hold companies across countries and sectors. A technology index fund is still an index fund, but its concentration gives it a very different role and risk profile.'],
      actions: ['Read the index description.', 'Inspect country, sector, and top-holding weights.', 'Compare fees and tracking history.', 'Place the fund inside a suitable overall asset allocation.'],
      caution: 'Market-cap indexes can become concentrated in the largest companies, and narrow thematic indexes may behave like sector bets.',
      takeaway: 'Index funds make diversified market exposure accessible. The important choice is not simply index versus non-index; it is which market exposure fits the plan.',
      related: ['diversification', 'active-vs-passive', 'mutual-funds-vs-etfs'],
      sources: [source('Investor.gov: Introduction to Investing', INVESTOR_GOV)]
    }),

    'active-vs-passive': guide({
      title: 'Active vs. Passive Investing: What the Evidence Means',
      titleHtml: 'Active vs. passive investing: what the <em>evidence means</em>',
      deck: 'Active investing tries to outperform a benchmark. Passive investing tries to capture a benchmark, usually at lower cost.',
      category: 'Asset Classes', level: 'Intermediate', minutes: 9,
      intro: [
        'The active-passive decision is not a contest between people who think and people who do not. Both approaches rely on rules, judgement, and trade-offs.',
        'The core arithmetic is that the market return is shared by all participants before costs. After costs, a higher-cost strategy has a larger hurdle to overcome.'
      ],
      explanation: [
        'Active managers select securities, adjust weights, or change exposures in an effort to beat a benchmark or control risk. Passive funds follow a stated index and accept its composition.',
        'A fair comparison uses an appropriate benchmark, the same risk level, and returns after all fees. One strong period is not enough to establish repeatable skill.'
      ],
      points: ['Active results should be compared after fees and against the right benchmark.', 'Passive funds still make choices through index design.', 'Taxes and trading can widen the cost difference.', 'Consistency and portfolio fit matter more than labels.'],
      example: ['An active Canadian equity fund that holds smaller companies should not be judged only against a large-company index. The investor should compare like with like and include the management fee.'],
      actions: ['Identify the benchmark in the fund documents.', 'Compare long periods and multiple market conditions.', 'Measure total cost and tax impact.', 'Write down what would justify keeping or replacing the strategy.'],
      caution: 'Past outperformance can disappear, while switching after weak performance can lock investors into chasing whichever style just won.',
      takeaway: 'Passive investing offers a low-cost default. Active investing needs a clear role, fair benchmark, and evidence strong enough to justify its extra cost and complexity.',
      related: ['index-funds', 'investment-fees', 'investor-behaviour'],
      sources: [source('Investor.gov: Understanding Fees', FEE_GUIDE)]
    }),

    'diversification': guide({
      title: 'Understanding Diversification',
      titleHtml: 'Diversification beyond <em>more holdings</em>',
      deck: 'Diversification spreads exposure across risks that are unlikely to fail for the same reason at the same time.',
      category: 'Portfolio Thinking', minutes: 7,
      intro: [
        'Owning many investments is not enough if they all depend on the same sector, country, currency, or economic outcome.',
        'Useful diversification combines assets whose return drivers differ. It aims to reduce the damage from being wrong about any one company or scenario.'
      ],
      explanation: [
        'Company-specific risk can be reduced by owning many issuers. Sector and country diversification spread broader exposures. Bonds and cash may respond differently from stocks, helping with stability and withdrawals.',
        'Diversification cannot prevent a portfolio from falling during a broad crisis. Its purpose is resilience, not immunity.'
      ],
      points: ['Count independent risk drivers, not ticker symbols.', 'Funds can provide broad exposure efficiently.', 'Home-country familiarity can create concentration.', 'Rebalancing maintains the intended mix over time.'],
      example: ['Owning five Canadian bank stocks is five holdings but one concentrated industry and country exposure. A global equity fund plus high-quality bonds spreads risk across more businesses and economic drivers.'],
      actions: ['Review top holdings and sector weights across all accounts.', 'Look for duplicated exposure between funds.', 'Set reasonable limits for employer stock and individual companies.', 'Diversify at the household level, including income sources.'],
      caution: 'Adding a complex asset does not automatically improve diversification. High correlations can emerge during stress, and unfamiliar products may add risks you cannot monitor.',
      takeaway: 'Diversification is the practice of not requiring one company, sector, or forecast to be right. Build around independent sources of return and risk.',
      related: ['asset-allocation', 'index-funds', 'rebalancing'],
      sources: [source('Investor.gov: Diversification', DIVERSIFICATION_GUIDE)]
    }),

    'open-brokerage-account': guide({
      title: 'How to Open a Brokerage Account: Step by Step',
      titleHtml: 'How to open a brokerage account, <em>step by step</em>',
      deck: 'Choose the account type, compare the complete cost and service, verify your identity, fund it, and make an intentional first purchase.',
      category: 'Getting Started', minutes: 8,
      intro: [
        'Opening an account is administrative; choosing what belongs in it is the investing decision. Keeping those steps separate prevents a rushed purchase at the end of a signup flow.',
        'In Canada, the same brokerage may offer taxable accounts and registered accounts such as TFSAs, RRSPs, or FHSAs. The account title changes tax rules, not market behaviour.'
      ],
      explanation: [
        'A brokerage will request identity, tax residency, contact, employment, and financial information. It may ask about investing knowledge and objectives to meet regulatory obligations.',
        'After approval, money can usually arrive by linked bank transfer or bill payment. Settlement times, transfer holds, and currency conversion policies differ by provider.'
      ],
      points: ['Choose the account before the investment.', 'Compare commissions, FX costs, account fees, and available products.', 'Use strong unique credentials and multi-factor authentication.', 'Confirm how cash is held and statements are delivered.'],
      example: ['A person saving for a first home might compare FHSA availability, automatic purchases, transfer fees, and suitable low-risk products before selecting a platform. A flashy trading interface is not the deciding feature.'],
      actions: ['Define the goal and account type.', 'Compare at least two providers on total cost and support.', 'Gather ID and tax information.', 'Fund with a small test transfer before automating.'],
      caution: 'Do not open a margin account or enable options simply because the setup offers them. Borrowing and derivatives create risks that are separate from ordinary investing.',
      takeaway: 'A brokerage is infrastructure. Pick one that reliably supports the account, investments, automation, and service your plan requires.',
      related: ['first-investment-framework', 'registered-accounts', 'automatic-contributions'],
      sources: [source('Investor.gov: Introduction to Investing', INVESTOR_GOV)]
    }),

    'first-investment-framework': guide({
      title: 'Your First Investment: A Framework for Deciding',
      titleHtml: 'Your first investment: a framework for <em>deciding</em>',
      deck: 'Start with the job the money must do. Product selection comes after goal, time horizon, risk, account, diversification, and cost.',
      category: 'Getting Started', minutes: 9,
      intro: [
        'The internet usually answers what should I buy with a ticker symbol. A durable answer begins with information about the investor that no ticker can provide.',
        'A first investment should be understandable, diversified enough for its role, affordable to hold, and compatible with the date the money will be needed.'
      ],
      explanation: [
        'Work from the outside in: define the goal, protect near-term cash needs, choose the account, set an asset mix, and only then compare products that implement it.',
        'This order prevents a popular product from quietly deciding the risk level. It also makes future reviews easier because each holding has a stated purpose.'
      ],
      points: ['Goal and withdrawal date determine the planning horizon.', 'Risk capacity matters alongside emotional tolerance.', 'Diversified funds can simplify a first portfolio.', 'Low cost and automation reduce ongoing friction.'],
      example: ['Retirement money for 30 years from now and tuition due in two years should not share the same investment merely because both balances are called savings. Their time horizons require different trade-offs.'],
      actions: ['Write one sentence describing the goal.', 'Set aside emergency and near-term needs.', 'Choose the account using current rules.', 'Compare a short list of simple diversified options.'],
      caution: 'Do not let urgency from social media replace due diligence. There will always be another market day; there may not be an easy way to reverse tax or transfer mistakes.',
      takeaway: 'The best first investment is not universally best. It is the simplest suitable tool for a clearly defined job.',
      related: ['open-brokerage-account', 'asset-allocation', 'how-much-to-invest'],
      sources: [source('Investor.gov: Introduction to Investing', INVESTOR_GOV)]
    }),

    'how-much-to-invest': guide({
      title: 'How Much Should You Invest - and What Should Stay in Cash?',
      titleHtml: 'How much should you invest - and what should stay in <em>cash</em>?',
      deck: 'The right amount is what remains after near-term obligations and resilience are protected, not a universal percentage copied from someone else.',
      category: 'Getting Started', minutes: 7,
      intro: [
        'Investing more is not always progress. If a car repair or rent increase forces an early sale, an aggressive contribution can weaken the plan it was meant to improve.',
        'A useful contribution amount balances present stability with future goals.'
      ],
      explanation: [
        'Start with required expenses, minimum debt payments, irregular annual costs, and an emergency reserve based on your household risk. Then consider employer matching and high-interest debt before allocating the remaining cash flow across goals.',
        'The reserve does not need to follow one universal month count. Job security, insurance, dependants, health needs, and access to credit all affect the amount.'
      ],
      points: ['Protect bills and known near-term expenses first.', 'Prioritize expensive debt and valuable employer matching.', 'Use separate timelines for separate goals.', 'Choose a contribution that can survive an ordinary bad month.'],
      example: ['A household with variable freelance income may hold a larger cash buffer than a dual-income household with stable pensions. The difference reflects resilience needs, not investing courage.'],
      actions: ['List monthly essentials and annual irregular costs.', 'Set a reserve target based on actual household risks.', 'Rank goals by date and importance.', 'Automate a conservative amount, then adjust from real cash-flow data.'],
      caution: 'Do not invest money needed for taxes, a known purchase, or basic emergencies merely to avoid missing market gains.',
      takeaway: 'Invest the amount that your present finances can support consistently. A resilient plan is more likely to remain invested long enough to work.',
      related: ['budgeting-without-rigidity', 'automatic-contributions', 'first-investment-framework'],
      sources: [source('Investor.gov: Introduction to Investing', INVESTOR_GOV)]
    }),

    'registered-accounts': guide({
      title: 'Registered Accounts Explained: TFSA, RRSP, FHSA, and RESP',
      titleHtml: 'Registered accounts: TFSA, RRSP, FHSA, and <em>RESP</em>',
      deck: 'Canadian registered accounts apply different tax and withdrawal rules to the investments held inside them. Match the account to the goal.',
      category: 'Canadian Money', level: 'Intermediate', minutes: 10,
      intro: [
        'A registered account is not an investment. It is a rule set around cash, GICs, funds, stocks, bonds, or other eligible holdings.',
        'The main accounts solve different problems: flexible tax-free saving, retirement tax deferral, first-home saving, and education saving.'
      ],
      explanation: [
        'TFSAs use after-tax contributions and generally allow tax-free withdrawals. RRSP contributions may be deductible and withdrawals are generally taxable. FHSAs offer deductible contributions and tax-free qualifying first-home withdrawals. RESPs can attract education grants and have their own payment rules.',
        'Account choice should consider the goal, expected tax rates, access needs, contribution room, grants, and employer programs.'
      ],
      points: ['Account type determines tax rules; holdings determine investment risk.', 'Contribution room is personal and must be verified.', 'Withdrawals can affect future room or tax differently by account.', 'Government grants or employer matching can change priority.'],
      example: ['A first-home saver may use an FHSA for the home goal while keeping emergency money in a TFSA. Retirement contributions can continue separately in an RRSP. One person can use several accounts for different jobs.'],
      actions: ['Define the goal for each account.', 'Verify current room and eligibility.', 'Capture grants or matching you qualify for.', 'Keep records of contributions, withdrawals, and transfers.'],
      caution: 'Overcontributions and non-qualifying withdrawals can create tax consequences. Verify current CRA and program rules rather than relying on old contribution figures.',
      takeaway: 'Choose the account by purpose, then choose suitable investments inside it. The account and the asset allocation are two separate layers of the plan.',
      related: ['tfsa-explained', 'rrsp-explained', 'fhsa-explained'],
      sources: [source('CRA: Tax-Free Savings Account', TFSA_GUIDE), source('CRA: Registered Retirement Savings Plan', RRSP_GUIDE), source('CRA: First Home Savings Account', FHSA_GUIDE)]
    }),

    'automatic-contributions': guide({
      title: 'Setting Up Automatic Contributions',
      titleHtml: 'Automatic contributions that run <em>without willpower</em>',
      deck: 'A reliable transfer schedule turns investing from a monthly decision into part of the household system.',
      category: 'Getting Started', minutes: 5,
      intro: [
        'Automation does not make a plan correct, but it makes a correct plan easier to follow. The best schedule is large enough to matter and small enough to survive normal life.',
        'Automating immediately after income arrives also reduces the chance that every available dollar acquires another purpose first.'
      ],
      explanation: [
        'Automation can happen in two stages: a bank transfer into the account and an automatic purchase of the chosen investment. Confirm both stages, because some platforms transfer cash without investing it.',
        'Irregular earners can use a smaller baseline transfer plus a percentage of larger payments.'
      ],
      points: ['Confirm whether transferred cash is actually invested.', 'Leave enough account balance to avoid failed transfers.', 'Use a schedule aligned with income.', 'Increase the amount intentionally when capacity grows.'],
      example: ['A biweekly $100 transfer begins the day after payday and purchases a diversified fund automatically. A yearly reminder increases it by $10 when the budget allows.'],
      actions: ['Choose an account and suitable investment first.', 'Start below the maximum you think you can afford.', 'Run one cycle and verify the purchase.', 'Create a yearly contribution review.'],
      caution: 'Automation can quietly create an overcontribution if registered-account room is not tracked. It can also keep buying an outdated allocation if the plan is never reviewed.',
      takeaway: 'Automate a deliberate plan, verify that it works, and review it periodically. Consistency should reduce effort, not awareness.',
      related: ['dollar-cost-averaging', 'starting-early', 'how-much-to-invest'],
      sources: [source('Investor.gov: Dollar-Cost Averaging', DCA_GUIDE)]
    }),

    'beginner-investing-mistakes': guide({
      title: 'Common Beginner Investing Mistakes - and How to Avoid Them',
      titleHtml: 'Common beginner mistakes - and how to <em>avoid them</em>',
      deck: 'Most early mistakes come from missing structure: unclear goals, concentrated bets, unexamined fees, and decisions driven by recent performance.',
      category: 'Getting Started', minutes: 8,
      intro: [
        'Beginners do not need perfect knowledge. They need a process that limits the cost of being inexperienced while knowledge grows.',
        'Simple guardrails often matter more than finding an exceptional investment.'
      ],
      explanation: [
        'Common errors include investing emergency money, copying a stranger\'s portfolio, mistaking recent gains for safety, holding overlapping funds, trading too often, and ignoring account rules.',
        'Another error is endless waiting. A clear, diversified, low-cost starting plan can be improved later without demanding mastery on day one.'
      ],
      points: ['Do not invest money with a short required timeline.', 'Know the total cost and what each holding owns.', 'Avoid concentration you cannot explain.', 'Write a response plan for market declines.'],
      example: ['A new investor buys three popular ETFs and believes the portfolio is diversified. All three hold nearly the same large technology companies, so the number of funds disguises the actual concentration.'],
      actions: ['Write the goal and time horizon.', 'Check overlap and top holdings.', 'Automate a sustainable amount.', 'Schedule reviews instead of monitoring constantly.'],
      caution: 'Changing strategies after every disappointing month creates a portfolio made from yesterday\'s winners and today\'s anxiety.',
      takeaway: 'A beginner-friendly plan is clear, diversified, affordable, and repeatable. Complexity can wait until it solves a specific problem.',
      related: ['first-investment-framework', 'investor-behaviour', 'diversification'],
      sources: [source('Investor.gov: Introduction to Investing', INVESTOR_GOV)]
    }),

    'bear-markets': guide({
      title: 'What Actually Happens in a Bear Market',
      titleHtml: 'What actually happens in a <em>bear market</em>',
      deck: 'A bear market is a substantial decline, not a complete description of the economy or a reliable signal about what happens next.',
      category: 'Market Behaviour', level: 'Intermediate', minutes: 10,
      intro: [
        'Large declines compress years of anxiety into a short period. Prices fall, forecasts spread, and choices that looked sensible in calm markets suddenly feel irresponsible.',
        'The useful work happens before the decline: matching risk to the goal, holding liquidity, and deciding how rebalancing will work.'
      ],
      explanation: [
        'Bear markets can begin before a recession, during one, or without one. Markets price expectations, so they may recover while economic news remains poor.',
        'A diversified portfolio can still decline. Bonds or cash may reduce the fall and provide funds for withdrawals or rebalancing, depending on the type of crisis.'
      ],
      points: ['Market declines are measured from a prior high.', 'Recovery dates cannot be known in advance.', 'Losses hurt more when withdrawals are required.', 'A preset rebalance rule can turn volatility into a planned action.'],
      example: ['An investor with three years of planned withdrawals in stable assets does not need to sell stocks immediately after a decline. Another investor with no reserve may face that forced choice.'],
      actions: ['Check whether the goal or only the price has changed.', 'Use the written rebalancing rule.', 'Direct new contributions toward underweight assets.', 'Reduce news and account-checking if it prompts impulsive trades.'],
      caution: 'Holding through every decline is appropriate only when the portfolio was suitable beforehand. Fraud, a failed individual company, or a changed personal goal requires separate analysis.',
      takeaway: 'A bear market tests the design of the plan. Liquidity, diversification, and realistic risk make patience possible when patience is hardest.',
      related: ['time-in-market', 'rebalancing', 'investor-behaviour'],
      sources: [source('Investor.gov: Introduction to Investing', INVESTOR_GOV)]
    }),

    'tfsa-explained': guide({
      title: 'TFSA Explained: How It Works and When to Use It',
      titleHtml: 'TFSA explained: flexible, tax-free <em>growth</em>',
      deck: 'A TFSA is a Canadian registered account. Contributions are not deductible, while eligible investment income and withdrawals are generally tax-free.',
      category: 'Canadian Money', minutes: 7,
      intro: [
        'Despite its name, a Tax-Free Savings Account can hold more than a savings deposit. Depending on the provider, it may hold eligible cash, GICs, funds, stocks, or bonds.',
        'The TFSA is flexible because withdrawals are generally tax-free and the withdrawn amount is added back to contribution room in the following calendar year.'
      ],
      explanation: [
        'TFSA contributions use after-tax dollars and do not reduce taxable income. Eligible income and gains inside the account generally do not create Canadian tax, and withdrawals generally do not count as taxable income.',
        'Contribution room accumulates for eligible residents from age 18 under the rules for each year. Personal room depends on history, not only the current annual limit.'
      ],
      points: ['A TFSA is an account type, not one specific investment.', 'Contributions are not tax-deductible.', 'Withdrawals generally return as room on January 1 of the next year.', 'Replacing a withdrawal too soon can cause an overcontribution.'],
      example: ['If someone withdraws TFSA money in October, that withdrawal does not automatically create replacement room in October. Unless other room is available, the amount can generally be recontributed starting the next calendar year.'],
      actions: ['Confirm room using your own records and CRA information.', 'Match the investments to the goal and timeline.', 'Track contributions across every TFSA provider.', 'Use direct transfers when moving a TFSA between institutions.'],
      caution: 'Overcontributions can be penalized. CRA data can lag recent transactions, so maintain your own records and verify current rules.',
      takeaway: 'A TFSA can support flexible tax-free saving and investing. Its value comes from using contribution room carefully and holding assets suited to the goal.',
      related: ['rrsp-explained', 'tfsa-vs-rrsp', 'registered-accounts'],
      sources: [source('CRA: What is a TFSA?', TFSA_GUIDE), source('CRA: Making or Replacing TFSA Withdrawals', TFSA_WITHDRAWALS)]
    }),

    'rrsp-explained': guide({
      title: 'RRSP Explained: Deferrals, Deductions, and Withdrawals',
      titleHtml: 'RRSP explained: deductions now, taxable withdrawals <em>later</em>',
      deck: 'Eligible RRSP contributions can reduce taxable income. Investments generally grow tax-deferred, while withdrawals are usually taxable.',
      category: 'Canadian Money', minutes: 8,
      intro: [
        'A Registered Retirement Savings Plan shifts the timing of tax. It may provide a deduction when money is contributed and generally includes withdrawals in taxable income later.',
        'That structure can be especially useful when a deduction is taken at a higher marginal rate than the rate paid on a future withdrawal, but the outcome depends on the full household picture.'
      ],
      explanation: [
        'RRSP room is based on prior earned income and adjustments, subject to the rules. Unused room can carry forward. Growth inside the plan is generally not taxed annually.',
        'A withdrawal usually creates taxable income and normally does not restore contribution room. Specific programs, such as current home or education withdrawal provisions, have separate conditions.'
      ],
      points: ['A contribution and a deduction can sometimes occur in different years.', 'Withdrawals are generally taxable income.', 'Withholding at withdrawal may not equal the final tax owed.', 'Employer matching can make an RRSP contribution especially valuable.'],
      example: ['A worker contributes through payroll and receives an employer match. The combined contribution grows inside the RRSP; future withdrawals are included in income under the rules then in force.'],
      actions: ['Verify deduction limit on the latest Notice of Assessment.', 'Understand employer matching before contributing elsewhere.', 'Plan both contributions and eventual withdrawals.', 'Name and review beneficiaries where applicable.'],
      caution: 'Treating the initial tax refund as free money can overstate the benefit. The RRSP is generally tax-deferred, not permanently tax-free.',
      takeaway: 'An RRSP can be a powerful retirement tool when the deduction, employer benefits, investment plan, and future withdrawal tax are considered together.',
      related: ['tfsa-explained', 'tfsa-vs-rrsp', 'taxes-and-compounding'],
      sources: [source('CRA: Registered Retirement Savings Plan', RRSP_GUIDE)]
    }),

    'tfsa-vs-rrsp': guide({
      title: 'TFSA vs. RRSP: Which Should You Use First?',
      titleHtml: 'TFSA vs. RRSP: which should you use <em>first</em>?',
      deck: 'The choice depends on tax rates, employer matching, access needs, benefits, and the purpose of the money. It is often a sequence, not a winner.',
      category: 'Canadian Money', level: 'Intermediate', minutes: 9,
      intro: [
        'Both accounts can shelter investment growth from annual Canadian tax, but they handle contributions and withdrawals differently.',
        'A TFSA uses after-tax contributions and generally tax-free withdrawals. An RRSP may provide a deduction now and generally creates taxable income when withdrawn.'
      ],
      explanation: [
        'An employer RRSP match often deserves early priority because it adds compensation. Beyond that, a TFSA may suit flexibility or a lower current tax rate, while an RRSP may become more attractive at a higher current marginal rate and for retirement savings.',
        'Income-tested benefits and credits can also matter because RRSP withdrawals generally add taxable income while TFSA withdrawals generally do not.'
      ],
      points: ['Capture employer matching before comparing unaided contributions.', 'Compare current and plausible future marginal tax rates.', 'Consider whether withdrawals may happen before retirement.', 'Evaluate effects on income-tested benefits.'],
      example: ['An early-career worker in a lower bracket may value TFSA flexibility, then shift more savings toward an RRSP as income rises. A high-income worker with matching may reasonably prioritize the RRSP now.'],
      actions: ['Write down the goal and expected withdrawal window.', 'Confirm room in both accounts.', 'Estimate the current marginal deduction value.', 'Revisit the sequence after major income changes.'],
      caution: 'Rules of thumb such as always use one account first ignore matching, debt, benefits, pensions, and future income. Personal tax advice may be worthwhile for complex cases.',
      takeaway: 'The TFSA and RRSP solve different tax-timing problems. Use the account whose rules best match the next dollar and the goal it serves.',
      related: ['tfsa-explained', 'rrsp-explained', 'registered-accounts'],
      sources: [source('CRA: Tax-Free Savings Account', TFSA_GUIDE), source('CRA: Registered Retirement Savings Plan', RRSP_GUIDE)]
    }),

    'fhsa-explained': guide({
      title: 'The FHSA: Canada\'s First Home Savings Account Explained',
      titleHtml: 'The FHSA: saving for a first home with <em>two tax advantages</em>',
      deck: 'Eligible FHSA contributions are generally deductible, and qualifying first-home withdrawals can be tax-free.',
      category: 'Canadian Money', minutes: 8,
      intro: [
        'The First Home Savings Account is designed for eligible first-time home buyers. It combines an RRSP-like deduction with TFSA-like treatment for a qualifying home withdrawal.',
        'Opening timing matters because participation room begins under the FHSA rules after the first account is opened, rather than automatically accumulating from adulthood.'
      ],
      explanation: [
        'The first year an FHSA is opened generally provides $8,000 of participation room. The lifetime contribution limit is $40,000 under current rules. Unused room carryforward is limited by the program rules.',
        'A qualifying withdrawal must meet eligibility and documentation requirements. If the home plan changes, property can generally be transferred directly to an RRSP or RRIF under the applicable rules without an immediate tax consequence.'
      ],
      points: ['Confirm first-time home-buyer eligibility before opening.', 'Contribution room starts through participation in the program.', 'Contributions are generally deductible.', 'Qualifying withdrawals can generally be received tax-free.'],
      example: ['An eligible buyer opens an FHSA, contributes over several years, and uses the required form for a qualifying purchase. The account investments should become more conservative as the purchase date approaches.'],
      actions: ['Read the current eligibility test.', 'Open only when the account fits a realistic home plan.', 'Track contributions and deductions.', 'Reduce investment risk as the purchase becomes near term.'],
      caution: 'A tax advantage does not make stocks suitable for a home purchase next year. Account rules and investment risk remain separate decisions.',
      takeaway: 'The FHSA can be unusually tax-efficient for an eligible first-home goal. Use it with careful room tracking and an asset mix matched to the purchase date.',
      related: ['registered-accounts', 'tfsa-vs-rrsp', 'how-much-to-invest'],
      sources: [source('CRA: First Home Savings Account', FHSA_GUIDE)]
    }),

    'cpp-explained': guide({
      title: 'What Is CPP and How Much Will You Actually Get?',
      titleHtml: 'CPP: what it is and how to estimate <em>your benefit</em>',
      deck: 'CPP retirement benefits are based on your contribution history and when you start them. The advertised maximum is not a personal estimate.',
      category: 'Canadian Money', level: 'Intermediate', minutes: 7,
      intro: [
        'The Canada Pension Plan provides a monthly taxable retirement benefit to eligible contributors. It is designed to replace part of employment earnings, not an entire retirement income.',
        'Actual benefits vary because people contribute for different amounts and numbers of years.'
      ],
      explanation: [
        'CPP calculations use pensionable earnings and contributions across a working life, with program adjustments. The start age also changes the monthly amount: starting earlier generally reduces it, while delaying generally increases it within the program limits.',
        'The most useful starting estimate is your official Statement of Contributions and benefit estimate through My Service Canada Account.'
      ],
      points: ['The maximum benefit is not the average or guaranteed amount.', 'Contribution history affects the personal estimate.', 'Start age changes the monthly payment.', 'CPP is taxable and should be integrated with other retirement income.'],
      example: ['Two people retiring in the same year can receive different CPP amounts because one had more years at higher pensionable earnings. A generic maximum cannot replace their individual records.'],
      actions: ['Review your CPP Statement of Contributions.', 'Correct missing or inaccurate contribution records.', 'Model several start ages with life expectancy and cash-flow needs.', 'Coordinate CPP with pensions, savings, and tax planning.'],
      caution: 'Do not base a retirement plan on the current maximum payment unless your official record supports it. Benefit amounts and rules should be checked with Service Canada.',
      takeaway: 'CPP is a personal, contribution-based income stream. Use your official estimate and evaluate timing within the complete retirement plan.',
      related: ['rrsp-explained', 'tfsa-vs-rrsp', 'registered-accounts'],
      sources: [source('Government of Canada: Canada Pension Plan', CPP_GUIDE), source('Service Canada: Statement of Contributions', CPP_STATEMENT)]
    }),

    'disability-investing-canada': guide({
      title: 'Investing with a Disability in Canada: Accounts, Benefits, and Questions to Ask',
      titleHtml: 'Investing with a disability in Canada: accounts, benefits, and <em>questions to ask</em>',
      deck: 'An RDSP may provide grants, bonds, and long-term tax-deferred growth for an eligible beneficiary, while provincial benefit rules require separate checking.',
      category: 'Canadian Money', level: 'Intermediate', minutes: 11,
      intro: [
        'Disability planning crosses federal registered-plan rules, tax credits, provincial or territorial assistance, trusts, and day-to-day liquidity. Advice that treats it as an ordinary investing problem can miss important consequences.',
        'The Registered Disability Savings Plan is designed for long-term savings for a beneficiary approved for the Disability Tax Credit.'
      ],
      explanation: [
        'RDSP contributions are not deductible. Depending on eligibility and family income, government grants or bonds may be available. Investment income, grants, and bonds are generally treated under the RDSP payment rules when money is paid out.',
        'Provincial and territorial disability programs set their own asset and income rules. The treatment of an RDSP, trust, gift, withdrawal, or taxable account must be checked with the specific program.'
      ],
      points: ['Confirm Disability Tax Credit eligibility.', 'Check grant and bond eligibility before deciding the contribution amount.', 'Understand repayment rules tied to some withdrawals.', 'Verify provincial benefit treatment directly with the program.'],
      example: ['A family considers adding money to an RDSP but expects a near-term expense. Before contributing, they compare the long-term purpose and withdrawal rules with a separate accessible emergency fund.'],
      actions: ['Read the federal RDSP guide.', 'Request current provincial benefit rules in writing where possible.', 'Map short-term support needs separately from long-term savings.', 'Consult a disability-planning professional for trusts or large transfers.'],
      caution: 'Do not assume a strategy that protects benefits in one province works in another. Withdrawal, grant repayment, tax, and estate consequences can interact.',
      takeaway: 'Use the RDSP for its intended long-term role, preserve accessible cash for nearer needs, and verify every benefit interaction under the exact program that applies.',
      related: ['registered-accounts', 'how-much-to-invest', 'first-investment-framework'],
      sources: [source('CRA: Registered Disability Savings Plan', RDSP_GUIDE), source('Employment and Social Development Canada: Disability Savings', DISABILITY_SAVINGS)]
    }),

    'investor-behaviour': guide({
      title: 'Why Smart People Make Bad Investment Decisions',
      titleHtml: 'Why smart people make <em>bad investment decisions</em>',
      deck: 'Intelligence does not remove recency bias, loss aversion, overconfidence, or social pressure. A good system anticipates those reactions.',
      category: 'Market Behaviour', minutes: 9,
      intro: [
        'Investing turns uncertain outcomes into visible daily prices. That environment rewards compelling stories and immediate action even when patience would better serve the goal.',
        'Behavioural errors are not character flaws. They are predictable shortcuts that become costly when a portfolio has no guardrails.'
      ],
      explanation: [
        'Recency bias projects the latest trend forward. Loss aversion makes a decline feel more powerful than an equal gain. Confirmation bias collects evidence for an existing position. Overconfidence narrows the range of outcomes a person considers possible.',
        'A written investment policy, automatic contributions, diversification, and scheduled review periods reduce the number of decisions made under pressure.'
      ],
      points: ['A convincing story is not the same as base-rate evidence.', 'Frequent checking increases exposure to emotional noise.', 'Selling can relieve anxiety while damaging the plan.', 'Rules decided in calm periods are easier to trust in volatile ones.'],
      example: ['After a sector rises for two years, an investor increases its weight because it now feels safe. The decision is based on recent comfort even though valuation and concentration risk have increased.'],
      actions: ['Write the reason and expected holding period before buying.', 'Use a 24-hour pause for unplanned trades.', 'Review on a calendar.', 'Ask what evidence would change your mind.'],
      caution: 'A rule should not become stubbornness. New facts about fraud, personal needs, or a misunderstood product can justify a change; ordinary volatility usually is not new information about your goal.',
      takeaway: 'Better behaviour comes from better defaults. Build a system that makes the planned action easier than the emotional one.',
      related: ['bear-markets', 'time-in-market', 'beginner-investing-mistakes'],
      sources: [source('Investor.gov: Introduction to Investing', INVESTOR_GOV)]
    }),

    'asset-allocation': guide({
      title: 'Asset Allocation Explained: The Decision That Shapes the Portfolio',
      titleHtml: 'Asset allocation: the decision that shapes the <em>portfolio</em>',
      deck: 'Asset allocation is the planned split among categories such as stocks, bonds, and cash. It sets much of the portfolio\'s expected behaviour.',
      category: 'Portfolio Thinking', level: 'Intermediate', minutes: 10,
      intro: [
        'Choosing an individual fund feels concrete, but the broader stock-bond-cash mix usually determines whether the portfolio is aggressive, balanced, or conservative.',
        'A suitable allocation connects the goal\'s time horizon with the investor\'s capacity and willingness to tolerate loss.'
      ],
      explanation: [
        'Stocks generally offer more long-term growth potential with larger declines. High-quality bonds can provide income and stability but carry rate, credit, and inflation risks. Cash provides access and nominal stability with limited long-term growth.',
        'Allocation can be implemented with separate funds or a single balanced fund. Either approach needs a rebalancing method.'
      ],
      points: ['Start with goals and withdrawal dates.', 'Separate risk capacity from emotional tolerance.', 'Consider the household balance sheet, not one account alone.', 'Set a rebalancing rule when setting the allocation.'],
      example: ['A 90% stock portfolio may suit long-term growth on paper, but not an investor who will sell after a 25% decline. A slightly more conservative mix that remains invested can be the stronger real-world plan.'],
      actions: ['Group goals by time horizon.', 'Model a severe decline in dollar terms.', 'Choose the simplest mix that meets the need.', 'Document target ranges and review dates.'],
      caution: 'Age-based formulas are rough starting points. Pensions, debt, job risk, dependants, and withdrawal flexibility can materially change capacity.',
      takeaway: 'Asset allocation is where the plan becomes a portfolio. Choose a mix that can fund the goal and survive the investor\'s actual behaviour.',
      related: ['diversification', 'rebalancing', 'what-risk-means'],
      sources: [source('Investor.gov: Asset Allocation, Diversification, and Rebalancing', ASSET_ALLOCATION_GUIDE)]
    }),

    'rebalancing': guide({
      title: 'Rebalancing: Why Your Portfolio Needs a Tune-Up',
      titleHtml: 'Rebalancing: returning the portfolio to its <em>plan</em>',
      deck: 'As assets grow at different rates, the portfolio drifts. Rebalancing restores the intended risk mix rather than chasing the recent winner.',
      category: 'Portfolio Thinking', minutes: 5,
      intro: [
        'A target allocation does not maintain itself. If stocks outperform bonds, their weight rises and the portfolio becomes riskier than originally chosen.',
        'Rebalancing means selling, buying, or directing new cash to bring weights back toward target.'
      ],
      explanation: [
        'Common methods are calendar-based reviews or tolerance bands, such as acting when an asset class moves a set distance from target. The best method is one that is clear, tax-aware, and not triggered by every small move.',
        'New contributions and withdrawals can often rebalance with less selling.'
      ],
      points: ['Rebalancing manages risk; it does not guarantee higher return.', 'Set the rule before drift occurs.', 'Use cash flows where possible.', 'Consider tax and transaction costs in taxable accounts.'],
      example: ['A 60/40 portfolio becomes 68/32 after a stock rally. New contributions can be directed to bonds until the mix returns to its allowed range, avoiding an immediate taxable sale.'],
      actions: ['Write target weights and tolerance ranges.', 'Review on a modest schedule.', 'Look across all accounts as one portfolio.', 'Record why each rebalance occurred.'],
      caution: 'Constant rebalancing can create unnecessary taxes, costs, and attention. A small drift is not automatically a problem.',
      takeaway: 'Rebalancing is disciplined maintenance: trim what has grown beyond plan and refill what has fallen below it, using a rule rather than a forecast.',
      related: ['asset-allocation', 'diversification', 'bear-markets'],
      sources: [source('Investor.gov: Asset Allocation, Diversification, and Rebalancing', ASSET_ALLOCATION_GUIDE)]
    }),

    'bonds-in-portfolio': guide({
      title: 'What Bonds Actually Do in a Portfolio',
      titleHtml: 'What bonds actually do in a <em>portfolio</em>',
      deck: 'Bonds can add income, liquidity, and stability to a portfolio, but their usefulness depends on credit quality, maturity, and the goal they support.',
      category: 'Asset Classes', level: 'Intermediate', minutes: 6,
      intro: [
        'The purpose of bonds is not simply to earn less than stocks. Their role is to create a different return pattern that can make the complete portfolio easier to fund and hold.',
        'High-quality bonds may provide planned cash flow, reduce the depth of some portfolio declines, and create assets available for rebalancing.'
      ],
      explanation: [
        'Shorter, high-quality bonds generally offer more stability, while longer maturities react more strongly to changing interest rates. Lower-quality borrowers may offer more yield but can behave more like equities during stress.',
        'The useful bond allocation follows from the job: a near withdrawal, a volatility buffer, an income need, or diversification from stock risk.'
      ],
      points: ['Quality determines how much credit risk enters the portfolio.', 'Duration shapes sensitivity to rate changes.', 'Yield alone does not describe the role or risk.', 'Bond funds and individual bonds solve cash-flow needs differently.'],
      example: ['A retiree holding upcoming withdrawals in short, high-quality bonds may avoid selling stocks after a market decline. A long-duration or high-yield fund would not provide the same kind of stability.'],
      actions: ['Name the job assigned to bonds.', 'Match duration to the time horizon.', 'Review credit quality and concentration.', 'Rebalance using a written portfolio rule.'],
      caution: 'Bonds are not immune to losses. Reaching for yield can replace the stability you wanted with credit, currency, or duration risk.',
      takeaway: 'Use bonds because they perform a defined portfolio job, not because of an age-based slogan. Quality and maturity should follow that job.',
      related: ['bonds-explained', 'asset-allocation', 'rebalancing'],
      sources: [source('Investor.gov: Introduction to Investing', INVESTOR_GOV)]
    }),

    'inflation-erodes-savings': guide({
      title: 'How Inflation Erodes Your Savings - and What to Do About It',
      titleHtml: 'How inflation erodes savings - and what to <em>do about it</em>',
      deck: 'Inflation reduces what each dollar can buy. A savings plan should protect near-term access while giving long-term money a chance to outgrow rising costs.',
      category: 'Market Behaviour', minutes: 6,
      intro: [
        'A cash balance can rise while its purchasing power falls. The change becomes visible only when rent, food, travel, or another goal costs more than it did before.',
        'The answer is not to eliminate cash. It is to hold cash for the jobs where certainty matters and seek suitable growth for goals further away.'
      ],
      explanation: [
        'Compare the after-tax interest rate with inflation to estimate whether purchasing power is growing. Then separate emergency reserves and short goals from money intended for many years in the future.',
        'Long-term investments can fluctuate and do not beat inflation every year. Their role is to improve the range of long-term outcomes, not guarantee an annual result.'
      ],
      points: ['Measure progress in purchasing power, not dollars alone.', 'Shop savings rates without sacrificing access or protection.', 'Match investment risk to the date of the goal.', 'Increase future goal estimates as prices change.'],
      example: ['A $20,000 car target may need to become $22,000 if the purchase is several years away. Updating the target is as important as choosing where the savings sit.'],
      actions: ['Label each cash balance by purpose.', 'Use competitive insured savings for near-term money.', 'Update long-range goal costs annually.', 'Invest only the portion whose horizon can absorb volatility.'],
      caution: 'Moving short-term savings into volatile assets can exchange a gradual inflation risk for an immediate loss at the purchase date.',
      takeaway: 'Protect liquidity where you need certainty and pursue growth where you have time. Inflation planning starts by giving each dollar a timeline.',
      related: ['inflation-and-cash', 'how-much-to-invest', 'what-risk-means'],
      sources: [source('Investor.gov: Introduction to Investing', INVESTOR_GOV)]
    }),

    'index-vs-active-funds': guide({
      title: 'Index Funds vs. Actively Managed Funds: The Real Difference',
      titleHtml: 'Index funds vs. actively managed funds: the <em>real difference</em>',
      deck: 'Index funds seek to track a benchmark. Active funds pay a manager to depart from one. The decision rests on exposure, cost, evidence, and fit.',
      category: 'Fundamentals', level: 'Intermediate', minutes: 9,
      intro: [
        'Both fund types pool investor money and can own similar securities. The difference is how the holdings and weights are chosen.',
        'An active manager must add enough value to overcome higher research, trading, and management costs. An index fund accepts the benchmark result minus its own costs and tracking difference.'
      ],
      explanation: [
        'A proper comparison starts with funds in the same category and uses the active fund\'s stated benchmark. Results should be reviewed after fees and across more than one market environment.',
        'Indexing also contains choices: the index provider sets inclusion rules, weighting, and reconstitution. Passive does not mean decision-free.'
      ],
      points: ['Compare like-for-like market exposure.', 'Use returns after all recurring costs.', 'Check whether the benchmark matches the fund holdings.', 'Do not infer repeatable skill from one strong period.'],
      example: ['A global active fund should not be compared with a Canadian large-company index. First align geography and risk, then evaluate whether its after-fee result justifies the strategy.'],
      actions: ['Read the mandate and benchmark.', 'Compare fees in dollars and percent.', 'Review long-period risk-adjusted results.', 'Decide what evidence would justify a future change.'],
      caution: 'Switching to whichever style just outperformed can turn a reasonable comparison into performance chasing.',
      takeaway: 'A broad low-cost index is a strong default. Choose active management only when its specific role and evidence justify the extra cost and monitoring.',
      related: ['active-vs-passive', 'index-funds', 'investment-fees'],
      sources: [source('Investor.gov: Understanding Fees', FEE_GUIDE)]
    }),

    'expense-ratios-mers': guide({
      title: 'What Expense Ratios, MERs, and Fund Fees Actually Cost You',
      titleHtml: 'Expense ratios, MERs, and what fund fees <em>actually cost</em>',
      deck: 'A fund expense ratio is deducted inside the fund. Translate the percentage into dollars and long-term opportunity cost before comparing products.',
      category: 'Asset Classes', level: 'Intermediate', minutes: 6,
      intro: [
        'A management expense ratio can be easy to miss because it is not usually billed like a subscription. It is reflected in the fund\'s reported return.',
        'The cost rises with the balance, and every dollar removed is also unavailable for future compounding.'
      ],
      explanation: [
        'Multiply the percentage by the invested balance for a rough first-year dollar estimate. A 0.25% MER is about $25 per $10,000; a 2% MER is about $200 per $10,000, before changes in value.',
        'Also inspect trading expenses, advice charges, account fees, sales charges, spreads, and foreign-exchange costs. The MER is important but may not be the complete cost.'
      ],
      points: ['Fund returns are generally reported after internal expenses.', 'Dollar cost grows as the portfolio grows.', 'Compare products with similar exposure and service.', 'Ask whether advice fees are included or separate.'],
      example: ['Two balanced funds hold similar assets, but one costs 0.30% and the other 1.80%. On $50,000, the rough first-year difference is $750, which also loses future growth.'],
      actions: ['Find the MER in the fund facts.', 'Convert it to annual dollars at your balance.', 'Add account, advice, trading, and FX costs.', 'Document what the higher-cost option provides.'],
      caution: 'Switching can trigger tax, redemption, or transfer costs. Compare the ongoing benefit with the one-time consequences before acting.',
      takeaway: 'Percentages become real dollars. Understand the complete cost, then decide whether the investment and service earn their place.',
      related: ['investment-fees', 'mutual-funds-vs-etfs', 'index-vs-active-funds'],
      sources: [source('Investor.gov: Understanding Fees', FEE_GUIDE)]
    }),

    'market-drops-plan': guide({
      title: 'What to Do When the Market Drops',
      titleHtml: 'What to do when the market <em>drops</em>',
      deck: 'A market decline calls for a checklist, not an improvised prediction. Verify the goal, liquidity, allocation, and rebalancing rule before changing anything.',
      category: 'Getting Started', minutes: 7,
      intro: [
        'When prices fall, taking action can feel safer than waiting. The first task is to determine whether the decline changed your financial plan or only the current market value.',
        'A suitable diversified portfolio should already assume that declines will occur.'
      ],
      explanation: [
        'Review money needed soon, the emergency reserve, and the target allocation. If those remain sound, the plan may call for continued contributions or a rebalance rather than a sale.',
        'If the decline reveals that the portfolio was too aggressive, make a deliberate long-term allocation change instead of repeatedly moving in and out.'
      ],
      points: ['Check the goal before the headlines.', 'Protect near-term withdrawals with suitable assets.', 'Follow preset rebalancing ranges.', 'Separate a personal cash emergency from ordinary market volatility.'],
      example: ['A balanced portfolio falls and stocks move below their target range. The written policy directs new contributions toward stocks; it does not require predicting the bottom.'],
      actions: ['Pause unplanned trades for 24 hours.', 'Confirm emergency and near-term cash.', 'Compare current weights with target ranges.', 'Continue the scheduled plan unless facts have changed.'],
      caution: 'Doing nothing is not universal advice. A concentrated failed company, unsuitable leverage, fraud, or a changed withdrawal date may require action.',
      takeaway: 'Respond to declines with the plan you wrote in calm conditions. Check liquidity and allocation, then act only when a rule or real-life change calls for it.',
      related: ['bear-markets', 'rebalancing', 'time-in-market'],
      sources: [source('Investor.gov: Asset Allocation, Diversification, and Rebalancing', ASSET_ALLOCATION_GUIDE)]
    }),

    'budgeting-without-rigidity': guide({
      title: 'Budgeting for People Who Hate Budgeting',
      titleHtml: 'Budgeting without turning life into a <em>spreadsheet</em>',
      deck: 'A useful budget directs money toward essentials, flexibility, and goals without requiring every purchase to fit a perfect category.',
      category: 'Money Systems', minutes: 7,
      intro: [
        'Traditional budgets often fail because they demand precise forecasts for an unpredictable life. A flexible system starts with a few important commitments and leaves room for everything else.',
        'The purpose is not control for its own sake. It is making sure today\'s spending and tomorrow\'s goals can coexist.'
      ],
      explanation: [
        'Begin with take-home income, fixed essentials, minimum debt payments, and irregular costs converted to monthly amounts. Then automate savings or investing. The remainder becomes a flexible spending pool.',
        'For variable income, build the plan around a conservative baseline and assign percentages to income above it.'
      ],
      points: ['Separate fixed commitments from flexible spending.', 'Create sinking funds for predictable irregular bills.', 'Automate priorities before discretionary spending.', 'Review actual totals without moral labels.'],
      example: ['Instead of forecasting restaurants, clothing, and entertainment separately, a household gives itself one flexible weekly amount after bills, taxes, and savings are covered.'],
      actions: ['Calculate a conservative monthly income baseline.', 'List fixed and annual obligations.', 'Choose one or two automatic goals.', 'Use a weekly flexible-spending number.'],
      caution: 'A simple budget still needs periodic review. Subscription creep, debt interest, and annual expenses can hide when only the chequing balance is monitored.',
      takeaway: 'A budget should reduce decisions, not create more of them. Protect commitments, automate priorities, and let the remaining money be genuinely flexible.',
      related: ['how-much-to-invest', 'automatic-contributions', 'starting-early'],
      sources: []
    })
  };

  const expansionSources = {
    secGameStop: source('U.S. SEC: Staff Report on Equity and Options Market Structure Conditions in Early 2021', SEC_GAMESTOP_REPORT),
    fcacEmergency: source('Financial Consumer Agency of Canada: Setting Up an Emergency Fund', FCAC_EMERGENCY_FUND),
    fcacBudget: source('Financial Consumer Agency of Canada: Making a Budget', FCAC_BUDGET_GUIDE),
    fcacGoals: source('Financial Consumer Agency of Canada: Setting Savings and Investment Goals', FCAC_GOAL_GUIDE),
    bankInflation: source('Bank of Canada: Inflation Calculator', BANK_OF_CANADA_INFLATION),
    statcanCpi2022: source('Statistics Canada: Consumer Price Index Annual Review, 2022', STATCAN_CPI_2022),
    spivaCanada2025: source('S&P Dow Jones Indices: SPIVA Canada Year-End 2025', SPIVA_CANADA_2025),
    craRegisteredLimits: source('Canada Revenue Agency: Registered Plan and TFSA Limits', CRA_REGISTERED_LIMITS),
    cppWhen: source('Government of Canada: When to Start Your CPP Retirement Pension', CPP_WHEN_TO_START)
  };

  const expansions = window.AccessibleFinanceGuideExpansions || {};
  Object.entries(expansions).forEach(([id, expansion]) => {
    if (!guides[id]) return;
    const { sourceKeys = [], ...content } = expansion;
    Object.assign(guides[id], content);
    const combinedSources = [
      ...guides[id].sources,
      ...sourceKeys.map((key) => expansionSources[key]).filter(Boolean)
    ];
    guides[id].sources = combinedSources.filter((entry, index, entries) =>
      entries.findIndex((candidate) => candidate.url === entry.url) === index
    );
  });

  const depthRecords = window.AccessibleFinanceGuideDepth || {};
  Object.entries(depthRecords).forEach(([id, depthRecord]) => {
    if (!guides[id]) return;
    Object.assign(guides[id], depthRecord);
  });

  const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const renderParagraphs = (paragraphs) => paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join('');
  const renderList = (items) => `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;
  const renderCaseFacts = (facts) => facts && facts.length
    ? `<dl class="case-facts">${facts.map((fact) => `<div class="case-fact"><dt>${escapeHtml(fact.label)}</dt><dd>${escapeHtml(fact.value)}</dd></div>`).join('')}</dl>`
    : '';
  const renderCaseStudy = (caseStudy) => `
    <div class="case-study">
      <div class="case-study-label">${escapeHtml(caseStudy.label || 'Worked example')}</div>
      ${renderParagraphs(caseStudy.paragraphs)}
      ${renderCaseFacts(caseStudy.facts)}
    </div>`;
  const decisionNotes = [
    'Add the amount, deadline, and evidence behind this step. A dated note makes the decision reviewable instead of relying on memory after the outcome is known.',
    'Turn the idea into a measurable rule. State what you will do, how often you will do it, and which result would require a deliberate review.',
    'Check how this step interacts with cash reserves, debt, taxes, fees, and the rest of the portfolio. A choice can look sensible alone and still weaken the wider plan.',
    'Set a review trigger before acting. Use a meaningful change in the goal, household, or evidence rather than a price headline as the reason to revisit it.'
  ];
  const renderDecisionPlan = (item) => `
    ${renderParagraphs(item.context)}
    <h3>Your four-part worksheet</h3>
    <ol class="decision-steps">
      ${item.actions.slice(0, 4).map((action, index) => `
        <li class="decision-step">
          <span class="decision-step-number" aria-hidden="true">${index + 1}</span>
          <div class="decision-step-copy">
            <strong>${action}</strong>
            <p>${decisionNotes[index]}</p>
          </div>
        </li>`).join('')}
    </ol>
    <div class="planning-close">
      <p><strong>Keep the finished worksheet short.</strong> One page is enough. Review it annually and after a material change to income, family needs, tax circumstances, or the goal date. That rhythm keeps the plan current without turning every market move into a new decision.</p>
      <p>Before acting, read the page as though it belonged to someone else. Check whether assumptions are stated in current dollars, whether fees, taxes, and inflation are included, and whether a lower-return or early-loss scenario still leaves workable choices. Record the source and date for any rate, limit, or rule, then decide what happens automatically and what requires a fresh discussion. The final page should explain the choice clearly to another household member. Complexity should earn its place by solving a named problem; otherwise, remove it.</p>
      <p>Store the page where you can find it during a stressful week. At the next review, compare actual contributions, costs, and behaviour with the assumptions before changing the strategy. That feedback loop improves the plan without rewarding constant tinkering.</p>
    </div>`;
  const renderQuestions = (questions) => `
    <div class="faq-list">
      ${questions.map(([question, answer]) => `
        <div class="faq-item">
          <h3>${escapeHtml(question)}</h3>
          <p>${escapeHtml(answer)}</p>
        </div>`).join('')}
    </div>`;
  const countWords = (item) => {
    const content = [
      item.intro, item.explanation, item.points, item.deepDive, item.example,
      item.caseStudy && item.caseStudy.paragraphs,
      item.caseStudy && item.caseStudy.facts && item.caseStudy.facts.map((fact) => `${fact.label} ${fact.value}`),
      item.context, item.actions, decisionNotes.slice(0, Math.min(item.actions.length, 4)),
      item.questions && item.questions.flat(), item.caution, item.takeaway
    ].flat(Infinity).filter(Boolean).join(' ');
    const plainText = content.replace(/<[^>]*>/g, ' ').replace(/&[a-z0-9#]+;/gi, ' ');
    return (plainText.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g) || []).length + 161;
  };

  function setMeta(selector, attribute, value) {
    const element = document.querySelector(selector);
    if (element) element.setAttribute(attribute, value);
  }

  function renderNotFound(requestedId) {
    const articleHead = document.querySelector('.article-head');
    const articleWrap = document.querySelector('.article-wrap');
    const related = document.querySelector('.related');
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex';
    document.head.appendChild(robots);
    document.title = 'Guide Not Found - Accessible Finance';

    articleHead.innerHTML = `
      <div class="crumb"><a href="articles.html">Guides</a><span class="sep">&rsaquo;</span>Not found</div>
      <span class="cat-tag">Guide Library</span>
      <h1>We could not find that <em>guide</em>.</h1>
      <p class="deck">The guide link may have changed, or the address may contain a typo.</p>
      <div class="article-meta"><span>Requested: ${escapeHtml(requestedId)}</span></div>`;
    articleWrap.innerHTML = `
      <article class="article-body">
        <h2>Return to the library</h2>
        <p>Browse the complete guide collection to choose a topic and continue learning.</p>
        <div class="callout bottom"><div class="callout-label">Next step</div><p><a href="articles.html"><strong>View all guides &rarr;</strong></a></p></div>
      </article>`;
    related.hidden = true;
  }

  function renderGuide(id, item) {
    const category = escapeHtml(item.category);
    const title = escapeHtml(item.title);
    const canonical = `https://accessible-finance.com/article.html?id=${encodeURIComponent(id)}`;
    const wordCount = countWords(item);
    const readingMinutes = Math.max(5, Math.ceil(wordCount / 180));

    document.title = `${item.title} - Accessible Finance`;
    setMeta('meta[name="description"]', 'content', item.deck);
    setMeta('meta[property="og:title"]', 'content', item.title);
    setMeta('meta[property="og:description"]', 'content', item.deck);
    setMeta('link[rel="canonical"]', 'href', canonical);

    const articleHead = document.querySelector('.article-head');
    articleHead.innerHTML = `
      <div class="crumb"><a href="articles.html">Guides</a><span class="sep">&rsaquo;</span>${category}</div>
      <span class="cat-tag">${category}</span>
      <h1>${item.titleHtml}</h1>
      <p class="deck">${escapeHtml(item.deck)}</p>
      <div class="article-meta">
        <span>${readingMinutes} min read</span><span class="dot"></span>
        <span>${escapeHtml(item.level)}</span><span class="dot"></span>
        <span>Updated ${escapeHtml(item.updated)}</span>
      </div>`;

    const sections = [
      { id: 'why-it-matters', title: 'Why it matters', body: renderParagraphs(item.intro) },
      {
        id: 'how-it-works', title: item.explanationTitle,
        body: `${renderParagraphs(item.explanation)}<h3>${escapeHtml(item.pointsTitle)}</h3>${renderList(item.points)}`
      }
    ];

    if (item.deepDive && item.deepDive.length) {
      sections.push({
        id: 'deeper-look', title: item.deepDiveTitle || 'A deeper look',
        body: renderParagraphs(item.deepDive)
      });
    }

    sections.push({ id: 'practical-example', title: item.exampleTitle, body: renderParagraphs(item.example) });

    if (item.caseStudy) {
      sections.push({
        id: 'real-world-case', title: item.caseStudy.title || 'A real-world case',
        body: renderCaseStudy(item.caseStudy)
      });
    }

    if (item.context && item.context.length) {
      sections.push({
        id: 'build-your-plan', title: 'Build it into your plan',
        body: renderDecisionPlan(item)
      });
    }

    if (item.questions && item.questions.length) {
      sections.push({
        id: 'common-questions', title: 'Questions people ask',
        body: renderQuestions(item.questions)
      });
    }

    sections.push(
      { id: 'put-it-into-practice', title: 'Put it into practice', body: renderList(item.actions) },
      {
        id: 'what-to-watch-for', title: 'What to watch for',
        body: `<div class="callout"><div class="callout-label">Important</div><p>${item.caution}</p></div>`
      },
      {
        id: 'key-takeaway', title: 'Key takeaway',
        body: `<div class="callout bottom"><div class="callout-label">Bottom line</div><p>${item.takeaway}</p></div>`
      }
    );

    if (item.sources.length) {
      sections.push({
        id: 'sources', title: 'Sources and further reading',
        body: `<ul class="source-list">${item.sources.map((entry) => `<li><a href="${escapeHtml(entry.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(entry.label)}</a></li>`).join('')}</ul>`
      });
    }

    document.querySelector('.toc-list').innerHTML = sections
      .map((section) => `<li><a href="#${section.id}">${escapeHtml(section.title)}</a></li>`)
      .join('');
    document.querySelector('.article-body').innerHTML = sections
      .map((section) => `<section><h2 id="${section.id}">${escapeHtml(section.title)}</h2>${section.body}</section>`)
      .join('');

    const relatedIds = (item.related || []).filter((relatedId) => guides[relatedId] && relatedId !== id).slice(0, 3);
    if (relatedIds.length < 3) {
      Object.keys(guides).some((candidateId) => {
        if (candidateId !== id && !relatedIds.includes(candidateId) && guides[candidateId].category === item.category) {
          relatedIds.push(candidateId);
        }
        return relatedIds.length === 3;
      });
    }

    document.querySelector('.related-grid').innerHTML = relatedIds.map((relatedId) => {
      const relatedItem = guides[relatedId];
      return `
        <a href="article.html?id=${encodeURIComponent(relatedId)}" class="related-card reveal">
          <div class="cat">${escapeHtml(relatedItem.category)}</div>
          <h3>${escapeHtml(relatedItem.title)}</h3>
          <div class="meta">${Math.max(5, Math.ceil(countWords(relatedItem) / 180))} min read &middot; ${escapeHtml(relatedItem.level)}</div>
        </a>`;
    }).join('');
  }

  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get('id') || 'investing-vs-speculating';
  const selectedGuide = guides[requestedId];

  if (!selectedGuide) {
    renderNotFound(requestedId);
    return;
  }

  renderGuide(requestedId, selectedGuide);
  window.AccessibleFinanceGuides = Object.freeze({ ...guides });
}());
