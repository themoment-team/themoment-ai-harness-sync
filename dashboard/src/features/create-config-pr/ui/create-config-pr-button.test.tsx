// @vitest-environment jsdom

import { act } from 'react';

import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CreateConfigPrButton } from './create-config-pr-button';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const container = document.createElement('div');
const root = createRoot(container);

afterEach(() => {
  act(() => root.unmount());
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('CreateConfigPrButton', () => {
  it('클릭 시 새 탭을 열고 PR 생성 후 이동한다', async () => {
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
    const pullRequestWindow = {
      close: vi.fn(),
      location: { assign: vi.fn() },
      opener: window,
    } as unknown as Window;
    const open = vi.spyOn(window, 'open').mockReturnValue(pullRequestWindow);

    act(() => {
      root.render(
        <CreateConfigPrButton
          owner="acme"
          repo="api"
          selection={{ enabled: true, mode: 'fixed', itemIds: [], groups: [], overrides: {} }}
        />,
      );
    });

    const button = container.querySelector('button');
    act(() => {
      button?.click();
    });

    expect(open).toHaveBeenCalledWith('', '_blank');
    expect(button?.textContent).toBe('설정 PR 생성 중…');

    await act(async () => {
      resolveFetch({
        ok: true,
        json: async () => ({ url: 'https://github.com/acme/api/pull/1' }),
      });
    });

    expect(pullRequestWindow.location.assign).toHaveBeenCalledWith(
      'https://github.com/acme/api/pull/1',
    );
  });
});
