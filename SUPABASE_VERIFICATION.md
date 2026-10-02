# Supabase Free setup and cloud verification

Updated October 1, 2026 (America/Toronto). **The Free project is healthy, all
three migrations are applied, and the nine transactional database checks pass.**
Anonymous Data API denial and a local build with the production cloud gate also pass.
Sender DNS, custom SMTP, Netlify public variables, and the configured preview
build/public delivery also pass. The owner reported both signup confirmations;
live authenticated repository tests and cleanup pass. Preview 15 also passes
onboarding, save/reload, account separation, and JSON export/import checks.
Recovery completion and production verification remain PENDING. Database results do not establish
email delivery or end-to-end application readiness. See
[SUPABASE_STATUS.json](SUPABASE_STATUS.json) for the recorded observations and
migration hashes.

Browser access and the existing account sign-ins are restored. The approved
Resend connection and domain-restricted SMTP key are configured. The preview is
ready for controlled testing. Both signup confirmations are owner-reported,
and real Auth verified both identities. An onboarding ID mismatch was found:
the page replaced the parent ID after creating its income/spending rows. The
fix selects the existing identity before creating children; validation remains
unchanged. Eight regressions, all 160 unit tests in 17 suites, lint, TypeScript,
a cloud-required build, and 24 Edge browser checks pass. The fixed preview-15
browser flow passes with positive income and spending for both accounts.
Recorded SQL, repository, browser, mail, and production results remain separate.

Organization: Accessible Finance (`xwbugaccilzeirzhhprs`). Project:
`accessible-finance-planner` (`drjfjdgzqmvjmrqfeluz`). The owner created it in
**West US (Oregon), `us-west-2`**, not Canada.

Use this checklist with [PLANNER_SETUP.md](PLANNER_SETUP.md) and the current
[database instructions](supabase/README.md). Keep the project, SMTP service,
and existing Netlify site on their free plans; do not enable paid add-ons.

## 1. Project setup and remaining configuration

1. The account, organization, and Free project above are created. Keep the
   database password private. Current Free usage was reviewed: no quota exceeded,
   database about 26 MB of 500 MB, zero monthly active users at that earlier
   check, and no overage billing.
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
   production build with `PLANNER_REQUIRE_CLOUD=true` pass. Later authenticated
   repository and scoped preview-15 browser results are recorded below.
   Netlify now has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, using the
   same intended public configuration in all deploy contexts. Free requires
   all scopes. Preview-15 deploy `6abf18672a51ee0008e70ca1` passes build and public
   HTTP/bundle checks. The second variable
   accepts the public `sb_publishable_` browser key (preferred) or legacy `anon`
   key. **No secret/service-role key, database password, management token, or
   SMTP credential belongs in frontend code, Netlify environment variables,
   commits, logs, screenshots, or exports.** SMTP credentials belong only in
   Supabase's SMTP settings. Rebuild after changing public values; keep
   `PLANNER_REQUIRE_CLOUD=true` for production.

## 2. Set the exact callback URLs

**Saved:** Site URL `https://accessible-finance.com/planner/` and all ten
exact Redirect URLs below. Preview 15's two entries were added while preserving
the prior eight. They match the callbacks in
`planner-app/src/auth/AuthContext.tsx`. Saving the allowlist does not verify
actual confirmation or recovery delivery.

| Environment | Signup confirmation | Password recovery |
| --- | --- | --- |
| Production | `https://accessible-finance.com/planner/dashboard` | `https://accessible-finance.com/planner/reset-password` |
| Local cloud preview | `http://127.0.0.1:4174/planner/dashboard` | `http://127.0.0.1:4174/planner/reset-password` |
| Local Vite development | `http://localhost:5173/planner/dashboard` | `http://localhost:5173/planner/reset-password` |
| Netlify preview 14 | `https://deploy-preview-14--accessiblefinance.netlify.app/planner/dashboard` | `https://deploy-preview-14--accessiblefinance.netlify.app/planner/reset-password` |
| Netlify preview 15 | `https://deploy-preview-15--accessiblefinance.netlify.app/planner/dashboard` | `https://deploy-preview-15--accessiblefinance.netlify.app/planner/reset-password` |

