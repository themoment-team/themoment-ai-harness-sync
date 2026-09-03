'use client';

import { useState } from 'react';

import { getApiErrorMessage } from '@/shared/lib/api-error';

import type { ConfigChange } from '../model/schema';

type CreateConfigPrButtonProps = {
  owner: string;
  repo: string;
  selection: ConfigChange;
};

export function CreateConfigPrButton({ owner, repo, selection }: CreateConfigPrButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function createPullRequest() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/repositories/${owner}/${repo}/config-pr`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(selection),
      });
      const result = (await response.json()) as { code?: string; message?: string; url?: string };
      if (!response.ok || !result.url) {
        throw new Error(
          getApiErrorMessage(result.code, result.message ?? '설정 PR을 만들지 못했습니다.'),
        );
      }

      setPending(false);
      window.open(result.url, '_blank', 'noopener');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : '설정 PR을 만들지 못했습니다.');
      setPending(false);
    }
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={createPullRequest}
        disabled={pending}
        className="bg-accent text-bg hover:bg-accent-active w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? '설정 PR 생성 중…' : '설정 PR 만들기'}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-xs leading-5 text-[#a2382a]">
          {error}
        </p>
      )}
    </div>
  );
}
