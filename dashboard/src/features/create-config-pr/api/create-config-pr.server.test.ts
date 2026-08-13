import { describe, expect, it, vi } from "vitest";

import { createConfigPullRequest } from "./create-config-pr.server";

describe("createConfigPullRequest", () => {
  it("열린 harness-config PR이 있으면 새 브랜치를 만들지 않는다", async () => {
    const createReference = vi.fn();

    await expect(
      createConfigPullRequest(
        {
          owner: "acme",
          repo: "api",
          userToken: "user-token",
          config: {
            enabled: true,
            mode: "fixed",
            itemIds: ["claude/skills/api-design"],
            groups: [],
            overrides: {},
          },
        },
        {
          getDashboardData: async () => ({
            repository: { fullName: "acme/api", installationId: 3, defaultBranch: "main" },
            manifest: {
              defaults: ["claude"],
              items: [{ id: "claude/skills/api-design", src: "source", dest: "dest", groups: ["claude"] }],
            },
            config: { enabled: true, mode: "automatic", groups: ["claude"], overrides: {} },
            selectedItemIds: ["claude/skills/api-design"],
          }),
          findOpenConfigPullRequest: async () => ({ url: "https://github.com/acme/api/pull/12", number: 12 }),
          createReference,
          writeSyncConfig: vi.fn(),
          createPullRequest: vi.fn(),
        },
      ),
    ).resolves.toEqual({ url: "https://github.com/acme/api/pull/12", number: 12 });

    expect(createReference).not.toHaveBeenCalled();
  });
});
