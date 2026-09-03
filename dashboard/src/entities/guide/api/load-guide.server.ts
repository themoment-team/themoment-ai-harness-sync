import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';

import { type ParsedGuideDocument, parseGuideDocument } from '../lib/parse-guide-document';

import 'server-only';

export type GuideDocument = ParsedGuideDocument & { slug: string[] };

const guideDirectory = resolve(process.cwd(), '..', 'docs', 'guide');

async function findMarkdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? findMarkdownFiles(join(directory, entry.name))
        : entry.name.endsWith('.md')
          ? [join(directory, entry.name)]
          : [],
    ),
  );
  return files.flat();
}

function slugFor(file: string): string[] {
  return relative(guideDirectory, file).replace(/\.md$/, '').split(sep);
}

export async function listGuideDocuments(): Promise<GuideDocument[]> {
  const files = await findMarkdownFiles(guideDirectory);
  const documents = await Promise.all(
    files.map(async (file) => ({
      ...parseGuideDocument(await readFile(file, 'utf8')),
      slug: slugFor(file),
    })),
  );
  return documents.sort((left, right) => left.order - right.order);
}

export async function getGuideDocument(slug: string[]): Promise<GuideDocument | null> {
  const file = resolve(guideDirectory, `${slug.join('/')}.md`);
  if (!file.startsWith(`${guideDirectory}${sep}`)) return null;
  try {
    return { ...parseGuideDocument(await readFile(file, 'utf8')), slug };
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT')
      return null;
    throw error;
  }
}