Use the matching local origin and port; `127.0.0.1` and `localhost` are different
origins. If the actual preview origin changes, replace its two exact
entries before testing. Remove obsolete preview entries after testing. The
production domain must serve the candidate before its final callback smoke test.
[Supabase redirect guidance](https://supabase.com/docs/guides/auth/redirect-urls)

## 3. Configure free email delivery

The [Resend Free setup checklist](SMTP_SETUP.md) records the signed-in account,
verified $0 subscription with no payment method and verified
`auth.accessible-finance.com` sender. Exact DNS matches were checked on both
authoritative Cloudflare servers. The approved automatic connector configured
Supabase SMTP with a Sending-access key restricted to that domain. Saved sender
is `no-reply@auth.accessible-finance.com`, name Accessible Finance, host
`smtp.resend.com`, port 465, username `resend`. The owner reported both signup
confirmations, and actual Auth sign-ins verified both confirmed identities.
Recovery receipt and password-change completion remain PENDING; account A's
request was accepted from preview 15, which alone does not prove delivery.

The default Supabase sender only delivers to organization-team addresses and
allows two messages per hour. It cannot validate public signup. The selected
Resend Free service allows 3,000 emails/month and 100/day at the recorded check.
Recheck the account's limits before changing its plan or increasing traffic.
[Supabase SMTP restrictions](https://supabase.com/docs/guides/auth/auth-smtp),
[Resend pricing](https://resend.com/pricing)

Verify a sender on the existing domain or a dedicated auth subdomain using the
provider's DNS records (SPF/DKIM and the appropriate DMARC policy). Preserve
existing website and mail records. The domain's authoritative nameservers were
verified as Cloudflare on September 30; sender records belong in that Cloudflare
zone; account access and the sender records are now verified. For Resend, the documented Supabase settings
are `smtp.resend.com`, port `465`, username `resend`, and an API key as the SMTP
password. Disable link tracking so auth links are not rewritten. Keep auth
messages separate from newsletters. Supabase's documented initial custom-SMTP
limit is 30 messages/hour; this project's actual saved email limit is **25/hour**
and its integration's per-user retry interval is 1 second. Provider daily and
monthly limits apply as well. Confirm Email remains enabled after setup.
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
`checks_completed = 9`. A separate post-check at that time found zero Auth users, profiles,
and plans; removed temporary results; 10 RLS tables; 40 policies; and the plan
revision column. Local evidence is retained in ignored
`.local-tools/supabase-setup/database-checks.txt`, `cleanup-checks.txt`, and
`database-checks-passed.jpg`. These are recorded database observations, not
proof of Auth, REST, browser, or SMTP behavior.

Later, the live authenticated repository harness passed all nine groups and
removed its own fixtures, restoring the original profile fields. The subsequent
preview-15 browser tests created two fictional saved plans. Those plans remain;
neither earlier cleanup result means that the project currently has zero users
or plans. Do not rerun the clean-account harness against these populated accounts.

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
values fictional. The October 1 database results are separated from the later
repository/browser proofs and remaining checks below.

Public HTTP checks on October 1 at **10:57 a.m. Toronto** found the production
homepage available, but `/planner/`, `/planner/dashboard`, and
`/planner/reset-password` all returned 404. Those three preview-14 routes
returned 200 with the planner HTML and expected security headers. Its inspected
bundles lacked the intended Supabase project URL/reference and public key,
indicating an unconfigured Demo build at that earlier check. The configured
preview was rebuilt successfully later on October 1 as deploy
`6abf0657fbb1a09ea1ab46c3`, commit `83fb812db65a284f0239391bb41eac9f2d040fb9`.
Its three planner routes return 200 with the expected security headers, and
the inspected scripts contain the intended project and exact public key.
No scanned privileged credential patterns were detected. These observations
verify public delivery, not browser authentication or cloud operations. The
new report is `.local-tools/supabase-setup/configured-preview-http.json`;
the earlier redacted report is
`.local-tools/supabase-setup/deployment-http-checks.json`.

The current candidate is [PR #15](https://github.com/kylerippedhispants-web/accessible-finance/pull/15),
commit `8acac16b3aaf8fe1970b9103ea00e6cb39fca50a`, deployed successfully as
`6abf18672a51ee0008e70ca1` at
`https://deploy-preview-15--accessiblefinance.netlify.app`.
[Planner quality run 36956324281](https://github.com/kylerippedhispants-web/accessible-finance/actions/runs/36956324281)
passed. `.local-tools/supabase-setup/pr15-public-verification.json` confirms the seven intended
file blobs, 197 unrelated files preserved, all three planner routes, and 19
scripts with the intended public configuration and fixed onboarding module.

In actual separate browser sessions, account A saved fictional annual income
of $60,000 and spending of $30,000; account B saved $80,000 and $40,000. Both
reached their own dashboard with Saved status and no ownership error. Refresh
required A to sign in again, then restored A's $60,000/$30,000 inputs; sign-out
cleared the plan view. Neither session showed the other account's name. Account
B downloaded JSON without Auth fields, reimported it as an unsaved draft, then
explicitly saved it successfully. These are scoped browser proofs, not a full
storage/log audit or a production test.

| Check | Status | Evidence / remaining action |
| --- | --- | --- |
| Account, Free plan, project, region | PASS | Healthy project `drjfjdgzqmvjmrqfeluz`; Free organization; West US (Oregon), `us-west-2`; October 1 |
| Three migrations and schema checks | PASS | Dashboard success for all three; 10 RLS tables, 40 policies, revision present; helper checked RPC security; October 1 |
| Transactional database helper and cleanup | PASS | Nine checks, aggregate true; zero fixtures and temporary results after that SQL run; October 1; later browser plans remain |
| Auth provider and callback settings | PASS | Email/confirmation enabled; anonymous/manual linking off; Site URL plus ten exact callbacks saved, including preview 15; October 1 |
| Password-policy persistence | PASS | Saved settings visually confirmed: minimum 8, secure password change on, Save disabled; `.local-tools/supabase-setup/auth-email-security.jpg`; October 1 |
| Local public configuration | PASS | Project URL and existing public publishable key saved to ignored `.env.local`; October 1 |
| Anonymous public API boundary | PASS | All 10 tables and `save_planner_snapshot` denied with HTTP 401 / `42501`; public Auth settings return 200 with email confirmation enabled; no users, emails, or data created |
| Cloud-required local build | PASS | `.env.local` active, `PLANNER_REQUIRE_CLOUD=true`, validated public configuration, build exit 0; `.local-tools/supabase-setup/public-cloud-validation.json` |
| Netlify public build configuration | PASS | Intended public URL/browser key saved in all deploy contexts; cloud-required preview build passes; inspected scripts match the intended public configuration |
| Sender DNS and SMTP configuration | PASS | Resend domain Verified; all three records match both authoritative nameservers; domain-restricted Sending key transferred; custom SMTP saved and enabled |
| Signup confirmation | PASS | Owner reported both controlled inbox confirmations; real Auth sign-in verified both confirmed identities; mail timing/placement/headers not recorded |
| Password recovery delivery | PENDING | Account A request accepted from preview 15; owner receipt and link use remain unverified |
| New external-user onboarding | PASS | Separate confirmed A/B preview-15 sessions saved positive income/spending and reached Saved dashboards without an ownership error |
| Cloud save and reload | PASS | A's refresh required sign-in; its saved $60,000/$30,000 fictional inputs reloaded; sign-out cleared the view |
| Authenticated repository acceptance | PASS | Nine live check groups: actual app save/load, bidirectional ten-table REST/RPC isolation, anonymous denial, 33 malformed requests, atomic rollback, stale revision, 5,000 changes across five pages, and sign-out/sign-in; fixture/profile cleanup passes; `.local-tools/cloud-acceptance-result.json` |
| Browser account separation | PASS | Separate preview-15 A/B sessions showed their respective plans and no other account name; ten-table REST/RPC isolation is proved separately |
| Browser competing saves and offline failure | PENDING | Repository stale-revision rejection passes; browser draft preservation and failed-save feedback remain to verify |
| Password recovery | PENDING | Request accepted; owner must receive/use link, privately change password, then verify new-password success and old-password rejection |
| Signed-out direct recovery guard | PASS | Preview 15 requires a current reset link and shows no password form; earlier local guard also passed |
| Other recovery guards | PENDING | Ordinary signed-in session and used/expired links must not authorize password changes |
| Session behavior | PASS | Preview-15 refresh required sign-in; sign-out cleared the plan view |
| Storage and log inspection | PENDING | Explicitly inspect localStorage/sessionStorage for tokens/cloud records and logs for plan data; session behavior alone is insufficient |
| Cloud JSON export/import | PASS | B's actual download contained no Auth fields; reimport remained an unsaved draft until explicit Save, then showed Saved |
| Large/invalid browser import and cloud Demo separation | PENDING | Additional browser cases; local transfer tests and 5,000-difference repository pagination are separate evidence |
| Configured preview 14 public delivery | PASS | Three planner routes return 200 with planner HTML/security headers; referenced scripts match intended public Supabase configuration; deploy `6abf0657fbb1a09ea1ab46c3`; October 1, 9:23 p.m. Toronto |
| Configured preview 15 source and public delivery | PASS | Deploy `6abf18672a51ee0008e70ca1`; exact commit above; seven intended blobs, 197 unrelated files preserved, three routes and 19 scripts verified |
| Wider preview navigation/accessibility | PENDING | Homepage journey, Canadian/US navigation, keyboard use, and a real narrow-screen device remain distinct from the verified cloud flow and 24 automated Edge checks |
| Current production planner availability | FAIL | `/planner/`, `/planner/dashboard`, and `/planner/reset-password` each return 404; October 1, 10:57 a.m. Toronto |
| Production smoke test | PENDING | After release: real-domain signup/recovery callbacks, save/reload, routes, and security headers pass |

[PR #14](https://github.com/kylerippedhispants-web/accessible-finance/pull/14)
was merged as `ce61addb0bec1220e3c261e4467238e5811970ef`. The implementation
passed 16 unit suites, 152 tests, and 24 browser checks. The updated branch
`83fb812db65a284f0239391bb41eac9f2d040fb9` also passed
[Planner quality run 36881349362](https://github.com/kylerippedhispants-web/accessible-finance/actions/runs/36881349362).
Those earlier checks do not replace the later preview-15 proofs or pending
recovery and production tests.

## 5. Release gate and follow-ups

Before production, finish the real recovery/password-change flow, the remaining
recovery-session guards, and the explicit storage/log privacy inspection. No
production release or recovery PASS is established by the current evidence.
After an authorized release, record real-domain callbacks, save/reload, routes,
and security headers as a separate production smoke test.

Keep wider device/navigation coverage, large/invalid browser-import cases,
account/data deletion and backup procedures, and free-quota monitoring visible
as follow-ups in [NEXT_STEPS.md](NEXT_STEPS.md); their pending status is not a
failure of the browser operations already verified above.
