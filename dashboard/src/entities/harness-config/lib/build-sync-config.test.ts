import { describe, expect, it } from 'vitest';

import { buildSyncConfig } from './build-sync-config';
import { parseSyncConfig } from './parse-sync-config';

describe('buildSyncConfig', () => {
  it('고정 선택은 그룹을 비우고 true override만 기록한다', () => {
    expect(
      buildSyncConfig({
        enabled: true,
        mode: 'fixed',
        itemIds: ['gemini/settings', 'claude/skills/api-design'],
      }),
    ).toBe(
      'enabled: true\ngroups: []\noverrides:\n  claude/skills/api-design: true\n  gemini/settings: true\n',
    );
  });

  it('자동 수신 설정의 기존 옵션을 보존한다', () => {
    expect(
      buildSyncConfig({
        enabled: false,
        mode: 'automatic',
        groups: ['claude'],
        overrides: { 'claude/skills/git-commit': false },
        baseBranch: 'develop',
        prLabel: false,
        itemIds: [],
      }),
    ).toBe(
      'enabled: false\ngroups:\n  - claude\nbase_branch: develop\npr_label: false\noverrides:\n  claude/skills/git-commit: false\n',
    );
  });

  it('설정 파일이 없으면 기존 자동 수신 기본값을 사용한다', () => {
    expect(parseSyncConfig(null, ['claude', 'codex'])).toMatchObject({
      enabled: true,
      mode: 'automatic',
      groups: ['claude', 'codex'],
    });
  });

  it('빈 그룹 설정은 새 항목을 자동 수신하지 않는 고정 선택이다', () => {
    expect(
      parseSyncConfig(
        'enabled: false\ngroups: []\noverrides:\n  claude/skills/api-design: true\n',
        ['claude'],
      ),
    ).toMatchObject({ enabled: false, mode: 'fixed', groups: [] });
  });

  it('잘못된 YAML 설정은 거부한다', () => {
    expect(() => parseSyncConfig('enabled: nope', ['claude'])).toThrow();
  });
});
