import { describe, expect, it, vi } from 'vitest';

import { requestSync } from './request-sync.server';

describe('requestSync', () => {
  it('동기화가 비활성화된 레포는 실행하지 않는다', async () => {
    const dispatch = vi.fn();

    await expect(
      requestSync(
        { owner: 'acme', repo: 'api', userToken: 'token' },
        {
          getDashboardData: async () => ({
            repository: { fullName: 'acme/api', installationId: 1, defaultBranch: 'main' },
            manifest: { defaults: [], items: [] },
            config: { enabled: false, mode: 'fixed', groups: [], overrides: {} },
            syncConfigSource: 'enabled: false\n',
            selectedItemIds: [],
          }),
          findOpenSyncPullRequest: async () => null,
          findRecentWorkflowRun: async () => null,
          dispatch,
        },
      ),
    ).rejects.toMatchObject({ code: 'SYNC_DISABLED' });

    expect(dispatch).not.toHaveBeenCalled();
  });
});
