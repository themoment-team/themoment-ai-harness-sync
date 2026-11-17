import type { HarnessManifest, SyncOverride } from '../model/types';

// 버전 고정은 `id@version` 항목이 있어야 동기화된다 (scripts/list-installed-repos.py는 없으면 pin을 무시한다).
// 삭제·이름 변경된 항목은 고정할 수 없으므로 기준 항목도 있어야 한다 (docs/guide/sync-configuration.md)
function isKnownOverride(knownItemIds: Set<string>, itemId: string, override: SyncOverride) {
  if (!knownItemIds.has(itemId)) return false;
  return typeof override !== 'string' || knownItemIds.has(`${itemId}@${override}`);
}

/** manifest 기준으로 동기화에 반영되지 않는 override를 나눠 낸다 */
export function splitStaleOverrides(
  manifest: HarnessManifest,
  overrides: Record<string, SyncOverride>,
): { overrides: Record<string, SyncOverride>; staleItemIds: string[] } {
  const knownItemIds = new Set(manifest.items.map((item) => item.id));
  const entries = Object.entries(overrides);

  return {
    overrides: Object.fromEntries(
      entries.filter(([itemId, override]) => isKnownOverride(knownItemIds, itemId, override)),
    ),
    staleItemIds: entries
      .filter(([itemId, override]) => !isKnownOverride(knownItemIds, itemId, override))
      .map(([itemId]) => itemId),
  };
}
