# Supabase Free setup and cloud verification

Updated October 1, 2026 (America/Toronto). **The Free project is healthy, all
three migrations are applied, and the nine transactional database checks pass.**
Anonymous Data API denial and a local build with the production cloud gate also pass.
SMTP, real account and browser flows, Netlify public build variables, configured preview,
and production verification remain PENDING. Database results do not establish
email delivery or end-to-end application readiness. See
[SUPABASE_STATUS.json](SUPABASE_STATUS.json) for the recorded observations and
migration hashes.

The browser connection is currently unavailable, preventing further Dashboard
setup and authenticated browser checks. This is an operational blocker; it does
not invalidate the recorded database results. Public HTTP/API and local build
checks can be recorded separately as they finish.

Organization: Accessible Finance (`xwbugaccilzeirzhhprs`). Project:
`accessible-finance-planner` (`drjfjdgzqmvjmrqfeluz`). The owner created it in
**West US (Oregon), `us-west-2`**, not Canada.

Use this checklist with [PLANNER_SETUP.md](PLANNER_SETUP.md) and the current
[database instructions](supabase/README.md). Keep the project, SMTP service,
and existing Netlify site on their free plans; do not enable paid add-ons.

## 1. Project setup and remaining configuration

1. The account, organization, and Free project above are created. Keep the
   database password private and review current free-plan usage before release.
   Custom SMTP is included; leaked-password protection,
   configurable session timeouts, and single-session enforcement are not.
   Free projects can pause after one week of inactivity. [Free-plan details](https://supabase.com/pricing)
2. Email/password and **Confirm Email** are enabled; anonymous sign-in and
   manual account linking are disabled. The persisted eight-character minimum
   and enabled secure password change were visually confirmed in the saved
   settings. Confirm the policy matches the app and use email-link expiry of
   one hour or less.
   Do not disable confirmation to work around mail delivery. [Production checklist](https://supabase.com/docs/guides/deployment/going-into-prod)
3. All three complete migrations were applied through the Dashboard SQL Editor:
   foundation, atomic save, then `20260930010000_planner_payload_validation.sql`.
   Do not replay them. The CLI migration-history table was absent at preflight;
   Dashboard execution does not manage that history. Reconcile history before
   any later `supabase db push`.
4. The public project URL and existing `sb_publishable_` browser key are now
   configured in ignored `.env.local`. The actual anonymous API checks and local
   production build with `PLANNER_REQUIRE_CLOUD=true` pass. Authenticated account
   and browser checks remain pending.
   Netlify configuration remains pending. Configure only `VITE_SUPABASE_URL`
   and `VITE_SUPABASE_ANON_KEY` in the intended Netlify build contexts. The second variable
   accepts the public `sb_publishable_` browser key (preferred) or legacy `anon`
   key. **No secret/service-role key, database password, management token, or
   SMTP credential belongs in frontend code, Netlify environment variables,
   commits, logs, screenshots, or exports.** SMTP credentials belong only in
   Supabase's SMTP settings. Rebuild after changing public values; keep
   `PLANNER_REQUIRE_CLOUD=true` for production.

## 2. Set the exact callback URLs

**Saved:** Site URL `https://accessible-finance.com/planner/` and all eight
exact Redirect URLs below. They match the callbacks in
`planner-app/src/auth/AuthContext.tsx`. Saving the allowlist does not verify
actual confirmation or recovery delivery.

| Environment | Signup confirmation | Password recovery |
| --- | --- | --- |
| Production | `https://accessible-finance.com/planner/dashboard` | `https://accessible-finance.com/planner/reset-password` |
| Local cloud preview | `http://127.0.0.1:4174/planner/dashboard` | `http://127.0.0.1:4174/planner/reset-password` |
| Local Vite development | `http://localhost:5173/planner/dashboard` | `http://localhost:5173/planner/reset-password` |
| Netlify preview 14 | `https://deploy-preview-14--accessiblefinance.netlify.app/planner/dashboard` | `https://deploy-preview-14--accessiblefinance.netlify.app/planner/reset-password` |

Use the matching local origin and port; `127.0.0.1` and `localhost` are different
origins. If the actual preview origin changes, replace its two exact
entries before testing. Remove obsolete preview entries after testing. The
production domain must serve the candidate before its final callback smoke test.
[Supabase redirect guidance](https://supabase.com/docs/guides/auth/redirect-urls)

## 3. Configure free email delivery

The [Resend Free setup checklist](SMTP_SETUP.md) is prepared. Actual SMTP
configuration, sender-domain access, account setup, and delivery remain PENDING.

The default Supabase sender only delivers to organization-team addresses and
allows two messages per hour. It cannot validate public signup. Choose a free
SMTP service: Resend currently allows 3,000 emails/month and 100/day; Brevo allows
300/day with its free branding. Check the selected account's current limits.
[Supabase SMTP restrictions](https://supabase.com/docs/guides/auth/auth-smtp),
[Resend pricing](https://resend.com/pricing),
[Brevo limits](https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan)

Verify a sender on the existing domain or a dedicated auth subdomain using the
provider's DNS records (SPF/DKIM and the appropriate DMARC policy). Preserve
existing website and mail records. The domain's authoritative nameservers were
verified as Cloudflare on September 30; sender records belong in that Cloudflare
zone, and account access remains unverified. For Resend, the documented Supabase settings
are `smtp.resend.com`, port `465`, username `resend`, and an API key as the SMTP
password. Disable link tracking so auth links are not rewritten. Keep auth
messages separate from newsletters. Supabase's initial custom-SMTP limit is
30 messages/hour; provider limits apply as well.
[Resend integration](https://resend.com/docs/send-with-supabase-smtp),
[Supabase email guidance](https://supabase.com/docs/guides/auth/auth-smtp)

Send verification messages only to owner-authorized, controlled test inboxes
outside the Supabase organization team. Record receipt and successful link use,
without recording the link, OTP, password, or token. Admin-created users and manually generated links can
test application mechanics but do not prove normal email delivery. A successful
recovery API response alone is insufficient: nonexistent accounts intentionally
receive a success response without an email.
[Password recovery behavior](https://supabase.com/docs/guides/auth/passwords)

## 4. Verify the database and application

Completed on October 1: preflight found no public tables, no non-internal
`auth.users` triggers, and no CLI history table. Each complete migration then
reported success. One editor-append attempt repeated the foundation and failed
with `profiles already exists`; the schema was rechecked before applying only
the missing scripts.

The rollback helper returned `all_database_checks_passed = true` and
`checks_completed = 9`. A separate post-check found zero Auth users, profiles,
and plans; removed temporary results; 10 RLS tables; 40 policies; and the plan
revision column. Local evidence is retained in ignored
`.local-tools/supabase-setup/database-checks.txt`, `cleanup-checks.txt`, and
`database-checks-passed.jpg`. These are recorded database observations, not
proof of Auth, REST, browser, or SMTP behavior.

For a later deliberate recheck, use the schema queries in `supabase/README.md`
and review and run the **whole** helper
`supabase/verification/planner-cloud-checks.sql` in one trusted SQL Editor
session on this project. It is a verification transaction, not a migration: it
creates fictional fixtures, tests operations under authenticated/anonymous
roles, and ends with `ROLLBACK`. Expect exactly **nine PASS rows**,
`all_database_checks_passed = true`, and the rollback acknowledgement. Any FAIL,
missing result, or interrupted transaction leaves verification incomplete. If
interrupted, roll back in the same connection or close it; never commit the
fixtures. These SQL tests do not exercise browser authentication or SMTP.

The helper itself sends no account emails. Before using it on a pre-existing
project, inspect additional `auth.users` triggers: inserting synthetic users
could invoke external webhooks or mail integrations whose effects cannot be
rolled back.

Record each result as PASS, FAIL, or PENDING with its date, project reference,
candidate commit/deploy URL, and a concise redacted observation. Keep test plan
values fictional. The October 1 database results are separated from pending
application checks below.

Public HTTP checks on October 1 at **10:57 a.m. Toronto** found the production
homepage available, but `/planner/`, `/planner/dashboard`, and
`/planner/reset-password` all returned 404. Those three preview-14 routes
returned 200 with the planner HTML and expected security headers. Its inspected
bundles lacked the intended Supabase project URL/reference and public key,
indicating an unconfigured Demo build. This verifies static delivery only, not
browser behavior or cloud operations. The redacted report is
`.local-tools/supabase-setup/deployment-http-checks.json`.

| Check | Status | Evidence / remaining action |
| --- | --- | --- |
| Account, Free plan, project, region | PASS | Healthy project `drjfjdgzqmvjmrqfeluz`; Free organization; West US (Oregon), `us-west-2`; October 1 |
| Three migrations and schema checks | PASS | Dashboard success for all three; 10 RLS tables, 40 policies, revision present; helper checked RPC security; October 1 |
| Transactional database helper and cleanup | PASS | Nine checks, aggregate true; Auth users/profiles/plans all zero; temporary results removed; October 1 |
| Auth provider and callback settings | PASS | Email/confirmation enabled; anonymous/manual linking off; Site URL plus eight exact callbacks saved; October 1 |
| Password-policy persistence | PASS | Saved settings visually confirmed: minimum 8, secure password change on, Save disabled; `.local-tools/supabase-setup/auth-email-security.jpg`; October 1 |
| Local public configuration | PASS | Project URL and existing public publishable key saved to ignored `.env.local`; October 1 |
| Anonymous public API boundary | PASS | All 10 tables and `save_planner_snapshot` denied with HTTP 401 / `42501`; public Auth settings return 200 with email confirmation enabled; no users, emails, or data created |
| Cloud-required local build | PASS | `.env.local` active, `PLANNER_REQUIRE_CLOUD=true`, validated public configuration, build exit 0; `.local-tools/supabase-setup/public-cloud-validation.json` |
| Netlify public build configuration | PENDING | Set and verify public project URL/browser key in intended build contexts; no privileged values |
| Sender verification and delivery | PENDING | Free SMTP account; DNS verified; controlled external-team inbox receives confirmation |
| New external-user account | PENDING | Normal signup → received confirmation → correct callback → onboarding → sign-in |
| Cloud save and reload | PENDING | Save fictional plan; sign out; sign in in another browser; same saved inputs load |
| Browser account isolation | PENDING | Account B cannot read, change, delete, or attach rows to A's plan; test API boundary, not just UI |
| Competing saves and offline failure | PENDING | Stale revision rejected; local draft preserved; failed save never shown as saved |
| Password recovery | PENDING | Public reset form → received email → intended reset page → new password works; old password fails |
| Recovery guard | PENDING | Direct/reset-page visit or ordinary session cannot change a password without a valid recovery event; used/expired link fails safely |
| Session and privacy | PENDING | Refresh requires sign-in; sign-out clears auth; no tokens/cloud records in localStorage or sessionStorage; no plan data in logs |
| Backup/import and Demo Mode | PENDING | Export/reimport and large/invalid files checked; import remains unsaved until Save; Demo makes no Supabase writes |
| Preview 14 static HTTP delivery | PASS | Three planner routes return 200 with planner HTML/security headers; bundle remains unconfigured for Supabase; October 1, 10:57 a.m. Toronto |
| Candidate preview | PENDING | Cloud flow, deep-route refresh, mobile/keyboard use, headers, and legacy navigation pass on the configured preview |
| Current production planner availability | FAIL | `/planner/`, `/planner/dashboard`, and `/planner/reset-password` each return 404; October 1, 10:57 a.m. Toronto |
| Production smoke test | PENDING | After release: real-domain signup/recovery callbacks, save/reload, routes, and security headers pass |

Draft [PR #14](https://github.com/kylerippedhispants-web/accessible-finance/pull/14)
at `451467b1ab028ca5b110dcc4c70d8dfb138a0827` passed
[Planner quality run 36809903915](https://github.com/kylerippedhispants-web/accessible-finance/actions/runs/36809903915):
16 unit suites, 152 tests, and 24 browser checks. Those checks do not replace
the pending real cloud and email acceptance tests.

Keep deployment pending until the candidate's cloud checks pass. After release,
record production observations separately; a preview PASS is not a production
PASS. Continue the remaining privacy, deletion, backup, and free-quota checks in
[NEXT_STEPS.md](NEXT_STEPS.md).
