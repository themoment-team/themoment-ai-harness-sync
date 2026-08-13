import type { HarnessManifest, SyncConfig } from "@/entities/harness-config";

export type DashboardRepository = {
  fullName: string;
  installationId: number;
  defaultBranch: string;
};

export type RepositoryDashboardData = {
  repository: DashboardRepository;
  manifest: HarnessManifest;
  config: SyncConfig;
  selectedItemIds: string[];
};
