import { describe, expect, it } from 'vitest';

import { resolveGuideLink } from './guide-link';

describe('resolveGuideLink', () => {
  it('상대 Markdown 링크를 대시보드 가이드 경로로 변환한다', () => {
    expect(resolveGuideLink('./reference/skills.md', ['getting-started'])).toBe(
      '/guide/reference/skills',
    );
    expect(resolveGuideLink('../conventions/claude.md#훅-hooks', ['reference', 'agents'])).toBe(
      '/guide/conventions/claude#훅-hooks',
    );
  });

  it('가이드 밖을 가리키거나 Markdown 문서가 아닌 링크는 유지한다', () => {
    expect(resolveGuideLink('../../README.md', ['getting-started'])).toBe('../../README.md');
    expect(resolveGuideLink('https://example.com/guide.md', ['getting-started'])).toBe(
      'https://example.com/guide.md',
    );
    expect(resolveGuideLink('#section', ['getting-started'])).toBe('#section');
  });
});
