# Website and planner next steps

Updated October 1, 2026 (America/Toronto). This checklist covers the selected FIRE
website and planner. Local Demo Mode checks do not validate cloud services or
public launch.

The browser connection is currently unavailable, blocking further Dashboard
configuration and authenticated browser checks. The recorded database results
remain valid; public API and local build checks can continue separately.

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
- [ ] Complete review and merge the follow-up changes before production release.
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
- [ ] Review current Free usage before launch.
- [ ] Verify real Auth/REST/browser isolation with two controlled test accounts.
  Account B must not read, change, delete, or attach rows to A's plan. The passed
  transactional SQL tests do not establish browser or Data API acceptance.
- [ ] Complete [SUPABASE_VERIFICATION.md](SUPABASE_VERIFICATION.md), recording
  actual database, account, email, and application results separately from Demo
  Mode results. Database verification passed; email and application checks remain
  pending.
- [x] Configure the project URL and existing public publishable key in ignored
  `.env.local`. Actual anonymous API checks deny access to all 10 tables and the
  save RPC. Public Auth settings confirm email confirmation is enabled. The
  local production build passes with `PLANNER_REQUIRE_CLOUD=true`. Authenticated
  account and browser checks remain pending. Evidence:
  `.local-tools/supabase-setup/public-cloud-validation.json`.
- [ ] Configure the two public Supabase values for the intended Netlify build.
  Keep secrets out of client variables; retain the production cloud gate.
- [ ] Configure SMTP sender DNS and email delivery within the free-tools
  requirement, then test real signup confirmation and password recovery using
  controlled accounts outside the project team and the saved callback URLs.
  [SMTP_SETUP.md](SMTP_SETUP.md) prepares the Resend Free steps; actual account,
  sender DNS, SMTP configuration, and inbox tests remain pending.
- [ ] Test cloud load/save, stale-revision conflicts, sign-out, and signing in
  again after refresh. Check that auth tokens and cloud financial records are
  absent from localStorage/sessionStorage and that logs contain no plan data.
- [ ] Test JSON backup and restore in cloud mode, including a large plan and an
  invalid file. Review imported values before explicitly saving them.
- [ ] Define and verify account/data deletion and backup/recovery procedures.
  Review privacy, storage, and educational modelling disclosures against the
  behaviour of the configured service.
- [ ] Review the existing Netlify project, its current free-plan usage, build
  variables, redirects, and planner security headers. Validate a configured
  deploy preview before production release.
- [x] Check preview 14 static HTTP delivery: the three planner routes return
  200 with correct planner HTML and expected security headers. Inspected bundles
  lack the intended Supabase project URL/reference and public key, so the preview
  remains an unconfigured Demo build. This does not pass cloud/browser acceptance.
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
