import { stringify } from 'yaml';

import type { SyncConfigInput, SyncOverride } from '../model/types';

function sortedOverrides(overrides: Record<string, SyncOverride>): Record<string, SyncOverride> {
  return Object.fromEntries(
    Object.entries(overrides).sort(([left], [right]) => left.localeCompare(right)),
  );
}

export function buildSyncConfig(input: SyncConfigInput): string {
  // 고정 모드에서도 선택된 항목의 버전 고정 값("v1" 등)은 유지한다
  const fixedOverrides = Object.fromEntries(
    input.itemIds.map((itemId) => {
      const override = input.overrides?.[itemId];
      return [itemId, typeof override === 'string' ? override : true];
    }),
  );
  const overrides = input.mode === 'fixed' ? fixedOverrides : (input.overrides ?? {});
  const config: Record<string, unknown> = {
    enabled: input.enabled,
    groups: input.mode === 'fixed' ? [] : (input.groups ?? []),
  };

  if (input.baseBranch) config.base_branch = input.baseBranch;
  if (input.branchPrefix) config.branch_prefix = input.branchPrefix;
  if (input.language) config.language = input.language;
  if (input.prLabel !== undefined) config.pr_label = input.prLabel;
  if (Object.keys(overrides).length > 0) config.overrides = sortedOverrides(overrides);

  return stringify(config, { lineWidth: 0 });
}
