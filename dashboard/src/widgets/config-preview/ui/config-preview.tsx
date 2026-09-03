'use client';

import { buildSyncConfig } from '@/entities/harness-config';
import { CreateConfigPrButton } from '@/features/create-config-pr';
import { RequestSyncButton } from '@/features/request-sync';
import type { SelectionState } from '@/features/select-harness-items';

import { createYamlDiff } from '../model/yaml-diff';

type ConfigPreviewProps = {
  owner: string;
  repo: string;
  currentYaml: string | null;
  selection: SelectionState;
};

const diffLineClassNames = {
  added: 'bg-[#e8f5e9] text-[#26732e] dark:bg-[#1d3a25] dark:text-[#9be5a4]',
  context: 'text-fg',
  removed: 'bg-[#fff0ef] text-[#a2382a] dark:bg-[#3b2023] dark:text-[#ffaaa3]',
};

export function ConfigPreview({ owner, repo, currentYaml, selection }: ConfigPreviewProps) {
  const yaml = buildSyncConfig(selection);
  const diff = createYamlDiff(currentYaml, yaml);

  return (
    <aside aria-label="설정 변경 미리보기">
      <p className="text-accent tracking-label text-xs font-medium uppercase">Preview</p>
      <h2 className="tracking-heading mt-1 text-lg font-bold">변경 미리보기</h2>
      <p className="text-fg-muted mt-3 text-xs leading-5">
        PR을 만들기 전 대상 레포의 실제 sync.yml 변경 내용을 확인합니다.
      </p>
      <pre className="border-border bg-bg-subtle text-fg mt-4 overflow-x-auto rounded-md border p-4 font-mono text-xs leading-5">
        <code>
          {diff.map((line, index) => (
            <span
              key={`${line.type}-${line.value}-${index}`}
              className={`block min-w-max px-1 ${diffLineClassNames[line.type]}`}
            >
              {line.type === 'added' ? '+ ' : line.type === 'removed' ? '- ' : '  '}
              {line.value}
            </span>
          ))}
        </code>
      </pre>
      <CreateConfigPrButton owner={owner} repo={repo} selection={selection} />
      {selection.enabled && <RequestSyncButton owner={owner} repo={repo} />}
    </aside>
  );
}
