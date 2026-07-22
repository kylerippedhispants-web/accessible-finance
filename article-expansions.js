(function () {
  'use strict';

  window.AccessibleFinanceGuideExpansions = {
    'investing-vs-speculating': {
      deepDiveTitle: 'The thesis matters more than the label',
      deepDive: [
        'A useful way to separate the two activities is to write down the source of the expected return. For a bond, it may be scheduled interest and repayment. For a diversified equity fund, it is a share of the earnings produced by many businesses. For a speculative trade, the return often depends mainly on a future buyer accepting a higher price.',
        'That does not mean every long-term investment succeeds or every speculation fails. It means the risk controls should be different. A retirement portfolio can rely on broad ownership, time, and recurring contributions. A concentrated price bet needs a strict loss budget because its outcome may depend on one narrative, one security, and one exit window.'
      ],
      caseStudy: {
        title: 'The 2021 meme-stock episode',
        label: 'Historical market example',
        paragraphs: [
          'In January 2021, GameStop and several other stocks rose dramatically as individual-investor interest spread through social media. The SEC later examined the episode, including short selling, options, order handling, and temporary trading restrictions.',
          'Some buyers had a detailed view of the business, but many trades were explicitly about crowd behaviour and the next price move. The lesson is not that buying one named stock is always speculation. It is that a thesis based on who may buy next requires a very different position size from money assigned to rent, tuition, or retirement.'
        ],
        facts: [
          { label: 'Episode', value: 'Jan. 2021' },
          { label: 'Main catalyst', value: 'Social attention' },
          { label: 'Planning lesson', value: 'Limit the stake' }
        ]
      },
      sourceKeys: ['secGameStop']
    },

    'why-investing-exists': {
      deepDiveTitle: 'Primary markets and secondary markets',
      deepDive: [
        'When a company first sells shares or bonds, the primary market moves capital to the issuer. A later trade between two investors happens in the secondary market; the company does not receive that sale price directly. Secondary markets still matter because the ability to resell an investment makes people more willing to provide capital in the first place.',
        'The return available to each investor depends on the claim being purchased. Lenders receive contractual payments before shareholders receive residual value. Shareholders have more upside if the business prospers, but they also stand behind lenders if the company fails.'
      ],
      caseStudy: {
        title: 'One expansion, two financing choices',
        label: 'Business financing example',
        paragraphs: [
          'Imagine a profitable food producer needs $10 million for a new facility. It could issue bonds and commit to interest plus repayment, or sell new shares and give investors part ownership. Debt preserves the current owners\' upside but adds mandatory payments. Equity avoids a maturity date but permanently shares future profits.',
          'An investor comparing the two is not simply choosing a higher or lower return. The investor is choosing where to sit in the capital structure, which cash flows are promised, and which risks appear if sales disappoint.'
        ],
        facts: [
          { label: 'Capital needed', value: '$10M' },
          { label: 'Bond investor', value: 'Lender' },
          { label: 'Share investor', value: 'Owner' }
        ]
      }
    },

    'how-markets-work': {
      deepDiveTitle: 'Price, value, and execution are different',
      deepDive: [
        'A quoted price is information about the latest trade, not a guarantee for the next one. In a liquid security, many orders may sit close together. In a thin market, the next available seller can be far above the last trade or the next buyer far below it. That gap is why order type matters.',
        'A market order says execution matters more than price. A limit order says the trade should happen only at the stated price or better. A limit can protect the price but may never fill. Neither order type answers the larger question of whether the security is worth owning.'
      ],
      caseStudy: {
        title: 'What a four-cent spread can cost',
        label: 'Trade execution example',
        paragraphs: [
          'Suppose an ETF shows a $24.98 bid and a $25.02 ask. Buying 400 units immediately at the ask costs about $10,008. Selling immediately at the bid would return about $9,992 before commissions, creating a $16 round-trip spread cost.',
          'On a long-term diversified holding, that one-time amount may be modest. On repeated short-term trades, the same friction compounds against the trader. The visible commission can be zero while execution still has a cost.'
        ],
        facts: [
          { label: 'Bid / ask', value: '$24.98 / $25.02' },
          { label: 'Units', value: '400' },
          { label: 'Round-trip spread', value: '$16' }
        ]
      }
    },

    'what-risk-means': {
      deepDiveTitle: 'Risk belongs to the goal, not just the asset',
      deepDive: [
        'The same investment can be reasonable for one goal and reckless for another. A broad stock fund can fit retirement three decades away while being unsuitable for next year\'s tuition. The fund did not change; the cost of a badly timed decline did.',
        'Risk also exists outside the brokerage account. A worker in a cyclical industry already depends on that industry for income. Owning a large amount of employer stock adds portfolio exposure precisely when a downturn could threaten both employment and savings.'
      ],
      caseStudy: {
        title: 'When income and investments fail together',
        label: 'Household risk example',
        paragraphs: [
          'A technology employee earns $110,000 and has accumulated $80,000 of employer shares through compensation. If the company encounters trouble, the share price may fall at the same time bonuses are cut or jobs disappear.',
          'Selling part of the position and diversifying can feel disloyal, but the decision reduces one shared failure point. The goal is not to predict the employer\'s future. It is to prevent one company from controlling income, benefits, and long-term savings at once.'
        ],
        facts: [
          { label: 'Annual income', value: '$110K' },
          { label: 'Employer shares', value: '$80K' },
          { label: 'Shared risk', value: 'One company' }
        ]
      }
    },

    'risk-and-return': {
      deepDiveTitle: 'The path of returns can change the outcome',
      deepDive: [
        'Average return hides sequence risk. A saver making deposits can benefit from lower prices because each contribution buys more units. A retiree taking withdrawals faces the opposite problem: selling after an early decline removes units that can no longer participate in a recovery.',
        'This is why a retirement plan needs more than an average-return assumption. Withdrawal flexibility, stable assets, pension income, and rebalancing rules determine whether the portfolio can survive an unfriendly sequence.'
      ],
      caseStudy: {
        title: 'The arithmetic after an early retirement loss',
        label: 'Withdrawal example',
        paragraphs: [
          'A new retiree starts with $600,000 and plans a $30,000 withdrawal. If the portfolio falls 20% first, it declines to $480,000. Taking the withdrawal leaves $450,000.',
          'Returning from $450,000 to the original $600,000 now requires a 33.3% gain, not 20%. Holding part of the next few years of spending in stable assets may prevent a forced stock sale, although it also changes the portfolio\'s expected return.'
        ],
        facts: [
          { label: 'Starting balance', value: '$600K' },
          { label: 'After loss + withdrawal', value: '$450K' },
          { label: 'Gain to recover', value: '33.3%' }
        ]
      }
    },

    'time-in-market': {
      deepDiveTitle: 'Market timing creates a second deadline',
      deepDive: [
        'Selling is emotionally satisfying because it ends exposure to the immediate decline. It also creates a new obligation: choosing when to return. Waiting for economic news to become reassuring often means waiting until prices have already reflected some of that improvement.',
        'A rules-based portfolio uses time horizon and allocation to decide how much market risk to hold. It can still change when the goal, income, or capacity for loss changes. What it avoids is treating each headline as a fresh forecast competition.'
      ],
      caseStudy: {
        title: 'The 2020 recovery began before normal life returned',
        label: 'Historical market pattern',
        paragraphs: [
          'Global markets fell abruptly in February and March 2020 as the pandemic spread. A rebound began while shutdowns, job losses, and uncertainty were still dominating daily life. Investors waiting for the news to feel normal faced a difficult re-entry decision.',
          'The point is not that every decline recovers quickly. It is that market prices and current conditions move on different clocks. A long-term allocation removes the need to identify the exact day when fear has peaked.'
        ],
        facts: [
          { label: 'Shock', value: 'Early 2020' },
          { label: 'News backdrop', value: 'Still severe' },
          { label: 'Timing decisions', value: 'Sell + return' }
        ]
      }
    },

    'inflation-and-cash': {
      deepDiveTitle: 'Measure money in what it can buy',
      deepDive: [
        'Nominal stability can hide a real loss. If prices rise 4% and a savings account earns 2%, the balance grows while purchasing power declines. Tax on the interest can widen the gap in a non-registered account.',
        'The correct response depends on timing. Emergency money values immediate access. A home deposit due next year values principal stability. Retirement money several decades away may need a diversified growth allocation because its largest threat is failing to keep pace with future costs.'
      ],
      caseStudy: {
        title: 'What Canada\'s 2022 inflation meant for cash',
        label: 'Canadian historical example',
        paragraphs: [
          'Statistics Canada reported that the Consumer Price Index rose 6.8% on an annual-average basis in 2022. If $20,000 earned no interest while prices rose at that rate, its year-end purchasing power was roughly equivalent to $18,727 at the start of the year.',
          'That does not mean the full balance should have been invested. A household that needed the money for an imminent expense still benefited from stability. The example shows why long-term plans should use real, inflation-aware targets.'
        ],
        facts: [
          { label: '2022 average CPI', value: '+6.8%' },
          { label: 'Starting cash', value: '$20K' },
          { label: 'Real-value decline', value: 'About $1,273' }
        ]
      },
      sourceKeys: ['statcanCpi2022', 'bankInflation']
    },

    'compound-interest': {
      deepDiveTitle: 'Contributions build the engine first',
      deepDive: [
        'At the beginning, deposits usually create more growth than investment returns because the balance is small. Later, returns have a larger base to work on. This is why early progress can feel slow even when the plan is functioning exactly as expected.',
        'A useful projection separates contributions from growth. It also tests several return assumptions. If the goal works only at an unusually high return, the safer adjustment may be a higher contribution, a later date, or a smaller target.'
      ],
      caseStudy: {
        title: 'Ten years versus thirty years',
        label: 'Compound-growth illustration',
        paragraphs: [
          'At a hypothetical 6% annual return compounded monthly, contributing $200 a month grows to about $32,776 after 10 years. The investor supplied $24,000 and the illustration adds roughly $8,776 of growth.',
          'After 30 years, the same schedule reaches about $200,903. Contributions total $72,000, while illustrated growth supplies about $128,903. Real returns will be uneven and may be lower; the example isolates what additional time can do.'
        ],
        facts: [
          { label: 'Monthly deposit', value: '$200' },
          { label: '10-year value', value: '$32,776' },
          { label: '30-year value', value: '$200,903' }
        ]
      }
    },

    'starting-early': {
      deepDiveTitle: 'Delay changes the required contribution',
      deepDive: [
        'Starting early is valuable because each early dollar receives more compounding periods. It also spreads the savings burden across more paycheques. Someone who starts later can still catch up, but the required monthly amount rises because time can no longer do as much of the work.',
        'The habit matters independently of the projection. An investor who begins with a modest automated amount learns account mechanics and experiences market declines with a smaller balance before the stakes become larger.'
      ],
      caseStudy: {
        title: 'The cost of waiting ten years',
        label: 'Savings illustration',
        paragraphs: [
          'At a hypothetical 6% annual return compounded monthly, $300 a month for 30 years grows to about $301,355. The same $300 deposited for only the final 20 years grows to about $138,612.',
          'The early starter contributes $36,000 more, but the illustrated ending difference is about $162,743. That gap is not a promised market return. It shows why waiting often requires both larger deposits and a more demanding plan.'
        ],
        facts: [
          { label: 'Monthly deposit', value: '$300' },
          { label: '30 years', value: '$301,355' },
          { label: '20 years', value: '$138,612' }
        ]
      }
    },

    'dollar-cost-averaging': {
      deepDiveTitle: 'A contribution rule, not a return guarantee',
      deepDive: [
        'Dollar-cost averaging manages the decision process. It does not change the value of the asset or ensure that the average purchase price will be below the final price. If the investment steadily falls because its underlying value deteriorates, repeated buying can deepen the loss.',
        'The method is strongest when paired with a diversified investment and a long horizon. It is also different from holding an existing lump sum in cash: once money is already available, delaying investment is an additional market-timing choice.'
      ],
      caseStudy: {
        title: 'Six equal purchases through uneven prices',
        label: 'Unit-cost illustration',
        paragraphs: [
          'An investor contributes $300 at unit prices of $10, $8, $6, $9, $12, and $15. The $1,800 buys about 195.83 units because lower-price months purchase more units.',
          'The average cost is approximately $9.19 per unit, even though the simple average of the six quoted prices is $10. The result is useful only if the asset remains suitable; averaging is not a repair strategy for a broken investment.'
        ],
        facts: [
          { label: 'Total invested', value: '$1,800' },
          { label: 'Units purchased', value: '195.83' },
          { label: 'Average unit cost', value: '$9.19' }
        ]
      }
    },

    'dividend-reinvestment': {
      deepDiveTitle: 'Yield is only one part of total return',
      deepDive: [
        'A company that distributes cash has less cash after the payment, so investors should not treat the dividend as a free bonus. Total return combines distributions with the change in the investment\'s value. A high yield can coexist with a falling share price.',
        'Reinvestment is most useful when the holding remains suitable and the investor does not need income. In a taxable account, a distribution may create a tax obligation even when the cash is immediately reinvested.'
      ],
      caseStudy: {
        title: 'Turning one distribution into more ownership',
        label: 'Reinvestment illustration',
        paragraphs: [
          'A $20,000 fund holding distributes 3%, or $600, over a year. If units cost $25 when the distribution is reinvested, the investor acquires 24 additional units without adding new cash.',
          'Those units participate in later gains, losses, and distributions. If the fund cuts its payout or declines in value, reinvestment does not prevent a loss. The useful measure remains total after-tax return and portfolio fit.'
        ],
        facts: [
          { label: 'Fund balance', value: '$20K' },
          { label: '3% distribution', value: '$600' },
          { label: 'New $25 units', value: '24' }
        ]
      }
    },

    'rule-of-72': {
      deepDiveTitle: 'Use shortcuts to challenge assumptions',
      deepDive: [
        'The Rule of 72 is most helpful as a credibility test. A projection that doubles money every six years assumes roughly 12% compound growth. That may be possible in some periods, but it is aggressive enough to demand a clear discussion of risk, fees, and downside.',
        'The same rule makes invisible drags more intuitive. Persistent inflation near 3% would halve purchasing power in roughly 24 years. A recurring 2% cost does not literally halve the account by itself, but it creates an equally important long-term compounding gap.'
      ],
      caseStudy: {
        title: 'Three rates, three very different timelines',
        label: 'Mental-math example',
        paragraphs: [
          'At 8%, the Rule of 72 estimates a doubling time near nine years. At 6%, it estimates 12 years. At 3%, it estimates 24 years. The exact mathematical results differ slightly, but the shortcut is close enough for a first conversation.',
          'This makes sales claims easier to inspect. If a product illustration assumes repeated doubling, translate the timeline back into an implied annual return before deciding whether the risk sounds realistic.'
        ],
        facts: [
          { label: 'At 8%', value: 'About 9 years' },
          { label: 'At 6%', value: 'About 12 years' },
          { label: 'At 3%', value: 'About 24 years' }
        ]
      }
    },

    'investment-fees': {
      deepDiveTitle: 'A fee removes more than its invoice',
      deepDive: [
        'The direct fee is only the first cost. Money paid away this year cannot earn returns next year, so the gap compounds. A one-percentage-point annual difference can become a large portion of the ending balance over a multi-decade horizon.',
        'Cost still needs context. A planning service that improves taxes, behaviour, or estate decisions may be valuable. The investor should be able to name the service, calculate its total cost, and compare it with a realistic alternative.'
      ],
      caseStudy: {
        title: 'One percentage point over twenty-five years',
        label: 'Fee-drag illustration',
        paragraphs: [
          'A $100,000 balance growing at a hypothetical 6% nominal annual return, compounded monthly for 25 years, reaches about $446,497. If recurring costs reduce that nominal return to 5%, the illustration ends near $348,129.',
          'The difference is about $98,368, even though the first year\'s one-percentage-point cost looked like only $1,000. Taxes and actual returns will change the result, but the example shows why recurring costs deserve more attention than trading commissions alone.'
        ],
        facts: [
          { label: '6% ending value', value: '$446,497' },
          { label: '5% ending value', value: '$348,129' },
          { label: 'Illustrated gap', value: '$98,368' }
        ]
      }
    },

    'taxes-and-compounding': {
      deepDiveTitle: 'Tax location changes the return you keep',
      deepDive: [
        'Tax drag can arise from interest, foreign income, dividends, realized gains, or fund distributions. The exact treatment depends on the account, investment, jurisdiction, and investor. That makes asset location a second decision after asset allocation.',
        'Registered accounts can reduce annual tax friction, but their withdrawal rules differ. The account with the largest immediate deduction is not automatically the best place for money that may be needed soon.'
      ],
      caseStudy: {
        title: 'The value of keeping more capital invested',
        label: 'Tax-drag illustration',
        paragraphs: [
          'A one-time $7,000 investment compounding annually at 6% for 20 years reaches about $22,450. If annual tax drag reduces the effective growth rate to 4.8%, the same illustration ends near $17,878.',
          'The $4,572 difference is not a universal TFSA benefit calculation. Real tax depends on the return type and personal circumstances. It demonstrates the mechanism: annual tax leaves a smaller base available for the next year.'
        ],
        facts: [
          { label: 'Starting amount', value: '$7,000' },
          { label: '6% for 20 years', value: '$22,450' },
          { label: '4.8% for 20 years', value: '$17,878' }
        ]
      }
    },

    'stocks-explained': {
      deepDiveTitle: 'A great business can still be an expensive stock',
      deepDive: [
        'A share price reflects both business results and the valuation investors place on those results. Revenue can grow while the stock falls if expectations had been even higher. Conversely, a weak company can rally when results are merely less bad than feared.',
        'This is why direct stock analysis includes the balance sheet, cash flow, competition, dilution, and price paid. A broad fund does not remove valuation risk, but it reduces the damage from being wrong about one business.'
      ],
      caseStudy: {
        title: 'When earnings rise but the share price falls',
        label: 'Valuation example',
        paragraphs: [
          'A company earns $1 per share and trades at $20, a price-to-earnings multiple of 20. The next year earnings rise 20% to $1.20, but investors become less optimistic and value the company at 15 times earnings.',
          'The resulting price is $18. The business improved while the stock lost 10%. The example shows why buying a familiar company is not enough; the expectations already embedded in the price matter.'
        ],
        facts: [
          { label: 'Starting EPS / multiple', value: '$1 / 20x' },
          { label: 'New EPS / multiple', value: '$1.20 / 15x' },
          { label: 'Illustrated price', value: '$18' }
        ]
      }
    },

    'bonds-explained': {
      deepDiveTitle: 'Why existing bond prices move when rates change',
      deepDive: [
        'A fixed bond payment becomes less attractive when newly issued bonds offer more interest. Its market price falls until the remaining cash flows offer a competitive yield. The reverse generally happens when new rates decline.',
        'Maturity magnifies this effect because a long bond locks in its payment for more years. Credit quality adds a separate risk: even an attractive yield is only useful if the borrower can make the promised payments.'
      ],
      caseStudy: {
        title: 'Repricing a five-year bond',
        label: 'Bond valuation illustration',
        paragraphs: [
          'Consider a $1,000 five-year bond paying $30 annually, a 3% coupon. If comparable new bonds yield 5%, the present value of the old bond\'s payments is roughly $913.',
          'An investor who holds the individual bond to maturity still expects $1,000 back if the issuer pays as promised, but anyone selling earlier faces the lower market price. A bond fund reflects this repricing across many holdings every day.'
        ],
        facts: [
          { label: 'Face value', value: '$1,000' },
          { label: 'Coupon', value: '3%' },
          { label: 'Value at 5% yield', value: 'About $913' }
        ]
      }
    },

    'mutual-funds-vs-etfs': {
      deepDiveTitle: 'Compare the full ownership experience',
      deepDive: [
        'Product cost includes more than the MER. An ETF buyer may encounter commissions, bid-ask spreads, currency conversion, and the temptation to trade. A mutual fund may include trailing commissions or advice costs but make automated dollar purchases and fractional ownership easier.',
        'Taxes can also differ because fund structure and trading activity affect distributions. The right comparison uses two products with similar holdings, then adds every cost and service the investor will actually experience.'
      ],
      caseStudy: {
        title: 'Low MER, expensive currency conversion',
        label: 'Brokerage cost example',
        paragraphs: [
          'A Canadian investor converts $10,000 to buy a U.S.-listed ETF. If the brokerage charges 1.5% through its foreign-exchange spread, the entry conversion costs roughly $150 before the ETF is purchased. Converting the eventual sale back can create another charge.',
          'A Canadian-listed fund with a slightly higher MER may be cheaper for a smaller or shorter holding once currency costs and convenience are counted. For a large, long-term position, the conclusion may reverse.'
        ],
        facts: [
          { label: 'Amount converted', value: '$10K' },
          { label: 'Illustrated FX cost', value: '1.5%' },
          { label: 'Entry cost', value: '$150' }
        ]
      }
    },

    'index-funds': {
      deepDiveTitle: 'The index rule determines the exposure',
      deepDive: [
        'A market-cap-weighted index gives larger companies larger positions. That approach is cheap and self-adjusting, but it can create concentration when a few companies become very valuable. Equal-weight, factor, and thematic indexes make different trade-offs.',
        'The practical review is the same as for any fund: inspect top holdings, sector and country weights, turnover, fees, and the index methodology. The word index describes the selection process, not the amount of risk.',
        'Tracking difference is the result investors actually receive. It includes the stated fee plus trading, withholding tax, sampling, and cash held inside the fund. Two funds following the same benchmark can therefore deliver slightly different returns.'
      ],
      caseStudy: {
        title: 'How diversification contains one company\'s damage',
        label: 'Portfolio-weight example',
        paragraphs: [
          'Suppose a company represents 2% of a broad fund and its share price falls 50% while every other holding is unchanged. Its direct effect on the fund is approximately a 1% decline.',
          'Owning the company alone would produce the full 50% loss. The fund can still fall for broader reasons, but no single 2% holding determines the entire result.'
        ],
        facts: [
          { label: 'Company weight', value: '2%' },
          { label: 'Company decline', value: '-50%' },
          { label: 'Direct fund effect', value: 'About -1%' }
        ]
      }
    },

    'active-vs-passive': {
      deepDiveTitle: 'Survivorship and benchmark choice matter',
      deepDive: [
        'A fund comparison can look better when failed or merged products disappear from the data. A rigorous scorecard keeps track of those funds and compares each category with a relevant benchmark. It also looks beyond one year, because style cycles can make temporary outperformance look like permanent skill.',
        'Passive funds do not win every period, and an active manager may provide downside control or a specialized mandate. The evidence question is whether the benefit persists after fees and whether the investor can identify it before, rather than after, the result.',
        'Manager risk is separate from market risk. A manager can leave, the process can change, assets can grow too large for the original strategy, or a concentrated view can remain wrong for years. Active investors need a monitoring rule for those changes as well as patience during ordinary underperformance.',
        'Index investors face governance choices too. An index provider decides which securities qualify and how weights change. The practical advantage is that those rules are usually published in advance, making the exposure and performance benchmark easier to audit.',
        'Some investors combine the approaches by using broad index funds as a low-cost core and a limited active allocation for a clearly defined purpose. That structure only helps when the active sleeve has a size limit, a fair benchmark, and a reason stronger than recent performance.'
      ],
      caseStudy: {
        title: 'What the 2025 SPIVA Canada scorecard found',
        label: 'Current Canadian evidence',
        paragraphs: [
          'S&P Dow Jones Indices reported that 93.4% of Canadian Equity funds underperformed the S&P/TSX Composite Index in 2025. The underperformance rate was 98.8% over the ten-year horizon ending in 2025.',
          'The report also said 47.1% of Canadian Equity funds merged or liquidated over ten years. This does not prove every active decision is wrong. It shows how high the hurdle becomes after costs, selection, and survivorship are included.'
        ],
        facts: [
          { label: '2025 underperformed', value: '93.4%' },
          { label: '10-year underperformed', value: '98.8%' },
          { label: '10-year merged / closed', value: '47.1%' }
        ]
      },
      sourceKeys: ['spivaCanada2025']
    },

    'diversification': {
      deepDiveTitle: 'Diversify the household, not only the account',
      deepDive: [
        'A portfolio can appear diversified while the household remains concentrated. Salary, pension, home value, private business ownership, and employer stock all belong in the risk picture. A Canadian homeowner working for a bank may already have substantial exposure to Canadian real estate and finance before opening a brokerage account.',
        'Diversification deliberately adds return drivers that do not depend on the same outcome. It can feel disappointing in any given year because something will usually lag. That lag is evidence that the pieces are not identical.'
      ],
      caseStudy: {
        title: 'Five holdings, one economic bet',
        label: 'Household concentration example',
        paragraphs: [
          'A worker owns shares in five Canadian banks, receives a bank salary and bonus, and owns a condominium financed by a Canadian lender. The stock list contains five tickers, but much of the household still depends on domestic credit and housing conditions.',
          'Adding global equities and high-quality fixed income introduces different countries, sectors, and cash-flow patterns. It cannot guarantee a gain, but it reduces the number of ways one domestic shock can affect everything at once.'
        ],
        facts: [
          { label: 'Bank stocks', value: '5' },
          { label: 'Economic theme', value: 'Mostly one' },
          { label: 'Missing exposure', value: 'Global sectors' }
        ]
      }
    },

    'open-brokerage-account': {
      deepDiveTitle: 'The platform changes friction, not investment quality',
      deepDive: [
        'Brokerages compete on commissions, foreign exchange, product access, automation, advice, and support. A polished interface can make activity feel productive, but the platform does not turn a concentrated security into a diversified plan.',
        'Operational details become important when money moves. Transfer-out fees, account minimums, settlement, fractional shares, recurring purchases, and registered-account availability can matter more than a promotional free trade.'
      ],
      caseStudy: {
        title: 'The hidden cost in a commission-free trade',
        label: 'Account-opening example',
        paragraphs: [
          'A new investor deposits $5,000 and buys a U.S. stock with no commission. A 1.5% currency conversion spread costs about $75 on the purchase. If the money is later converted back at the same spread, the round-trip currency cost approaches $150 before market movement.',
          'A platform with a small commission but cheaper currency handling may be less expensive. The comparison should follow the exact investments and transaction pattern the account will use.'
        ],
        facts: [
          { label: 'Deposit', value: '$5,000' },
          { label: 'Trade commission', value: '$0' },
          { label: 'Potential round-trip FX', value: 'About $150' }
        ]
      }
    },

    'first-investment-framework': {
      deepDiveTitle: 'A holding should have a written job',
      deepDive: [
        'Naming the job of each dollar prevents product excitement from deciding the portfolio. A retirement contribution needs long-run growth. A tax payment needs certainty. An emergency reserve needs immediate access. The same household can reasonably use different products for each.',
        'A useful one-page decision records the goal, date, target amount, account, asset mix, recurring cost, and conditions for review. That note becomes a defence against changing the strategy simply because another investment recently performed better.'
      ],
      caseStudy: {
        title: 'The same $15,000 with two different jobs',
        label: 'Goal-matching example',
        paragraphs: [
          'One saver has $15,000 for tuition due in 18 months. Another has $15,000 for retirement in 30 years. A broad stock fund may be reasonable for part of the retirement plan but can create unacceptable timing risk for the tuition bill.',
          'The amount is identical; the deadline changes the decision. The tuition saver may prioritize a high-interest savings account or short GIC, while the retirement saver can evaluate a diversified long-term allocation.'
        ],
        facts: [
          { label: 'Amount', value: '$15K each' },
          { label: 'Goal one', value: '18 months' },
          { label: 'Goal two', value: '30 years' }
        ]
      },
      sourceKeys: ['fcacGoals']
    },

    'how-much-to-invest': {
      deepDiveTitle: 'Resilience comes before optimization',
      deepDive: [
        'A portfolio cannot compound if every unexpected bill forces a withdrawal. Emergency savings create the practical capacity to hold long-term assets through a decline. The target depends on job stability, dependants, insurance, housing, health, and how quickly expenses can be reduced.',
        'FCAC suggests gradually working toward roughly three to six months of regular expenses or income as an emergency-fund reference. That is a planning range, not a command; a secure dual-income household and a variable-income contractor may need different buffers.'
      ],
      caseStudy: {
        title: 'Sizing the reserve before investing more',
        label: 'Household cash-flow example',
        paragraphs: [
          'A household has $4,000 of essential monthly expenses. A three-to-six-month range equals $12,000 to $24,000. The household currently has $6,000 in accessible savings and $1,000 of monthly surplus.',
          'Instead of investing the entire surplus, it directs $700 to the reserve and $300 to long-term investing. The split preserves the habit while reducing the chance that a repair or job interruption forces a market sale.'
        ],
        facts: [
          { label: 'Monthly essentials', value: '$4,000' },
          { label: 'Reference range', value: '$12K-$24K' },
          { label: 'Monthly split', value: '$700 / $300' }
        ]
      },
      sourceKeys: ['fcacEmergency', 'fcacGoals']
    },

    'registered-accounts': {
      deepDiveTitle: 'Prioritize benefits, then flexibility and tax timing',
      deepDive: [
        'Account priority is often decided at the margin. An employer match may make the next RRSP dollar unusually valuable. An FHSA may fit an eligible first-home goal. A TFSA can preserve withdrawal flexibility. An RESP may attract grants for education.',
        'Room should not be filled merely because it exists. High-interest debt, emergency savings, expected withdrawals, and benefit interactions can matter more than maximizing every registered account in one year.'
      ],
      caseStudy: {
        title: 'One year, three account decisions',
        label: 'Canadian planning example',
        paragraphs: [
          'An eligible first-home buyer has $18,000 to allocate in 2026. The person contributes $8,000 to an FHSA, uses $3,000 to capture a full employer RRSP match, and places the remaining $7,000 in a TFSA if enough personal room is available.',
          'The sequence uses the FHSA\'s home-focused treatment, captures employer compensation, and retains flexibility. It is an illustration, not a universal order; debt, tax rates, room, and the home timeline can change it.'
        ],
        facts: [
          { label: 'FHSA contribution', value: '$8,000' },
          { label: 'RRSP for match', value: '$3,000' },
          { label: 'TFSA contribution', value: '$7,000' }
        ]
      },
      sourceKeys: ['craRegisteredLimits']
    },

    'automatic-contributions': {
      deepDiveTitle: 'Automation needs controls around it',
      deepDive: [
        'A transfer schedule should include an overdraft buffer, a contribution-room check, and a yearly review. Without those controls, a useful habit can create fees, leave cash uninvested, or overcontribute to a registered account.',
        'The strongest automation follows income. Paycheque-aligned transfers work for salaried employees; variable earners may combine a small fixed baseline with a percentage of every invoice or bonus.',
        'Automation should also specify the destination investment. A recurring bank transfer that leaves money in brokerage cash creates the appearance of progress without the planned market exposure. Verify the first few cycles from deposit through purchase.'
      ],
      caseStudy: {
        title: 'A contribution that grows with income',
        label: 'Paycheque automation example',
        paragraphs: [
          'A worker automates $100 every two weeks, contributing $2,600 over 26 pay periods. Each January, the amount rises by $10 per paycheque if the emergency fund and debt plan remain on track.',
          'After five increases, the transfer reaches $150 and the annual pace becomes $3,900. The system grows without requiring a new decision every payday, while the yearly review prevents autopilot from ignoring changed circumstances.'
        ],
        facts: [
          { label: 'Starting transfer', value: '$100 biweekly' },
          { label: 'First-year total', value: '$2,600' },
          { label: 'Year-six pace', value: '$3,900' }
        ]
      }
    },

    'beginner-investing-mistakes': {
      deepDiveTitle: 'Most complexity is accidental, not useful',
      deepDive: [
        'Beginners often add funds because each one sounds diversified on its own. The result can be several products owning the same large companies, mixed account purposes, and no clear target allocation. More line items do not necessarily create more diversification.',
        'Another common error is measuring success against a popular index that does not match the portfolio. A balanced investor should not abandon bonds because a stock index had a strong year; the bond allocation was chosen for a different job.',
        'Small administrative mistakes can be costly too: ignoring beneficiary forms, using the wrong registered account, or assuming cash was invested. A short annual checklist catches these errors without turning portfolio review into constant monitoring.'
      ],
      caseStudy: {
        title: 'Three ETFs, nearly the same exposure',
        label: 'Portfolio-overlap example',
        paragraphs: [
          'An investor buys a U.S. large-company ETF, a technology ETF, and a global ETF. The three names look different, but many of the largest positions overlap. The technology allocation becomes much larger than intended.',
          'A holdings review reveals that one broad global fund already contains the major U.S. companies. Removing the duplicate funds makes the portfolio easier to understand and rebalance without necessarily reducing market coverage.'
        ],
        facts: [
          { label: 'Funds owned', value: '3' },
          { label: 'New risk drivers', value: 'Fewer than 3' },
          { label: 'Repair', value: 'Check overlap' }
        ]
      }
    },

    'bear-markets': {
      deepDiveTitle: 'A bear market is an event, not a strategy',
      deepDive: [
        'The label describes a large decline from a prior high but says nothing certain about duration, cause, or recovery. A fast shock and a long valuation unwind can both meet the definition while requiring the same basic household preparation: liquidity, diversification, and a tolerable allocation.',
        'Economic data often remain weak after markets begin to recover because prices react to changes in expectations. Waiting for unemployment, profits, and headlines all to improve can mean waiting until the market has already moved.'
      ],
      caseStudy: {
        title: 'Why the emergency fund changes the experience',
        label: 'Two-household comparison',
        paragraphs: [
          'Two investors each hold $100,000 in the same portfolio during a severe decline. One also has six months of expenses in savings. The other invested every available dollar and now needs $8,000 for a roof repair.',
          'The first investor can follow the rebalancing plan. The second may have to sell while prices are down. Their market return was identical, but their financial resilience created different real outcomes.'
        ],
        facts: [
          { label: 'Portfolio each', value: '$100K' },
          { label: 'Unexpected bill', value: '$8,000' },
          { label: 'Key difference', value: 'Cash reserve' }
        ]
      },
      sourceKeys: ['fcacEmergency']
    },

    'tfsa-explained': {
      deepDiveTitle: 'Room is a running personal calculation',
      deepDive: [
        'TFSA room is not simply the current annual dollar limit. It combines unused room, the annual amount earned while eligible, prior-year withdrawals, and contributions already made across every provider. CRA information can lag recent transactions, so personal records remain important.',
        'A withdrawal creates flexibility but the replacement room generally arrives on January 1 of the following calendar year. A direct institution-to-institution transfer avoids treating the move as a withdrawal and recontribution.'
      ],
      caseStudy: {
        title: 'The withdrawal-and-replacement trap',
        label: 'Canadian account example',
        paragraphs: [
          'The 2026 TFSA dollar limit is $7,000. An investor with no unused room contributes $7,000, then withdraws $12,000 in October after earlier growth. The $12,000 generally becomes new room on January 1, 2027, not immediately in October.',
          'Putting the $12,000 back in December 2026 would therefore create an excess contribution if no other room exists. Waiting until the next calendar year avoids that timing mistake.'
        ],
        facts: [
          { label: '2026 dollar limit', value: '$7,000' },
          { label: 'October withdrawal', value: '$12,000' },
          { label: 'Replacement room', value: 'Jan. 1, 2027' }
        ]
      },
      sourceKeys: ['craRegisteredLimits']
    },

    'rrsp-explained': {
      deepDiveTitle: 'The deduction and the withdrawal belong in one calculation',
      deepDive: [
        'An RRSP contribution can reduce taxable income today, but the plan generally creates taxable income later. The meaningful comparison includes the current marginal deduction rate, the future withdrawal rate, years of tax-deferred growth, and what happens to the refund.',
        'Contribution room is valuable and normally does not return after an ordinary withdrawal. That makes an RRSP less flexible than a TFSA for money that may be needed before retirement, even when the initial deduction looks attractive.'
      ],
      caseStudy: {
        title: 'What happens to a $10,000 contribution',
        label: 'Tax-timing illustration',
        paragraphs: [
          'Assume a $10,000 RRSP deduction applies at a 35% marginal tax rate. The immediate tax reduction is approximately $3,500. If that refund is spent, only the original $10,000 remains invested; reinvesting the refund gives the strategy a larger base.',
          'A later $10,000 withdrawal taxed at an illustrative 25% leaves $7,500 after tax. Actual rates, investment growth, withholding, benefits, and timing will change the result. The example shows why the refund and future tax cannot be ignored.'
        ],
        facts: [
          { label: 'Contribution', value: '$10,000' },
          { label: '35% tax reduction', value: '$3,500' },
          { label: '$10K at 25% later', value: '$7,500 net' }
        ]
      }
    },

    'tfsa-vs-rrsp': {
      deepDiveTitle: 'Compare the next dollar, not the account names',
      deepDive: [
        'The TFSA-versus-RRSP choice changes over a career. A lower-income year can make a TFSA contribution or a carried-forward RRSP deduction attractive. A high-income year can make an RRSP deduction more valuable. Employer matching can override both because it adds compensation immediately.',
        'Withdrawals also interact differently with taxable income. RRSP withdrawals can affect income-tested credits and benefits, while TFSA withdrawals generally do not. That distinction can matter as much as the tax rate itself.'
      ],
      caseStudy: {
        title: 'The same contribution in two career stages',
        label: 'Canadian tax-rate example',
        paragraphs: [
          'A worker earning $55,000 has an illustrative marginal rate of 25% and expects income to rise. A $5,000 RRSP deduction would reduce tax by roughly $1,250. The worker may prefer TFSA flexibility and reserve RRSP room for a later higher-rate year.',
          'At $120,000 of income and an illustrative 43% marginal rate, the same deduction would reduce current tax by about $2,150. Province, deductions, pensions, benefits, and future withdrawal rates must be checked before applying this framework.'
        ],
        facts: [
          { label: '$5K at 25%', value: '$1,250' },
          { label: '$5K at 43%', value: '$2,150' },
          { label: 'Difference', value: '$900' }
        ]
      }
    },

    'fhsa-explained': {
      deepDiveTitle: 'Opening date and purchase date both matter',
      deepDive: [
        'FHSA participation room starts after the first account is opened under the program rules. Opening earlier can begin room accumulation, but it also starts the account\'s maximum participation period. The decision should connect to a plausible home timeline rather than tax savings alone.',
        'Investment risk should fall as the purchase approaches. A portfolio that makes sense eight years before a down payment may be far too volatile eight months before closing.'
      ],
      caseStudy: {
        title: 'Building the $40,000 lifetime contribution',
        label: 'First-home savings illustration',
        paragraphs: [
          'An eligible buyer contributes $8,000 near the beginning of each year for five years, reaching the current $40,000 lifetime contribution limit. At a hypothetical 5% annual return, the illustrated balance after the fifth year is about $46,415.',
          'The $6,415 growth is not guaranteed, and a short home-buying horizon may call for savings or GICs rather than market risk. The account\'s tax treatment cannot protect a down payment from an investment decline.'
        ],
        facts: [
          { label: 'Annual contribution', value: '$8,000' },
          { label: 'Five-year principal', value: '$40,000' },
          { label: 'At 5% illustration', value: '$46,415' }
        ]
      }
    },

    'cpp-explained': {
      deepDiveTitle: 'Start age is a longevity and cash-flow decision',
      deepDive: [
        'CPP is a lifetime, inflation-adjusted public pension, so delaying can increase guaranteed monthly income later. Starting earlier provides payments sooner. Health, employment, survivor needs, taxes, other assets, and eligibility for income-tested benefits all belong in the decision.',
        'The current rules reduce a pension started before 65 by 0.6% per month, to 36% at age 60. Delaying after 65 increases it by 0.7% per month, to 42% at age 70. These percentages apply to the individual estimate, not automatically to the published maximum.'
      ],
      caseStudy: {
        title: 'Applying the start-age adjustment to a personal estimate',
        label: 'CPP timing illustration',
        paragraphs: [
          'Suppose a Statement of Contributions estimates $1,050 per month at age 65. Under the current adjustment factors, starting at 60 would produce roughly $672 per month, while delaying to 70 would produce roughly $1,491 per month.',
          'The early option pays for five additional years; the delayed option pays more each month afterward. A break-even age alone is incomplete because taxes, investment withdrawals, longevity risk, and the value of guaranteed income differ by household.'
        ],
        facts: [
          { label: 'At age 60', value: 'About $672' },
          { label: 'At age 65', value: '$1,050' },
          { label: 'At age 70', value: 'About $1,491' }
        ]
      },
      sourceKeys: ['cppWhen']
    },

    'disability-investing-canada': {
      deepDiveTitle: 'Liquidity and long-term support are separate jobs',
      deepDive: [
        'An RDSP is designed for long-term support and may attract federal grants or bonds, but withdrawal rules can make it a poor substitute for an emergency fund. Accessible cash, disability-related expenses, housing, and caregiving needs should be planned separately.',
        'Provincial and territorial assistance rules are not uniform. Before moving a gift, inheritance, trust distribution, or investment, confirm how the exact program treats assets and income. Written program guidance and specialized advice can prevent a well-intentioned transfer from disrupting support.'
      ],
      caseStudy: {
        title: 'Splitting a family gift by time horizon',
        label: 'Disability-planning example',
        paragraphs: [
          'A DTC-approved beneficiary receives a $10,000 family gift and expects $3,000 of accessibility equipment costs within a year. Placing the full gift in an RDSP could make the near-term money harder to use efficiently.',
          'After checking provincial rules and potential grant entitlement, the family keeps the equipment amount accessible and considers the remaining $7,000 for long-term planning. The exact split depends on benefit, tax, and RDSP withdrawal rules.'
        ],
        facts: [
          { label: 'Family gift', value: '$10,000' },
          { label: 'Near-term need', value: '$3,000' },
          { label: 'Long-term amount', value: '$7,000' }
        ]
      }
    },

    'investor-behaviour': {
      deepDiveTitle: 'Good systems reduce the number of emotional decisions',
      deepDive: [
        'Biases often work together. A rising price creates recency bias, social proof supplies confirmation, and early gains produce overconfidence. Once the position falls, loss aversion encourages holding without revisiting the original thesis.',
        'A decision journal interrupts that chain. Recording the reason, valuation, position limit, expected horizon, and disconfirming evidence before buying makes it harder to rewrite the story after the outcome is known.'
      ],
      caseStudy: {
        title: 'Why social proof felt like research in 2021',
        label: 'Meme-stock behaviour example',
        paragraphs: [
          'During the January 2021 meme-stock episode, rapidly rising prices and constant social-media attention reinforced each other. The SEC staff report documented the dramatic trading activity and the market-structure questions that followed.',
          'An investor seeing thousands of confident posts could mistake repetition for independent evidence. A preset speculative limit and written exit thesis would not predict the price, but it could prevent crowd intensity from deciding the size of the bet.'
        ],
        facts: [
          { label: 'Feedback loop', value: 'Price + attention' },
          { label: 'Common bias', value: 'Social proof' },
          { label: 'Useful guardrail', value: 'Position limit' }
        ]
      },
      sourceKeys: ['secGameStop']
    },

    'asset-allocation': {
      deepDiveTitle: 'Allocation determines which disappointments you accept',
      deepDive: [
        'No allocation wins in every environment. More stocks can improve long-term growth potential but deepen equity declines. More bonds can reduce some volatility but lag during strong stock markets and lose value when rates rise. More cash improves stability while increasing inflation risk.',
        'A good allocation is therefore not the one with the best backtest. It is the one whose weak periods the household can fund and tolerate without abandoning the strategy.',
        'Capacity can change as the goal approaches. A down payment or retirement date turns a distant paper loss into a possible spending problem. Gradually adjusting the mix can reduce that timing risk without requiring a forecast about next month\'s market.'
      ],
      caseStudy: {
        title: 'Turning risk tolerance into dollars',
        label: 'Portfolio-loss illustration',
        paragraphs: [
          'An investor is choosing between an 80% stock portfolio and a 60% stock portfolio. In a simplified scenario where stocks fall 30% and bonds are unchanged, a $100,000 portfolio falls to about $76,000 at 80/20 and $82,000 at 60/40.',
          'The six-thousand-dollar difference can determine whether the investor stays invested. The lower-stock portfolio also gives up some upside in strong markets. Allocation is a trade-off, not a score of bravery.'
        ],
        facts: [
          { label: 'Stock decline', value: '-30%' },
          { label: '80/20 ending value', value: '$76,000' },
          { label: '60/40 ending value', value: '$82,000' }
        ]
      }
    },

    'rebalancing': {
      deepDiveTitle: 'Rebalancing turns a target into a rule',
      deepDive: [
        'Without a rule, rebalancing can become disguised market timing. Investors may rebalance after every small move when nervous, then avoid it after a large rally because the winning asset feels safest. Calendar reviews or tolerance bands create consistency.',
        'Taxes and transaction costs matter. New contributions, dividends, and withdrawals can often move the portfolio toward target without selling appreciated assets in a taxable account.',
        'A household with several accounts should rebalance at the combined level. One account can hold more bonds while another holds more stocks, provided the overall risk target and account-specific tax considerations remain intentional.'
      ],
      caseStudy: {
        title: 'Restoring a 60/40 portfolio after a rally',
        label: 'Rebalancing illustration',
        paragraphs: [
          'A $100,000 portfolio starts with $60,000 in stocks and $40,000 in bonds. Stocks rise 20% while bonds are unchanged, producing $72,000 of stocks and a $112,000 total. Stocks now represent about 64.3%.',
          'Returning to 60/40 requires moving roughly $4,800 from stocks to bonds, or using future cash flows to close the gap. The trade is driven by the target, not a claim that stocks are about to fall.'
        ],
        facts: [
          { label: 'New total', value: '$112,000' },
          { label: 'Stock weight', value: '64.3%' },
          { label: 'Amount to redirect', value: 'About $4,800' }
        ]
      }
    },

    'bonds-in-portfolio': {
      deepDiveTitle: 'Match bond structure to the liability',
      deepDive: [
        'A bond allocation is more useful when it is connected to a future payment. Short, high-quality bonds can support spending over the next several years. Longer bonds may hedge some long-term risks but move more when rates change. High-yield bonds add credit risk and may fall alongside stocks.',
        'This liability-matching view is more precise than holding bonds merely because of age. Two retirees of the same age can need different bond structures if one has a large indexed pension and the other relies heavily on portfolio withdrawals.'
      ],
      caseStudy: {
        title: 'A three-year withdrawal ladder',
        label: 'Retirement cash-flow example',
        paragraphs: [
          'A retiree expects to withdraw $30,000 from the portfolio in each of the next three years. The plan holds roughly $30,000 maturing in each year through cash, GICs, or suitable high-quality short bonds, while longer-term assets remain invested.',
          'If stocks decline, the retiree can fund scheduled spending without immediately selling them. The ladder does not eliminate inflation or reinvestment risk, and the right amount depends on pension income and flexibility.'
        ],
        facts: [
          { label: 'Annual withdrawal', value: '$30,000' },
          { label: 'Years matched', value: '3' },
          { label: 'Near-term allocation', value: 'About $90,000' }
        ]
      }
    },

    'inflation-erodes-savings': {
      deepDiveTitle: 'Inflation changes the target as well as the return',
      deepDive: [
        'A saver can earn a positive real return and still miss a goal if the goal\'s price rises faster than general inflation. Housing, tuition, food, and health costs can follow different paths from the headline CPI. Update the target itself, not only the assumed investment return.',
        'Cash should be compared after tax and against the relevant timeline. Shopping for a better savings rate can reduce erosion without taking market risk, while long-term money may need a diversified mix with higher expected growth.'
      ],
      caseStudy: {
        title: 'A larger cash balance with less buying power',
        label: '2022 Canadian inflation example',
        paragraphs: [
          'With Canada\'s annual-average CPI up 6.8% in 2022, $30,000 earning no interest ended the year with purchasing power of roughly $28,090 in start-of-year dollars. The nominal statement still showed $30,000.',
          'A 3% savings rate would have softened the loss but not fully matched inflation before tax. The example explains why emergency cash and long-term savings should be evaluated by different standards.'
        ],
        facts: [
          { label: 'Starting cash', value: '$30,000' },
          { label: '2022 average CPI', value: '+6.8%' },
          { label: 'Real-value decline', value: 'About $1,910' }
        ]
      },
      sourceKeys: ['statcanCpi2022', 'bankInflation']
    },

    'index-vs-active-funds': {
      deepDiveTitle: 'The fund you can choose in advance is the real test',
      deepDive: [
        'It is easy to identify an outperforming active fund after the fact. The investor\'s challenge is selecting it before the outperformance, holding it through inevitable weak periods, and distinguishing skill from a favourable style cycle.',
        'Index funds replace manager selection with benchmark selection. That still requires care, but the rules and costs are usually easier to observe. The evidence should be used to set a default, not to claim that no active fund can ever outperform.',
        'A fair decision also includes behaviour. An inexpensive index fund that an investor can hold may produce a better personal outcome than an active fund repeatedly bought after strong performance and sold after a weak period.'
      ],
      caseStudy: {
        title: 'The Canadian ten-year hurdle',
        label: 'SPIVA Canada example',
        paragraphs: [
          'For the ten years ending in 2025, SPIVA Canada reported that 98.8% of Canadian Equity funds underperformed their benchmark. In the same category, 47.1% of funds merged or liquidated over the decade.',
          'An investor screening only the funds that survived to 2025 would miss much of that failure. A fair active-passive comparison includes closed funds, fees, and the benchmark the manager was actually trying to beat.'
        ],
        facts: [
          { label: '10-year underperformed', value: '98.8%' },
          { label: 'Merged / liquidated', value: '47.1%' },
          { label: 'Period ended', value: 'Dec. 2025' }
        ]
      },
      sourceKeys: ['spivaCanada2025']
    },

    'expense-ratios-mers': {
      deepDiveTitle: 'Translate every percentage into a dollar decision',
      deepDive: [
        'An MER is charged as a percentage of fund assets, so the dollar cost grows as the account grows. Comparing only today\'s balance understates the future expense. The higher-cost fund must deliver a valuable service or enough additional after-fee return to justify that widening hurdle.',
        'Fund Facts documents make MERs visible, but investors should also look for trading expenses, sales charges, advice fees, account administration, spreads, and currency conversion.',
        'Compare costs at the household level. A low-cost fund inside an account with a separate one-percent advice charge does not create a low-cost portfolio, and a quoted fee before tax may cost more than the same number suggests.'
      ],
      caseStudy: {
        title: 'A 1.5-point MER gap over twenty-five years',
        label: 'Fund-cost illustration',
        paragraphs: [
          'Two funds each begin with $50,000 and earn a hypothetical 6% before fees. One costs 0.30%, leaving 5.70%; the other costs 1.80%, leaving 4.20%. After 25 years, the illustrated balances are about $199,915 and $139,850.',
          'The gap is roughly $60,065. The higher-cost fund may include advice or a different strategy, so the comparison is not automatically decisive. It makes the price of that difference concrete.'
        ],
        facts: [
          { label: 'Low-cost ending value', value: '$199,915' },
          { label: 'High-cost ending value', value: '$139,850' },
          { label: 'Illustrated gap', value: '$60,065' }
        ]
      }
    },

    'market-drops-plan': {
      deepDiveTitle: 'Separate a rebalance from a rescue attempt',
      deepDive: [
        'A rebalance follows a pre-existing allocation rule. A rescue attempt changes the plan because the decline feels unbearable. Both involve trades, but only one was anticipated before the pressure arrived.',
        'If a drop exposes that the portfolio was unsuitable, change the long-term allocation once and document the reason. Repeatedly moving to cash after declines and back to stocks after recoveries converts discomfort into a systematic buy-high, sell-low pattern.',
        'Before trading, check whether upcoming withdrawals are already protected and whether the holdings still match the intended strategy. A broad market decline is different from discovering fraud, leverage, or concentration inside a product you misunderstood.'
      ],
      caseStudy: {
        title: 'Applying the checklist after a 25% stock decline',
        label: 'Market-drop illustration',
        paragraphs: [
          'A $100,000 portfolio starts 80% in stocks and 20% in bonds. If stocks fall 25% and bonds are unchanged, the portfolio falls to $80,000 with $60,000 in stocks and $20,000 in bonds. Stocks now represent 75%.',
          'A rule targeting 80/20 would redirect about $4,000 from bonds to stocks, assuming cash needs and risk capacity are unchanged. Selling all stocks instead would lock in the decline and create a future re-entry decision.'
        ],
        facts: [
          { label: 'Portfolio after decline', value: '$80,000' },
          { label: 'New stock weight', value: '75%' },
          { label: 'Rebalance amount', value: 'About $4,000' }
        ]
      }
    },

    'budgeting-without-rigidity': {
      deepDiveTitle: 'Use ranges when income or expenses move',
      deepDive: [
        'A variable-income budget should not pretend every month is average. Build fixed commitments around a conservative baseline, keep a buffer between invoices, and use percentages for income above the baseline. This prevents a strong month from permanently increasing recurring expenses.',
        'Sinking funds handle costs that are irregular but predictable, such as annual insurance, winter tires, professional dues, or gifts. Emergency savings are reserved for expenses that are both important and genuinely unexpected.',
        'The review should compare planned totals with actual totals, not judge individual purchases in isolation. If flexible spending repeatedly exceeds the pool, adjust the categories, baseline, or goals so the plan reflects real life instead of generating guilt.'
      ],
      caseStudy: {
        title: 'A freelancer\'s baseline budget',
        label: 'Variable-income example',
        paragraphs: [
          'A freelancer earns between $3,000 and $7,000 a month after tax. The budget uses $3,500 as its baseline: $2,600 for essentials, $300 for annual-cost sinking funds, $300 for long-term goals, and $300 of breathing room.',
          'Income above $3,500 is split 50% to future low-income months, 30% to goals, and 20% to flexible spending. The percentages let a $7,000 month help the future without making the plan feel punitive.'
        ],
        facts: [
          { label: 'Income range', value: '$3K-$7K' },
          { label: 'Baseline', value: '$3,500' },
          { label: 'Above-baseline split', value: '50 / 30 / 20' }
        ]
      },
      sourceKeys: ['fcacBudget', 'fcacEmergency']
    }
  };
}());
