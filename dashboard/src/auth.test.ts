import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/config/env', () => ({
  getServerEnv: () => ({
    GITHUB_CLIENT_ID: 'client-id',
    GITHUB_CLIENT_SECRET: 'client-secret',
  }),
}));

import { getAuthOptions, refreshGitHubAccessToken } from './auth';

describe('refreshGitHubAccessToken', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('GitHub refresh token으로 새 사용자 access token을 발급받는다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 28_800,
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      refreshGitHubAccessToken({
        githubAccessToken: 'old-access-token',
        githubRefreshToken: 'refresh-token',
      }),
    ).resolves.toMatchObject({
      githubAccessToken: 'new-access-token',
      githubRefreshToken: 'new-refresh-token',
    });

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe('POST');
    expect(Object.fromEntries(options.body as URLSearchParams)).toEqual({
      client_id: 'client-id',
      client_secret: 'client-secret',
      grant_type: 'refresh_token',
      refresh_token: 'refresh-token',
    });
  });

  it('refresh token이 없으면 재로그인을 요구한다', async () => {
    await expect(
      refreshGitHubAccessToken({ githubAccessToken: 'old-access-token' }),
    ).resolves.toMatchObject({
      githubTokenError: 'RefreshAccessTokenError',
    });
  });

  it('만료 임박한 JWT는 세션 조회 중에 갱신한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token',
            expires_in: 28_800,
          }),
        ),
      ),
    );
    const callback = getAuthOptions().callbacks?.jwt;
    if (!callback) throw new Error('JWT 콜백이 없습니다.');

    await expect(
      callback({
        token: {
          githubAccessToken: 'old-access-token',
          githubAccessTokenExpiresAt: Date.now(),
          githubRefreshToken: 'refresh-token',
        },
      } as never),
    ).resolves.toMatchObject({ githubAccessToken: 'new-access-token' });
  });

  it('갱신 오류를 클라이언트 세션에 전달한다', async () => {
    const callback = getAuthOptions().callbacks?.session;
    if (!callback) throw new Error('세션 콜백이 없습니다.');

    expect(
      callback({
        session: { expires: '2026-08-19T00:00:00.000Z', user: {} },
        token: { githubTokenError: 'RefreshAccessTokenError' },
      } as never),
    ).toMatchObject({ githubTokenError: 'RefreshAccessTokenError' });
  });

  it('GitHub 로그인 ID를 세션에 전달한다', async () => {
    const { jwt, session } = getAuthOptions().callbacks ?? {};
    if (!jwt || !session) throw new Error('인증 콜백이 없습니다.');

    await expect(
      jwt({
        account: { access_token: 'access-token' },
        profile: { login: 'themoment' },
        token: {},
      } as never),
    ).resolves.toMatchObject({ githubLogin: 'themoment' });

    expect(
      session({
        session: { expires: '2026-08-19T00:00:00.000Z', user: {} },
        token: { githubLogin: 'themoment' },
      } as never),
    ).toMatchObject({ githubLogin: 'themoment' });
  });
});
