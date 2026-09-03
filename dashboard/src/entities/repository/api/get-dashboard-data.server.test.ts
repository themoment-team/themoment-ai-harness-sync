import { describe, expect, it, vi } from 'vitest';

import { getRepositoryDashboardData } from './get-dashboard-data.server';

describe('getRepositoryDashboardData', () => {
  it('대상 레포의 원본 sync 설정을 함께 반환한다', async () => {
    await expect(
      getRepositoryDashboardData(
        { owner: 'acme', repo: 'api', userToken: 'user-token' },
        {
          getRepositories: async () => [
            { fullName: 'acme/api', installationId: 3, defaultBranch: 'main' },
          ],
          getUsername: async () => 'member',
          getPermission: async () => 'write',
          readManifest: async () => 'defaults: []\nitems: []\n',
          readSyncConfig: async () => 'enabled: true\ngroups: []\n',
        },
      ),
    ).resolves.toMatchObject({ syncConfigSource: 'enabled: true\ngroups: []\n' });
  });

  it('권한이 없으면 대상 설정을 읽지 않는다', async () => {
    const readSyncConfig = vi.fn();

    await expect(
      getRepositoryDashboardData(
        { owner: 'acme', repo: 'api', userToken: 'user-token' },
        {
          getRepositories: async () => [
            { fullName: 'acme/api', installationId: 3, defaultBranch: 'main' },
          ],
          getUsername: async () => 'member',
          getPermission: async () => 'read',
          readManifest: async () => 'defaults: []\nitems: []\n',
          readSyncConfig,
        },
      ),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });

    expect(readSyncConfig).not.toHaveBeenCalled();
  });

  it('설정 조회 오류는 잘못된 설정으로 변환하지 않는다', async () => {
    const upstreamError = new Error('GitHub 요청 실패');

    await expect(
      getRepositoryDashboardData(
        { owner: 'acme', repo: 'api', userToken: 'user-token' },
        {
          getRepositories: async () => [
            { fullName: 'acme/api', installationId: 3, defaultBranch: 'main' },
          ],
          getUsername: async () => 'member',
          getPermission: async () => 'write',
          readManifest: async () => 'defaults: []\nitems: []\n',
          readSyncConfig: async () => {
            throw upstreamError;
          },
        },
      ),
    ).rejects.toBe(upstreamError);
  });
});
