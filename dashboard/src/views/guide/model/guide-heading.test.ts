import { describe, expect, it } from 'vitest';

import { createGuideHeadingId, getGuideHeadings } from './guide-heading';

describe('getGuideHeadings', () => {
  it('코드 블록을 제외한 제목의 앵커 ID를 만든다', () => {
    expect(
      getGuideHeadings(
        '# 안내\n\n## `AI` Harness\n\n```yaml\n## 제외\n```\n\n### [자세히](#detail)',
      ),
    ).toEqual([
      { id: '안내', level: 1, line: 1, title: '안내' },
      { id: 'ai-harness', level: 2, line: 3, title: 'AI Harness' },
      { id: '자세히', level: 3, line: 9, title: '자세히' },
    ]);
  });

  it('같은 제목에는 고유한 앵커 ID를 부여한다', () => {
    expect(getGuideHeadings('## 설정\n\n## 설정')).toMatchObject([
      { id: '설정' },
      { id: '설정-2' },
    ]);
  });
});

describe('createGuideHeadingId', () => {
  it('공유 가능한 URL 조각을 만든다', () => {
    expect(createGuideHeadingId('동기화 활성화 / 비활성화 (`enabled`)')).toBe(
      '동기화-활성화-비활성화-enabled',
    );
  });
});
