# Free authentication email setup

Prepared October 1, 2026 for Supabase project `drjfjdgzqmvjmrqfeluz`.
**Sender verification, SMTP configuration, and signup confirmation PASS;
password recovery remains PENDING.** The owner reported both test inboxes
confirmed. Real Supabase password sign-in verified both confirmed identities.
The owner's Resend account is signed in. Authenticated Billing shows
Transactional Free at **$0/month for 3,000 emails**, with no payment method.
Resend marks `auth.accessible-finance.com` **Verified**. The exact three sender
records match on both authoritative Cloudflare nameservers. Supabase custom
SMTP is saved and enabled. See [SUPABASE_VERIFICATION.md](SUPABASE_VERIFICATION.md) for the
separate database, application, and release results.

## 1. Verify the sender on Resend Free

- [x] Open the owner's Resend account and verify the free subscription. Select
  **Transactional Free: $0/month, 3,000 emails/month, 100/day, three domains**.
  Keep paid plans, add-ons, and paid overages disabled. These limits were checked
  against [Resend pricing](https://resend.com/pricing) on the date above.
- [x] Add the dedicated sending subdomain `auth.accessible-finance.com`
  after checking that name is available in the existing DNS zone. This is a
  verified sending domain. The configured From address is
  `no-reply@auth.accessible-finance.com`; this does not establish a receiving
  mailbox. Resend recommends
  separating transactional mail with a
  [sending subdomain](https://resend.com/docs/dashboard/domains/introduction).
- [x] Add the exact DKIM and sending records shown by Resend to the
  existing Cloudflare zone. Cloudflare nameservers were verified during setup.
  Preserve website records, existing mail delivery, and existing DMARC policy;
  review DMARC alignment for the chosen sender. Keep Resend receiving disabled
  for this sending-only setup. Use the actual record names and values, not
  documentation examples. Click Verify and require verified status.
  [Resend's Cloudflare instructions](https://resend.com/docs/knowledge-base/cloudflare)
- Current authenticated UI records are TXT `resend._domainkey.auth` and
  DNS-only CNAMEs `rsend.auth` → `rsend.forge.rmta.net` and `send.auth` →
  `send.forge.rmta.net`, all saved with one-hour TTLs. Use the domain's actual public DKIM
  value. Do not substitute older documentation's MX/TXT examples at those
  CNAME names. Both authoritative Cloudflare servers returned exact matches
  after publication, with 3,600-second TTLs. Receiving remains off;
  no tracking subdomain has been created. The optional apex DMARC record was
  not selected. A policy specific to this sender belongs at `_dmarc.auth`.
- [x] Keep tracking unconfigured for this domain: no tracking subdomain was
  created. Keep confirmation and
  recovery templates focused on their account action. Tracking can rewrite
  authentication links.
  [Auth email delivery guidance](https://resend.com/docs/knowledge-base/how-do-i-maximize-deliverability-for-supabase-auth-emails)
- [x] Create the dedicated **Supabase Integration** Resend key. The actual key
  detail page confirms **Sending access** restricted to
  `auth.accessible-finance.com`. Resend transferred it through the approved
  automatic integration; no manual credential entry was needed. Keep private
  key values out of frontend variables, Netlify, Git, chat, and screenshots.
  [Resend key permissions](https://resend.com/docs/api-reference/api-keys/create-api-key)

Use the existing domain and Supabase-managed project URL. A paid Supabase custom
domain or a new domain purchase is unnecessary for this setup.

## 2. Connect Supabase Auth

The automatic Resend integration is available on this account. Its actual
Supabase consent screen requested **Auth and Projects READ + WRITE** for the
Accessible Finance organization. The owner approved that connection and the
new SMTP credential. The automatic integration selected only project
`drjfjdgzqmvjmrqfeluz`, linked the verified auth domain, created the restricted
sending key, and saved SMTP settings. The values below describe that saved
configuration.

Open the selected project's **Authentication → Email → SMTP Settings**, enable
custom SMTP, enter these fields, and save. The owner handles private credential
entry and any account sign-in or terms screens.

| Field | Value |
| --- | --- |
| Sender email | `no-reply@auth.accessible-finance.com` |
| Sender name | Accessible Finance |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | Dedicated Resend API key, transferred by the approved integration |

These are Resend's documented
[Supabase SMTP settings](https://resend.com/docs/send-with-supabase-smtp).

- [x] Keep email/password sign-in and **Confirm Email** enabled. Rechecked after
  SMTP setup; anonymous sign-in and manual linking remain off. Do not disable
  confirmation to make an email test pass.
- [x] Check Auth's actual email rate limit: **25 messages/hour**, visually
  verified in the saved Dashboard. The integration's per-user retry interval
  is **1 second**; an attempted interval edit did not persist and was cancelled.
  Resend's daily/monthly limits also apply. The documented initial custom-SMTP
  default is 30/hour; the default
  Supabase sender is unsuitable for public launch: it serves only project-team
  addresses and currently allows two messages/hour.
  [Supabase SMTP limits](https://supabase.com/docs/guides/auth/auth-smtp)
- [x] Confirm Site URL is `https://accessible-finance.com/planner/`. Allow the
  exact `/planner/dashboard` and `/planner/reset-password` URLs on each actual
  local or preview origin used for testing, and on the production origin.
  These match `AuthContext.tsx`. Test on an origin serving the configured app;
  verify production callbacks again after release.
  [Supabase redirect configuration](https://supabase.com/docs/guides/auth/redirect-urls)

## 3. Prove confirmation and recovery work

Use two owner-controlled test addresses outside the Supabase organization team,
preferably with different mailbox providers. Gmail plus aliases can serve as
separate planner identities in one controlled inbox; they do not test delivery
to different providers. [Google's address-variation guidance](https://support.google.com/a/users/answer/9282734?hl=en)
Use fictional planner inputs. Stop at onboarding until the authenticated
acceptance harness and its cleanup pass; onboarding submission saves a plan
and would violate the harness's clean-account precondition.
An SMTP/API success response, generated link, or admin-created account alone
does not prove delivery. Follow the real
[password authentication flow](https://supabase.com/docs/guides/auth/passwords).

- [x] **Confirmation:** submit normal signup from the configured app. Receive
  the message, check its sender and inbox placement, then use its link. Require
  the intended origin and planner onboarding/dashboard, followed by successful
  password sign-in. Both confirmations are owner-reported, and live Auth
  sign-in verified both identities. Arrival delay, spam placement, mail headers,
  and delivery to different providers were not recorded.
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
