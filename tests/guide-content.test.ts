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
    expect(markup).toContain('Educational projections, not advice.');
    expect(markup).toContain('aria-labelledby="guide-contents-title"');
  });
});
