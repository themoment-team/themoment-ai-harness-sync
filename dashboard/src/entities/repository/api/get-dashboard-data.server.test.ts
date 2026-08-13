import { describe, expect, it, vi } from "vitest";

import { getRepositoryDashboardData } from "./get-dashboard-data.server";

describe("getRepositoryDashboardData", () => {
  it("권한이 없으면 대상 설정을 읽지 않는다", async () => {
    const readSyncConfig = vi.fn();

    await expect(
      getRepositoryDashboardData(
        { owner: "acme", repo: "api", userToken: "user-token" },
        {
          getRepositories: async () => [{ fullName: "acme/api", installationId: 3, defaultBranch: "main" }],
          getUsername: async () => "member",
          getPermission: async () => "read",
          readManifest: async () => "defaults: []\nitems: []\n",
          readSyncConfig,
        },
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    expect(readSyncConfig).not.toHaveBeenCalled();
  });
});
