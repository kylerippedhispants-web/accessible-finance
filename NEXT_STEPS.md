# Website and planner next steps

Updated October 23, 2026 (America/Toronto). This checklist covers the selected FIRE
website and planner. Local Demo Mode checks do not validate cloud services or
public launch.

**The website and cloud planner are published at https://accessible-finance.com.**
The owner explicitly requested merge and production deployment without waiting
for the remaining recovery and privacy checks. The October 1 verification recorded
production public delivery and an existing confirmed account's sign-in/saved-plan
load passing; those authenticated checks were not repeated for this UI release.
Recovery completion and explicit storage/log inspection remain pending follow-ups. Earlier preview-15
onboarding, save/reload, account separation, and JSON export/import proofs are
recorded below. Two fictional browser-created plans remain after the earlier
authenticated harness cleanup.

## October 23 mobile performance improvements

- [x] Show the homepage hero immediately and remove reveal delays on narrow
  screens. Keep all reading content usable before JavaScript initializes.
- [x] Serve the existing typography from the site, with hashed WOFF2 assets,
  Latin/Latin-ext subsets, targeted preloads, and upstream OFL licenses.
  Fonts share URLs across the public site and planner for browser cache reuse.
- [x] Keep the mobile cash-flow map closed in the initial HTML. Load its pinned
  diagram libraries only when requested/visible, skip hidden redraws, and retain
  editable totals plus accessible loading, error, timeout and retry states.
- [x] Build the planner's projection table only when opened and reuse its
  unchanged rows during chart inspection.
- [x] Include the public planner landing page in its initial code bundle to
  avoid a second loading roundtrip; keep the other planner pages lazy-loaded.
- [x] Supply appropriately sized homepage photographs and remove unused content
  downloads from the old article redirect.
- [x] Pass 199 unit tests, 63 browser cases, lint, type checks, static validation,
  and both Demo and cloud-required production builds.

Mobile comparisons use three cold visits at 390 × 844 pixels, 4× CPU slowdown,
1.6 Mbps download, and 150 ms added latency, allowing normal cache reuse within
each visit. They are lab observations, not real-user Core Web Vitals or Lighthouse
scores. Do not compare results from different cache policies or unthrottled runs.
Preserve the font filenames' hashes when updating assets and recheck the actual
Netlify cache/security headers after deployment.

## October 20 review recommendations implemented

The review was implemented in the selected website/planner copy. Its release
build preserves the unrelated Tidepost files added to master by PR #17.
The following numbers map to the 22 review findings:

- [x] **1 — Numeric entry:** malformed required or optional numbers invalidate
  the visible draft; collection submissions, preview, save, and export cannot
  silently reuse a previous value.
- [x] **2 — U.S. state tax:** fix Ohio's statutory base and Rhode Island's
  uniform schedule. Remove blanket filing-status scaling. Show verified
  schedules only; unsupported estimates say "Not estimated" and make the
  federal-only limitation explicit.
- [x] **3 — Keyboard and motion:** skip/contents links focus their destination,
  respect reduced motion, and preserve desktop contents navigation. Scenario
  editors and actions restore focus.
- [x] **4 — Contrast:** replace low-contrast text colours on light and dark
  surfaces, including calculator results, captions, and regional footers.
- [x] **5 — Long names:** wrap scenario cards, feedback, chart legends,
  inspectors, summaries, and table headers at narrow widths.
- [x] **6 — Newsletter:** use a readable direct Substack action on phones,
  load desktop modal embeds on demand, provide a fallback, and restore focus
  when closing. Explain that Substack manages subscription email.
- [x] **7 — Accessible data:** provide complete cash-flow values, preserve SVG
  names after redraw, stack the Canadian tax breakdown on phones, and make
  remaining scrolling tables keyboard focusable with instructions.
- [x] **8 — Cash-flow categories:** explicitly classify saving, spending, and
  debt rows; migrate prior saved categories once and retain types after rename.
- [x] **9 — Referral conditions:** correct payout/eligibility wording and link
  current official terms beside the relevant actions.
- [x] **10 — Deployed URLs:** support both pretty and .html URLs for planner
  bridges, preserve cash-flow edition links, and fix footer topic filters.
- [x] **11 — Onboarding failures:** retain entered information and announce
  failed saves with retry guidance.
- [x] **12 — Navigation:** group Learn and Tools, retain Planner and About,
  distinguish quick FIRE calculations from the detailed Canadian planner, and
  replace the journal placeholder with a clear newsletter destination.
- [x] **13 — Homepage:** explain AF's purpose before advanced tools, make the
  beginner route primary, and reduce repeated planner promotion.
- [x] **14 — Assumptions:** label pre-credit/payroll tax results, nominal
  returns, and benefit amounts expressed in dollars at their chosen start age.
