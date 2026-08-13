'use client';

import { useState } from 'react';

import { getApiErrorMessage } from '@/shared/lib/api-error';

export function RequestSyncButton({ owner, repo }: { owner: string; repo: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function requestSync() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/repositories/${owner}/${repo}/sync`, { method: 'POST' });
      const result = (await response.json()) as { code?: string; message?: string; url?: string };
      if (!response.ok || !result.url)
        throw new Error(
          getApiErrorMessage(result.code, result.message ?? '동기화를 요청하지 못했습니다.'),
        );
      window.location.assign(result.url);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : '동기화를 요청하지 못했습니다.',
      );
      setPending(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={requestSync}
        disabled={pending}
        className="border-border text-fg hover:border-fg/30 w-full rounded-lg border px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? '동기화 요청 중…' : '지금 동기화'}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-xs leading-5 text-[#a2382a]">
          {error}
        </p>
      )}
    </div>
  );
}
