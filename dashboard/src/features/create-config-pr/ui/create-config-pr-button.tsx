"use client";

import { useState } from "react";

import type { SelectionState } from "@/features/select-harness-items/model/selection";

type CreateConfigPrButtonProps = {
  owner: string;
  repo: string;
  selection: SelectionState;
};

export function CreateConfigPrButton({ owner, repo, selection }: CreateConfigPrButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function createPullRequest() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/repositories/${owner}/${repo}/config-pr`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(selection),
      });
      const result = await response.json() as { message?: string; url?: string };
      if (!response.ok || !result.url) throw new Error(result.message ?? "설정 PR을 만들지 못했습니다.");

      window.location.assign(result.url);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "설정 PR을 만들지 못했습니다.");
      setPending(false);
    }
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={createPullRequest}
        disabled={pending}
        className="w-full rounded-lg bg-accent px-4 py-3 font-semibold text-bg text-sm transition-colors hover:bg-accent-active disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "설정 PR 생성 중…" : "설정 PR 만들기"}
      </button>
      {error && <p role="alert" className="mt-3 text-[#a2382a] text-xs leading-5">{error}</p>}
    </div>
  );
}
