// @vitest-environment jsdom

import { act } from 'react';

import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RequestSyncButton } from './request-sync-button';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const container = document.createElement('div');
const root = createRoot(container);

afterEach(() => {
  act(() => root.unmount());
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('RequestSyncButton', () => {
  it('클릭 시 새 탭을 열고 동기화 요청 후 이동한다', async () => {
    let resolveFetch!: (response: { ok: boolean; json: () => Promise<{ url: string }> }) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve;
          }),
      ),
    );
    const syncWindow = {
      close: vi.fn(),
      location: { assign: vi.fn() },
      opener: window,
    } as unknown as Window;
    const open = vi.spyOn(window, 'open').mockReturnValue(syncWindow);

    act(() => {
      root.render(<RequestSyncButton owner="acme" repo="api" />);
    });

    const button = container.querySelector('button');
    act(() => {
      button?.click();
    });

    expect(open).toHaveBeenCalledWith('', '_blank');
    expect(button?.textContent).toBe('동기화 요청 중…');

    await act(async () => {
      resolveFetch({
        ok: true,
        json: async () => ({ url: 'https://github.com/acme/harness/actions/runs/1' }),
      });
    });

    expect(syncWindow.location.assign).toHaveBeenCalledWith(
      'https://github.com/acme/harness/actions/runs/1',
    );
  });
});
