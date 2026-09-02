import { Link } from 'react-router-dom';

export function GuidePage() {
  return (
    <div className="page guide-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Planning guide</span>
          <h1>Build a plan you can explain.</h1>
          <p>
            Understand your modeled FIRE amount and year, then build the clear baseline and
            transparent assumptions behind them. Use this guide as you work through your plan.
          </p>
        </div>
      </header>

      <nav className="panel form-panel" aria-labelledby="guide-contents-title">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">On this page</span>
            <h2 id="guide-contents-title">Choose a topic.</h2>
          </div>
        </div>
        <div className="form-actions">
          <a className="button button-quiet button-small" href="#fire-guide">FIRE estimate</a>
          <a className="button button-quiet button-small" href="#adding-inputs">Add inputs &amp; sync</a>
          <a className="button button-quiet button-small" href="#baseline">Reliable baseline</a>
          <a className="button button-quiet button-small" href="#dollars">Dollar views</a>
          <a className="button button-quiet button-small" href="#building-blocks">Plan inputs</a>
          <a className="button button-quiet button-small" href="#retirement-guide">Retirement</a>
          <a className="button button-quiet button-small" href="#scenario-guide">Scenarios</a>
          <a className="button button-quiet button-small" href="#reading-results">Read results</a>
          <a className="button button-quiet button-small" href="#privacy-guide">Data and privacy</a>
        </div>
      </nav>

      <section id="fire-guide" className="panel form-panel" aria-labelledby="fire-guide-title">
        <div className="panel-heading">
          <div>
            <span className="step-number">01</span>
            <h2 id="fire-guide-title">Understand your FIRE estimate</h2>
            <p>FIRE means financial independence, retire early. This planner treats it as a transparent annual cash-flow screen, not a promise.</p>
          </div>
        </div>
        <div className="privacy-grid">
          <article>
            <span aria-hidden="true">Y</span>
            <div><h3>Estimated FIRE year</h3><p>The earliest tested calendar year when earned income can stop, every modeled cash flow stays funded through your plan horizon, and ending net worth remains non-negative.</p></div>
          </article>
          <article>
            <span aria-hidden="true">$</span>
            <div><h3>Modeled FIRE amount</h3><p>Cash, investments, pensions, and other non-property assets available at the opening of that year, shown in today&apos;s dollars and nominal dollars. Debt payments remain in cash flow, so debt is not subtracted again. It is not a 4% rule target.</p></div>
          </article>
          <article>
            <span aria-hidden="true">H</span>
            <div><h3>Why home equity is separate</h3><p>The projection appreciates property but never assumes a sale. Property therefore contributes to net worth but not to the FIRE amount used to fund spending.</p></div>
          </article>
          <article>
            <span aria-hidden="true">P</span>
            <div><h3>Planned versus estimated</h3><p>Your planned retirement age is the date you want to test. The estimated FIRE age is the earliest annual boundary that passes the model&apos;s funding screen.</p></div>
          </article>
        </div>
        <div className="method-note">
          <strong>Why the result is a year, not an exact date.</strong>
          <p>The finance engine works in calendar years and reports end-of-year ages and balances. A precise month or day would imply accuracy the model does not have.</p>
        </div>
        <aside className="notice notice-caution" aria-label="FIRE estimate limitations">
          <strong>Modeled availability is not legal or tax availability.</strong>
          <span>Account access rules, withdrawal tax, contribution limits, fees, market volatility, sequence risk, and property sales are not modeled. Review the amount alongside every assumption below.</span>
        </aside>
        <div className="form-actions">
          <Link className="button button-primary" to="/dashboard">See my FIRE outlook</Link>
          <Link className="button button-secondary" to="/retirement">Review goal &amp; assumptions</Link>
        </div>
      </section>

      <section id="adding-inputs" className="panel form-panel" aria-labelledby="adding-inputs-title">
        <div className="panel-heading">
          <div>
            <span className="step-number">02</span>
            <h2 id="adding-inputs-title">Open the menu to add your inputs</h2>
            <p>The Dashboard shows results. Your detailed inputs live in the planner sections.</p>
          </div>
        </div>
        <ol>
          <li>On a phone or narrow screen, select the three-line <strong>Menu</strong> button in the top-right. On a larger screen, the same navigation stays open on the left.</li>
          <li>Choose <Link to="/income">Income</Link>, <Link to="/expenses">Expenses</Link>, <Link to="/assets">Assets</Link>, or <Link to="/debts">Debts</Link>, then select that page&apos;s Add button and submit the form.</li>
          <li>Use <Link to="/retirement">Retirement</Link> for plan-wide assumptions and <Link to="/settings">Profile &amp; settings</Link> for your profile, transfers, and plan details.</li>
        </ol>
        <div className="method-note">
          <strong>How saving and sync work.</strong>
          <p>Submitting a form updates the open draft first. In a signed-in cloud plan, choose <strong>Save changes</strong> in the header to send validated inputs to Supabase; <strong>Saved</strong> confirms the sync. Sign in to the same account on another browser or device to load that saved plan. Sync is explicit, not automatic or real-time. In Demo Mode, Save changes keeps fictional edits only for the current browser session and never uploads them.</p>
        </div>
        <div className="form-actions">
          <Link className="button button-primary" to="/income">Add or review income</Link>
          <Link className="button button-secondary" to="/settings">Review plan settings</Link>
        </div>
      </section>

      <section id="baseline" className="panel form-panel" aria-labelledby="baseline-title">
        <div className="panel-heading">
          <div>
            <span className="step-number">03</span>
            <h2 id="baseline-title">Start with a reliable baseline</h2>
            <p>Your baseline is the plan every scenario is measured against.</p>
          </div>
        </div>
        <ol>
          <li>
            Confirm your profile, projection year, and plan name in <Link to="/settings">Settings</Link>.
            Age-based results depend on the birth date and base year you enter.
          </li>
          <li>
            Add the income, spending, balances, and debts that belong in the projection. Use start and
            end years when something is temporary, and disable records you want the engine to ignore.
          </li>
          <li>
            Keep debt payments out of Expenses when the same loan is entered under Debts. The engine
            already treats scheduled debt payments as required cash flow.
          </li>
          <li>
            Review the first modelled year on the <Link to="/dashboard">Dashboard</Link>. It is the
            quickest place to catch a missing income source, duplicated expense, or unexpected debt payment.
          </li>
        </ol>
        <div className="form-actions">
          <Link className="button button-primary" to="/dashboard">Review dashboard</Link>
          <Link className="button button-secondary" to="/settings">Review plan details</Link>
        </div>
      </section>

      <section id="dollars" className="panel form-panel" aria-labelledby="dollars-title">
        <div className="panel-heading">
          <div>
            <span className="step-number">04</span>
            <h2 id="dollars-title">Today&apos;s dollars and future dollars</h2>
            <p>Both views use the same projection. Only the way future amounts are displayed changes.</p>
          </div>
        </div>
        <div className="privacy-grid">
          <article>
            <span aria-hidden="true">N</span>
            <div>
              <h3>Nominal dollars</h3>
              <p>Shows the dollar amount modelled in each future year, including the growth and inflation assumptions attached to your inputs.</p>
            </div>
          </article>
          <article>
            <span aria-hidden="true">T</span>
            <div>
              <h3>Today&apos;s dollars</h3>
              <p>Converts projected amounts back to base-year purchasing power using your general inflation assumption.</p>
            </div>
          </article>
        </div>
        <div className="method-note">
          <strong>Keep the distinction clear.</strong>
          <p>Changing the chart view does not change cash flow, balances, or investment growth. It only changes how projection values are presented.</p>
        </div>
      </section>

      <section id="building-blocks" className="panel form-panel" aria-labelledby="building-blocks-title">
        <div className="panel-heading">
          <div>
            <span className="step-number">05</span>
            <h2 id="building-blocks-title">Build the plan from four parts</h2>
            <p>Each collection feeds the year-by-year projection in a different way.</p>
          </div>
        </div>
        <div className="privacy-grid">
          <article>
            <span aria-hidden="true">I</span>
            <div>
              <h3><Link to="/income">Income</Link></h3>
              <p>Monthly, biweekly, and annual amounts are converted to annual cash flow. Recurring sources can grow, end, or stop at retirement; one-time income appears only in its scheduled year.</p>
            </div>
          </article>
          <article>
            <span aria-hidden="true">E</span>
            <div>
              <h3><Link to="/expenses">Expenses</Link></h3>
              <p>Recurring expenses follow their own inflation assumptions. One-time expenses occur once and are not inflated. Retirement spending can later replace or add to recurring expenses.</p>
            </div>
          </article>
          <article>
            <span aria-hidden="true">A</span>
            <div>
              <h3><Link to="/assets">Assets</Link></h3>
              <p>Starting values grow from your return or appreciation assumptions. Scheduled contributions are funded only when modelled cash is available after required outflows and prior shortfalls.</p>
            </div>
          </article>
          <article>
            <span aria-hidden="true">D</span>
            <div>
              <h3><Link to="/debts">Debts</Link></h3>
              <p>Balances are reduced using the payment, frequency, rate, amortization, and extra payment you enter. A balance due now, or still owing at the end of its schedule, is paid as a final balloon amount.</p>
            </div>
          </article>
        </div>
        <aside className="notice notice-caution" aria-label="Canadian account limitation">
          <strong>Account labels are not tax rules.</strong>
          <span>TFSA, RRSP, FHSA, RESP, RRIF, and non-registered labels organize assets. The planner does not calculate contribution room, deductions, grants, minimum withdrawals, or withdrawal tax.</span>
        </aside>
      </section>

      <section id="retirement-guide" className="panel form-panel" aria-labelledby="retirement-guide-title">
        <div className="panel-heading">
          <div>
            <span className="step-number">06</span>
            <h2 id="retirement-guide-title">Make retirement assumptions explicit</h2>
            <p>Retirement begins in the calendar year when the projection reaches your target age.</p>
          </div>
        </div>
        <ul>
          <li>Choose whether retirement spending replaces recurring expenses or is added to them. One-time expenses remain in either mode.</li>
          <li>Enter separate investment return assumptions before and after retirement.</li>
          <li>Enter CPP and OAS amounts, start ages, taxability, and growth manually. The planner does not calculate eligibility or entitlement.</li>
          <li>Supply your own flat effective-tax assumption. Canadian tax brackets, credits, deductions, and registered-account withdrawal tax are not modelled.</li>
          <li>Set a planning end age long enough to show the period you want to inspect; it is the end of the model, not a life-expectancy estimate.</li>
        </ul>
        <div className="form-actions">
          <Link className="button button-primary" to="/retirement">Review retirement assumptions</Link>
        </div>
      </section>

      <section id="scenario-guide" className="panel form-panel" aria-labelledby="scenario-guide-title">
        <div className="panel-heading">
          <div>
            <span className="step-number">07</span>
            <h2 id="scenario-guide-title">Use scenarios to compare, not predict</h2>
            <p>A scenario stores selected differences from the baseline instead of copying the whole plan.</p>
          </div>
        </div>
        <ul>
          <li>Use Dashboard what-if controls or a quick preview to see a temporary comparison immediately.</li>
          <li>Return to the baseline often so you know which line represents the plan you actually entered.</li>
          <li>Previewing does not create or sync a scenario. Save the scenario, then use Save changes in the header to send it to the cloud.</li>
          <li>Compare several plausible inputs rather than treating one scenario as a forecast or probability of success.</li>
        </ul>
        <div className="form-actions">
          <Link className="button button-primary" to="/scenarios">Open scenarios</Link>
          <Link className="button button-secondary" to="/dashboard">Use what-if controls</Link>
        </div>
      </section>

      <section id="reading-results" className="panel form-panel" aria-labelledby="reading-results-title">
        <div className="panel-heading">
          <div>
            <span className="step-number">08</span>
            <h2 id="reading-results-title">Read the projection in layers</h2>
            <p>The chart is most useful when you also inspect the cash flow and balances behind the line.</p>
          </div>
        </div>
        <div className="privacy-grid">
          <article>
            <span aria-hidden="true">1</span>
            <div><h3>Starting position</h3><p>Starting net worth uses enabled balances that exist at the beginning of the base year. Projection rows show end-of-year results after that year&apos;s activity.</p></div>
          </article>
          <article>
            <span aria-hidden="true">2</span>
            <div><h3>Available savings</h3><p>This is net income less expenses and required debt payments, before scheduled asset contributions. It can be negative.</p></div>
          </article>
          <article>
            <span aria-hidden="true">3</span>
            <div><h3>Contributions and withdrawals</h3><p>Contributions cannot exceed modelled available cash. A shortfall first uses available non-property assets; any remainder becomes a liability.</p></div>
          </article>
          <article>
            <span aria-hidden="true">4</span>
            <div><h3>Net worth</h3><p>Total assets less total liabilities produces the line on the chart. Inspect individual years instead of relying only on the final point.</p></div>
          </article>
          <article>
            <span aria-hidden="true">5</span>
            <div><h3>Estimated FIRE age and year</h3><p>This screening metric checks the entire projection for unfunded cash flow, then finds the earliest tested retirement year that reaches the plan end with non-negative net worth. It is not a success rate or recommendation.</p></div>
          </article>
          <article>
            <span aria-hidden="true">6</span>
            <div><h3>Model boundaries</h3><p>Returns are deterministic. The projection does not include market volatility, sequence risk, fees, currency changes, property sales, or unentered future events.</p></div>
          </article>
        </div>
        <div className="form-actions">
          <Link className="button button-primary" to="/dashboard">Inspect the projection</Link>
        </div>
      </section>

      <section id="privacy-guide" className="panel form-panel" aria-labelledby="privacy-guide-title">
        <div className="panel-heading">
          <div>
            <span className="step-number">09</span>
            <h2 id="privacy-guide-title">Know where your data goes</h2>
            <p>The planner separates saved inputs from locally calculated projection results.</p>
          </div>
        </div>
        <div className="privacy-grid">
          <article>
            <span aria-hidden="true">B</span>
            <div><h3>Browser calculations</h3><p>Projection calculations run on this device. Changing an assumption does not send projection output to Supabase or a Netlify Function.</p></div>
          </article>
          <article>
            <span aria-hidden="true">C</span>
            <div><h3>Cloud-saved plan</h3><p>For signed-in users, an explicit save sends validated plan inputs to Supabase. The planner does not write on every keystroke. If you are offline or the cloud plan changed elsewhere, your draft stays open and the planner tells you what to do next. Refreshing requires signing in again.</p></div>
          </article>
          <article>
            <span aria-hidden="true">D</span>
            <div><h3>Demo Mode</h3><p>Demo changes stay in browser session storage and are never uploaded. Use fictional information only, because browser storage is not a secure place for personal financial data.</p></div>
          </article>
          <article>
            <span aria-hidden="true">J</span>
            <div><h3>JSON transfer</h3><p>Exports omit authentication data and cloud ownership metadata, but the downloaded file still contains your plan. Store and share it with appropriate care.</p></div>
          </article>
        </div>
        <div className="form-actions">
          <Link className="button button-secondary" to="/settings">Open privacy and transfer settings</Link>
        </div>
      </section>

      <section className="panel form-panel" aria-labelledby="canadian-resources-title">
        <div className="panel-heading">
          <div>
            <span className="step-number">10</span>
            <h2 id="canadian-resources-title">Continue with trusted Canadian resources</h2>
            <p>
              These Financial Consumer Agency of Canada pages can help you review the real-world
              information behind your inputs. They are separate from this planner and do not share data with it.
            </p>
          </div>
        </div>
        <div className="privacy-grid">
          <article>
            <span aria-hidden="true">B</span>
            <div>
              <h3><a href="https://www.canada.ca/en/financial-consumer-agency/services/make-budget.html" target="_blank" rel="noreferrer">Making a budget<span className="sr-only"> (opens in a new tab)</span></a></h3>
              <p>Review income and spending using recent pay information, bills, and account statements.</p>
            </div>
          </article>
          <article>
            <span aria-hidden="true">G</span>
            <div>
              <h3><a href="https://www.canada.ca/en/financial-consumer-agency/services/savings-investments/savings-investment-goals.html" target="_blank" rel="noreferrer">Savings and investment goals<span className="sr-only"> (opens in a new tab)</span></a></h3>
              <p>Think through a goal, amount, timeframe, and how your comfort with risk may affect your choices.</p>
            </div>
          </article>
          <article>
            <span aria-hidden="true">D</span>
            <div>
              <h3><a href="https://www.canada.ca/en/financial-consumer-agency/services/debt.html" target="_blank" rel="noreferrer">Managing debt<span className="sr-only"> (opens in a new tab)</span></a></h3>
              <p>Learn about debt, repayment options, changing interest rates, and when to seek qualified help.</p>
            </div>
          </article>
          <article>
            <span aria-hidden="true">R</span>
            <div>
              <h3><a href="https://www.canada.ca/en/financial-consumer-agency/services/retirement-planning.html" target="_blank" rel="noreferrer">Retirement planning<span className="sr-only"> (opens in a new tab)</span></a></h3>
              <p>Explore retirement income sources, spending considerations, inflation, public pensions, and checklists.</p>
            </div>
          </article>
        </div>
      </section>

      <aside className="notice notice-caution" aria-labelledby="guide-disclaimer-title">
        <strong id="guide-disclaimer-title">Educational projections, not advice.</strong>
        <span>Accessible Finance Planner provides projections for informational and educational purposes only. It does not constitute financial, investment, tax, accounting, or legal advice. Results depend entirely on the inputs and assumptions you choose.</span>
      </aside>
    </div>
  );
}
