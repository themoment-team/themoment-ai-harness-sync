import type { HarnessManifest, SyncConfig } from '@/entities/harness-config/@x/repository';

export type DashboardRepository = {
  fullName: string;
  installationId: number;
  defaultBranch: string;
};

export type RepositoryDashboardData = {
  repository: DashboardRepository;
  manifest: HarnessManifest;
  config: SyncConfig;
  syncConfigSource: string | null;
  selectedItemIds: string[];
};
