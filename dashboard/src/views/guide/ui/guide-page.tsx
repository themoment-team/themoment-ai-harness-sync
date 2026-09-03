import Link from 'next/link';

import type { GuideDocument } from '@/entities/guide/index.server';
import { AppHeader } from '@/widgets/app-header';

import { groupGuideDocuments } from '../model/group-guide-documents';
import { getGuideHeadings } from '../model/guide-heading';
import { CopyHeadingLinks } from './copy-heading-links';
import { GuideContent } from './guide-content';
import { GuideTableOfContents } from './guide-table-of-contents';

export function GuidePage({
  document,
  documents,
}: {
  document?: GuideDocument;
  documents: GuideDocument[];
}) {
  const headings = document ? getGuideHeadings(document.content) : [];

  return (
    <main className="bg-bg text-fg min-h-screen">
      <AppHeader />
      {document && <CopyHeadingLinks />}
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[12rem_minmax(0,1fr)] xl:grid-cols-[12rem_minmax(0,1fr)_12rem]">
        <nav aria-label="가이드 탐색" className="hidden text-sm lg:block">
          {groupGuideDocuments(documents).map((category) => (
            <section key={category.title} className="mb-6 last:mb-0">
              <p className="mb-3 font-semibold">{category.title}</p>
              {category.documents.map((item) => (
                <Link
                  key={item.slug.join('/')}
                  href={`/guide/${item.slug.join('/')}`}
                  className="text-fg-muted hover:text-accent mb-2 block"
                >
                  {item.title}
                </Link>
              ))}
            </section>
          ))}
        </nav>
        {document ? (
          <article className="prose-guide min-w-0">
            <GuideContent content={document.content} headings={headings} />
          </article>
        ) : (
          <section>
            <p className="text-accent tracking-label text-xs font-medium uppercase">Guide</p>
            <h1 className="tracking-heading mt-2 text-3xl font-bold">AI Harness 가이드</h1>
            <p className="text-fg-muted mt-4 leading-7">
              설치, 동기화 설정, 대시보드 사용 방법을 확인하세요.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {documents.map((item) => (
                <Link
                  key={item.slug.join('/')}
                  href={`/guide/${item.slug.join('/')}`}
                  className="border-border hover:border-accent rounded-lg border p-5"
                >
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="text-fg-muted mt-2 text-sm leading-6">{item.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
        {document && <GuideTableOfContents headings={headings} />}
      </div>
    </main>
  );
}
