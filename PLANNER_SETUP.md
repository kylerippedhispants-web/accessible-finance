# Accessible Finance Planner

This repository now builds the existing static Accessible Finance website and a
client-rendered planner mounted at `/planner/`. The repository is a deployment
candidate, not a live production launch: cloud accounts and synchronization
remain disabled until a Supabase project, the included migrations, the two public
build variables, and the production verification steps below are completed. The
local checks do not verify the current public `/planner` URL or Netlify status.
Review and deploy this branch to the intended existing site only after the
cloud and release checks below pass.

Use [NEXT_STEPS.md](NEXT_STEPS.md) for the ordered setup and release checklist,
and [SUPABASE_VERIFICATION.md](SUPABASE_VERIFICATION.md) for cloud acceptance.

## Architecture

```text
                    Supabase Auth + PostgreSQL
                    inputs and sparse scenarios
                              |
                  same account, schema, and RLS
                              |
            +-----------------+-----------------+
            |                                   |
    Web planner on Netlify              Future Expo clients
    React + local calculations          Android and iOS
            |                                   |
            +-------- pure TypeScript ----------+
                     types + finance engine
```

The database stores inputs. `planner-app/src/finance-engine/` calculates yearly
outputs locally and has no React, browser-storage, Supabase, or Netlify
dependency. No Netlify Function, server-side rendering, background job, or
Realtime subscription is used.

## Local setup

Requirements: Node.js 22.12 or newer and npm.

```powershell
cd C:\path\to\accessible-finance
npm.cmd ci
Copy-Item .env.example .env.local
npm.cmd run dev
```

Open `http://localhost:5173/planner/`. Demo Mode works without Supabase values.
For cloud mode, fill `.env.local` with the public values from the intended
Supabase project:

```dotenv
VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=PUBLIC_PUBLISHABLE_OR_LEGACY_ANON_KEY
```

Despite the compatibility-oriented variable name, the current Supabase
publishable browser key is preferred; the legacy `anon` key also works. Both are
public client identifiers protected by RLS. Never use a secret key, service-role
key, database password, management token, or admin credential. Vite embeds every
`VITE_` value in public JavaScript.

## Integrated local preview

To try the educational website and planner together, use the combined build:

```powershell
npm.cmd run build
npm.cmd run preview
```

Open `http://127.0.0.1:4173/` for the website and follow **Open the FIRE planner**.
The planner is served at `/planner/` on the same local address. The homepage,
FIRE and cash-flow tools, guide pages, and regional navigation link to the
Canadian planner. Educational links inside an open plan use a separate tab so
the current draft remains open. Calculator inputs are not automatically copied
into the planner because their models and assumptions differ.

With both Supabase variables absent, this preview uses fictional Demo Mode.
It does not enable cloud saving. Production's cloud-configuration gate remains
in place. `npm run dev` is still the planner-only Vite development server;
rebuild and use `preview` when testing the entire website together.

On this imported Windows copy, portable npm is available in the ignored
`.local-tools` folder. If npm is not on PATH, use:

```powershell
$env:PATH = (Join-Path (Get-Location).Path '.local-tools/bin') + ';' + $env:PATH
node .local-tools/package/bin/npm-cli.js run build
node .local-tools/package/bin/npm-cli.js run preview
```

Browser checks normally use Playwright Chromium. To use an installed Microsoft
Edge instead, set `$env:PLAYWRIGHT_CHANNEL = 'msedge'` before `npm run test:e2e`.
On this copy, also set
`$env:PLAYWRIGHT_BROWSERS_PATH = (Join-Path (Get-Location).Path '.local-tools/browsers')`
to use the locally installed video-recording helper.
The `site-planner-integration.spec.ts` suite checks the complete navigation flow,
an unsaved draft remaining open while reading a guide, and narrow mobile layouts.

## Exact Supabase setup

1. Create one Supabase Free project. Select the desired region and record its
   project reference. Do not put the database password in this repository or in
   Netlify's client variables.
