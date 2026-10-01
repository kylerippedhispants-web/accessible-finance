# Website and planner next steps

Updated September 30, 2026. This checklist covers the selected FIRE website and
planner. Local Demo Mode checks do not validate cloud services or public launch.

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

- [ ] Review [draft PR #13](https://github.com/kylerippedhispants-web/accessible-finance/pull/13)
  and its latest checks. Keep it in draft until the launch requirements below
  are satisfied, then review the release before merging.
- [ ] Confirm the intended Supabase Free project and current account limits.
  Create a project only if needed. Follow [PLANNER_SETUP.md](PLANNER_SETUP.md).
- [ ] Apply the two migrations in order, check grants and RLS using
  [supabase/README.md](supabase/README.md), and verify isolation with two unrelated
  test accounts. Account B must not read, change, or attach rows to A's plan.
- [ ] Configure only the public project URL and publishable key for local cloud
  testing and the intended Netlify build. Keep secrets out of client variables.
  Retain the production cloud-configuration gate.
- [ ] Confirm the actual planner hostname, sign-up redirects, and recovery URLs.
  Configure email delivery within the free-tools requirement, then test
  confirmation and password recovery using accounts outside the project team.
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
  deploy preview before approving a production release.
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
