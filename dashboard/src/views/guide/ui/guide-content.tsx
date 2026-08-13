import { Children, isValidElement, type ReactNode } from 'react';

import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { createGuideHeadingId, type GuideHeading } from '../model/guide-heading';

type GuideContentProps = {
  content: string;
  headings: GuideHeading[];
};

function getText(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number') return String(child);
      if (isValidElement<{ children?: ReactNode }>(child)) return getText(child.props.children);
      return '';
    })
    .join('');
}

function isExternalLink(href?: string) {
  return href?.startsWith('https://') || href?.startsWith('http://');
}

export function GuideContent({ content, headings }: GuideContentProps) {
  const headingIdByLine = new Map(headings.map((heading) => [heading.line, heading.id]));
  const getHeadingId = (line: number | undefined, children: ReactNode) =>
    (line === undefined ? undefined : headingIdByLine.get(line)) ??
    createGuideHeadingId(getText(children));

  const components: Components = {
    a: ({ href, ...props }) => (
      <a
        href={href}
        rel={isExternalLink(href) ? 'noreferrer' : undefined}
        target={isExternalLink(href) ? '_blank' : undefined}
        {...props}
      />
    ),
    h1: ({ children, node, ...props }) => {
      const id = getHeadingId(node?.position?.start.line, children);
      return (
        <h1 id={id} className="group" {...props}>
          {children}
          <a
            className="anchor-heading"
            href={`#${id}`}
            aria-label={`${getText(children)} 섹션 링크`}
          >
            #
          </a>
        </h1>
      );
    },
    h2: ({ children, node, ...props }) => {
      const id = getHeadingId(node?.position?.start.line, children);
      return (
        <h2 id={id} className="group" {...props}>
          {children}
          <a
            className="anchor-heading"
            href={`#${id}`}
            aria-label={`${getText(children)} 섹션 링크`}
          >
            #
          </a>
        </h2>
      );
    },
    h3: ({ children, node, ...props }) => {
      const id = getHeadingId(node?.position?.start.line, children);
      return (
        <h3 id={id} className="group" {...props}>
          {children}
          <a
            className="anchor-heading"
            href={`#${id}`}
            aria-label={`${getText(children)} 섹션 링크`}
          >
            #
          </a>
        </h3>
      );
    },
  };

  return (
    <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
      {content}
    </ReactMarkdown>
  );
}
