import { describe, expect, it } from 'vitest';

import { splitStaleOverrides } from './stale-overrides';

describe('splitStaleOverrides', () => {
  const manifest = {
    defaults: ['claude'],
    items: [
      { id: 'claude/skills/a', src: '', dest: '', groups: ['claude'] },
      { id: 'claude/skills/a@v1', src: '', dest: '', groups: [] },
      { id: 'claude/skills/renamed@v1', src: '', dest: '', groups: [] },
    ],
  };

  it('기준 항목과 버전 항목이 모두 있는 override만 남긴다', () => {
    expect(
      splitStaleOverrides(manifest, {
        'claude/skills/a': 'v1',
        'claude/skills/removed': true,
      }),
    ).toEqual({
      overrides: { 'claude/skills/a': 'v1' },
      staleItemIds: ['claude/skills/removed'],
    });
  });

  it('버전 항목이 없는 고정은 동기화가 무시하므로 정리한다', () => {
    expect(splitStaleOverrides(manifest, { 'claude/skills/a': 'v9' })).toEqual({
      overrides: {},
      staleItemIds: ['claude/skills/a'],
    });
  });

  it('기준 항목이 삭제된 항목의 고정은 지원하지 않으므로 정리한다', () => {
    expect(splitStaleOverrides(manifest, { 'claude/skills/renamed': 'v1' })).toEqual({
      overrides: {},
      staleItemIds: ['claude/skills/renamed'],
    });
  });
});
