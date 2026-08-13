import { parse } from "yaml";
import { z } from "zod";

import type { HarnessManifest, SyncConfig, SyncOverride } from "../model/types";

const syncConfigSchema = z.object({
  enabled: z.boolean().default(true),
  groups: z.array(z.string()).optional(),
  overrides: z.record(z.string(), z.union([z.boolean(), z.string()])).default({}),
  base_branch: z.string().optional(),
  branch_prefix: z.string().optional(),
  language: z.string().optional(),
  pr_label: z.boolean().optional(),
});

export function parseSyncConfig(source: string | null, defaultGroups: string[]): SyncConfig {
  if (source === null) {
    return {
      enabled: true,
      mode: "automatic",
      groups: defaultGroups,
      overrides: {},
    };
  }

  const raw = syncConfigSchema.parse(parse(source));
  const groups = raw.groups ?? defaultGroups;

  return {
    enabled: raw.enabled,
    mode: groups.length === 0 ? "fixed" : "automatic",
    groups,
    overrides: raw.overrides as Record<string, SyncOverride>,
    baseBranch: raw.base_branch,
    branchPrefix: raw.branch_prefix,
    language: raw.language,
    prLabel: raw.pr_label,
  };
}

export function resolveSelectedItemIds(manifest: HarnessManifest, config: SyncConfig): string[] {
  return manifest.items
    .filter((item) => {
      const override = config.overrides[item.id];
      return override === false ? false : Boolean(override) || item.groups.some((group) => config.groups.includes(group));
    })
    .map((item) => item.id);
}
