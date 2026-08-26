import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  COLLECTION_GUIDANCE,
  CollectionGuidance,
} from '../planner-app/src/pages/CollectionPages';

describe('collection education guidance', () => {
  it.each(Object.keys(COLLECTION_GUIDANCE) as Array<keyof typeof COLLECTION_GUIDANCE>)(
    'gives the %s page a labelled, three-part guidance section',
    (kind) => {
      const markup = renderToStaticMarkup(createElement(CollectionGuidance, { kind }));
      const headingId = `${kind}-guidance-title`;

      expect(markup).toContain('<section');
      expect(markup).toContain(`aria-labelledby="${headingId}"`);
      expect(markup).toContain(`<h2 id="${headingId}">${COLLECTION_GUIDANCE[kind].heading}</h2>`);
      expect(markup).toContain('<ul>');
      expect(markup.match(/<li>/g)).toHaveLength(3);
      for (const item of COLLECTION_GUIDANCE[kind].items) {
        expect(markup).toContain(`<strong>${item.title}</strong>`);
        expect(markup).toContain(`<p>${item.body}</p>`);
      }
    },
  );
});
