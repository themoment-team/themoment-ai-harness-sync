// @vitest-environment jsdom

import { act } from 'react';

import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

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

  it('도메인이 있는 항목은 Frontend, Backend, 공통 순서로 나눠 표시한다', () => {
    const html = renderToStaticMarkup(
      <ItemSelector
        manifest={{
          defaults: [],
          items: [
            { id: 'claude/skills/git-commit', src: '', dest: '', groups: [], domain: 'common' },
            { id: 'claude/skills/api-design', src: '', dest: '', groups: [], domain: 'backend' },
            { id: 'claude/skills/legacy', src: '', dest: '', groups: [] },
            {
              id: 'claude/skills/tailwind-shadcn',
              src: '',
              dest: '',
              groups: [],
              domain: 'frontend',
            },
          ],
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

    const sectionOrder = ['Skills Frontend', 'Skills Backend', 'Skills 공통', 'Skills 기타'].map(
      (label) => html.indexOf(`aria-label="${label}"`),
    );
    expect(sectionOrder.every((index) => index !== -1)).toBe(true);
    expect(sectionOrder).toEqual([...sectionOrder].sort((left, right) => left - right));
    expect(html.indexOf('tailwind-shadcn')).toBeLessThan(html.indexOf('api-design'));
  });

  it('도메인이 없는 유형은 하위 구분 없이 표시한다', () => {
    const html = renderToStaticMarkup(
      <ItemSelector
        manifest={{
          defaults: [],
          items: [{ id: 'claude/hooks/secret-guard', src: '', dest: '', groups: [] }],
        }}
        selection={{ enabled: true, mode: 'fixed', itemIds: [], groups: [], overrides: {} }}
        onChange={() => undefined}
      />,
    );

    expect(html).not.toContain('기타');
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

  it('카테고리 체크박스는 일부 선택 시 중간 상태이고 클릭하면 아코디언을 유지한 채 전체 선택한다', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    const onChange = vi.fn();

    act(() => {
      root.render(
        <ItemSelector
          manifest={{
            defaults: [],
            items: [
              { id: 'claude/skills/a', src: '', dest: '', groups: [] },
              { id: 'claude/skills/b', src: '', dest: '', groups: [] },
            ],
          }}
          selection={{
            enabled: true,
            mode: 'fixed',
            itemIds: ['claude/skills/a'],
            groups: [],
            overrides: {},
          }}
          onChange={onChange}
        />,
      );
    });

    const checkbox = container.querySelector<HTMLInputElement>(
      'input[aria-label="Skills 전체 선택"]',
    );
    expect(checkbox?.indeterminate).toBe(true);
    expect(checkbox?.closest('summary')).toBeNull();

    act(() => checkbox?.click());

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ itemIds: ['claude/skills/a', 'claude/skills/b'] }),
    );
    expect(container.querySelector('details')?.open).toBe(false);
    act(() => root.unmount());
    container.remove();
  });
});
