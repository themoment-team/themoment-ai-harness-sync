import type { HarnessManifest, SyncOverride } from '../model/types';

// 버전 고정은 기준 항목이 사라져도 `id@version` 항목이 있으면 유효하다 (scripts/list-installed-repos.py와 같은 규칙)
function isKnownOverride(knownItemIds: Set<string>, itemId: string, override: SyncOverride) {
  return (
    knownItemIds.has(itemId) ||
    (typeof override === 'string' && knownItemIds.has(`${itemId}@${override}`))
  );
}

/** manifest에 없는 항목의 override를 나눠 낸다 */
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
