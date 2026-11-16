import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { parseGuideDocument } from '../lib/parse-guide-document';
import { listGuideDocuments } from './load-guide.server';

// 인라인 문자열이 아니라 실제 docs/guide 문서를 읽어, frontmatter 오류로 /guide가 깨지는 것을 머지 전에 잡는다
const guideDirectory = resolve(process.cwd(), '..', 'docs', 'guide');
const files = (await readdir(guideDirectory, { recursive: true }))
  .filter((file) => file.endsWith('.md'))
  .sort();

describe('docs/guide 문서', () => {
  it('문서가 하나 이상 있다', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s의 frontmatter를 읽을 수 있다', async (file) => {
    const source = await readFile(join(guideDirectory, file), 'utf8');
    expect(() => parseGuideDocument(source)).not.toThrow();
  });

  it('listGuideDocuments가 모든 문서를 읽는다', async () => {
    await expect(listGuideDocuments()).resolves.toHaveLength(files.length);
  });
});
