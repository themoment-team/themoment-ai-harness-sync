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
  it('동기화 요청이 끝난 뒤 새 탭을 연다', async () => {
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
    const open = vi.spyOn(window, 'open').mockReturnValue(null);

    act(() => {
      root.render(<RequestSyncButton owner="acme" repo="api" />);
    });

    const button = container.querySelector('button');
    act(() => {
      button?.click();
    });

    expect(open).not.toHaveBeenCalled();
    expect(button?.textContent).toBe('동기화 요청 중…');

    await act(async () => {
      resolveFetch({
        ok: true,
        json: async () => ({ url: 'https://github.com/acme/harness/actions/runs/1' }),
      });
    });

    expect(open).toHaveBeenCalledWith(
      'https://github.com/acme/harness/actions/runs/1',
      '_blank',
      'noopener',
    );
  });
});
