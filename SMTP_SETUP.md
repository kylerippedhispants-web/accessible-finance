# Free authentication email setup

Prepared October 1, 2026 for Supabase project `drjfjdgzqmvjmrqfeluz`.
**SMTP configuration, sender verification, and inbox tests remain PENDING.**
This checklist does not record completed account creation, DNS changes, or
email delivery. See [SUPABASE_VERIFICATION.md](SUPABASE_VERIFICATION.md) for the
separate database, application, and release results.

## 1. Verify the sender on Resend Free

- [ ] Open the owner's Resend account, or complete signup if needed. Select
  **Transactional Free: $0/month, 3,000 emails/month, 100/day, three domains**.
  Keep paid plans, add-ons, and paid overages disabled. These limits were checked
  against [Resend pricing](https://resend.com/pricing) on the date above.
- [ ] Add a dedicated sending subdomain such as `auth.accessible-finance.com`
  after checking that name is available in the existing DNS zone. This is a
  proposed name, not a configured sender. Choose the actual From address after
  verification; no mailbox or sender address is assumed here. Resend recommends
  separating transactional mail with a
  [sending subdomain](https://resend.com/docs/dashboard/domains/introduction).
- [ ] Add the exact DKIM and sending SPF/MX records shown by Resend to the
  existing Cloudflare zone. Cloudflare nameservers were verified during setup.
  Preserve website records, existing mail delivery, and existing DMARC policy;
  review DMARC alignment for the chosen sender. Keep Resend receiving disabled
  for this sending-only setup. Use the actual record names and values, not
  documentation examples. Click Verify and require verified status.
  [Resend's Cloudflare instructions](https://resend.com/docs/knowledge-base/cloudflare)
- [ ] Disable open and click tracking for this domain. Keep confirmation and
  recovery templates focused on their account action. Tracking can rewrite
  authentication links.
  [Auth email delivery guidance](https://resend.com/docs/knowledge-base/how-do-i-maximize-deliverability-for-supabase-auth-emails)
- [ ] Create a dedicated Resend key with sending permission restricted to this
  domain. Store it privately and enter it only into Supabase's SMTP password
  field. Keep it out of frontend variables, Netlify, Git, chat, and screenshots.
  [Resend key permissions](https://resend.com/docs/api-reference/api-keys/create-api-key)

Use the existing domain and Supabase-managed project URL. A paid Supabase custom
domain or a new domain purchase is unnecessary for this setup.

## 2. Connect Supabase Auth

Open the selected project's **Authentication → Email → SMTP Settings**, enable
custom SMTP, enter these fields, and save. The owner handles private credential
entry and any account sign-in or terms screens.

| Field | Value |
| --- | --- |
| Sender email | Owner-selected address at the verified sending domain |
| Sender name | Accessible Finance |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | Dedicated Resend API key, entered privately |

These are Resend's documented
[Supabase SMTP settings](https://resend.com/docs/send-with-supabase-smtp).

- [ ] Keep email/password sign-in and **Confirm Email** enabled. Do not disable
  confirmation to make an email test pass.
- [ ] Check Auth's email rate limit. Supabase initially limits custom SMTP to
  **30 messages/hour**; Resend's daily/monthly limits also apply. The default
  Supabase sender is unsuitable for public launch: it serves only project-team
  addresses and currently allows two messages/hour.
  [Supabase SMTP limits](https://supabase.com/docs/guides/auth/auth-smtp)
- [ ] Confirm Site URL is `https://accessible-finance.com/planner/`. Allow the
  exact `/planner/dashboard` and `/planner/reset-password` URLs on each actual
  local or preview origin used for testing, and on the production origin.
  These match `AuthContext.tsx`. Test on an origin serving the configured app;
  verify production callbacks again after release.
  [Supabase redirect configuration](https://supabase.com/docs/guides/auth/redirect-urls)

## 3. Prove confirmation and recovery work

Use two owner-controlled inboxes outside the Supabase organization team,
preferably with different mailbox providers. Use fictional planner inputs.
An SMTP/API success response, generated link, or admin-created account alone
does not prove delivery. Follow the real
[password authentication flow](https://supabase.com/docs/guides/auth/passwords).

- [ ] **Confirmation:** submit normal signup from the configured app. Receive
  the message, check its sender and inbox placement, then use its link. Require
  the intended origin and planner onboarding/dashboard, followed by successful
  password sign-in. Repeat with the second inbox.
- [ ] **Recovery:** request a reset for a confirmed test account from the app.
  Receive the message and reach `/planner/reset-password`. Set a new password;
  after sign-out, require the new password to work and the old one to fail.
- [ ] **Invalid links:** in a fresh signed-out browser, a used or expired link
  must fail safely. Directly opening the reset page must not permit a password
  change without a valid recovery session. If a fresh link is already consumed,
  investigate mailbox link scanning before retrying or changing templates.
- [ ] **Delivery evidence:** require actual receipt and completed account actions
  in both inboxes. Review delivery/bounce status and SPF/DKIM/DMARC results.
  Record date, tested origin, inbox label A/B, PASS/FAIL, arrival delay, and spam
  placement. Never record passwords, tokens, confirmation URLs, or message bodies.

Keep public account signup/recovery release pending until these tests pass:
users must be able to confirm ownership and recover access. Then finish the
remaining application and deployment checks in
[SUPABASE_VERIFICATION.md](SUPABASE_VERIFICATION.md). Free-tier email quota must
continue to cover both confirmation and recovery traffic.
