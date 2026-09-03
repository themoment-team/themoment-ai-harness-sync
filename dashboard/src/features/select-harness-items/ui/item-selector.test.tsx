// @vitest-environment jsdom

import { act } from 'react';

import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ItemSelector } from './item-selector';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

describe('ItemSelector', () => {
  it('도구와 항목 유형별 접이식 섹션으로 동기화 항목을 표시한다', () => {
    const html = renderToStaticMarkup(
      <ItemSelector
        manifest={{
          defaults: [],
          items: [
            { id: 'claude/skills/api-design', src: '', dest: '', groups: ['claude'] },
            { id: 'claude/hooks/secret-guard', src: '', dest: '', groups: [] },
            { id: 'codex/agents/web-researcher', src: '', dest: '', groups: ['codex'] },
            { id: 'gemini/settings', src: '', dest: '', groups: ['gemini'] },
          ],
        }}
        selection={{
          enabled: true,
          mode: 'fixed',
          itemIds: ['claude/skills/api-design', 'codex/agents/web-researcher'],
          groups: [],
          overrides: {},
        }}
        onChange={() => undefined}
      />,
    );

    expect(html).toContain('Claude');
    expect(html).toContain('Codex');
    expect(html).toContain('Gemini');
    expect(html).toContain('Skills');
    expect(html).toContain('Agents');
    expect(html).toContain('Hooks');
    expect(html).toContain('<details');
  });

  it('선택된 항목이 있어도 아코디언을 닫아서 시작한다', () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => {
      root.render(
        <ItemSelector
          manifest={{
            defaults: [],
            items: [{ id: 'claude/skills/api-design', src: '', dest: '', groups: ['claude'] }],
          }}
          selection={{
            enabled: true,
            mode: 'fixed',
            itemIds: ['claude/skills/api-design'],
            groups: [],
            overrides: {},
          }}
          onChange={() => undefined}
        />,
      );
    });

    expect(container.querySelector('details')?.open).toBe(false);
    act(() => root.unmount());
  });
});
