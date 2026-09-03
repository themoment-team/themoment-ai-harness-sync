import { notFound } from 'next/navigation';

import type { Metadata } from 'next';

import { getGuideDocument, listGuideDocuments } from '@/entities/guide/index.server';
import { GuidePage } from '@/views/guide';

type GuideDocumentPageProps = PageProps<'/guide/[...slug]'>;

export async function generateMetadata({ params }: GuideDocumentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const document = await getGuideDocument(slug);

  return document
    ? { title: document.title, description: document.description }
    : { title: '문서를 찾을 수 없습니다' };
}

export default async function GuideDocumentPage({ params }: GuideDocumentPageProps) {
  const { slug } = await params;
  const [document, documents] = await Promise.all([getGuideDocument(slug), listGuideDocuments()]);
  if (!document) notFound();
  return <GuidePage document={document} documents={documents} />;
}
