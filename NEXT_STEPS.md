# Website and planner next steps

Updated October 1, 2026 (America/Toronto). This checklist covers the selected FIRE
website and planner. Local Demo Mode checks do not validate cloud services or
public launch.

Browser access is restored and the existing accounts are signed in. Resend's
auth sender domain is verified and the approved automatic SMTP connection is
saved in Supabase. The configured Netlify preview passes public HTTP and bundle
checks. The owner confirmed two test inboxes, and live authenticated repository
checks pass, including cleanup. An onboarding identity bug found during testing
is fixed locally. Its deployed browser check, recovery, and production release
remain pending; new password entry is an owner handoff.

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
  pass. Ownership validation is unchanged.

## Before public launch

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
  Production deployment and authenticated acceptance remain pending.
- [x] Create the Accessible Finance Free organization and healthy Supabase
  project `accessible-finance-planner` (`drjfjdgzqmvjmrqfeluz`). Its region is West US (Oregon),
  `us-west-2`, not Canada. Keep the database password private.
- [x] Apply all three complete migrations through the Dashboard SQL Editor.
  Run the rollback-only database helper: all nine checks passed, with zero
  remaining Auth users, profiles, and plans; 10 RLS tables and 40 policies.
  See [SUPABASE_STATUS.json](SUPABASE_STATUS.json) for hashes and evidence.
  Dashboard execution did not manage CLI history; reconcile before `db push`.
- [x] Save the production planner Site URL and eight exact callbacks for
  production, `127.0.0.1:4174`, `localhost:5173`, and Netlify preview 14.
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
  restored. React/browser isolation remains a separate check.
- [ ] Complete [SUPABASE_VERIFICATION.md](SUPABASE_VERIFICATION.md), recording
  actual database, account, email, and application results separately from Demo
  Mode results. Database and authenticated repository checks pass; recovery and
  deployed application checks remain pending.
- [x] Configure the project URL and existing public publishable key in ignored
  `.env.local`. Actual anonymous API checks deny access to all 10 tables and the
  save RPC. Public Auth settings confirm email confirmation is enabled. The
  local production build passes with `PLANNER_REQUIRE_CLOUD=true`. Authenticated
  account and browser checks remain pending. Evidence:
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
- [ ] Test password recovery using controlled accounts and saved callback URLs.
  [SMTP_SETUP.md](SMTP_SETUP.md) records the verified sender and SMTP connection.
  Recovery inbox receipt and password-change actions remain pending.
- [ ] Test cloud load/save, stale-revision conflicts, sign-out, and signing in
  again after refresh. Check that auth tokens and cloud financial records are
  absent from localStorage/sessionStorage and that logs contain no plan data.
- [ ] Test JSON backup and restore in cloud mode, including a large plan and an
  invalid file. Review imported values before explicitly saving them.
- [ ] Define and verify account/data deletion and backup/recovery procedures.
  Review privacy, storage, and educational modelling disclosures against the
  behaviour of the configured service.
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
  preview above supersedes that configuration result, while cloud/browser
  acceptance remains pending.
  Evidence: `.local-tools/supabase-setup/deployment-http-checks.json`.
- [ ] Check the deployed homepage-to-planner journey, nested planner routes,
  Canadian/US navigation, keyboard access, and a real narrow-screen device.
  Record cloud and deployment results separately from the local baseline.

## After the launch baseline

- [ ] Monitor free-plan usage, service pauses, email delivery, and backup recovery.
- [ ] Add a clear merge/reload workflow for competing saves and versioned schema
  compatibility tests before introducing another client.
- [ ] Extract shared domain, validation, and calculation packages before starting
  the separate Expo client. Keep the other imported workspaces distinct.
- [ ] Evaluate PWA installation/offline behaviour with explicit cache rules;
  never cache auth tokens or cloud financial records in the public site shell.
- [ ] Add Canadian tax or registered-account rules only after verifying official
  sources, effective dates, and calculation regression fixtures.
