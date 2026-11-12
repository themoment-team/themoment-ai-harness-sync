import { describe, expect, it } from 'vitest';

import { setItemsSelected, toggleItem } from './selection';

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

describe('setItemsSelected', () => {
  const items = [
    { id: 'claude/skills/a', src: '', dest: '', groups: ['claude'] },
    { id: 'claude/skills/b', src: '', dest: '', groups: [] },
  ];

  it('고정 모드에서 카테고리 항목을 한 번에 선택하고 해제한다', () => {
    const state = {
      enabled: true,
      mode: 'fixed' as const,
      itemIds: ['claude/skills/a'],
      groups: [],
      overrides: {},
    };

    const selected = setItemsSelected(state, items, true);
    expect(selected.itemIds).toEqual(['claude/skills/a', 'claude/skills/b']);
    expect(setItemsSelected(selected, items, false).itemIds).toEqual([]);
  });

  it('자동 모드에서는 상태가 바뀌는 항목에만 override를 기록한다', () => {
    const state = {
      enabled: true,
      mode: 'automatic' as const,
      itemIds: ['claude/skills/a'],
      groups: ['claude'],
      overrides: {},
    };

    expect(setItemsSelected(state, items, true).overrides).toEqual({ 'claude/skills/b': true });
    expect(setItemsSelected(state, items, false).overrides).toEqual({ 'claude/skills/a': false });
  });
});
