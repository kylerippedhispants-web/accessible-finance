import { useEffect, type AnchorHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';

function BackToTopics() {
  return <TopicLink className="text-button guide-back-link" href="#guide-topics">Back to topics <span aria-hidden="true">↑</span></TopicLink>;
}

function openTopic(hash: string) {
    const target = document.getElementById(hash.slice(1));
    if (!target) return;
    if (target instanceof HTMLDetailsElement) target.open = true;
    const focusTarget = target instanceof HTMLDetailsElement ? target.querySelector('summary') : target;
    if (!(target instanceof HTMLDetailsElement)) focusTarget?.setAttribute('tabindex', '-1');
    (focusTarget as HTMLElement)?.focus();
    target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
}

function TopicLink({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} href={href} onClick={(event) => {
    event.preventDefault();
    const hash = event.currentTarget.hash;
    history.replaceState(null, '', hash);
    openTopic(hash);
  }}>{children}</a>;
}

export function GuidePage() {
  useEffect(() => { if (window.location.hash) openTopic(window.location.hash); }, []);
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

      <nav id="guide-topics" className="panel form-panel" aria-labelledby="guide-contents-title">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">On this page</span>
            <h2 id="guide-contents-title">Choose a topic.</h2>
          </div>
        </div>
        <div className="form-actions">
          <TopicLink className="button button-quiet button-small" href="#fire-guide">FIRE estimate</TopicLink>
          <TopicLink className="button button-quiet button-small" href="#adding-inputs">Add inputs &amp; sync</TopicLink>
          <TopicLink className="button button-quiet button-small" href="#baseline">Reliable baseline</TopicLink>
          <TopicLink className="button button-quiet button-small" href="#dollars">Dollar views</TopicLink>
          <TopicLink className="button button-quiet button-small" href="#building-blocks">Plan inputs</TopicLink>
          <TopicLink className="button button-quiet button-small" href="#retirement-guide">Retirement</TopicLink>
          <TopicLink className="button button-quiet button-small" href="#scenario-guide">Scenarios</TopicLink>
          <TopicLink className="button button-quiet button-small" href="#reading-results">Read results</TopicLink>
          <TopicLink className="button button-quiet button-small" href="#privacy-guide">Data and privacy</TopicLink>
          <TopicLink className="button button-quiet button-small" href="#canadian-resources">Canadian resources</TopicLink>
        </div>
      </nav>

      <details id="fire-guide" className="panel form-panel guide-topic" open>
        <summary><h2 id="fire-guide-title"><span className="step-number">01</span>Understand your FIRE estimate</h2></summary>
        <p>FIRE means financial independence, retire early. This planner treats it as a transparent annual cash-flow screen, not a promise.</p>
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
        <BackToTopics />
      </details>

      <details id="adding-inputs" className="panel form-panel guide-topic" open>
        <summary><h2 id="adding-inputs-title"><span className="step-number">02</span>Open the menu to add your inputs</h2></summary>
        <p>The Dashboard shows results. Your detailed inputs live in the planner sections.</p>
        <ol>
          <li>On a phone or narrow screen, select the three-line <strong>Menu</strong> button in the top-right. On a larger screen, the same navigation stays open on the left.</li>
          <li>Choose <Link to="/income">Income</Link>, <Link to="/expenses">Expenses</Link>, <Link to="/assets">Assets</Link>, or <Link to="/debts">Debts</Link>, then select that page&apos;s Add button and submit the form.</li>
          <li>Use <Link to="/retirement">Retirement</Link> for plan-wide assumptions and <Link to="/settings">Profile &amp; settings</Link> for your profile, transfers, and plan details.</li>
        </ol>
        <div className="method-note">
          <strong>How saving and sync work.</strong>
          <p>Submitting a form updates the open draft first. In a signed-in cloud plan, choose <strong>Save changes</strong> in the header to save your inputs to your account; <strong>Saved</strong> confirms the sync. Sign in to the same account on another browser or device to load that saved plan. Sync is explicit, not automatic or real-time. In Demo Mode, Save changes keeps fictional edits only for the current browser session and never uploads them.</p>
        </div>
        <div className="form-actions">
          <Link className="button button-primary" to="/income">Add or review income</Link>
          <Link className="button button-secondary" to="/settings">Review plan settings</Link>
        </div>
        <BackToTopics />
      </details>

      <details id="baseline" className="panel form-panel guide-topic">
        <summary><h2 id="baseline-title"><span className="step-number">03</span>Start with a reliable baseline</h2></summary>
        <p>Your baseline is the plan every scenario is measured against.</p>
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
        <BackToTopics />
      </details>

      <details id="dollars" className="panel form-panel guide-topic">
        <summary><h2 id="dollars-title"><span className="step-number">04</span>Today&apos;s dollars and future dollars</h2></summary>
        <p>Both views use the same projection. Only the way future amounts are displayed changes.</p>
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
        <BackToTopics />
      </details>

      <details id="building-blocks" className="panel form-panel guide-topic">
        <summary><h2 id="building-blocks-title"><span className="step-number">05</span>Build the plan from four parts</h2></summary>
        <p>Each collection feeds the year-by-year projection in a different way.</p>
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
        <BackToTopics />
      </details>

      <details id="retirement-guide" className="panel form-panel guide-topic">
        <summary><h2 id="retirement-guide-title"><span className="step-number">06</span>Make retirement assumptions explicit</h2></summary>
        <p>Retirement begins in the calendar year when the projection reaches your target age.</p>
        <ul>
          <li>Choose whether retirement spending replaces recurring expenses or is added to them. One-time expenses remain in either mode.</li>
          <li>Enter annual nominal investment returns before and after retirement. These rates are before inflation; the planner applies inflation separately.</li>
          <li>Enter CPP and OAS amounts in future dollars at the age payments begin. Annual indexation applies only after that start age. For example, $10,000 received in 20 years has about $6,730 of today’s purchasing power at 2% inflation. The planner does not calculate eligibility or entitlement.</li>
          <li>Supply your own flat effective-tax assumption. Canadian tax brackets, credits, deductions, and registered-account withdrawal tax are not modelled.</li>
          <li>Set a planning end age long enough to show the period you want to inspect; it is the end of the model, not a life-expectancy estimate.</li>
        </ul>
        <div className="form-actions">
          <Link className="button button-primary" to="/retirement">Review retirement assumptions</Link>
        </div>
        <BackToTopics />
      </details>

      <details id="scenario-guide" className="panel form-panel guide-topic">
        <summary><h2 id="scenario-guide-title"><span className="step-number">07</span>Use scenarios to compare, not predict</h2></summary>
        <p>A scenario stores selected differences from the baseline instead of copying the whole plan.</p>
        <ul>
          <li>Use Dashboard what-if controls or a quick preview to see a temporary comparison immediately.</li>
          <li>Return to the baseline often so you know which line represents the plan you actually entered.</li>
          <li>Previewing does not create or sync a scenario. Save the scenario, then use Save changes in the header to keep it for the demo browser session or sync a signed-in cloud plan.</li>
          <li>Compare several plausible inputs rather than treating one scenario as a forecast or probability of success.</li>
        </ul>
        <div className="form-actions">
          <Link className="button button-primary" to="/scenarios">Open scenarios</Link>
          <Link className="button button-secondary" to="/dashboard">Use what-if controls</Link>
        </div>
        <BackToTopics />
      </details>

      <details id="reading-results" className="panel form-panel guide-topic">
        <summary><h2 id="reading-results-title"><span className="step-number">08</span>Read the projection in layers</h2></summary>
        <p>The chart is most useful when you also inspect the cash flow and balances behind the line.</p>
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
        <BackToTopics />
      </details>

      <details id="privacy-guide" className="panel form-panel guide-topic">
        <summary><h2 id="privacy-guide-title"><span className="step-number">09</span>Know where your data goes</h2></summary>
        <p>The planner separates saved inputs from locally calculated projection results.</p>
        <div className="privacy-grid">
          <article>
            <span aria-hidden="true">B</span>
            <div><h3>Browser calculations</h3><p>Projection calculations run on this device. Changing an assumption does not upload the calculated results.</p></div>
          </article>
          <article>
            <span aria-hidden="true">C</span>
            <div><h3>Cloud-saved plan</h3><p>For signed-in users, choosing Save changes sends your plan inputs to your private account. The planner does not write on every keystroke. If you are offline or the cloud plan changed elsewhere, your draft stays open and the planner tells you what to do next. Refreshing requires signing in again.</p></div>
          </article>
          <article>
            <span aria-hidden="true">D</span>
            <div><h3>Demo Mode</h3><p>Saved demo edits stay in this browser tab and are never uploaded. Unsaved edits remain on this page only. Use fictional information only, because browser storage is not a secure place for personal financial data.</p></div>
          </article>
          <article>
            <span aria-hidden="true">J</span>
            <div><h3>Downloadable backup</h3><p>Your backup contains your plan and scenarios, but no passwords or sign-in credentials. Keep the file private and share it only with people you choose.</p></div>
          </article>
        </div>
        <div className="form-actions">
          <Link className="button button-secondary" to="/settings">Open privacy and transfer settings</Link>
        </div>
        <BackToTopics />
      </details>

      <details id="canadian-resources" className="panel form-panel guide-topic">
        <summary><h2 id="canadian-resources-title"><span className="step-number">10</span>Continue with trusted Canadian resources</h2></summary>
        <p>
              These Financial Consumer Agency of Canada pages can help you review the real-world
              information behind your inputs. They are separate from this planner and do not share data with it.
            </p>
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
        <BackToTopics />
      </details>

      <aside className="notice notice-caution" aria-labelledby="guide-disclaimer-title">
        <strong id="guide-disclaimer-title">Educational projections, not advice.</strong>
        <span>Accessible Finance Planner provides projections for informational and educational purposes only. It does not constitute financial, investment, tax, accounting, or legal advice. Results depend entirely on the inputs and assumptions you choose.</span>
      </aside>
    </div>
  );
}
