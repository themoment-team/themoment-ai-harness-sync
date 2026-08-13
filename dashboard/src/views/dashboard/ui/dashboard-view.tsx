"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

import type { RepositoryDashboardData, DashboardRepository } from "@/entities/repository/model/types";
import { ItemSelector } from "@/features/select-harness-items/ui/item-selector";
import {
  createSelectionState,
  switchToFixedSelection,
  type SelectionState,
} from "@/features/select-harness-items/model/selection";
import { SyncToggle } from "@/features/toggle-sync/ui/sync-toggle";
import { ThemeToggle } from "@/features/theme";
import { ConfigPreview } from "@/widgets/config-preview/ui/config-preview";
import { RepositorySidebar } from "@/widgets/repository-sidebar/ui/repository-sidebar";

type LoadState = "loading" | "ready" | "error";

export function DashboardView() {
  const { data: session, status } = useSession();
  const [repositories, setRepositories] = useState<DashboardRepository[]>([]);
  const [selectedRepository, setSelectedRepository] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<RepositoryDashboardData | null>(null);
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [repositoriesState, setRepositoriesState] = useState<LoadState>("loading");
  const [dataState, setDataState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);

  const loadRepositories = useCallback(async () => {
    setRepositoriesState("loading");
    setError(null);

    try {
      const response = await fetch("/api/repositories");
      const nextRepositories = await response.json() as DashboardRepository[] & { message?: string };
      if (response.status === 401) {
        setRepositoriesState("error");
        setError("GitHub 로그인이 필요합니다.");
        return;
      }
      if (!response.ok) throw new Error(nextRepositories.message ?? "관리 가능한 프로젝트를 불러오지 못했습니다.");

      setRepositories(nextRepositories);
      setSelectedRepository(nextRepositories[0]?.fullName ?? null);
      setRepositoriesState("ready");
    } catch (caughtError) {
      setRepositoriesState("error");
      setError(caughtError instanceof Error ? caughtError.message : "관리 가능한 프로젝트를 불러오지 못했습니다.");
    }
  }, []);

  const loadRepositoryData = useCallback(async (fullName: string) => {
    setDataState("loading");
    setError(null);

    try {
      const response = await fetch(`/api/repositories/${fullName}`);
      const body = await response.json() as RepositoryDashboardData & { message?: string };
      if (!response.ok) throw new Error(body.message ?? "프로젝트 설정을 불러오지 못했습니다.");

      setDashboardData(body);
      setSelection(createSelectionState(body.config, body.selectedItemIds));
      setDataState("ready");
    } catch (caughtError) {
      setDataState("error");
      setError(caughtError instanceof Error ? caughtError.message : "프로젝트 설정을 불러오지 못했습니다.");
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadRepositories);
  }, [loadRepositories]);

  useEffect(() => {
    if (!selectedRepository) return;
    void Promise.resolve().then(() => loadRepositoryData(selectedRepository));
  }, [loadRepositoryData, selectedRepository]);

  const [owner = "", repo = ""] = selectedRepository?.split("/") ?? [];

  return (
    <main className="min-h-screen bg-bg text-fg">
      <header className="border-border border-b">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="font-medium text-accent text-xs uppercase tracking-label">Themoment / AI Harness</p>
            <h1 className="mt-2 font-bold text-2xl leading-heading tracking-heading sm:text-3xl">프로젝트 동기화 제어</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {status === "authenticated" ? (
              <>
                {session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={`${session.user?.name ?? "GitHub"}의 GitHub 프로필 사진`}
                    width={32}
                    height={32}
                    className="size-8 rounded-full border border-border object-cover"
                  />
                ) : (
                  <span className="flex size-8 items-center justify-center rounded-full bg-bg-subtle text-fg-muted text-xs font-semibold" aria-label={`${session.user?.name ?? "GitHub"}의 GitHub 프로필 사진`}>
                    {(session.user?.name ?? "G").slice(0, 1).toUpperCase()}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => void signOut({ callbackUrl: "/" })}
                  className="rounded-lg border border-border px-4 py-2 text-fg-muted text-sm transition-colors hover:border-fg/30 hover:text-fg"
                >
                  로그아웃
                </button>
              </>
            ) : status === "unauthenticated" ? (
              <Link href="/api/auth/signin/github?callbackUrl=/" className="rounded-lg border border-border px-4 py-2 text-fg-muted text-sm transition-colors hover:border-fg/30 hover:text-fg">
                GitHub 로그인
              </Link>
            ) : <span className="inline-block h-9 w-28" aria-hidden />}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <div className="border-border border-b pb-8">
          <p className="max-w-2xl text-base text-fg-muted leading-relaxed">필요한 AI 도구 설정만 선택하고, 검토 가능한 설정 PR로 반영합니다.</p>
        </div>

        {error && (
          <section role="alert" className="mt-8 rounded-lg border border-[#d9aaa4] bg-[#fff5f3] px-4 py-3 text-sm text-[#8e3024]">
            <p>{error}</p>
            {error === "GitHub 로그인이 필요합니다." && <Link className="mt-2 inline-block font-semibold underline" href="/api/auth/signin/github?callbackUrl=/">로그인 계속하기</Link>}
          </section>
        )}

        {repositoriesState === "loading" && <p className="mt-10 text-fg-muted text-sm">프로젝트 목록을 불러오는 중…</p>}

        {repositoriesState === "ready" && repositories.length === 0 && (
          <section className="mt-10 max-w-xl rounded-xl border border-border bg-bg-subtle p-6">
            <h2 className="text-lg font-semibold">관리할 수 있는 프로젝트가 없습니다</h2>
            <p className="mt-2 text-fg-muted text-sm leading-6">GitHub App이 설치되어 있고, 본인에게 maintain 또는 admin 권한이 있는 레포가 표시됩니다.</p>
          </section>
        )}

        {repositories.length > 0 && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[12rem_minmax(0,1fr)_16rem]">
            <div className="border-border pr-0 lg:border-r lg:pr-8">
              <RepositorySidebar repositories={repositories} selectedRepository={selectedRepository} onSelect={setSelectedRepository} />
            </div>

            <section>
              {dataState === "loading" && <p className="text-fg-muted text-sm">설정을 불러오는 중…</p>}
              {dataState === "ready" && dashboardData && selection && (
                <>
                  <SyncToggle checked={selection.enabled} onChange={(enabled) => setSelection({ ...selection, enabled })} />
                  {selection.mode === "automatic" && (
                    <aside className="mt-5 border-accent border-l-2 bg-bg-subtle px-4 py-3 text-fg-muted text-sm leading-6">
                      이 프로젝트는 새 항목을 자동 수신합니다. 고정 선택으로 전환하면 현재 수신 중인 항목만 유지합니다.
                      <button type="button" onClick={() => setSelection(switchToFixedSelection(selection, dashboardData.selectedItemIds))} className="ml-2 font-semibold text-accent underline underline-offset-2">고정 선택으로 전환</button>
                    </aside>
                  )}
                  <div className="mt-6">
                    <ItemSelector manifest={dashboardData.manifest} selection={selection} onChange={setSelection} />
                  </div>
                </>
              )}
            </section>

            <section className="border-border pt-8 lg:border-l lg:pt-0 lg:pl-8">
              {dashboardData && selection && <ConfigPreview owner={owner} repo={repo} selection={selection} />}
              {dataState === "error" && <p className="text-[#8e3024] text-sm">설정을 표시할 수 없습니다.</p>}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
