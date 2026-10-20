// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { createDemoSnapshot, DEMO_PRESETS } from '../planner-app/src/data/demoPlan';
import { estimateFireTarget } from '../planner-app/src/finance-engine';
import { formatCadMetric } from '../planner-app/src/lib/formatters';

vi.mock('../planner-app/src/auth/AuthContext', () => ({
  useAuth: () => ({ configured: false }),
}));
import { LandingPage } from '../planner-app/src/pages/LandingPage';

it('updates the landing estimate and demo action for every selected fictional example', async () => {
  const reactGlobal = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean };
  reactGlobal.IS_REACT_ACT_ENVIRONMENT = true;
  document.body.innerHTML = '<div id="root"></div>';
  const root = createRoot(document.getElementById('root')!);
  const open = vi.fn<(preset?: string) => void>();
  try {
    await act(async () => root.render(createElement(LandingPage, { onTryDemo: open })));
    for (const preset of DEMO_PRESETS) {
      const selector = document.querySelector('select')!;
      await act(async () => {
        selector.value = preset.id;
        selector.dispatchEvent(new Event('change', { bubbles: true }));
      });
      const preview = document.querySelector('.projection-preview')!;
      const expected = estimateFireTarget(createDemoSnapshot(preset.id).plan);
      expect(preview.textContent).toContain(preset.name);
      expect(preview.textContent).toContain('The curve is a schematic');
      if (expected.status === 'estimated') {
        expect(preview.textContent).toContain(formatCadMetric(expected.realOpeningModeledWithdrawableAssets).precise);
        expect(preview.textContent).toContain(`Modeled FIRE year ${expected.year} · age ${expected.age}`);
      } else {
        expect(preview.textContent).toContain(expected.status === 'needs_inputs' ? 'Needs inputs' : 'Not reached');
      }
      await act(async () => (document.querySelector('.landing-actions button') as HTMLButtonElement).click());
      expect(open).toHaveBeenLastCalledWith(preset.id);
    }
  } finally {
    act(() => root.unmount());
    reactGlobal.IS_REACT_ACT_ENVIRONMENT = false;
  }
});
