import { describe, expect, it } from 'vitest';

import type { GuideDocument } from '@/entities/guide/index.server';

import { groupGuideDocuments } from './group-guide-documents';

describe('groupGuideDocuments', () => {
  it('Wiki 구조에 맞게 문서를 카테고리로 묶는다', () => {
    const documents = [
      { slug: ['getting-started'], title: '시작하기' },
      { slug: ['architecture', 'frontend'], title: '프론트엔드 아키텍처' },
      { slug: ['reference', 'skills'], title: '스킬 레퍼런스' },
      { slug: ['conventions', 'claude'], title: 'Claude 컨벤션' },
      { slug: ['other'], title: '기타' },
    ] as GuideDocument[];

    expect(groupGuideDocuments(documents)).toEqual([
      { title: '설정', documents: [documents[0]] },
      { title: '레퍼런스', documents: [documents[1], documents[2]] },
      { title: '컨벤션', documents: [documents[3]] },
      { title: '기타', documents: [documents[4]] },
    ]);
  });
});
