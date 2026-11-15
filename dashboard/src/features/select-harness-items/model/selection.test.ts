import { describe, expect, it } from 'vitest';

import {
  createSelectionState,
  setItemsSelected,
  switchToFixedSelection,
  toggleItem,
} from './selection';

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

  it('자동 모드에서 해제 후 재선택하면 그룹이 보장하는 항목의 override를 지운다', () => {
    const state = {
      enabled: true,
      mode: 'automatic' as const,
      itemIds: ['claude/skills/a'],
      groups: ['claude'],
      overrides: {},
    };

    const roundTrip = setItemsSelected(setItemsSelected(state, items, false), items, true);
    expect(roundTrip.overrides).toEqual({ 'claude/skills/b': true });
    expect(roundTrip.itemIds).toEqual(['claude/skills/a', 'claude/skills/b']);
  });

  it('자동 모드에서 해제 후 재선택해도 버전 고정 값을 복원한다', () => {
    const state = createSelectionState(
      {
        enabled: true,
        mode: 'automatic',
        groups: ['claude'],
        overrides: { 'claude/skills/a': 'v1' },
      },
      ['claude/skills/a'],
    );

    const cleared = setItemsSelected(state, items, false);
    expect(cleared.overrides).toEqual({ 'claude/skills/a': false });
    expect(setItemsSelected(cleared, items, true).overrides).toEqual({
      'claude/skills/a': 'v1',
      'claude/skills/b': true,
    });
  });
});

describe('switchToFixedSelection', () => {
  it('고정 모드로 전환해도 버전 고정 값을 유지하고 해제 후 재선택에도 보존한다', () => {
    const items = [{ id: 'claude/skills/the-sdk', src: '', dest: '', groups: ['claude'] }];
    const state = createSelectionState(
      {
        enabled: true,
        mode: 'automatic',
        groups: ['claude'],
        overrides: { 'claude/skills/the-sdk': 'v1' },
      },
      ['claude/skills/the-sdk'],
    );

    const fixed = switchToFixedSelection(state, ['claude/skills/the-sdk']);
    expect(fixed.overrides).toEqual({ 'claude/skills/the-sdk': 'v1' });

    const roundTrip = setItemsSelected(setItemsSelected(fixed, items, false), items, true);
    expect(roundTrip.itemIds).toEqual(['claude/skills/the-sdk']);
    expect(roundTrip.overrides).toEqual({ 'claude/skills/the-sdk': 'v1' });
  });
});
