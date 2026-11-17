import { describe, expect, it } from 'vitest';

import { splitStaleOverrides } from './stale-overrides';

describe('splitStaleOverrides', () => {
  it('manifest에 없는 override를 나누고, 기준 항목이 없어도 버전 항목이 있는 고정은 유지한다', () => {
    const manifest = {
      defaults: ['claude'],
      items: [
        { id: 'claude/skills/a', src: '', dest: '', groups: ['claude'] },
        { id: 'claude/skills/renamed@v1', src: '', dest: '', groups: [] },
      ],
    };

    expect(
      splitStaleOverrides(manifest, {
        'claude/skills/a': false,
        'claude/skills/renamed': 'v1',
        'claude/skills/removed': true,
        'claude/skills/a-pin': 'v9',
      }),
    ).toEqual({
      overrides: { 'claude/skills/a': false, 'claude/skills/renamed': 'v1' },
      staleItemIds: ['claude/skills/removed', 'claude/skills/a-pin'],
    });
  });
});
