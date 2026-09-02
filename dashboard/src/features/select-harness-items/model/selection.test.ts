import { describe, expect, it } from 'vitest';

import { toggleItem } from './selection';

describe('toggleItem', () => {
  it('고정 모드에서 선택 해제한 항목은 override 목록에서 제거한다', () => {
    expect(
      toggleItem(
        {
          enabled: true,
          mode: 'fixed',
          itemIds: ['claude/skills/api-design'],
          groups: [],
          overrides: {},
        },
        'claude/skills/api-design',
      ).itemIds,
    ).toEqual([]);
  });
});
