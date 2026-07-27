'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const template = fs.readFileSync(path.join(root, 'privacy.html'), 'utf8');

function escapeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function buildPage(config) {
  const canonical = `https://accessible-finance.com/${config.file}`;
  let html = template
    .replace(
      /<script async src="https:\/\/pagead2\.googlesyndication\.com[\s\S]*?<\/script>\s*/i,
      ''
    )
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${config.title} | Accessible Finance</title>`)
    .replace(
      /<meta name="description"[^>]*>/i,
      `<meta name="description" content="${config.description}">`
    )
    .replace(
      /<link rel="canonical"[^>]*>/i,
      `<link rel="canonical" href="${canonical}">`
    )
    .replace(
      /<meta property="og:title"[^>]*>/i,
      `<meta property="og:title" content="${config.title} | Accessible Finance">`
    )
    .replace(
      /<meta property="og:description"[^>]*>/i,
      `<meta property="og:description" content="${config.description}">`
    )
    .replace(
      '</style>',
      `.legal-body a:not(.legal-back) { color: var(--green); text-decoration: underline; text-decoration-color: rgba(29,107,69,0.35); text-underline-offset: 4px; }
.legal-body a:not(.legal-back):hover { color: var(--ink); text-decoration-color: var(--gold); }
.process-list { counter-reset: process; }
.legal-body .process-list li { padding-left: 42px; }
.legal-body .process-list li::before { counter-increment: process; content: counter(process, decimal-leading-zero); top: 2px; width: auto; height: auto; background: none; color: var(--gold); font-family: var(--sans); font-size: 11px; font-weight: 700; letter-spacing: 0.08em; }
</style>`
    );

  const schema = {
    '@context': 'https://schema.org',
    '@type': config.schemaType,
    name: config.title,
    description: config.description,
    url: canonical,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Accessible Finance',
      url: 'https://accessible-finance.com/',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Accessible Finance',
      url: 'https://accessible-finance.com/',
    },
    dateModified: '2026-07-27',
  };
  html = html.replace(
    '</head>',
    `<script type="application/ld+json">${escapeJson(schema)}</script>\n</head>`
  );

  html = html.replace(
    /<header class="legal-hero"[\s\S]*?<\/main>/,
    config.content
  );

  fs.writeFileSync(
    path.join(root, config.file),
    html.replace(/\r?\n/g, '\n'),
    'utf8'
  );
}

buildPage({
  file: 'editorial-policy.html',
  title: 'Editorial Standards and Corrections',
  description: 'How Accessible Finance researches, writes, reviews, updates, and corrects its financial education and calculators.',
  schemaType: 'AboutPage',
  content: `<header class="legal-hero" id="main-content" tabindex="-1">
  <a href="index.html" class="legal-back">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
    Back home
  </a>
  <div class="updated">Last reviewed &middot; July 27, 2026</div>
  <h1>Editorial <em>standards</em></h1>
  <p class="lead">This page explains who is responsible for Accessible Finance content, how a guide moves from an idea to publication, and what happens when something needs to be corrected.</p>
</header>

<main class="legal-body">
  <section>
    <h2>Purpose and <em>scope</em></h2>
    <p>Accessible Finance is an independent financial-education publication for readers in Canada and the United States. We explain investing, registered and tax-advantaged accounts, taxes, financial independence, and everyday money systems. We do not provide individualized investment, legal, accounting, or tax advice.</p>
    <p>Pages are written to help a reader understand a decision and the trade-offs around it. They are not recommendations to buy a particular security or a substitute for advice from a qualified professional who knows the reader's full situation.</p>
  </section>

  <section>
    <h2>Authorship and <em>accountability</em></h2>
    <p>Articles are published by <strong>Accessible Finance</strong>, the independent publisher responsible for this website. We do not claim professional designations that we do not hold, and we do not present the site as a registered advisory or accounting service.</p>
    <p>The publisher is responsible for selecting topics, checking sources, reviewing examples and calculator logic, approving final pages, and responding to correction reports. You can reach the publication through the methods on the <a href="contact.html">contact page</a>.</p>
  </section>

  <section>
    <h2>How a guide is <em>made</em></h2>
    <ul class="process-list">
      <li><strong>Define the reader's question.</strong> Each guide starts with a specific concept or decision, the intended audience, and the limits of what the page can answer.</li>
      <li><strong>Find primary sources.</strong> We prefer tax authorities, regulators, government statistical agencies, official program pages, legislation, and original research. Reputable secondary sources may add context but do not replace primary material for rules or limits.</li>
      <li><strong>Draft in plain language.</strong> The explanation defines terms before using them, separates facts from assumptions, and includes a realistic example rather than relying on slogans.</li>
      <li><strong>Check facts and calculations.</strong> Dates, thresholds, contribution limits, formulas, and worked examples are compared against the cited material. Calculator states are tested at zero, typical, boundary, and high-value inputs.</li>
      <li><strong>Review risks and uncertainty.</strong> We identify what could change the answer, where estimates are simplified, and when professional guidance may be appropriate.</li>
      <li><strong>Publish sources and a review date.</strong> Guides link to their supporting material and display the month they were last reviewed. Time-sensitive pages are revisited when official rules change.</li>
    </ul>
  </section>

  <section>
    <h2>Source <em>standards</em></h2>
    <p>For Canadian topics, preferred sources include the Canada Revenue Agency, Finance Canada, the Financial Consumer Agency of Canada, the Bank of Canada, Statistics Canada, provincial governments, and securities regulators. For U.S. topics, preferred sources include the IRS, SEC, Social Security Administration, Department of Labor, and state tax authorities.</p>
    <p>When a source is opinion-based, commercial, or based on historical market data, the guide says so through its wording and context. Historical results are not presented as a promise of future performance. Links are provided so readers can inspect the underlying material themselves.</p>
  </section>

  <section>
    <h2>Calculators and <em>methodology</em></h2>
    <p>Calculators are educational estimates, not filing software or personal financial plans. Each calculator explains its main assumptions and links to the official rates or datasets used. Results are rounded for readability and may omit credits, deductions, benefits, surtaxes, local taxes, timing rules, or household circumstances that affect a real return.</p>
    <p>Calculator logic is reviewed when rates are updated and tested across representative inputs. A result should be used as a starting point for learning or scenario comparison, then checked against official tools or a qualified professional before a consequential decision.</p>
  </section>

  <section>
    <h2>Software-assisted <em>work</em></h2>
    <p>Software tools may help organize research notes, compare drafts, test calculator states, check links, or identify inconsistent wording. They do not replace source verification or final editorial judgment. The publisher reviews the final page, its examples, and its citations before publication.</p>
  </section>

  <section>
    <h2>Ads, referrals, and <em>independence</em></h2>
    <p>A limited number of display ads may help pay for hosting and upkeep. Separate referral pages may contain tracked links. Advertising and referral relationships do not purchase coverage, determine conclusions, or create paid rankings. Pages that primarily present referral offers do not carry display advertising.</p>
    <p>Commercial relationships are disclosed where relevant and in the <a href="disclaimer.html">site disclaimer</a>. We do not ask readers to click ads or describe an advertisement as an endorsement.</p>
  </section>

  <section>
    <h2>Corrections and <em>updates</em></h2>
    <p>Readers can report a factual error, broken source, unclear passage, or calculator problem through the <a href="contact.html">contact page</a>. Please include the page URL, the specific statement or result, and a supporting source when possible.</p>
    <p>Confirmed errors are corrected as promptly as practical. Material changes to a time-sensitive guide are reflected in its review date. Minor spelling or layout fixes may be made without a separate correction note.</p>
  </section>

  <div class="legal-divider"></div>
  <a href="contact.html" class="legal-back">Report a correction
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
  </a>
</main>`,
});

buildPage({
  file: 'contact.html',
  title: 'Contact and Corrections',
  description: 'Contact Accessible Finance with questions, source suggestions, accessibility feedback, or correction reports.',
  schemaType: 'ContactPage',
  content: `<header class="legal-hero" id="main-content" tabindex="-1">
  <a href="index.html" class="legal-back">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
    Back home
  </a>
  <div class="updated">Contact Accessible Finance</div>
  <h1>Questions and <em>corrections</em></h1>
  <p class="lead">Found a factual error, a broken source, an accessibility problem, or a calculation that looks wrong? Send enough detail for us to reproduce and review it.</p>
</header>

<main class="legal-body">
  <section>
    <h2>Contact the <em>publication</em></h2>
    <p>The public contact channel for Accessible Finance is <a href="https://www.instagram.com/accessible.finance?igsh=MXVobG52emdvMTBudw==" target="_blank" rel="noopener noreferrer">Instagram @accessible.finance</a>. You can send a direct message there. Newsletter subscribers may also reply to a Dispatch email.</p>
    <p>Do not send account numbers, tax documents, passwords, government identification, or other sensitive financial information. Accessible Finance cannot provide personal investment, legal, accounting, or tax advice.</p>
  </section>

  <section>
    <h2>Report a <em>correction</em></h2>
    <p>A useful correction report includes:</p>
    <ul>
      <li>The URL of the page.</li>
      <li>The exact sentence, table, source link, or calculator result at issue.</li>
      <li>What you believe is incorrect or unclear.</li>
      <li>A primary or authoritative source that supports the correction, when available.</li>
      <li>Your browser and device if the problem is visual or interactive.</li>
    </ul>
    <p>Reports are checked against the source material and the process described in our <a href="editorial-policy.html">editorial and corrections policy</a>.</p>
  </section>

  <section>
    <h2>Accessibility <em>feedback</em></h2>
    <p>Please report keyboard traps, low-contrast text, labels that are unclear with a screen reader, text that clips at larger zoom levels, or interactions that do not work on your device. Include a screenshot or short description when practical.</p>
  </section>

  <section>
    <h2>Privacy</h2>
    <p>Messages sent through Instagram or a newsletter reply are handled by those services under their own privacy terms. Read the <a href="privacy.html">Accessible Finance privacy policy</a> for details about the website itself.</p>
  </section>

  <div class="legal-divider"></div>
  <a href="editorial-policy.html" class="legal-back">Read our editorial standards
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
  </a>
</main>`,
});

buildPage({
  file: '404.html',
  title: 'Page Not Found',
  description: 'The requested Accessible Finance page could not be found.',
  schemaType: 'WebPage',
  content: `<header class="legal-hero" id="main-content" tabindex="-1">
  <a href="index.html" class="legal-back">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
    Back home
  </a>
  <div class="updated">Error 404</div>
  <h1>That page has <em>moved</em></h1>
  <p class="lead">The address may be outdated or mistyped. The complete guide library and calculators are still available.</p>
</header>

<main class="legal-body">
  <section>
    <h2>Choose a <em>next step</em></h2>
    <ul>
      <li><a href="articles.html"><strong>Browse all 42 financial guides</strong></a></li>
      <li><a href="topic.html"><strong>Start with investing fundamentals</strong></a></li>
      <li><a href="tax-calculator.html"><strong>Open the Canadian tax calculator</strong></a></li>
      <li><a href="fire.html"><strong>Use the FIRE planner</strong></a></li>
    </ul>
  </section>
</main>`,
});

process.stdout.write('Built editorial-policy.html, contact.html, and 404.html.\n');