2. In **Authentication > Providers > Email**, enable email/password sign-in.
   Keep email confirmation enabled for production unless there is a deliberate
   reason not to. In the project's Auth password-security settings, require at
   least eight characters and enable secure password change/reauthentication.
   The UI only exposes password updates after a verified `PASSWORD_RECOVERY`
   event; it does not treat an ordinary active session as a reset link.
3. In **Authentication > URL Configuration**, set:

   ```text
   Site URL: https://accessible-finance.com/planner/
   Redirect URL: https://accessible-finance.com/planner/dashboard
   Redirect URL: https://accessible-finance.com/planner/reset-password
   Redirect URL: http://localhost:5173/planner/dashboard
   Redirect URL: http://localhost:5173/planner/reset-password
   ```

   Add the same two exact paths on the local preview origin actually in use
   (currently `http://127.0.0.1:4174`) and on the specific Netlify Deploy Preview
   used for acceptance. Keep production entries exact; avoid broad wildcards.
4. Configure a production SMTP provider in **Project Settings > Authentication >
   SMTP** before public launch. Supabase's built-in email sender is intended for
   testing, is heavily rate-limited, and does not provide a production delivery
   guarantee. Test sign-up confirmation and password recovery end to end.
5. Apply all three migrations in timestamp order. The foundation creates the
   normalized RLS-protected schema; the atomic-save migration adds optimistic
   revisions and the transactional save RPC; the payload-validation migration
   rejects missing required fields before any rows can be changed:

   ```text
   supabase/migrations/20260824010000_planner_foundation.sql
   supabase/migrations/20260825010000_planner_atomic_save.sql
   supabase/migrations/20260930010000_planner_payload_validation.sql
   ```

   The CLI path is recommended:

   ```powershell
   npx.cmd supabase@latest init
   npx.cmd supabase@latest login
   npx.cmd supabase@latest link --project-ref PROJECT_REF
   npx.cmd supabase@latest db push
   ```

   If `supabase/config.toml` already exists, skip `init`. For a new project where
   the CLI cannot be used, run each complete migration once, in order, in the
   Dashboard SQL Editor. Do not mix that approach with `db push` until migration
   history is reconciled.
6. In **Project Settings > API**, copy the project URL and its public publishable
   key into `.env.local` for local development and into Netlify for production.
7. Run both read-only verification queries in `supabase/README.md`. They must show
   10 user-data tables with RLS enabled and four authenticated CRUD policies per
   table.
8. Create two unrelated test accounts. Save a plan with account A, sign out, then
   verify account B cannot select, update, or attach child rows to A's plan. The
   UI is not the security boundary; PostgreSQL RLS and ownership foreign keys are.