- [x] **15 — Wealth context:** distinguish published benchmarks from fictional
  interpolation/composition assumptions, display source years, avoid false
  percentile precision, and collapse secondary views.
- [x] **16 — Reading length:** remove repetitive guide worksheet prose,
  preserve examples/checklists/cautions/sources, and make advanced material
  optional across all 42 guides and the planner guide.
- [x] **17 — Contact:** provide the existing publicly published AF email
  address for questions, corrections, accessibility and privacy requests.
  No response-time promise or new mailbox is implied.
- [x] **18 — Visual states:** show selected authentication controls correctly
  and enlarge small functional text.
- [x] **19 — Financial copy:** clarify RRSP withdrawals and FHSA limits; remove
  unsupported superlatives, generalizations, and unverified About history.
- [x] **20 — Planner language:** replace implementation jargon in everyday
  flows while retaining clear draft/save and privacy explanations.
- [x] **21 — Beginner paths:** add four short routes for spending, unexpected
  costs, investing basics, and retirement accounts, with concrete finish points.
- [x] **22 — Fictional examples:** add Starting out, Variable income, and
  Approaching retirement alongside Alex. No example transfers to a cloud plan.

The test suite includes financial threshold/filing-status cases, invalid-entry
and failed-save cases, fictional-plan ownership and projection checks, keyboard
journeys, and public-page accessibility/reflow at 320, 768, and 1440 pixels.
Run `npm run validate`, then `npx playwright test` against a Demo Mode build.
Production must also pass `PLANNER_REQUIRE_CLOUD=true npm run build` with the
existing public Supabase configuration. Release CI and Netlify status must be
checked against the actual PR/merge commit.

### Follow-ups that require separate evidence

- Complete the existing owner-operated password-recovery check and explicit
  cloud storage/log inspection below; this UI release does not claim them.
- Confirm the published contact mailbox is monitored and exercise receipt of a
  real enquiry only with the owner's authorization.
- Conduct hands-on screen-reader and physical-device testing. Automated axe
  checks and browser viewport tests are useful checks, not certification.
- Expand U.S. state coverage only with official schedules, filing-status rules,
  clear assumptions, and threshold regression tests.

## October 11 site polish and local checks

- [x] Add guide search that combines with topic filters, includes the featured
  guide in the result count, and explains empty results. Make the phone topic
  strip visibly scrollable.
- [x] Open direct educational links in their URL's edition without a mandatory
  first-visit dialog. Preserve the edition switchers and saved home preference.
- [x] Make tablet navigation scroll, improve footer contrast, and correct the
  homepage's nine chart bars to match its existing Year 0–8, 5% example.
- [x] Restore keyboard focus after planner collection actions; announce draft
  changes and retain the explicit Save reminder. Contain long names at 320px,
  retain a compact mobile storage badge, show JSON picker focus, and complete
  the planning guide's contents and return links.
- [x] Validate 63 static pages and 42 guides, lint, TypeScript, 160 unit tests in
  17 suites, and the production build with cloud configuration required.
- [x] Exercise 40 Edge browser cases, including 16 new regressions: 38 passed
  in the initial full run, and the remaining two passed after correcting a new
  test's navigation wait and its expected count for two matching guides.
- [x] Verify the production dependency audit reports zero vulnerabilities.
  Keep the ignored local public configuration byte-for-byte unchanged during
  Demo Mode testing. Evidence is in `.local-tools/polish-20261010/` on this copy;
  these ignored logs are not portable proof.

These checks do not complete the recovery or cloud privacy follow-ups below.
The cloud-only JSON picker focus treatment was reviewed in source; this polish
pass did not sign in to an account or verify that control in a cloud session.

## Completed locally

- [x] Connect the homepage, guides, regional navigation, and standalone tools to
  the Canadian planner. Keep calculator inputs separate from planner inputs.
- [x] Keep an unsaved plan open while educational pages open in a separate tab.
- [x] Repair the redacted test fixture with fictional values and restore local
  tooling without changing dependency versions.
- [x] Polish unavailable-account messaging, demo save wording, and demo exit.
- [x] Fix malformed preview requests and the backup import/export size mismatch.
- [x] Run site, lint, TypeScript, unit, build, browser, and dependency checks.
  See [LOCAL_VALIDATION.json](LOCAL_VALIDATION.json) for the dated local results.
- [x] Fix onboarding's plan ID mismatch before creating income/spending rows.
  Eight new regressions pass, including actual form submission and failed-save
  retry; all 160 tests in 17 suites, TypeScript, lint, and cloud-required build
  pass. Ownership validation is unchanged. The source also passes 24 Edge
  browser checks; actual preview-15 cloud proofs are recorded separately below.

## Completed cloud, preview, and production checks

