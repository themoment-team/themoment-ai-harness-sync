import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { parseManifest } from './parse-manifest';

const item = (extra: string) => `items:
  - id: claude/skills/sample
    src: a/
    dest: a/
    groups: [claude]
${extra}`;

describe('parseManifest', () => {
  it('항목의 domain을 읽는다', () => {
    expect(parseManifest(item('    domain: frontend')).items[0]?.domain).toBe('frontend');
  });

  it('domain이 없는 항목도 허용한다', () => {
    expect(parseManifest(item('')).items[0]?.domain).toBeUndefined();
  });

  it('정의되지 않은 domain은 거부한다', () => {
    expect(() => parseManifest(item('    domain: mobile'))).toThrow();
  });

  it('저장소 manifest의 모든 스킬과 에이전트에 domain이 지정되어 있다', () => {
    const source = readFileSync(
      path.resolve(import.meta.dirname, '../../../../../sync-manifest.yml'),
      'utf8',
    );
    const missing = parseManifest(source)
      .items.filter((entry) => /^(claude|codex)\/(skills|agents)\//.test(entry.id))
      .filter((entry) => !entry.domain)
      .map((entry) => entry.id);

    expect(missing).toEqual([]);
  });
});