Official references: [Supabase migrations](https://supabase.com/docs/guides/deployment/database-migrations),
[row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security),
[redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), and
[custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp), and
[password security](https://supabase.com/docs/guides/auth/password-security).

## Database created by the migrations

| Table | Purpose |
| --- | --- |
| `profiles` | Name, province/territory, birth date, and CAD preference |
| `financial_plans` | Plan identity, base year, assumptions, and optimistic revision |
| `income_sources` | Recurring and one-time income inputs |
| `expenses` | Recurring and one-time expense inputs |
| `assets` | Cash, investment, pension, property, and Canadian account inputs |
| `debts` | Balance, rate, payment, amortization, and extra-payment inputs |
| `retirement_settings` | Retirement horizon, spending, returns, and manual CPP/OAS |
| `scenarios` | Named baseline comparisons |
| `scenario_overrides` | Sparse add/update/delete differences from the baseline |
| `financial_goals` | A normalized Phase 2-ready goal store |

Every table uses UUID primary keys, `created_at`, `updated_at`, and an owner set
from `auth.uid()`. Plan-owned rows use composite owner foreign keys, so a child
cannot be attached to another user's plan. Public/anonymous table access is
revoked. Each table has explicit authenticated SELECT, INSERT, UPDATE, and DELETE
policies. Projection outputs are not stored.

## Authentication and save behaviour

- The landing page supports sign-up, sign-in, forgotten-password email, and Demo
  Mode when cloud configuration is present. Without it, the landing page offers
  fictional Demo Mode and explains that accounts are unavailable.
  `/planner/reset-password` handles the recovery link. Logout is in the app shell.
- Signed-in routes are guarded in the client for navigation. RLS remains the
  actual data-access boundary if a visitor bypasses the UI.
- A signed-in user's latest plan and revision are loaded into application state.
  Changes recalculate immediately in the browser and become dirty. **Save
  changes** sends one logical snapshot to a transactional PostgreSQL RPC; no
  write occurs on each keystroke.
- Saves are explicit, deduplicated while a request is in flight, and use
  optimistic revision matching. A newer edit is never replaced by an older save
  response. If another session saved first, the local draft stays open and the
  UI requires the user to export it if needed or deliberately reload the cloud
  copy. Network and offline failures never present an unsaved draft as saved.
- Demo Mode starts with fictional inputs and stores its edits in origin-wide
  `sessionStorage` under `accessibleFinancePlannerDemoV1`. It does not call
  Supabase. Use fictional values only; exiting Demo Mode removes that item.
- Cloud financial records are not copied into `localStorage`. The official
  Supabase browser SDK holds its authentication session only in the active
  planner page and refreshes it in memory. It does not persist the refresh token
  in origin-wide web storage, so refreshing requires signing in again. The app
  does not inspect, log, or export tokens.
- Exported JSON is versioned, validated, and omits account IDs, auth data,
  credentials, and database timestamps. Imports are limited to 16 MB, validate
  all plan and sparse-scenario fields, reject invalid references, re-key records,
  and remain unsaved until the user explicitly saves.

## Netlify deployment in the existing site

Use the existing Accessible Finance Netlify project; do not create a second
site.

1. Commit this implementation to the branch intended for deployment.
2. In the existing Netlify project's build settings, keep the repository root as
   the base directory. `netlify.toml` supplies:

   ```text
   Build command: npm run build
   Publish directory: dist
   ```

3. Set the Node.js runtime to 22.12 or newer. The repository's `package.json`
   also declares this engine.
4. In **Project configuration > Environment variables**, add
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the same public values
   used locally. Scope them to production and any preview contexts that should
   use this Supabase project. Trigger a new build after changing them. The
   production context sets `PLANNER_REQUIRE_CLOUD=true` in `netlify.toml`, so a
   production build fails instead of silently publishing Demo-only mode when
   either public value is missing. Deploy Previews may remain Demo-only.
5. Deploy the existing site. `scripts/build-site.mjs` copies all legacy static
   pages without changing their URLs; Vite then emits the planner into
   `dist/planner/`.
6. Verify all of the following on the deployed domain:

   ```text
   https://accessible-finance.com/
   https://accessible-finance.com/planner
   https://accessible-finance.com/planner/dashboard
   https://accessible-finance.com/planner/reset-password
   ```

   Refresh the deep routes directly. The scoped `/planner` rewrites in
   `netlify.toml` must serve the planner shell while unrelated legacy URLs and the
   existing 404 continue to behave normally.
7. Complete a production account test: sign up, confirm email, finish onboarding,
   save, sign out, sign in from another browser, and confirm the same plan loads.
   Also test password recovery through the production SMTP path.

Netlify's rewrite behaviour is documented in its
[rewrites and proxies guide](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/).

## Planner routes

```text
/planner/
/planner/reset-password
/planner/onboarding
/planner/dashboard
/planner/income
/planner/expenses
/planner/assets
/planner/debts
/planner/retirement
/planner/scenarios
/planner/profile
/planner/settings
```

The dashboard includes summary metrics, a responsive nominal/today's-dollar net
worth chart, keyboard inspection, chart text summary, and a detailed accessible
table. Income, expenses, assets, and debts have add/edit/delete controls.
Retirement inputs keep CPP and OAS manual. Scenarios store differences and render
baseline/comparison lines. What-if controls update locally and are saved only
when the user creates a scenario. “Estimated retirement age” is the earliest age
tested by the deterministic model that reaches the planning end age without
unfunded cash flow and with non-negative ending net worth; it is a screening
metric, not a probability of success or a recommendation.

## Verification before deployment

```powershell
npm.cmd run validate
npx.cmd playwright install chromium
npm.cmd run test:e2e
npm.cmd audit
git diff --check
```

`validate` runs the legacy static-site validator, Oxlint with warnings denied,
TypeScript, all Vitest suites, and the production build. The Playwright suite checks legacy integration, direct
planner routes, Demo Mode CRUD/session restore, what-if scenarios, serious or
critical axe findings, and viewport overflow down to 320 px.

Pull requests and pushes to `master` also run the same validation, Playwright
Chromium checks, and a production-dependency audit in
`.github/workflows/planner-quality.yml`.

## Privacy and security review

- No privileged key or credential belongs in the browser bundle. Before Vite
  emits assets, `scripts/validate-planner-env.mjs` fails the build unless the URL
  is a credential-free Supabase HTTPS project origin and the key is either an
  `sb_publishable_` key or a legacy JWT with the `anon` role. The runtime repeats
  that validation as defence in depth. Keep repository/provider secret scanning
  enabled; a runtime check alone cannot remove a key already embedded by Vite.
- The planner HTML deliberately omits the public site's analytics, ads,
  newsletter embed, and translation scripts. Because legacy pages on the same
  origin still execute third-party JavaScript, the planner does not persist auth
  tokens in origin-wide storage. Do not turn session persistence back on while
  this origin is shared.
- No plan, balance, scenario, session, or repository payload is written to the
  console. Generic user-facing errors do not echo financial inputs.
- RLS, table grants, constraints, owner foreign keys, sparse-diff checks, and the
  authenticated atomic-save RPC are in the migrations. Frontend filtering is
  never treated as ownership control. Direct legacy table writes remain
  owner-isolated by RLS, but new complete-plan clients should use the RPC so
  every child update participates in one transaction and revision check.
- The app uses no `dangerouslySetInnerHTML`; React renders imported names and
  descriptions as text. JSON imports and downloadable exports share a 16 MB
  UTF-8 byte limit and are schema-validated. The same bound applies before an
  imported file is parsed, so backups above the old 2 MB limit can be restored.
- Planner responses deny framing, isolate opener contexts, disable MIME
  sniffing, limit referrers, and disable camera, microphone, and geolocation. A
  planner-scoped Content Security Policy permits only its own scripts and images,
  Google-hosted brand fonts, and Supabase project connections. It does not alter
  legacy-page policies.

The principal same-origin tradeoff is deliberate: persistent web sign-in is
disabled. To add it safely, either move the authenticated application to a
dedicated origin (while retaining a `/planner` entry route) or remove same-origin
third-party executable scripts and deploy a tested site-wide CSP. Demo
`sessionStorage` is also origin-wide, which is why the UI instructs visitors to
use fictional values only.

Cloud loads read the plan revision before and after their bounded child queries.
If an atomic save commits between those reads, the load is rejected and retried
rather than assembling rows from two revisions. Every reconstructed cloud
snapshot is strictly decoded and schema-validated before it reaches the engine.

## Free-tier constraints to monitor

These limits can change; verify the account's own billing page before launch.

- New Netlify accounts on credit-based Free receive 300 credits per month with a
  hard cap. When the balance is exhausted, all web projects on that team pause
  until the next cycle. Accounts created before September 4, 2025 may still be on
  a legacy plan, so inspect **Usage & billing** rather than assuming the new
  allowance. This build avoids Functions and server rendering, but production
  deploys, bandwidth, and web requests still consume credits. See
  [Netlify's current Free-plan documentation](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/).
- Supabase Free currently includes two active free projects, 500 MB database
  size per project, 50,000 monthly active users, 5 GB egress, and 1 GB storage.
  Free projects may pause after inactivity, and the database becomes read-only if
  its size limit is exceeded. Free does not include production-grade automatic
  backups. Monitor the project's usage page and keep user-controlled JSON
  exports. See [Supabase pricing](https://supabase.com/pricing) and
  [database size behaviour](https://supabase.com/docs/guides/platform/database-size).
- Supabase's default SMTP service is for testing and is restricted to authorized
  team addresses with a very low send limit. Configure custom SMTP before public
  sign-ups. See [Supabase SMTP guidance](https://supabase.com/docs/guides/auth/auth-smtp).

## Calculation boundaries

The projection is deterministic educational modelling, not a tax or benefit
calculator. It currently supports frequency conversion, annual growth and
inflation, recurring contributions, asset growth, property appreciation,
nominal/real dollars, amortized debts and mortgages, retirement transitions,
manual benefits, surplus/withdrawal flow, net worth, and sparse scenarios.

Scheduled asset contributions are limited to modeled cash actually available
after required spending, debt payments, and prior shortfall repayment; unfunded
contributions do not create investment gains. Disabled records are excluded.
When a debt's entered payment is too small for its remaining horizon, the final
period becomes a transparent balloon payoff; zero remaining months means the
balance is due in the first projected year.

It deliberately does **not** implement:

- federal or provincial tax brackets, credits, deductions, payroll deductions,
  capital-gains inclusion, or household tax optimization; taxes use only the
  user's flat effective-tax percentage;
- CPP/OAS eligibility, entitlement, clawbacks, or verified indexation; all
  benefit amounts, start ages, taxability, and growth are manual assumptions;
- TFSA, RRSP, FHSA, RESP, RRIF, or non-registered contribution limits,
  deductions, grants, withdrawal taxation, RRIF minimums, or room tracking;
- stochastic/Monte Carlo returns, sequence-of-returns risk, market data,
  currency conversion, fees, or investment-product details;
- mortgage qualification, renewal, variable-rate changes, lender-specific
  prepayment rules, penalties, or fees;
- automatic sale of property to fund shortfalls or a detailed estate model.

Canadian account names are classifications only. No unverified government rule
or contribution limit is embedded. One-time inputs are scheduled nominal amounts
and are not inflated. Expense and retirement-spending inputs must exclude any
loan or mortgage payments entered under Debts, because the engine models those
cash flows separately. If a regular debt payment is too small to clear the
balance by its stated amortization end, the last period includes a balloon
payoff. Rates are percentage points (`5` means 5%).

## PWA and Phase 2

PWA support is practical but intentionally not enabled in this MVP. It would need
a scoped web-app manifest, branded install icons, an update-safe service worker,
offline/error UI, cache-version tests, and careful rules that cache only the app
shell and static assets—not Supabase API responses or financial records.

Recommended Phase 2 work:

1. Extract `domain`, `finance-engine`, and validation into versioned workspace
   packages without changing their JSON contract.
2. Add an Expo app that uses the same Supabase project, email/password accounts,
   publishable key, relational tables, and RLS policies. Add only the Expo deep
   link/callback URLs required by Supabase Auth.
3. Provide a React Native Supabase auth-storage adapter backed by platform-secure
   credential storage. Do not store tokens or financial plan caches in plain
   AsyncStorage; use an encrypted local database if offline plan caching is added.
4. Reuse the pure projection engine on-device and implement a mobile repository
   adapter for the same database rows. Mobile clients should read inputs, compute
   outputs locally, and explicitly sync changes just like the web client.
5. Build on the existing transactional saves and optimistic revisions with
   merge/conflict UI, schema compatibility tests, user-requested account/data
   deletion, and documented backup/recovery operations.
6. Add verified, versioned Canadian tax and registered-account modules only from
   authoritative sources, with effective dates and regression fixtures.

The future mobile app must never use a service-role key. A user's signed-in JWT
and the same RLS policies are what make desktop-to-mobile balance updates visible
only to that user.

> Accessible Finance Planner provides financial projections for informational
> and educational purposes only. It does not constitute financial, investment,
> tax, accounting, or legal advice.
