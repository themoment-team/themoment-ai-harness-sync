import type { Metadata } from 'next';

import { listGuideDocuments } from '@/entities/guide/index.server';
import { GuidePage } from '@/views/guide';

export const metadata: Metadata = {
  title: '가이드',
  description: 'AI Harness 설치, 동기화 설정, 대시보드 사용 가이드',
};

export default async function GuideIndexPage() {
  return <GuidePage documents={await listGuideDocuments()} />;
}
