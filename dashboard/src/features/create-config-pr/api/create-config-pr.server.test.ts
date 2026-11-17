import { describe, expect, it, vi } from 'vitest';

import { createConfigPullRequest } from './create-config-pr.server';

describe('createConfigPullRequest', () => {
  it('열린 harness-config PR이 있으면 새 브랜치를 만들지 않는다', async () => {
    const createReference = vi.fn();

    await expect(
      createConfigPullRequest(
        {
          owner: 'acme',
          repo: 'api',
          userToken: 'user-token',
          config: {
            enabled: true,
            mode: 'fixed',
            itemIds: ['claude/skills/api-design'],
            groups: [],
            overrides: {},
          },
        },
        {
          getDashboardData: async () => ({
            repository: { fullName: 'acme/api', installationId: 3, defaultBranch: 'main' },
            manifest: {
              defaults: ['claude'],
              items: [
                { id: 'claude/skills/api-design', src: 'source', dest: 'dest', groups: ['claude'] },
              ],
            },
            config: { enabled: true, mode: 'automatic', groups: ['claude'], overrides: {} },
            syncConfigSource: 'enabled: true\ngroups:\n  - claude\n',
            selectedItemIds: ['claude/skills/api-design'],
          }),
          findOpenConfigPullRequest: async () => ({
            url: 'https://github.com/acme/api/pull/12',
            number: 12,
          }),
          createReference,
          writeSyncConfig: vi.fn(),
          createPullRequest: vi.fn(),
        },
      ),
    ).resolves.toEqual({ url: 'https://github.com/acme/api/pull/12', number: 12 });

    expect(createReference).not.toHaveBeenCalled();
  });

  it('설정 변경이 없으면 PR을 만들지 않는다', async () => {
    const createReference = vi.fn();

    await expect(
      createConfigPullRequest(
        {
          owner: 'acme',
          repo: 'api',
          userToken: 'user-token',
          config: {
            enabled: true,
            mode: 'automatic',
            itemIds: ['claude/skills/api-design'],
            groups: ['claude'],
            overrides: {},
          },
        },
        {
          getDashboardData: async () => ({
            repository: { fullName: 'acme/api', installationId: 3, defaultBranch: 'main' },
            manifest: {
              defaults: ['claude'],
              items: [
                { id: 'claude/skills/api-design', src: 'source', dest: 'dest', groups: ['claude'] },
              ],
            },
            config: { enabled: true, mode: 'automatic', groups: ['claude'], overrides: {} },
            syncConfigSource: 'enabled: true\ngroups:\n  - claude\n',
            selectedItemIds: ['claude/skills/api-design'],
          }),
          findOpenConfigPullRequest: async () => null,
          createReference,
          writeSyncConfig: vi.fn(),
          createPullRequest: vi.fn(),
        },
      ),
    ).rejects.toMatchObject({ code: 'NO_CHANGES' });

    expect(createReference).not.toHaveBeenCalled();
  });

  it('매니페스트에서 삭제된 override는 막지 않고 파일에서 정리한 뒤 PR 본문에 표시한다', async () => {
    const writeSyncConfig = vi.fn();
    const createPullRequest = vi.fn(async () => ({
      url: 'https://github.com/acme/api/pull/13',
      number: 13,
    }));

    await createConfigPullRequest(
      {
        owner: 'acme',
        repo: 'api',
        userToken: 'user-token',
        config: {
          enabled: true,
          mode: 'automatic',
          itemIds: ['claude/skills/api-design'],
          groups: ['claude'],
          // 수정 전 화면은 오래된 override를 그대로 보낸다
          overrides: { 'claude/skills/removed': false },
        },
      },
      {
        getDashboardData: async () => ({
          repository: { fullName: 'acme/api', installationId: 3, defaultBranch: 'main' },
          manifest: {
            defaults: ['claude'],
            items: [
              { id: 'claude/skills/api-design', src: 'source', dest: 'dest', groups: ['claude'] },
            ],
          },
          config: {
            enabled: true,
            mode: 'automatic',
            groups: ['claude'],
            overrides: { 'claude/skills/removed': false },
          },
          syncConfigSource:
            'enabled: true\ngroups:\n  - claude\noverrides:\n  claude/skills/removed: false\n',
          selectedItemIds: ['claude/skills/api-design'],
        }),
        findOpenConfigPullRequest: async () => null,
        createReference: vi.fn(),
        writeSyncConfig,
        createPullRequest,
      },
    );

    expect(writeSyncConfig).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.not.stringContaining('claude/skills/removed') }),
    );
    expect(createPullRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining(
          '- 정리: `claude/skills/removed` (매니페스트에 없는 항목 또는 버전)',
        ),
      }),
    );
  });

  it('고정 모드에서 기준 항목이 삭제된 버전 고정도 조용히 빠지지 않고 본문에 표시한다', async () => {
    const writeSyncConfig = vi.fn();
    const createPullRequest = vi.fn(async () => ({
      url: 'https://github.com/acme/api/pull/14',
      number: 14,
    }));

    await createConfigPullRequest(
      {
        owner: 'acme',
        repo: 'api',
        userToken: 'user-token',
        config: {
          enabled: true,
          mode: 'fixed',
          itemIds: ['claude/skills/api-design'],
          groups: [],
          overrides: { 'claude/skills/renamed': 'v1' },
        },
      },
      {
        getDashboardData: async () => ({
          repository: { fullName: 'acme/api', installationId: 3, defaultBranch: 'main' },
          manifest: {
            defaults: ['claude'],
            items: [
              { id: 'claude/skills/api-design', src: 'source', dest: 'dest', groups: ['claude'] },
              { id: 'claude/skills/renamed@v1', src: 'source', dest: 'dest', groups: [] },
            ],
          },
          config: {
            enabled: true,
            mode: 'fixed',
            groups: [],
            overrides: { 'claude/skills/api-design': true, 'claude/skills/renamed': 'v1' },
          },
          syncConfigSource:
            'enabled: true\ngroups: []\noverrides:\n  claude/skills/api-design: true\n  claude/skills/renamed: v1\n',
          selectedItemIds: ['claude/skills/api-design'],
        }),
        findOpenConfigPullRequest: async () => null,
        createReference: vi.fn(),
        writeSyncConfig,
        createPullRequest,
      },
    );

    expect(writeSyncConfig).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.not.stringContaining('claude/skills/renamed') }),
    );
    expect(createPullRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining(
          '- 정리: `claude/skills/renamed` (매니페스트에 없는 항목 또는 버전)',
        ),
      }),
    );
  });
});
