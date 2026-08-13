import { describe, expect, it } from "vitest";

import { parseGuideDocument } from "./parse-guide-document";

describe("parseGuideDocument", () => {
  it("frontmatter와 Markdown 본문을 분리한다", () => {
    expect(parseGuideDocument("---\ntitle: 시작하기\ndescription: 설명\norder: 10\n---\n\n# 본문")).toEqual({
      title: "시작하기",
      description: "설명",
      order: 10,
      content: "# 본문",
    });
  });
});
