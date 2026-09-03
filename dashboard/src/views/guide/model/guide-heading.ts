export type GuideHeading = {
  id: string;
  level: 1 | 2 | 3;
  line: number;
  title: string;
};

export function createGuideHeadingId(title: string): string {
  return (
    title
      .normalize('NFC')
      .toLocaleLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-') || 'section'
  );
}

function toPlainText(source: string): string {
  return source
    .replace(/!?(?:\[([^\]]+)\]\([^)]*\))/g, '$1')
    .replace(/[`*_~]/g, '')
    .trim();
}

export function getGuideHeadings(content: string): GuideHeading[] {
  const usedIds = new Map<string, number>();
  let insideCodeBlock = false;

  return content.split('\n').flatMap((line, index) => {
    if (line.trimStart().startsWith('```')) {
      insideCodeBlock = !insideCodeBlock;
      return [];
    }
    if (insideCodeBlock) return [];

    const match = /^(#{1,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) return [];

    const title = toPlainText(match[2]);
    const baseId = createGuideHeadingId(title);
    const count = usedIds.get(baseId) ?? 0;
    usedIds.set(baseId, count + 1);

    return [
      {
        id: count === 0 ? baseId : `${baseId}-${count + 1}`,
        level: match[1].length as GuideHeading['level'],
        line: index + 1,
        title,
      },
    ];
  });
}
