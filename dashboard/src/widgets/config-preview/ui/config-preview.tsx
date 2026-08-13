"use client";

import { buildSyncConfig } from "@/entities/harness-config";
import type { SelectionState } from "@/features/select-harness-items/model/selection";

import { CreateConfigPrButton } from "@/features/create-config-pr/ui/create-config-pr-button";

type ConfigPreviewProps = {
  owner: string;
  repo: string;
  selection: SelectionState;
};

export function ConfigPreview({ owner, repo, selection }: ConfigPreviewProps) {
  const yaml = buildSyncConfig(selection);

  return (
    <aside aria-label="설정 변경 미리보기">
      <p className="font-medium text-accent text-xs uppercase tracking-label">Preview</p>
      <h2 className="mt-1 font-bold text-lg tracking-heading">변경 미리보기</h2>
      <p className="mt-3 text-fg-muted text-xs leading-5">PR을 만들기 전 대상 레포의 sync.yml 변경 내용을 확인합니다.</p>
      <pre className="mt-4 overflow-x-auto rounded-md border border-border bg-bg-subtle p-4 font-mono text-fg text-xs leading-5">
        <code>{yaml}</code>
      </pre>
      <CreateConfigPrButton owner={owner} repo={repo} selection={selection} />
    </aside>
  );
}
