// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from '../planner-app/src/components/AppShell';

vi.mock('../planner-app/src/auth/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('../planner-app/src/state/PlannerContext', () => ({
  usePlanner: () => ({ mode: 'demo', dirty: false, saveState: 'saved', saveMessage: '' }),
}));

describe('planner route focus', () => {
  let root: Root;
  const frames = new Map<number, FrameRequestCallback>();
  const reactGlobal = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean };

  beforeEach(() => {
    reactGlobal.IS_REACT_ACT_ENVIRONMENT = true;
    frames.clear();
    let nextFrame = 0;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.set(++nextFrame, callback);
      return nextFrame;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn<() => void>(), removeEventListener: vi.fn<() => void>() }));
    document.body.innerHTML = '<div id="root"></div>';
    root = createRoot(document.getElementById('root')!);
  });

  afterEach(() => {
    act(() => root.unmount());
    vi.unstubAllGlobals();
    reactGlobal.IS_REACT_ACT_ENVIRONMENT = false;
  });

  async function openScenarios() {
    const router = createMemoryRouter([{
      element: createElement(AppShell),
      children: [
        { path: '/dashboard', element: createElement('h1', {}, 'Dashboard') },
        { path: '/scenarios', element: createElement('button', { id: 'create-scenario' }, 'Create custom scenario') },
      ],
    }], { initialEntries: ['/dashboard'] });
    await act(async () => root.render(createElement(RouterProvider, { router })));
    await act(async () => document.getElementById('planner-menu-button')!.click());
    expect(document.querySelector('.app-content')!.hasAttribute('inert')).toBe(true);
    await act(async () => {
      (document.querySelector('#planner-sidebar a[href="/scenarios"]') as HTMLAnchorElement).click();
    });
    return router;
  }

  it('makes the destination interactive and focuses its main region in the route commit', async () => {
    await openScenarios();
    expect(document.querySelector('.app-content')!.hasAttribute('inert')).toBe(false);
    expect(document.activeElement).toBe(document.getElementById('planner-main'));
  });

  it('does not steal focus from a destination control on the next animation frame', async () => {
    await openScenarios();
    const create = document.getElementById('create-scenario')!;
    create.focus();
    expect(document.activeElement).toBe(create);
    await act(async () => {
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((callback) => callback(16));
    });
    expect(document.activeElement).toBe(create);
  });
});
