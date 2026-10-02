# Free authentication email setup

Prepared October 1, 2026 for Supabase project `drjfjdgzqmvjmrqfeluz`.
**Sender verification, SMTP configuration, and signup confirmation PASS;
password recovery remains PENDING.** The owner reported both test inboxes
confirmed. Real Supabase password sign-in and separate preview-15 browser
sessions verified both confirmed identities. A recovery request for account A
was accepted from preview 15; receipt, password change, and subsequent sign-in
are still an owner handoff.
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
  The two callbacks for `https://deploy-preview-15--accessiblefinance.netlify.app`
  are saved, bringing the allowlist to ten URLs while preserving the prior eight.
  These match `AuthContext.tsx`. Test on an origin serving the configured app;
  verify production callbacks again after release.
  [Supabase redirect configuration](https://supabase.com/docs/guides/auth/redirect-urls)

## 3. Prove confirmation and recovery work

Use two owner-controlled test addresses outside the Supabase organization team,
preferably with different mailbox providers. Gmail plus aliases can serve as
separate planner identities in one controlled inbox; they do not test delivery
to different providers. [Google's address-variation guidance](https://support.google.com/a/users/answer/9282734?hl=en)
Use fictional planner inputs. The authenticated acceptance harness and its
cleanup passed before the browser tests. Both accounts now have fictional
browser-created plans; they no longer meet the harness's clean-account
precondition. For any future harness run, use separately prepared clean test
accounts and stop at onboarding until that run and its cleanup pass.
An SMTP/API success response, generated link, or admin-created account alone
does not prove delivery. Follow the real
[password authentication flow](https://supabase.com/docs/guides/auth/passwords).

- [x] **Confirmation:** both signup confirmations are owner-reported; live Auth
  and separate preview-15 browser sign-ins verified the two identities. Both
  accounts completed onboarding and reached their own saved-plan dashboard.
  Arrival delay, spam placement, mail headers, and delivery to different
  providers were not recorded.
- [ ] **Recovery:** the reset request for confirmed account A was accepted from
  `https://deploy-preview-15--accessiblefinance.netlify.app`. The owner must
  receive the message, follow its link to `/planner/reset-password`, and set a
  new password privately. After sign-out, require the new password to work and
  the old one to fail. Request acceptance alone is not a recovery PASS.
- [x] **Signed-out direct visit:** preview 15 requires a current reset link and
  shows no password-entry form at `/planner/reset-password` without a recovery
  session. The earlier local direct-visit result is separate evidence.
- [ ] **Invalid links:** in a fresh signed-out browser, a used or expired link
  must fail safely; an ordinary signed-in session must not substitute for a
  recovery session. If a fresh link is already consumed,
  investigate mailbox link scanning before retrying or changing templates.

Keep public release pending until recovery and the remaining recovery-session
checks pass, then complete the release checks in
[SUPABASE_VERIFICATION.md](SUPABASE_VERIFICATION.md). Preview results do not
establish production delivery or callbacks.

## 4. Delivery follow-ups

- [ ] Review delivery/bounce status, inbox placement, and SPF/DKIM/DMARC results.
  Record date, tested origin, inbox label A/B, PASS/FAIL, arrival delay, and spam
  placement. Never record passwords, tokens, confirmation URLs, or message bodies.
- [ ] Check another mailbox provider if both test identities use one provider.
- [ ] Monitor free-tier quota for both confirmation and recovery traffic.
