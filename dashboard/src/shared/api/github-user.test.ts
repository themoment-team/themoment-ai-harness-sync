import { afterEach, describe, expect, it, vi } from 'vitest';

const { getToken } = vi.hoisted(() => ({ getToken: vi.fn() }));

vi.mock('next-auth/jwt', () => ({ getToken }));
vi.mock('@/shared/config/env', () => ({ getServerEnv: () => ({ AUTH_SECRET: 'secret' }) }));

import { canManageHarness, getGitHubAccessToken, getRepositoryPermission } from './github-user';

afterEach(() => vi.clearAllMocks());

describe('canManageHarness', () => {
  it('write 이상의 권한에서 설정 변경을 허용한다', () => {
    expect(canManageHarness('write')).toBe(true);
    expect(canManageHarness('maintain')).toBe(true);
    expect(canManageHarness('admin')).toBe(true);
  });

  it('read 이하 권한에서는 설정 변경을 허용하지 않는다', () => {
    expect(canManageHarness('read')).toBe(false);
    expect(canManageHarness('triage')).toBe(false);
    expect(canManageHarness('none')).toBe(false);
  });
});

describe('getRepositoryPermission', () => {
  it('GitHub 설치 레포의 권한을 대시보드 권한으로 변환한다', () => {
    expect(getRepositoryPermission({ push: true })).toBe('write');
    expect(getRepositoryPermission({ pull: true })).toBe('read');
  });
});

describe('getGitHubAccessToken', () => {
  it('만료 60초 전부터 access token을 사용하지 않는다', async () => {
    getToken.mockResolvedValue({
      githubAccessToken: 'access-token',
      githubAccessTokenExpiresAt: Date.now() + 59_000,
    });

    await expect(getGitHubAccessToken(new Request('https://example.com') as never)).resolves.toBeNull();
  });
});
