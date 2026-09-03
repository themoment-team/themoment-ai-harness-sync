import type { HarnessItem, SyncConfig } from '@/entities/harness-config';

export type SelectionState = {
  enabled: boolean;
  mode: 'automatic' | 'fixed';
  itemIds: string[];
  groups: string[];
  overrides: Record<string, boolean | string>;
};

export function createSelectionState(config: SyncConfig, itemIds: string[]): SelectionState {
  return {
    enabled: config.enabled,
    mode: config.mode,
    itemIds,
    groups: config.groups,
    overrides: config.overrides,
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
  const overrides = { ...state.overrides, [itemId]: !selected };
  const itemIds = selected
    ? state.itemIds.filter((candidate) => candidate !== itemId)
    : [...state.itemIds, itemId];

  return { ...state, itemIds, overrides };
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
  return { ...state, mode: 'fixed', itemIds: selectedItemIds, groups: [], overrides: {} };
}
