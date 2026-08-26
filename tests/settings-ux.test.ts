import { describe, expect, it } from 'vitest';
import { exportFilename } from '../planner-app/src/pages/SettingsPage';

describe('settings transfer UX', () => {
  it('creates a readable, path-safe JSON filename from the plan name', () => {
    const filename = exportFilename('../../Élodie & Sam: Coast FIRE');
    expect(filename).toMatch(/^accessible-finance-elodie-sam-coast-fire-\d{4}-\d{2}-\d{2}\.json$/);
    expect(filename).not.toContain('..');
    expect(filename).not.toContain('/');
    expect(filename).not.toContain('\\');
  });
});
