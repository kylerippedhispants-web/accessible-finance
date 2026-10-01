# Supabase Free setup and cloud verification

Prepared September 30, 2026. The Supabase account and **Accessible Finance Free
organization are created**. Project creation and cloud verification below are
PENDING. Local tests, a
prepared SQL script, and Demo Mode do not establish working cloud accounts,
email delivery, data isolation, or production readiness.

Use this checklist with [PLANNER_SETUP.md](PLANNER_SETUP.md) and the current
[database instructions](supabase/README.md). Keep the project, SMTP service,
and existing Netlify site on their free plans; do not enable paid add-ons.

## 1. Create and configure the project

1. The owner completes Supabase signup, creates a Free organization/project,
   chooses its region, and stores the database password privately. Record the
   project reference and region below, without credentials. Confirm Free in the
   billing screen. Custom SMTP is included; leaked-password protection,
   configurable session timeouts, and single-session enforcement are not.
   Free projects can pause after one week of inactivity. [Free-plan details](https://supabase.com/pricing)
2. Enable email/password sign-in and keep **Confirm Email** enabled. Match the
   password policy to the app, require at least eight characters, and check
   secure password-change behavior. Use email-link expiry of one hour or less.
   Do not disable confirmation to work around mail delivery. [Production checklist](https://supabase.com/docs/guides/deployment/going-into-prod)
3. Apply all three complete migrations once, in timestamp order, using the
   method in `supabase/README.md`: foundation, atomic save, then
   `20260930010000_planner_payload_validation.sql`. Do not replay the first two
   migrations or mix Dashboard and CLI migration history without reconciliation.
4. Configure only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in ignored
   `.env.local` and the intended Netlify build contexts. The second variable
   accepts the public `sb_publishable_` browser key (preferred) or legacy `anon`
   key. **No secret/service-role key, database password, management token, or
   SMTP credential belongs in frontend code, Netlify environment variables,
   commits, logs, screenshots, or exports.** SMTP credentials belong only in
   Supabase's SMTP settings. Rebuild after changing public values; keep
   `PLANNER_REQUIRE_CLOUD=true` for production.

## 2. Set the exact callback URLs

Set **Site URL** to `https://accessible-finance.com/planner/`. Add these exact
Redirect URLs for the environments being tested. They match the callbacks in
`planner-app/src/auth/AuthContext.tsx`; no wildcard is needed.

| Environment | Signup confirmation | Password recovery |
| --- | --- | --- |
| Production | `https://accessible-finance.com/planner/dashboard` | `https://accessible-finance.com/planner/reset-password` |
| Local cloud preview | `http://127.0.0.1:4174/planner/dashboard` | `http://127.0.0.1:4174/planner/reset-password` |
| Netlify preview 13 | `https://deploy-preview-13--accessiblefinance.netlify.app/planner/dashboard` | `https://deploy-preview-13--accessiblefinance.netlify.app/planner/reset-password` |

Open the local test at `http://127.0.0.1:4174/planner/`; `localhost` is a
different origin. If the actual preview origin changes, replace its two exact
entries before testing. Remove obsolete preview entries after testing. The
production domain must serve the candidate before its final callback smoke test.
[Supabase redirect guidance](https://supabase.com/docs/guides/auth/redirect-urls)

## 3. Configure free email delivery

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
without recording the link,
OTP, password, or token. Admin-created users and manually generated links can
test application mechanics but do not prove normal email delivery. A successful
recovery API response alone is insufficient: nonexistent accounts intentionally
receive a success response without an email.
[Password recovery behavior](https://supabase.com/docs/guides/auth/passwords)

## 4. Verify the database and application

After all three migrations, run the read-only schema queries in
`supabase/README.md`. Then review and run the **whole** helper
`supabase/verification/planner-cloud-checks.sql` in one trusted SQL Editor
session on this new dedicated project. It is a verification transaction, not a migration: it
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
values fictional. All entries below start PENDING.

| Check | Status | Evidence / remaining action |
| --- | --- | --- |
| Account, Free plan, project, region | PENDING | Account and Accessible Finance Free organization created; Canada Central project prepared; private database-password submission remains; project reference: — |
| Three migrations and schema checks | PENDING | 10 RLS tables; four authenticated CRUD policies each; revision column; INVOKER save RPC |
| Transactional database helper | PENDING | Nine PASS results, aggregate true, final rollback; ownership, invalid-payload, atomicity, and conflict checks |
| Public config and callback URLs | PENDING | Correct project/browser key; exact local/preview callbacks; no privileged values |
| Sender verification and delivery | PENDING | Free SMTP account; DNS verified; controlled external-team inbox receives confirmation |
| New external-user account | PENDING | Normal signup → received confirmation → correct callback → onboarding → sign-in |
| Cloud save and reload | PENDING | Save fictional plan; sign out; sign in in another browser; same saved inputs load |
| Browser account isolation | PENDING | Account B cannot read, change, delete, or attach rows to A's plan; test API boundary, not just UI |
| Competing saves and offline failure | PENDING | Stale revision rejected; local draft preserved; failed save never shown as saved |
| Password recovery | PENDING | Public reset form → received email → intended reset page → new password works; old password fails |
| Recovery guard | PENDING | Direct/reset-page visit or ordinary session cannot change a password without a valid recovery event; used/expired link fails safely |
| Session and privacy | PENDING | Refresh requires sign-in; sign-out clears auth; no tokens/cloud records in localStorage or sessionStorage; no plan data in logs |
| Backup/import and Demo Mode | PENDING | Export/reimport and large/invalid files checked; import remains unsaved until Save; Demo makes no Supabase writes |
| Candidate preview | PENDING | Cloud flow, deep-route refresh, mobile/keyboard use, headers, and legacy navigation pass on the configured preview |
| Production smoke test | PENDING | After an authorized release: real-domain signup/recovery callbacks, save/reload, routes, and security headers pass |

Keep deployment pending until the candidate's cloud checks pass. After release,
record production observations separately; a preview PASS is not a production
PASS. Continue the remaining privacy, deletion, backup, and free-quota checks in
[NEXT_STEPS.md](NEXT_STEPS.md).
