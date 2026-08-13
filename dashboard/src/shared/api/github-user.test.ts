import { describe, expect, it } from "vitest";

import { canManageHarness, getRepositoryPermission } from "./github-user";

describe("canManageHarness", () => {
  it("write 이상의 권한에서 설정 변경을 허용한다", () => {
    expect(canManageHarness("write")).toBe(true);
    expect(canManageHarness("maintain")).toBe(true);
    expect(canManageHarness("admin")).toBe(true);
  });

  it("read 이하 권한에서는 설정 변경을 허용하지 않는다", () => {
    expect(canManageHarness("read")).toBe(false);
    expect(canManageHarness("triage")).toBe(false);
    expect(canManageHarness("none")).toBe(false);
  });
});

describe("getRepositoryPermission", () => {
  it("GitHub 설치 레포의 권한을 대시보드 권한으로 변환한다", () => {
    expect(getRepositoryPermission({ push: true })).toBe("write");
    expect(getRepositoryPermission({ pull: true })).toBe("read");
  });
});
