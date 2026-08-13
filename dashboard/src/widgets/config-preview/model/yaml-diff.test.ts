import { describe, expect, it } from "vitest";

import { createYamlDiff } from "./yaml-diff";

describe("createYamlDiff", () => {
  it("변경된 줄은 이전 값과 새 값을 차례로 표시한다", () => {
    expect(createYamlDiff("enabled: true\ngroups: []\n", "enabled: false\ngroups: []\n")).toEqual([
      { type: "removed", value: "enabled: true" },
      { type: "added", value: "enabled: false" },
      { type: "context", value: "groups: []" },
    ]);
  });
});
