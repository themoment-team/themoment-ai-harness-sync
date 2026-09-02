import { NextRequest } from 'next/server';

import { describe, expect, it, vi } from 'vitest';

const { getGitHubAccessToken } = vi.hoisted(() => ({ getGitHubAccessToken: vi.fn() }));

vi.mock('@/entities/repository/index.server', () => ({ DashboardDataError: class extends Error {} }));
vi.mock('@/features/create-config-pr/index.server', () => ({
  ConfigPullRequestError: class extends Error {},
  configChangeSchema: { safeParse: vi.fn() },
  createConfigPullRequest: vi.fn(),
}));
vi.mock('@/shared/api', () => ({ getGitHubAccessToken }));

import { POST } from './route';

describe('POST /api/repositories/[owner]/[repo]/config-pr', () => {
  it('잘못된 JSON 요청은 400을 반환한다', async () => {
    getGitHubAccessToken.mockResolvedValue('access-token');

    const response = await POST(
      new NextRequest('https://example.com/api/repositories/owner/repo/config-pr', {
        method: 'POST',
        body: '{',
        headers: { 'content-type': 'application/json' },
      }),
      { params: Promise.resolve({ owner: 'owner', repo: 'repo' }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: '요청 형식이 올바르지 않습니다.' });
  });
});
