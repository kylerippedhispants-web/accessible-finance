import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { GuidePage } from '../planner-app/src/pages/GuidePage';

describe('planning guide content', () => {
  it('covers the model, privacy boundary, and official Canadian resources', () => {
    const markup = renderToStaticMarkup(
      createElement(MemoryRouter, {}, createElement(GuidePage)),
    );

    for (const heading of [
      'Open the menu to add your inputs',
      'Start with a reliable baseline',
      'Today&#x27;s dollars and future dollars',
      'Build the plan from four parts',
      'Make retirement assumptions explicit',
      'Use scenarios to compare, not predict',
      'Read the projection in layers',
      'Know where your data goes',
      'Continue with trusted Canadian resources',
    ]) {
      expect(markup).toContain(heading);
    }

    expect(markup).toContain('https://www.canada.ca/en/financial-consumer-agency/services/make-budget.html');
    expect(markup).toContain('three-line <strong>Menu</strong> button in the top-right');
    expect(markup).toContain('<strong>Save changes</strong> in the header to send validated inputs to Supabase');
    expect(markup).toContain('Sync is explicit, not automatic or real-time.');
    expect(markup).toContain('Demo Mode, Save changes keeps fictional edits only for the current browser session');
    for (const route of ['/income', '/expenses', '/assets', '/debts']) {
      expect(markup).toContain(`href="${route}"`);
    }
    expect(markup).toContain('Educational projections, not advice.');
    expect(markup).toContain('aria-labelledby="guide-contents-title"');
  });
});
