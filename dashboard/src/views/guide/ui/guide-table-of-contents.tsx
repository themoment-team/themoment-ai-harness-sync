'use client';

import { useEffect, useMemo, useState } from 'react';

import type { GuideHeading } from '../model/guide-heading';

export function GuideTableOfContents({ headings }: { headings: GuideHeading[] }) {
  const items = useMemo(
    () => headings.filter((heading) => heading.level === 2 || heading.level === 3),
    [headings],
  );
  const [activeId, setActiveId] = useState(items[0]?.id);

  useEffect(() => {
    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: '-15% 0px -70% 0px' },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  const links = (
    <div className="space-y-2">
      {items.map((item) => (
        <a
          className={`block leading-5 transition-colors ${
            item.level === 3 ? 'pl-3' : ''
          } ${activeId === item.id ? 'text-accent font-medium' : 'text-fg-muted hover:text-fg'}`}
          href={`#${item.id}`}
          key={item.id}
          onClick={(event) => {
            event.preventDefault();
            document
              .getElementById(item.id)
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        >
          {item.title}
        </a>
      ))}
    </div>
  );

  return (
    <>
      <details className="border-border bg-bg-subtle rounded-lg border px-4 py-3 xl:hidden">
        <summary className="cursor-pointer text-sm font-semibold">이 문서에서</summary>
        <div className="mt-4 text-sm">{links}</div>
      </details>
      <nav aria-label="문서 목차" className="sticky top-8 hidden self-start xl:block">
        <p className="mb-3 text-sm font-semibold">이 문서에서</p>
        <div className="text-sm">{links}</div>
      </nav>
    </>
  );
}
