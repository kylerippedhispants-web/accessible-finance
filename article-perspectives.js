(function () {
  'use strict';

  const perspective = (title, paragraphs, rows) => ({ perspectiveTitle: title, perspective: paragraphs, decisionRows: rows });

  window.AccessibleFinanceGuidePerspectives = {
    'investing-vs-speculating': perspective('When the line gets blurry', [
      'Productive assets can still be speculative at the wrong price or in the wrong position size. A profitable company purchased after an extreme run-up may require years of unusually strong growth merely to justify the price. Conversely, an unusual asset is not automatically irrational if the buyer understands that its return depends on scarcity, demand, and resale rather than cash flow. The honest description of the return source matters more than the category name.',
      'The distinction also changes over the life of a position. A carefully researched stock can become speculation when new evidence breaks the thesis but the owner keeps it only because selling would confirm a loss. A short-term trade does not become a retirement investment because its price fell. Review the original reason, current evidence, and portfolio role separately from the purchase price. That keeps identity and regret from rewriting the plan.'
    ], [
      ['A diversified retirement contribution', 'Broad ownership, recurring deposits, and a multi-decade goal.', 'Judge progress by savings rate, cost, allocation, and goal funding rather than this month\'s price.'],
      ['A researched individual company', 'Business quality, valuation, concentration, and evidence that could disprove the thesis.', 'Set a position limit and a dated review rule before buying.'],
      ['A trade driven by online excitement', 'Crowd behaviour, entry price, exit liquidity, and the possibility of a total loss.', 'Use only a separate loss budget that cannot affect essential goals.']
    ]),

    'why-investing-exists': perspective('Follow the financial claim', [
      'The same organization can issue several claims with very different outcomes. A company may have secured debt, ordinary bonds, preferred shares, and common shares. Each sits at a different place in the payment order and responds differently when business results improve or deteriorate. Looking only at the issuer name misses the legal and economic claim actually owned.',
      'Secondary-market prices also influence the real economy without sending every trade dollar to the issuer. A liquid market can lower the return investors demand when a company next raises capital, and a falling price can make new financing more expensive. For an individual investor, however, social usefulness and investment merit remain separate. A useful project can issue an overpriced security, and an unfashionable borrower can offer a reasonable contract at the right terms.'
    ], [
      ['A company sells newly issued shares', 'New capital reaches the company and existing owners are diluted.', 'Read why the money is being raised and how many new claims will exist.'],
      ['An ETF is bought on an exchange', 'Ownership changes hands in the secondary market.', 'Look through the fund to the claims, costs, and weighting rules underneath.'],
      ['A government bond is purchased', 'The investor is lending under stated payment and maturity terms.', 'Match credit, currency, and maturity risk to the goal that the bond must fund.']
    ]),

    'how-markets-work': perspective('Execution is part of the return', [
      'A security can be a sensible long-term holding and still be traded poorly. Spreads often widen near market open, around major announcements, or when the underlying market is closed. An ETF that owns overseas securities may trade while some of those holdings are not producing fresh prices, which can make its quoted price less certain. The order screen is therefore not a neutral final step; it is part of implementation.',
      'Order size matters relative to available liquidity. Buying one hundred units of a heavily traded fund may barely affect the quote, while selling the same dollar amount of a thin small-company stock can move through several price levels. Break a large decision into the investment thesis, the urgency of completion, and the cost of waiting. A limit order controls price, but an unrealistic limit can create a different cost by leaving needed cash or exposure unfinished.'
    ], [
      ['A liquid broad-market ETF', 'The bid-ask spread, trading time, and whether the underlying market is open.', 'Use a deliberate order type and avoid turning routine investing into intraday prediction.'],
      ['A lightly traded security', 'Depth beyond the best bid and ask, order size, and price gaps.', 'Reduce size, use price control, and accept that the order may not fill.'],
      ['A sale needed for an upcoming bill', 'Completion matters, but a rushed market order can still receive a poor price.', 'Raise cash before the deadline and use suitable assets for near-term obligations.']
    ]),

    'what-risk-means': perspective('Risk changes with the household', [
      'A portfolio questionnaire sees only part of the balance sheet. Employment, housing, debt, insurance, pension income, and family obligations can amplify or absorb investment losses. A commission-based worker in a cyclical industry may need a larger cash reserve than a dual-income household with stable pensions, even when both answer the emotional questions identically.',
      'The need to take risk deserves its own test. If conservative assumptions already fund the goal, adding more volatility may create no meaningful benefit. If the plan fails unless returns are heroic, taking more risk may hide an unrealistic contribution or spending target. A good risk decision balances willingness, capacity, and necessity, then uses diversification and liquidity to prevent one bad outcome from becoming permanent.'
    ], [
      ['A home purchase in two years', 'The date is close and a market loss could cancel the purchase.', 'Prioritize principal stability and access over maximum expected return.'],
      ['Retirement contributions for twenty-five years', 'The horizon can absorb volatility, but behaviour and job risk still matter.', 'Use a diversified allocation that can survive a severe dollar decline.'],
      ['A large employer-stock position', 'Income and investments depend on the same organization.', 'Set a concentration limit and diversify on a written schedule.']
    ]),

    'risk-and-return': perspective('Average return is not the journey', [
      'Two portfolios can report the same average return and leave investors with different results. Volatility reduces compound growth because a loss requires a larger percentage gain to recover. Cash flows make the order of returns matter even more: contributions buy additional units during declines, while withdrawals sell units that cannot participate in a recovery. A planning model should therefore test paths, not only one smooth line.',
      'Leverage changes this relationship sharply. Borrowing can magnify gains, but interest continues during weak markets and the lender may force a sale before the investment thesis has time to work. A high expected return does not compensate for a structure that cannot survive the path. Before increasing risk, ask which specific uncertainty is being accepted, what compensation is plausible, and whether the household can remain invested if that compensation arrives late.'
    ], [
      ['A saver making monthly deposits', 'Lower prices buy more units and the goal remains far away.', 'Continue the planned schedule while monitoring income and allocation.'],
      ['A new retiree taking withdrawals', 'An early decline can combine with unit sales and shrink recovery capacity.', 'Hold appropriate near-term spending assets and model flexible withdrawals.'],
      ['An investment purchased with debt', 'Interest, collateral calls, and a forced-sale date can overwhelm the thesis.', 'Stress-test a deep loss and avoid leverage that can reach essential assets.']
    ]),

    'time-in-market': perspective('A timing decision has two doors', [
      'Moving to cash feels like one reversible choice, but the return decision rarely arrives with a clear signal. Markets often rise before earnings, employment, or public confidence recover. A timer who waits for certainty may avoid part of a decline yet miss enough recovery days to leave the portfolio behind. The relevant comparison includes taxes, trading costs, cash interest, and the behaviour required to re-enter.',
      'Valuation can still shape long-term expectations without dictating an all-or-nothing move. A diversified investor can use a suitable stock-bond mix, rebalance when weights drift, and direct new contributions toward underweight assets. These actions respond to price without pretending to know tomorrow. If staged investing is used for a lump sum, write every date at the start; otherwise each instalment becomes another opportunity to wait for a feeling of safety that markets do not provide.'
    ], [
      ['Regular money from each paycheque', 'The cash was not available earlier, so the schedule is already natural.', 'Invest according to the goal rather than delaying each deposit for a forecast.'],
      ['A large amount becomes available', 'Immediate exposure has higher regret risk, while delay creates cash drag.', 'Choose lump sum or a short fixed schedule and document the trade-off.'],
      ['A goal date has moved closer', 'This is a real change in capacity, not a view about market direction.', 'Reduce risk according to the updated withdrawal timeline.']
    ]),

    'inflation-and-cash': perspective('One balance can have three jobs', [
      'Cash should be divided by purpose before its return is judged. Transaction cash must be available for current bills. Emergency cash protects against an event whose date is unknown. Goal cash covers a known purchase. Combining all three into one large balance makes it difficult to see what is truly excess and what must remain stable.',
      'Personal inflation can also differ from the published average. A renter, a homeowner renewing a mortgage, and a retiree paying more for health services experience different baskets. Build projections from the expenses that dominate the actual goal, then use an official index as a common reference. The solution is rarely to abandon cash. It is to limit long-term idle cash while making the required cash work efficiently through appropriate savings or short-term products.'
    ], [
      ['Next month\'s expenses', 'Immediate access and no market loss at the payment date.', 'Keep the amount in a transaction or accessible savings account.'],
      ['A down payment expected next year', 'A fixed date leaves little recovery time after a decline.', 'Use stable holdings and compare rates after fees and tax.'],
      ['Retirement spending decades away', 'Purchasing power is the larger threat than short-term price movement.', 'Use a diversified growth plan while keeping separate near-term reserves.']
    ]),

    'compound-interest': perspective('A projection is a range, not a promise', [
      'Compounding calculators create smooth curves because they must use one assumed rate. Real portfolios arrive at the same long-term average through uneven years, and the final value can change when deposits or withdrawals occur during those years. A useful projection shows at least three return cases and separates contributions, investment growth, fees, tax, and inflation.',
      'The model should also expose unrealistic dependencies. If a retirement goal succeeds at 8% but fails badly at 5%, the plan is relying on the market to solve a savings gap. Raising contributions by a manageable amount or extending the date may produce a sturdier result than adding risk. Re-run the model annually with actual balances, but resist changing its long-term assumptions simply because the most recent year was unusually strong or weak.'
    ], [
      ['A small recurring contribution', 'Consistency and future increases matter more than early dollar returns.', 'Automate the amount and schedule an annual contribution increase.'],
      ['A forecast using one high return', 'The apparent precision hides market, fee, and inflation uncertainty.', 'Add conservative and central scenarios before making a commitment.'],
      ['Expensive debt beside investing', 'Debt repayment offers a known interest saving while market returns are uncertain.', 'Compare after-tax outcomes and preserve enough liquidity for emergencies.']
    ]),

    'starting-early': perspective('Early is helpful, not mandatory', [
      'The strongest benefit of an early start is flexibility. More years allow smaller contributions, more opportunities to increase them, and more time to recover from mistakes or weak markets. That does not make a late start hopeless. A later saver can still improve the result through higher contributions, a carefully chosen retirement date, lower fees, and a realistic spending target.',
      'Life stages also compete for the same cash. Building an emergency reserve, eliminating high-cost debt, securing essential insurance, and receiving an employer match can be more urgent than maximizing an investment account. The right early habit is not investing at any cost; it is creating a repeatable surplus and assigning it deliberately. Once the foundation is stable, automatic increases can turn a modest start into a meaningful long-term rate.'
    ], [
      ['A first job with unstable expenses', 'The habit matters, but the cash buffer is still thin.', 'Begin modestly, capture matching, and build emergency savings in parallel.'],
      ['A mid-career saver starting late', 'Time is shorter, so contribution rate and goal design carry more weight.', 'Model the gap and increase savings before increasing investment risk.'],
      ['A raise or debt payoff', 'New cash flow can disappear into lifestyle before it reaches the goal.', 'Redirect part of it automatically before the first larger month.']
    ]),

    'dollar-cost-averaging': perspective('Automation and delay are different choices', [
      'Regular investing from income is often called dollar-cost averaging, but the money is invested as soon as it becomes available. Spreading an existing lump sum is different because part of the money deliberately remains in cash. The first choice builds a routine; the second exchanges some expected market exposure for emotional comfort and lower immediate regret.',
      'Transaction costs and product mechanics can change the best frequency. Tiny weekly ETF orders may create avoidable spreads or leave fractional cash, while a no-fee automated fund can handle exact amounts. Focus on total invested each year and whether the schedule actually runs. A theoretically elegant frequency is not useful if overdrafts, manual steps, or headline-driven pauses repeatedly interrupt it.'
    ], [
      ['Money arrives with each paycheque', 'There is no earlier lump sum waiting to be invested.', 'Schedule the purchase after payday and keep a cash-flow buffer.'],
      ['A windfall is already in cash', 'Staging reduces immediate regret but may miss a rising market.', 'Use a short schedule with fixed dates and a firm completion point.'],
      ['A downturn begins mid-plan', 'Changing the schedule would turn the method into market timing.', 'Continue unless the goal, cash need, or investment suitability changed.']
    ]),

    'dividend-reinvestment': perspective('Income is not separate from value', [
      'A dividend moves cash from the company to its owners; it does not create wealth by itself. The business has less cash after payment, and the market price adjusts for the distribution among many other factors. Investors should compare total return and the company\'s opportunities for retaining profits, repurchasing shares, reducing debt, or paying dividends.',
      'Reinvestment is most efficient when it supports the target allocation. Automatically buying more of an overweight stock can deepen concentration, while collecting cash from several holdings can help rebalance without sales. In a taxable account, the distribution may create tax even when no cash is taken for spending. Keep cost records and choose between reinvestment, rebalancing, and withdrawal according to the portfolio\'s current job.'
    ], [
      ['A diversified fund in accumulation', 'The payment is small and the target allocation is unchanged.', 'Automatic reinvestment can keep cash working with little effort.'],
      ['A concentrated high-yield stock', 'Yield may hide business stress and reinvestment increases one-company risk.', 'Review financial strength and direct cash elsewhere when concentration is high.'],
      ['A retiree funding expenses', 'Cash flow is useful, but spending should follow a total-return plan.', 'Combine distributions with planned sales instead of chasing yield alone.']
    ]),

    'rule-of-72': perspective('Use the shortcut to ask better questions', [
      'A doubling estimate is meaningful only after the rate is labelled. A nominal investment return, an after-fee return, and a real return after inflation describe different outcomes. At 6% nominal growth with 2% inflation, the account balance and its purchasing power double on very different schedules. The shortcut makes that distinction visible even before a detailed model is built.',
      'The rule is also useful outside investing. It can approximate how quickly a price level rises under steady inflation or how rapidly unpaid debt grows at a high rate. It is less useful when returns change sharply, payments are added, or the rate is very high. Treat the answer as a reasonableness check, then use an amortization or compound-growth calculator when a real commitment depends on the result.'
    ], [
      ['A long-term return assumption', 'Determine whether the rate is before fees, tax, and inflation.', 'Estimate the doubling time, then test the goal with a full calculator.'],
      ['A recurring investment fee', 'A small annual difference changes the net rate every year.', 'Compare doubling times at both net rates to make the drag tangible.'],
      ['High-interest debt', 'The balance may grow quickly when required payments are missed.', 'Use the shortcut for urgency, then build an exact repayment schedule.']
    ]),

    'investment-fees': perspective('Price the service and the product separately', [
      'An all-in percentage can combine several things: investment management, financial planning, tax coordination, trading, custody, and access to an adviser. Compare the investment exposure with a similar lower-cost option, then evaluate the remaining service on its own. This avoids assuming every expensive portfolio includes comprehensive advice or that every low-cost portfolio solves planning needs.',
      'Switching deserves its own calculation. A cheaper fund can save money for decades, but realizing a large taxable gain, paying a deferred sales charge, or sitting out of the market during a transfer can create immediate costs. List one-time consequences beside the annual saving and estimate the break-even period. The decision is strongest when the replacement preserves the intended exposure and the ongoing saving clearly outweighs the transition.'
    ], [
      ['Two funds with similar holdings', 'Recurring expense, tracking, spread, and service differences.', 'Convert every cost to dollars at the current and expected balance.'],
      ['An adviser-managed account', 'Separate portfolio cost from planning and behavioural support.', 'List deliverables, frequency, conflicts, and how value will be reviewed.'],
      ['A transfer to a cheaper provider', 'Tax, exit charges, transfer time, and feature differences.', 'Calculate the one-time cost and the years required to recover it.']
    ]),

    'taxes-and-compounding': perspective('Tax efficiency starts after suitability', [
      'Tax planning works best when the household portfolio is viewed as one system. A holding that is inefficient in one account may be reasonable in another, but asset location should not distort the intended level of risk. Moving every bond to one spouse\'s account or every stock to another can create unequal liquidity, beneficiary, or withdrawal consequences even when the spreadsheet shows a tax benefit.',
      'Benefits and income-tested credits can also change the effective cost of a withdrawal. A dollar of taxable retirement income may affect more than the stated bracket, while a TFSA withdrawal generally behaves differently. These interactions are personal and rules change, so projections should label assumptions and dates. Use educational comparisons to identify questions, then verify material decisions with current CRA guidance or qualified advice.'
    ], [
      ['Choosing between account types', 'Current deduction, future withdrawal tax, flexibility, and benefit interactions.', 'Model the same before-tax dollar under more than one future tax rate.'],
      ['Locating assets across accounts', 'Tax treatment matters, but so do risk, access, and estate details.', 'Optimize the household portfolio without breaking the target allocation.'],
      ['Selling a taxable holding', 'Capital gain, loss rules, transaction cost, and replacement exposure.', 'Estimate the after-tax transition before allowing tax alone to dictate the trade.']
    ]),

    'stocks-explained': perspective('Expectations move before statements do', [
      'A stock price is a negotiation about future cash flows, not a score for the latest quarter. A company can report record profit and fall because investors expected more, while a company reporting a loss can rise when its path improves faster than feared. Read results against prior expectations, the price already paid, and the assumptions required for future growth.',
      'Per-share results matter as much as company totals. Revenue and profit may grow while each owner\'s claim grows more slowly because new shares were issued for acquisitions, employee compensation, or financing. Buybacks can have the opposite effect when shares are repurchased at sensible prices, but they can destroy value when funded with too much debt or executed at inflated valuations. Follow the business and the ownership claim together.'
    ], [
      ['A mature profitable company', 'Cash generation, debt, competitive durability, and the valuation paid.', 'Use conservative growth assumptions and include dividends in total return.'],
      ['A fast-growing company with losses', 'Funding needs, unit economics, dilution, and the path to sustainable cash flow.', 'Limit position size and define evidence that the business model is maturing.'],
      ['Employer shares received as compensation', 'Income and net worth are exposed to the same company.', 'Create a diversification schedule instead of treating vested shares as untouchable.']
    ]),

    'bonds-explained': perspective('Coupon, yield, and risk tell different stories', [
      'The coupon describes contractual interest based on face value, while current yield and yield to maturity incorporate the market price. A low-coupon bond bought at a discount can offer a different return from its coupon, and a high-coupon bond bought at a premium can offer less. Comparisons should use a consistent yield measure and account for call features, default risk, fees, and tax.',
      'Duration gives a practical sense of interest-rate sensitivity, but it is an estimate rather than a guarantee. Credit spreads can widen at the same time rates move, especially for lower-quality issuers. A bond selected for stability should not quietly take stock-like credit risk to raise income. Match the issuer quality and maturity profile to the purpose of the money, then judge the return offered for accepting those risks.'
    ], [
      ['A short government bond', 'Low default risk and limited time for rate changes to affect price.', 'Use it for nearer liabilities where stability matters more than yield.'],
      ['A long investment-grade bond', 'Greater rate sensitivity and a longer contractual cash-flow stream.', 'Accept the price movement only when the horizon can support it.'],
      ['A high-yield corporate bond', 'Extra income comes with greater default and economic sensitivity.', 'Treat the position as risk capital, diversify issuers, and avoid chasing the headline yield.']
    ]),

    'mutual-funds-vs-etfs': perspective('The wrapper should serve the routine', [
      'Mutual funds and ETFs can hold nearly identical portfolios, so the wrapper alone does not determine return or risk. The differences appear in how investors transact, how advice may be bundled, how distributions are handled, and what the provider supports. Compare one real fund with another rather than comparing an abstract ETF category with an abstract mutual-fund category.',
      'Behaviour can outweigh a small fee gap. Exact-dollar automatic mutual-fund purchases may help an investor remain consistent, while an ETF\'s intraday screen may invite tinkering. Another investor may use a brokerage\'s recurring ETF feature and gain both low cost and automation. Include every operational step in the comparison: funding, purchase, reinvestment, rebalancing, tax records, and eventual withdrawals.'
    ], [
      ['A workplace group plan', 'Available funds, employer contributions, advice, and plan-level fees.', 'Use the best diversified option available and compare outside choices only for unmatched savings.'],
      ['A self-directed recurring plan', 'Automation, fractional units, commissions, spread, and fund expense.', 'Choose the wrapper that invests the intended amount with the fewest failure points.'],
      ['A large one-time trade', 'Intraday liquidity and order execution can matter more than exact-dollar features.', 'Check the spread and underlying market before placing the order.']
    ]),

    'index-funds': perspective('Every index has an opinion', [
      'Index rules decide which securities count, how large each position becomes, and when changes occur. Market-cap weighting gives the largest value to the companies investors already price most highly. Equal weighting, factor weighting, and thematic rules make different bets and usually require more turnover. The word passive describes how the rules are followed, not the absence of design choices.',
      'Concentration can grow quietly inside a broad label. A country index may become dominated by a handful of companies or sectors after a strong run. That may accurately represent the market, but it may not represent the investor\'s desired diversification. Review the top holdings and regional weights at the total-portfolio level, then decide whether other funds are completing a deliberate global allocation or merely adding overlap.'
    ], [
      ['A broad market-cap index', 'Low turnover and wide coverage, with larger companies receiving larger weights.', 'Use it as a core only after checking country and sector concentration.'],
      ['A sector or thematic index', 'Rules create a narrow exposure that can be expensive and cyclical.', 'Treat it as a limited satellite position, not automatic diversification.'],
      ['Two funds tracking the same index', 'Expense, tracking difference, spread, tax, currency, and securities lending.', 'Compare implementation because the market exposure is largely shared.']
    ]),

    'active-vs-passive': perspective('The benchmark must fit the mandate', [
      'Active performance can look impressive when the benchmark is easier, safer, or simply different. A small-company manager compared with a large-company index may appear skilful during a small-cap rally without adding value relative to the market actually owned. Compare holdings, factor exposures, cash, and risk before attributing the gap to security selection.',
      'Taxes and capacity can change the real result. Frequent trading can realize gains in taxable accounts, while a strategy that worked with a small asset base may struggle after attracting billions because its best opportunities cannot absorb the new money. A due-diligence process should examine people, philosophy, portfolio construction, fees, turnover, and whether success itself could weaken the approach.'
    ], [
      ['A broad developed-market allocation', 'Markets are liquid and low-cost index options are readily available.', 'Require strong evidence before accepting higher cost and manager risk.'],
      ['A specialized active mandate', 'The manager claims an edge in research, access, or risk control.', 'Define the relevant benchmark and evidence before investing.'],
      ['An active fund after a weak period', 'Performance may reflect style, bad luck, broken process, or excess cost.', 'Review mandate and holdings instead of selling solely from the ranking.']
    ]),

    'diversification': perspective('Look for shared failure points', [
      'Holdings that look different can depend on the same economic engine. A Canadian bank stock, a bank-focused ETF, and an employer pension invested heavily in domestic equities may all weaken in the same environment. Real diversification begins by identifying common revenue, sector, country, currency, rate, and credit exposures across the entire household.',
      'Home bias deserves explicit treatment. Domestic investments can reduce currency mismatch for local spending and may receive favourable tax treatment, but concentrating in one relatively small market leaves large parts of the global economy unowned. Choose a domestic weight intentionally rather than allowing familiarity to set it. Then establish rebalancing rules so recent winners do not gradually undo the diversification that was designed.'
    ], [
      ['Several funds from different providers', 'Their labels differ, but top holdings and benchmarks may overlap.', 'Compare underlying weights before counting them as separate diversification.'],
      ['A portfolio concentrated at home', 'Local spending and taxes compete with sector and country concentration.', 'Set a deliberate domestic range and add broad international exposure.'],
      ['A stock-heavy portfolio plus stable income', 'Employment or pension income may absorb some risks but add others.', 'Include human capital and guaranteed income in the household risk review.']
    ]),

    'open-brokerage-account': perspective('The platform is part of the system', [
      'A brokerage affects more than trade price. Transfer times, foreign-exchange methods, recurring-purchase support, tax slips, statements, customer service, and security controls all shape the investor\'s experience. A platform that saves a small commission but makes records or withdrawals unreliable may be expensive when the account becomes larger and more complex.',
      'Account permissions should begin narrow. Margin, options, real-time borrowing, and extended-hours trading are tools with additional risks, not default upgrades. Open only the account type and features required by the written plan. Test deposits and withdrawals with small amounts, store account and beneficiary records, and keep a second way to contact the institution if the app or primary device is unavailable.'
    ], [
      ['A first long-term account', 'Regulation, suitable account type, simple funds, automation, and clear fees.', 'Start with cash permissions and a small transfer before scaling up.'],
      ['A transfer from another provider', 'Tax status, in-kind eligibility, exit cost, and time out of market.', 'Obtain written transfer steps and keep copies of statements and cost records.'],
      ['A request to enable margin', 'Borrowing adds interest, collateral rules, and possible forced liquidation.', 'Enable it only for a defined need that has been stress-tested.']
    ]),

    'first-investment-framework': perspective('Sequence the decisions correctly', [
      'A first investment often becomes unnecessarily difficult because product research starts before the goal is defined. Once the amount, date, flexibility, account, and target allocation are known, much of the product universe becomes irrelevant. This is a feature, not a limitation. A good framework removes choices that do not serve the stated job.',
      'Implementation should be proportionate to the balance and experience. A single diversified fund can provide a complete allocation and automatic rebalancing, while several funds may allow more control at the cost of maintenance. Begin with the simplest structure that meets the need, and write the condition that would justify adding complexity later. Portfolio architecture should grow because a new problem appeared, not because investing began to feel too ordinary.'
    ], [
      ['A retirement goal decades away', 'Contribution rate, registered account choice, allocation, and low recurring cost.', 'Automate a diversified portfolio and schedule an annual review.'],
      ['A purchase expected within three years', 'Capital loss at the deadline matters more than long-term expected return.', 'Use savings or suitable short-term holdings instead of a stock portfolio.'],
      ['An urge to add several specialized funds', 'Overlap and maintenance can increase without improving goal coverage.', 'Name the missing exposure or problem before adding another product.']
    ]),

    'how-much-to-invest': perspective('The next dollar has competing jobs', [
      'Investment capacity is determined at the margin. The next available dollar might strengthen an emergency fund, eliminate high-cost debt, capture employer matching, fund a near-term obligation, or enter a long-term portfolio. Comparing these jobs produces a more useful answer than applying one savings percentage to every household.',
      'A target rate should also distinguish gross and net income and account for pension contributions already happening through work. Someone with a strong defined-benefit pension and someone without workplace retirement savings may need different personal investment rates even at the same salary. Build the goal projection from all future income sources, then choose a contribution that is both sufficient and resilient to ordinary setbacks.'
    ], [
      ['Cash flow has no emergency buffer', 'A surprise could force new debt or an investment sale.', 'Direct most new savings to liquidity while preserving any valuable match.'],
      ['High-cost debt remains', 'Repayment offers a known return equal to avoided interest.', 'Compare repayment with uncertain after-tax investing and reduce fragile debt first.'],
      ['Core finances are stable', 'The long-term goal and contribution gap now drive the decision.', 'Automate the required amount and add an escalation rule for future income.']
    ]),

    'registered-accounts': perspective('Room is valuable but not interchangeable', [
      'Registered accounts shelter or defer tax in different ways and attach different conditions to contributions and withdrawals. Contribution room can be more valuable for a high-growth asset held for decades than for cash needed next month, but the account must still suit the goal. Using every available dollar of room is not automatically wise if doing so creates an inaccessible or tax-inefficient withdrawal later.',
      'Account coordination becomes more important as the household grows. Spouses may have different incomes, pensions, room, beneficiaries, and expected retirement withdrawals. Employer plans can consume or create related room through pension rules. Keep one household map showing balances, tax treatment, contribution records, and intended withdrawal jobs, then verify current rules before moving or contributing large amounts.'
    ], [
      ['Saving for an uncertain medium-term goal', 'Withdrawal flexibility may matter more than a current deduction.', 'Compare TFSA and taxable options while protecting emergency access.'],
      ['Saving for retirement at a high current income', 'Deduction value, employer plans, and future withdrawal tax matter.', 'Model RRSP and TFSA contributions as part of one retirement-income plan.'],
      ['Moving a registered account', 'An ordinary withdrawal can have very different consequences from a direct transfer.', 'Use the prescribed institution-to-institution process and retain confirmations.']
    ]),

    'automatic-contributions': perspective('Automation needs an escape hatch', [
      'A useful automation rule is specific enough to run without attention and flexible enough to survive a real emergency. Pair each transfer with a minimum chequing balance, failed-payment alert, and pause condition. Otherwise a system intended to prevent decisions can create overdraft fees or force credit-card borrowing when income timing changes.',
      'Automation should include the investment purchase, not only the account deposit. Many people discover cash sitting uninvested months after setting up a transfer. Confirm the full path from paycheque to holding, including fractional units, settlement, and what happens when markets are closed. Review quarterly for failures and annually for amount, account, allocation, and fees.'
    ], [
      ['Stable salary and regular bills', 'Predictable timing supports a fixed transfer after payday.', 'Keep a chequing buffer and automate the investment purchase as well.'],
      ['Variable or seasonal income', 'A large fixed transfer can fail during lean months.', 'Use a conservative baseline plus a percentage of income above it.'],
      ['A job loss or genuine emergency', 'Liquidity now matters more than maintaining the old schedule.', 'Pause intentionally, document the restart trigger, and protect required expenses.']
    ]),

    'beginner-investing-mistakes': perspective('Build feedback without chasing outcomes', [
      'The market gives noisy feedback. A poor decision can make money and a sound diversified decision can lose money over a short period. Review whether the goal was clear, the risks were understood, the size was suitable, and the action followed the policy. Judging only the return trains investors to repeat lucky mistakes and abandon disciplined plans after ordinary bad luck.',
      'Complexity is another common form of overconfidence. Multiple accounts, overlapping funds, tactical positions, and frequent tax trades create more ways for the process to fail. Consolidate where practical, assign every holding a role, and remove positions whose purpose cannot be explained. A simple portfolio does not indicate a lack of sophistication; it can be the result of careful problem definition.'
    ], [
      ['A recent purchase rises quickly', 'The gain may reflect luck, market beta, or a sound thesis.', 'Review the original evidence before increasing the position.'],
      ['A diversified portfolio has a weak year', 'Short periods cannot reliably judge a long-horizon process.', 'Compare allocation, cost, and behaviour with the written plan.'],
      ['The account has many small holdings', 'Overlap, fees, and maintenance can hide the true exposure.', 'Map each holding to a goal and consolidate those without a distinct job.']
    ]),

    'bear-markets': perspective('Liquidity decides whether patience is possible', [
      'A long horizon helps only when the investor is not forced to sell. Job loss, debt payments, tuition, home repairs, or retirement withdrawals can turn a temporary market decline into a permanent loss. The bear-market plan therefore begins outside the portfolio with emergency cash, insurance, manageable debt, and a schedule for near-term spending.',
      'Market narratives become unusually persuasive during deep declines because the price movement appears to confirm every negative explanation. Replace story comparison with balance-sheet checks: what is needed soon, which holdings are concentrated, how far weights moved, and whether the goal changed. A broad decline does not guarantee recovery for every company, so diversification remains essential even when the overall plan calls for patience.'
    ], [
      ['A long-term saver with stable income', 'The goal and contribution capacity remain intact despite lower prices.', 'Continue scheduled purchases and rebalance only under the preset rule.'],
      ['A household facing job loss', 'Cash needs have changed at the same time the portfolio declined.', 'Protect liquidity first and adjust contributions without making a market forecast.'],
      ['A single stock collapses with the market', 'Company-specific failure can hide inside a broad downturn.', 'Reassess the business thesis rather than assuming every loss is temporary.']
    ]),

    'tfsa-explained': perspective('Tax-free does not mean consequence-free', [
      'A TFSA protects qualifying growth from tax, but losses still consume economic capital and do not create a tax deduction. Using scarce room for a highly speculative position can permanently reduce the value available to compound if that position fails. Match risk to the goal and treat tax-free growth as a reason for disciplined investing, not a reason to take more risk.',
      'Contribution tracking deserves special care because institutions see only their own account activity. Withdrawals generally return as room in a later calendar year, not instantly, and non-resident contributions can create tax. Keep a ledger beside CRA information and confirm transfers are processed directly. When activity resembles a trading business or an investment may be prohibited, seek current professional guidance rather than assuming the account label resolves the issue.'
    ], [
      ['Long-term diversified growth', 'Tax-free compounding and withdrawal flexibility can work together.', 'Use a suitable allocation and preserve records across all TFSA providers.'],
      ['Emergency savings', 'Access and stability matter, but room may have a higher long-term use.', 'Compare available room and hold the emergency amount in an accessible product.'],
      ['A withdrawal followed by recontribution', 'Timing rules can create an excess contribution when room is unavailable.', 'Wait for restored room or verify existing unused room before contributing again.']
    ]),

    'rrsp-explained': perspective('The deduction and withdrawal belong together', [
      'An RRSP decision spans two tax periods. The contribution may reduce taxable income today, while a future withdrawal generally adds taxable income later. Looking only at the refund ignores half of the arrangement. Compare the current marginal benefit with a range of retirement tax rates, then include the years of sheltered growth and whether the refund will be saved, invested, used for debt, or spent.',
      'Withdrawal sequencing can be as important as contribution choice. Large RRSP or RRIF balances, pensions, CPP, OAS, and taxable income may converge later in life. A retirement projection can test whether planned withdrawals should begin before other income, be spread more evenly, or remain deferred. The result depends on current rules, longevity, estate goals, and benefit interactions, so use the model to frame questions rather than to manufacture one perfect age.'
    ], [
      ['A high-income contribution year', 'The current deduction may be valuable, but future withdrawal tax still matters.', 'Invest the refund deliberately and model retirement income from all sources.'],
      ['A temporarily low-income year', 'Claiming the deduction now may provide less value than carrying it forward.', 'Verify current rules and compare the benefit of claiming in a later year.'],
      ['An early retirement before pensions begin', 'Lower-income years may create a withdrawal-planning opportunity.', 'Model staged withdrawals with tax and benefit effects before acting.']
    ]),

    'tfsa-vs-rrsp': perspective('Compare the same before-tax dollar', [
      'A fair comparison must account for the RRSP deduction. Putting $1,000 into each account does not use the same amount of before-tax income if the RRSP contribution generates a tax saving. The comparison should either gross up the RRSP contribution or invest the refund. Otherwise the TFSA appears stronger partly because more after-tax cash was committed to it.',
      'Tax rates are not the only difference. TFSA withdrawals generally preserve flexibility and do not add taxable income, while RRSP withdrawals generally do. The RRSP can be particularly compelling with employer matching; the TFSA can be valuable for uncertain spending or future years when taxable income should remain controlled. Use both accounts as complementary retirement-income tools rather than treating the choice as a permanent identity.'
    ], [
      ['Income is low today and likely higher later', 'The current RRSP deduction may be modest while TFSA flexibility is valuable.', 'Consider TFSA first while preserving RRSP room for a higher-income period.'],
      ['An employer matches plan contributions', 'The match can outweigh ordinary account-order preferences.', 'Capture the full useful match before comparing unmatched savings options.'],
      ['Retirement withdrawals need flexibility', 'Taxable income and income-tested benefits can vary by year.', 'Build both taxable and tax-free sources rather than relying on one account.']
    ]),

    'fhsa-explained': perspective('The home date sets the investment risk', [
      'The FHSA\'s tax features can make it attractive, but the down-payment timeline should determine the holdings. A buyer actively shopping next year cannot rely on a stock-market recovery, while someone with a flexible plan many years away may accept more growth risk. Reduce risk as the search becomes real, not only when an offer is signed.',
      'The account should also fit the wider home budget. A larger down payment does not repair an unaffordable mortgage, weak emergency reserve, or missing closing costs. Build a purchase model that includes legal fees, moving, repairs, property tax, insurance, and a post-closing cash buffer. If the purchase does not happen, understand the current transfer and closure rules early enough to preserve options rather than allowing a tax deadline to drive a housing decision.'
    ], [
      ['Buying within about two years', 'Capital stability and access matter more than maximum growth.', 'Use suitable savings or short-term holdings and track closing costs separately.'],
      ['A flexible purchase many years away', 'Some growth exposure may be reasonable, but the date can move suddenly.', 'Set a glide path that reduces risk as the plan becomes concrete.'],
      ['The home plan is abandoned', 'Transfer, withdrawal, and closure paths have different tax effects.', 'Review current CRA rules before the account approaches a deadline.']
    ]),

    'cpp-explained': perspective('Timing is a form of longevity insurance', [
      'Delaying CPP exchanges early payments for a larger lifelong monthly amount under current rules. That can be valuable protection against living longer than expected, especially when the household lacks other inflation-adjusted guaranteed income. Starting earlier can still be reasonable when cash is needed, health is poor, or using savings to bridge the delay would create unacceptable risk.',
      'The household decision should include both partners. Different ages, contribution histories, survivor needs, pensions, and tax positions can support different start dates. Compare cumulative payments under several lifespans, but also compare the quality of income: a larger indexed payment later is not identical to an investment balance that can fluctuate, be spent, or form part of an estate. Verify the current Service Canada estimate rather than planning from the maximum headline benefit.'
    ], [
      ['Strong savings and concern about longevity', 'The household can fund the bridge and values larger lifelong income.', 'Compare delayed CPP with the drawdown required from savings.'],
      ['Immediate income need or poor health', 'Earlier cash flow may have greater practical value than a later increase.', 'Model after-tax income and survivor implications before applying.'],
      ['Two partners with different pensions', 'Coordinated start dates can diversify income timing and tax.', 'Evaluate each person separately and then test the household result.']
    ]),

    'disability-investing-canada': perspective('Government incentives are only one layer', [
      'An RDSP can attract valuable grants or bonds, but the beneficiary may also need accessible cash, equipment, housing support, insurance, and help navigating public benefits. Money locked into a long-term structure should not leave immediate needs exposed. Separate the emergency and near-term plan from the long-horizon RDSP allocation before deciding how much family money to contribute.',
      'Estate and decision-support arrangements deserve early attention. A parent may intend to leave money for a beneficiary, but a direct inheritance, trust, insurance benefit, and RDSP can interact differently with provincial assistance and control of funds. Rules vary and circumstances are personal. Create a coordinated plan with professionals who understand disability benefits, tax, estates, and supported decision-making rather than optimizing one account in isolation.'
    ], [
      ['The beneficiary may qualify for grants or bonds', 'Eligibility, age, income, and carry-forward rules affect available support.', 'Confirm current entitlements before setting the personal contribution.'],
      ['Near-term accessibility costs are high', 'Long-term incentives do not replace money needed soon.', 'Fund immediate needs and emergency liquidity outside the RDSP.'],
      ['Family members are planning an inheritance', 'Benefits, trusts, tax, and decision authority may interact.', 'Coordinate the estate plan with qualified disability-planning advice.']
    ]),

    'investor-behaviour': perspective('Design the environment before testing willpower', [
      'Behavioural mistakes become more likely when decisions are frequent, feedback is noisy, and action is easy. A brokerage app with constant alerts can turn a twenty-year plan into hundreds of emotional moments. Remove nonessential notifications, separate speculative money, and require a written note before any unscheduled trade. The goal is not perfect discipline; it is fewer opportunities for discipline to fail.',
      'Social comparison creates a second source of risk. Other people report visible wins and hide position size, losses, debt, and timing. Their result may have no relationship to your goal or capacity. Measure progress against funded goals, contribution rate, cost, and policy adherence. A personal benchmark does not eliminate envy, but it gives the emotion somewhere useful to return.'
    ], [
      ['Markets are rising quickly', 'FOMO makes recent return feel like evidence about future return.', 'Use a cooling-off period and compare the idea with the target allocation.'],
      ['A position has fallen below purchase price', 'Anchoring makes the old price feel like a required destination.', 'Reassess from current evidence and ignore the need to break even.'],
      ['Friends share large gains', 'The missing context includes losses, leverage, and goal differences.', 'Return to the household benchmark and avoid copying an unknown risk budget.']
    ]),

    'asset-allocation': perspective('Build from liabilities backward', [
      'Asset allocation is often described as a personality choice, but future spending obligations provide a firmer starting point. Map which dollars may be needed in the next few years, which dates are flexible, and which expenses are covered by stable income. Assets can then be assigned to near-term spending, portfolio stability, and long-term growth rather than chosen from one broad risk label.',
      'The household allocation should include accounts that are easy to overlook. Workplace pensions, locked-in plans, education accounts, employer stock, and a partner\'s holdings all affect the total exposure. A 60/40 brokerage account is not a 60/40 household if the pension is bond-like or another account is entirely equities. Consolidate the view before rebalancing one account in isolation.'
    ], [
      ['A flexible goal decades away', 'Growth shortfall is a larger threat than near-term volatility.', 'Use meaningful equity exposure while preserving behavioural survivability.'],
      ['Withdrawals begin within a few years', 'Sequence risk and known spending require stable assets.', 'Create a withdrawal buffer and reduce reliance on stock sales.'],
      ['Several accounts use different funds', 'Account-level percentages can hide the household allocation.', 'Combine every holding into one exposure map before making trades.']
    ]),

    'rebalancing': perspective('Choose the cheapest path back to target', [
      'Rebalancing does not have to begin with a sale. New contributions, distributions, interest, and planned withdrawals can all move the portfolio toward target weights. This cash-flow approach can reduce tax and trading costs, though it may be too slow after a large drift. Rank the available methods before placing trades.',
      'Bands should be wide enough to ignore noise and narrow enough to prevent a meaningful change in risk. A five-percentage-point move has a different importance when the target is 50% than when the target is 5%, so some policies use relative thresholds or both absolute and relative tests. The exact rule is less important than writing it down, applying it across accounts, and checking tax consequences before execution.'
    ], [
      ['A small drift while contributions continue', 'New money may restore the mix without a taxable sale.', 'Direct contributions and distributions toward underweight assets.'],
      ['A large drift in registered accounts', 'Trading has fewer immediate tax concerns but still has spreads and timing.', 'Rebalance to the written range without forecasting the next winner.'],
      ['A large taxable gain would be realized', 'The tax cost may outweigh the benefit of exact precision.', 'Use cash flows, rebalance elsewhere, or return gradually with tax advice.']
    ]),

    'bonds-in-portfolio': perspective('Match the bond risk to its assignment', [
      'A bond allocation can be asked to do several jobs, but one holding may not do all of them well. Long government bonds can provide duration exposure and may rally in some recessions, yet they can fall sharply when rates rise. Corporate bonds offer more yield but can weaken with stocks during credit stress. Short bonds are steadier but provide less yield and less sensitivity when rates fall.',
      'Start with the portfolio problem. If bonds must fund the next three years of withdrawals, maturity and credit quality deserve priority. If they are mainly a long-term diversifier, a broader maturity mix may be reasonable. If the goal is income, avoid treating the highest yield as the best solution; the extra payment can reflect default risk that appears exactly when the rest of the household is under pressure.'
    ], [
      ['Near-term retirement withdrawals', 'Known cash needs call for high quality and controlled maturity risk.', 'Match part of the bond allocation to the spending schedule.'],
      ['A long-term balanced portfolio', 'Diversification, income, and rebalancing capacity all matter.', 'Use broad high-quality exposure and accept that prices can still decline.'],
      ['A search for more yield', 'Credit risk may make the holding behave more like equities.', 'Compare yield after default, fees, and economic sensitivity.']
    ]),

    'inflation-erodes-savings': perspective('Plan for the inflation you actually buy', [
      'A general consumer-price index is a useful benchmark, but household spending changes with age and location. Rent, property tax, child care, tuition, transportation, or health costs may dominate at different times. Build the goal from its major categories and apply more conservative assumptions to costs that have historically been volatile or personally inflexible.',
      'Inflation protection is rarely one asset. Cash provides short-term certainty, nominal bonds provide contractual payments, inflation-linked bonds adjust under defined formulas, and businesses may pass through costs over time. Each can disappoint in a particular inflation shock. A diversified plan combines them according to horizon and spending needs instead of searching for one perfect hedge after prices have already risen.'
    ], [
      ['Emergency and operating cash', 'Access is essential even when real return is temporarily negative.', 'Seek competitive interest without exposing required money to market loss.'],
      ['A fixed purchase several years away', 'The specific cost may rise differently from broad inflation.', 'Track the target price directly and adjust savings as it changes.'],
      ['Retirement over several decades', 'Spending and income sources will experience different inflation effects.', 'Model real returns and diversify growth, stable assets, and indexed income.']
    ]),

    'index-vs-active-funds': perspective('Make the comparison investable', [
      'A benchmark return is not always available to an investor at zero cost or tax. Use the return of a low-cost investable index fund as a practical alternative when comparing an active fund. Then include advice fees, loads, trading, tax distributions, and any currency differences. This shows the real choice the investor can make rather than a theoretical index line.',
      'Portfolio overlap can erase the intended distinction. An active fund may hold many of the same large companies as its benchmark while charging more and making only small weight changes. Measure active share or inspect the major differences, then ask whether those differences are large enough to justify the cost and risk. A concentrated active fund is more distinct, but it also creates a wider range of outcomes that position size should reflect.'
    ], [
      ['An active fund closely resembles its index', 'Small holding differences may not overcome the recurring cost gap.', 'Compare after-fee tracking and consider a lower-cost implementation.'],
      ['A concentrated active strategy', 'The manager has more opportunity to differ and more room to be wrong.', 'Use a limited role and a benchmark that matches the investable universe.'],
      ['A passive fund with poor tracking', 'Low advertised cost may hide implementation or tax drag.', 'Review actual tracking difference, spread, structure, and fund operations.']
    ]),

    'expense-ratios-mers': perspective('A percentage needs a dollar translation', [
      'Recurring fees scale automatically as the portfolio grows. A cost that feels negligible on a first $5,000 can become a major annual expense after decades of contributions, even when the percentage never changes. Show the cost at today\'s balance, a mid-plan balance, and the target balance. Then model the growth that leaves the portfolio along with the fee itself.',
      'Fee comparisons should preserve exposure and service. A balanced advice fund cannot be compared fairly with an equity-only ETF without accounting for risk and planning support. Break the decision into three layers: what the investments cost, what the account or platform costs, and what advice or service costs. That structure reveals whether a higher fee is paying for something the investor actually uses.'
    ], [
      ['A small portfolio with a flat account fee', 'The fixed charge can be a large percentage of the current balance.', 'Calculate the effective annual percentage before opening the account.'],
      ['A growing portfolio with percentage advice fees', 'Dollar cost rises even when service needs remain unchanged.', 'Review deliverables and alternatives at each major balance milestone.'],
      ['A lower-cost replacement fund', 'Exposure, tax, spread, and transfer cost may differ.', 'Calculate break-even time and confirm the replacement serves the same role.']
    ]),

    'market-drops-plan': perspective('Separate a market event from a money event', [
      'A falling market becomes a personal emergency only when it collides with cash needs, leverage, concentration, or a changed goal. Start with the household calendar: bills, job risk, debt, tuition, home plans, and withdrawals. Then inspect the portfolio. This order prevents a red account balance from becoming the only fact considered.',
      'Communication matters when more than one person depends on the plan. Agree in advance who can trade, where the policy is stored, and when an adviser or family meeting is required. During a decline, replace repeated market updates with one scheduled review. A shared process can prevent one frightened person from acting secretly and makes it easier to distinguish a real life change from temporary market stress.'
    ], [
      ['Prices fall but household cash flow is stable', 'The goal, liquidity, and target allocation have not changed.', 'Follow the contribution and rebalancing rules already written.'],
      ['Prices fall during a job loss', 'The cash-flow shock is real even if the portfolio remains suitable long term.', 'Protect expenses, pause contributions if needed, and avoid a forced sale.'],
      ['A leveraged or concentrated holding collapses', 'The loss may create obligations beyond ordinary volatility.', 'Assess collateral and thesis risk immediately rather than applying broad-market patience.']
    ]),

    'budgeting-without-rigidity': perspective('Use the budget to negotiate trade-offs', [
      'A flexible budget still needs boundaries. Decide which commitments are protected, which goals have minimum contributions, and which spending can move without creating debt. The flexible pool then becomes a genuine choice instead of an excuse to ignore totals. When the pool is gone, the decision is whether to borrow from another goal openly, not whether to pretend the purchase did not count.',
      'Review should focus on recurring patterns rather than isolated mistakes. One expensive week may be unusual; three months of the same overage means the plan or expectation is wrong. Adjust the category, reduce another commitment, or change the goal date. A budget becomes sustainable when it reflects actual behaviour and priorities, not when every month is forced to resemble an optimistic first draft.'
    ], [
      ['Income and bills are predictable', 'A fixed automatic structure can cover commitments and goals.', 'Transfer flexible spending weekly and review totals monthly.'],
      ['Income changes from month to month', 'Fixed obligations must survive the conservative baseline.', 'Use percentage rules for stronger months and maintain a larger buffer.'],
      ['The same category repeatedly exceeds plan', 'The estimate, priority, or surrounding habit may be unrealistic.', 'Change the structure deliberately instead of repeating guilt and reset.']
    ])
  };
}());
