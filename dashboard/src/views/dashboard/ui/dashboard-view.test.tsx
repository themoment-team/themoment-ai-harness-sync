// @vitest-environment jsdom

import { act } from 'react';

import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DashboardView } from './dashboard-view';

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
  useSession: () => ({ data: {}, status: 'authenticated' }),
}));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const container = document.createElement('div');
let root: Root;

beforeEach(() => {
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.history.replaceState(null, '', '/');
});

describe('DashboardView', () => {
  it('URL의 레포를 처음 선택한다', async () => {
    window.history.replaceState(null, '', '/?repo=acme%2Fweb');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string) => {
        if (input === '/api/repositories') {
          return {
            ok: true,
            status: 200,
            json: async () => [
              { fullName: 'acme/api', installationId: 1, defaultBranch: 'main' },
              { fullName: 'acme/web', installationId: 1, defaultBranch: 'main' },
            ],
          };
        }

        return {
          ok: true,
          json: async () => ({
            repository: { fullName: 'acme/web', installationId: 1, defaultBranch: 'main' },
            manifest: { defaults: [], items: [] },
            config: { enabled: true, mode: 'automatic', groups: [], overrides: {} },
            syncConfigSource: null,
            selectedItemIds: [],
          }),
        };
      }),
    );

    act(() => {
      root.render(<DashboardView />);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(fetch).toHaveBeenCalledWith('/api/repositories/acme/web');
  });

  it('레포를 선택하면 URL을 갱신한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string) => {
        if (input === '/api/repositories') {
          return {
            ok: true,
            status: 200,
            json: async () => [
              { fullName: 'acme/api', installationId: 1, defaultBranch: 'main' },
              { fullName: 'acme/web', installationId: 1, defaultBranch: 'main' },
            ],
          };
        }

        return {
          ok: true,
          json: async () => ({
            repository: { fullName: 'acme/api', installationId: 1, defaultBranch: 'main' },
            manifest: { defaults: [], items: [] },
            config: { enabled: true, mode: 'automatic', groups: [], overrides: {} },
            syncConfigSource: null,
            selectedItemIds: [],
          }),
        };
      }),
    );

    act(() => {
      root.render(<DashboardView />);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const button = [...container.querySelectorAll('button')].find(
      (candidate) => candidate.textContent === 'acme/web',
    );
    await act(async () => {
      button?.click();
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(window.location.search).toBe('?repo=acme%2Fweb');
  });
});
