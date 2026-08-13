import { parse } from 'yaml';

export type ParsedGuideDocument = {
  title: string;
  description: string;
  order: number;
  content: string;
};

export function parseGuideDocument(source: string): ParsedGuideDocument {
  const matched = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!matched) throw new Error('문서 frontmatter가 없습니다.');
  const metadata = parse(matched[1]) as Record<string, unknown>;
  if (
    typeof metadata.title !== 'string' ||
    typeof metadata.description !== 'string' ||
    typeof metadata.order !== 'number'
  ) {
    throw new Error('문서 frontmatter 형식이 올바르지 않습니다.');
  }
  return {
    title: metadata.title,
    description: metadata.description,
    order: metadata.order,
    content: matched[2].trim(),
  };
}
