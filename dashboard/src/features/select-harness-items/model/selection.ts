import type { HarnessItem, SyncConfig } from '@/entities/harness-config';

export type SelectionState = {
  enabled: boolean;
  mode: 'automatic' | 'fixed';
  itemIds: string[];
  groups: string[];
  overrides: Record<string, boolean | string>;
  /** 설정에서 읽은 버전 고정 값. 해제 후 재선택할 때 복원한다 */
  pinnedVersions?: Record<string, string>;
};

export function createSelectionState(config: SyncConfig, itemIds: string[]): SelectionState {
  return {
    enabled: config.enabled,
    mode: config.mode,
    itemIds,
    groups: config.groups,
    overrides: config.overrides,
    pinnedVersions: Object.fromEntries(
      Object.entries(config.overrides).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    ),
  };
}

export function isItemSelected(state: SelectionState, item: HarnessItem): boolean {
  if (state.mode === 'fixed') return state.itemIds.includes(item.id);

  const override = state.overrides[item.id];
  return override === false
    ? false
    : Boolean(override) || item.groups.some((group) => state.groups.includes(group));
}

export function toggleItem(
  state: SelectionState,
  itemId: string,
  item?: HarnessItem,
): SelectionState {
  if (state.mode === 'fixed') {
    const itemIds = state.itemIds.includes(itemId)
      ? state.itemIds.filter((candidate) => candidate !== itemId)
      : [...state.itemIds, itemId];
    return { ...state, itemIds };
  }

  if (!item) return state;
  const selected = isItemSelected(state, item);
  const overrides = { ...state.overrides };
  const override = automaticOverride(state, item, !selected);
  if (override === undefined) delete overrides[itemId];
  else overrides[itemId] = override;
  const itemIds = selected
    ? state.itemIds.filter((candidate) => candidate !== itemId)
    : [...state.itemIds, itemId];

  return { ...state, itemIds, overrides };
}

// 그룹 선택만으로 같은 결과가 나오면 override를 남기지 않고, 버전 고정 값은 유지한다
function automaticOverride(
  state: SelectionState,
  item: HarnessItem,
  selected: boolean,
): boolean | string | undefined {
  const coveredByGroup = item.groups.some((group) => state.groups.includes(group));
  if (selected) return state.pinnedVersions?.[item.id] ?? (coveredByGroup ? undefined : true);
  return coveredByGroup ? false : undefined;
}

export function setItemsSelected(
  state: SelectionState,
  items: HarnessItem[],
  selected: boolean,
): SelectionState {
  return items
    .filter((item) => isItemSelected(state, item) !== selected)
    .reduce((next, item) => toggleItem(next, item.id, item), state);
}

export function toggleGroup(state: SelectionState, group: string): SelectionState {
  const groups = state.groups.includes(group)
    ? state.groups.filter((candidate) => candidate !== group)
    : [...state.groups, group];
  return { ...state, groups };
}

export function switchToFixedSelection(
  state: SelectionState,
  selectedItemIds: string[],
): SelectionState {
  const pinnedVersions = {
    ...state.pinnedVersions,
    ...Object.fromEntries(
      Object.entries(state.overrides).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    ),
  };
  return {
    ...state,
    mode: 'fixed',
    itemIds: selectedItemIds,
    groups: [],
    overrides: pinnedVersions,
    pinnedVersions,
  };
}