- [x] Merge [PR #13](https://github.com/kylerippedhispants-web/accessible-finance/pull/13).
  The merged commit `7efd2df6446a94266f1ec23937c28b3deceb2bc8` passed GitHub's
  planner checks. Netlify's production build failed because the required public
  Supabase configuration was missing. On October 1 at 10:57 a.m. Toronto,
  production `/planner/`, `/planner/dashboard`, and `/planner/reset-password`
  still returned 404; the homepage returned 200.
- [x] Publish the cloud safety changes as draft
  [PR #14](https://github.com/kylerippedhispants-web/accessible-finance/pull/14),
  head `451467b1ab028ca5b110dcc4c70d8dfb138a0827`.
  [Planner quality run 36809903915](https://github.com/kylerippedhispants-web/accessible-finance/actions/runs/36809903915)
  passed: 16 unit suites, 152 tests, and 24 browser checks.
- [x] Review and merge the follow-up changes as commit
  `ce61addb0bec1220e3c261e4467238e5811970ef`.
  The updated branch `83fb812db65a284f0239391bb41eac9f2d040fb9` passed
  [Planner quality run 36881349362](https://github.com/kylerippedhispants-web/accessible-finance/actions/runs/36881349362).
  Those source checks preceded the authenticated results and the production
  release recorded below.
- [x] Create the Accessible Finance Free organization and healthy Supabase
  project `accessible-finance-planner` (`drjfjdgzqmvjmrqfeluz`). Its region is West US (Oregon),
  `us-west-2`, not Canada. Keep the database password private.
- [x] Apply all three complete migrations through the Dashboard SQL Editor.
  Run the rollback-only database helper: all nine checks passed, with zero
  Auth users, profiles, and plans immediately after that run; 10 RLS tables and
  40 policies. This historical cleanup does not count later browser-created plans.
  See [SUPABASE_STATUS.json](SUPABASE_STATUS.json) for hashes and evidence.
  Dashboard execution did not manage CLI history; reconcile before `db push`.
- [x] Save the production planner Site URL and ten exact callbacks for
  production, `127.0.0.1:4174`, `localhost:5173`, and Netlify previews 14 and 15.
  Preview 15's dashboard/reset-password entries preserve the prior eight URLs.
  Email and confirmation are enabled; anonymous sign-in/manual linking are off.
- [x] Visually confirm the persisted eight-character minimum and enabled secure
  password change; Save is disabled in the verified settings.
- [x] Review current Supabase Free usage: no quota exceeded, database about
  26 MB of 500 MB, zero monthly active users at that check, and no overage billing.
  Netlify Free is also verified at $0, with about 295 of 300 credits remaining,
  no saved payment method, and no overage charges.
- [x] Verify real Auth/REST/RPC isolation with the two confirmed controlled test
  accounts. Both directions across all ten tables pass; foreign ownership and
  attachments are rejected. Fixtures were removed and original profile fields
  restored before the subsequent browser tests. The two fictional browser plans
  remain; do not rerun the clean-account harness against these populated accounts.
- [x] Configure the project URL and existing public publishable key in ignored
  `.env.local`. Actual anonymous API checks deny access to all 10 tables and the
  save RPC. Public Auth settings confirm email confirmation is enabled. The
  local production build passes with `PLANNER_REQUIRE_CLOUD=true`. Later
  authenticated repository and preview-15 browser results are separate evidence:
  `.local-tools/supabase-setup/public-cloud-validation.json`.
- [x] Configure the two public Supabase values in Netlify, using the existing
  public publishable key. Values apply to all deploy contexts; Free requires
  all scopes. The configured preview build passes. Keep secrets out of client
  variables; retain the production cloud gate.
- [x] Verify sender DNS and save Resend Free SMTP in Supabase. The dedicated key
  has Sending access restricted to the verified auth domain. Confirm Email
  remains enabled; the actual email limit is 25/hour.
- [x] Receive signup confirmations for two controlled inboxes (owner-reported);
  real password sign-in confirms both accounts through Supabase Auth.
- [x] Review Netlify's Free plan, public variables, redirects, and planner
  headers. Rebuild preview 14 as deploy `6abf0657fbb1a09ea1ab46c3`, commit
  `83fb812db65a284f0239391bb41eac9f2d040fb9`. Public configuration validation and
  build pass; all three planner routes return 200. Referenced scripts contain
  the intended Supabase project and exact public key, with no scanned privileged
  credential patterns. This does not establish Auth or email delivery.
  Evidence: `.local-tools/supabase-setup/configured-preview-http.json`.
- [x] Check preview 14 static HTTP delivery: the three planner routes return
  200 with correct planner HTML and expected security headers. Inspected bundles
  lack the intended Supabase project URL/reference and public key, so the preview
  was an unconfigured Demo build at that earlier check. The later configured
  preview above supersedes that historical configuration result. Later
  preview-15 browser evidence is recorded below.
  Evidence: `.local-tools/supabase-setup/deployment-http-checks.json`.
- [x] Build [PR #15](https://github.com/kylerippedhispants-web/accessible-finance/pull/15)
  commit `8acac16b3aaf8fe1970b9103ea00e6cb39fca50a` as successful preview-15 deploy
  `6abf18672a51ee0008e70ca1`.
  [Planner quality run 36956324281](https://github.com/kylerippedhispants-web/accessible-finance/actions/runs/36956324281)
  passes. `.local-tools/supabase-setup/pr15-public-verification.json` verifies seven intended
  file blobs, 197 unrelated files preserved, all three planner routes, and 19
  scripts with the intended public configuration and fixed onboarding module.
- [x] Complete actual preview-15 onboarding in separate confirmed A/B sessions.
  Fictional annual income/spending of $60,000/$30,000 for A and $80,000/$40,000
  for B reached Saved dashboards without the ownership error. Neither session
  showed the other account's name; REST/RPC isolation is proved separately.
- [x] Refresh A's preview-15 session, require sign-in, then reload its saved
  $60,000/$30,000 inputs. Sign-out clears the plan view.
- [x] Download B's real JSON backup with no Auth fields. Reimporting creates only
  an unsaved draft; explicitly choosing Save then reaches Saved status.
- [x] Check the signed-out preview-15 reset route: a current reset link is
  required and no password-entry form is available without a recovery session.
- [x] Merge PR #15 head `efc95f83104ba7a34d0c685573cbbcd5e31cda4b` as master
  `fd3ba75e87effab0a42043fb42ef73dc50ef1107` on October 1. Netlify shows deploy
  `6abf288d7965070008c23118` as Published.
  [Production quality run 36961465028](https://github.com/kylerippedhispants-web/accessible-finance/actions/runs/36961465028)
  passes. The homepage and all three planner routes return 200; planner security
  headers pass and all 19 planner scripts match the verified preview bytes,
  including the public configuration and onboarding fix. Evidence:
  `.local-tools/supabase-setup/production-pr15-http-verification.json`.
- [x] Follow the live homepage's Canada edition and Open FIRE planner link,
  sign in as confirmed account B, and load its existing fictional plan with
  $80,000 annual income/$40,000 spending and the Cloud Plan Saved header.
  Sign-out restored the Welcome back screen and cleared the plan/cloud header.
  The production check made no cloud data writes. Evidence:
  `.local-tools/supabase-setup/production-browser-checks.json`.

## Pending release follow-ups

These checks were incomplete when the owner requested publication; deployment
does not change their status to PASS.

- [ ] Complete recovery for account A. Its request was accepted from preview 15;
  the owner must receive/use the email, enter a new password privately, then
  verify the new password works and the old one fails. Request acceptance is
  not proof of receipt or password change. See [SMTP_SETUP.md](SMTP_SETUP.md).
- [ ] Verify an ordinary signed-in session and used/expired reset links cannot
  authorize password changes. The signed-out direct-visit guard already passes.
- [ ] Inspect browser localStorage/sessionStorage for cloud tokens/records and
  logs for plan data. Refresh/sign-out behavior and Auth-free export pass, but
  do not substitute for this explicit privacy inspection.
- [ ] Verify real-domain signup/recovery callbacks and remaining production
  session/save behavior. Production HTTP delivery, homepage-to-planner navigation,
  sign-in, loading an existing saved plan, and sign-out already pass; those checks do not
  prove recovery or a new production save. See
  [SUPABASE_VERIFICATION.md](SUPABASE_VERIFICATION.md).

## Subsequent coverage and operational follow-ups

- [ ] Exercise browser offline-save failure and competing edits without losing
  the draft. The live repository stale-revision check already passes.
- [ ] Cover large and invalid JSON files in the deployed browser. Normal cloud
  download/import/explicit save passes; local transfer and large repository
  pagination tests are separate evidence.
- [ ] Complete hands-on screen-reader and real narrow-screen device checks.
  Canadian/US navigation and keyboard journeys now have automated browser coverage;
  keep physical-device and deployment evidence distinct from the local baseline.
- [ ] Define and verify account/data deletion and backup/recovery procedures.
  Review privacy, storage, and educational modelling disclosures against the
  configured service; no deletion/recovery procedure is claimed verified here.
- [ ] Monitor free-plan usage, service pauses, email delivery, and backup recovery.
- [ ] Add a clear merge/reload workflow for competing saves and versioned schema
  compatibility tests before introducing another client.
- [ ] Extract shared domain, validation, and calculation packages before starting
  the separate Expo client. Keep the other imported workspaces distinct.
- [ ] Evaluate PWA installation/offline behaviour with explicit cache rules;
  never cache auth tokens or cloud financial records in the public site shell.
- [ ] Add Canadian tax or registered-account rules only after verifying official
  sources, effective dates, and calculation regression fixtures.
