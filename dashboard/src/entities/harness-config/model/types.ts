export type HarnessItem = {
  id: string;
  src: string;
  dest: string;
  groups: string[];
};

export type HarnessManifest = {
  items: HarnessItem[];
  defaults: string[];
};

export type SyncOverride = boolean | string;
export type SyncMode = 'automatic' | 'fixed';

export type SyncConfig = {
  enabled: boolean;
  mode: SyncMode;
  groups: string[];
  overrides: Record<string, SyncOverride>;
  baseBranch?: string;
  branchPrefix?: string;
  language?: string;
  prLabel?: boolean;
};

export type SyncConfigInput = {
  enabled: boolean;
  mode: SyncMode;
  itemIds: string[];
  groups?: string[];
  overrides?: Record<string, SyncOverride>;
  baseBranch?: string;
  branchPrefix?: string;
  language?: string;
  prLabel?: boolean;
};
