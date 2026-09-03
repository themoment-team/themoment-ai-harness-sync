import type { GuideDocument } from '@/entities/guide/index.server';

type GuideCategory = {
  title: string;
  documents: GuideDocument[];
};

const categoryTitles = ['설정', '레퍼런스', '컨벤션', '기타'] as const;

function categoryFor(document: GuideDocument): (typeof categoryTitles)[number] {
  const [section] = document.slug;
  if (section === 'reference' || section === 'architecture') return '레퍼런스';
  if (section === 'conventions') return '컨벤션';
  if (
    ['getting-started', 'github-app-setup', 'sync-configuration', 'dashboard-guide'].includes(
      section,
    )
  ) {
    return '설정';
  }
  return '기타';
}

export function groupGuideDocuments(documents: GuideDocument[]): GuideCategory[] {
  return categoryTitles
    .map((title) => ({
      title,
      documents: documents.filter((document) => categoryFor(document) === title),
    }))
    .filter((category) => category.documents.length > 0);
}
