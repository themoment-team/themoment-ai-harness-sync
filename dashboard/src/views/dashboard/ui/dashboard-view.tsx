'use client';

import { useCallback, useEffect, useState } from 'react';

import Link from 'next/link';

import { useSession } from 'next-auth/react';

import type { DashboardRepository, RepositoryDashboardData } from '@/entities/repository';
import {
  createSelectionState,
  ItemSelector,
  type SelectionState,
  switchToFixedSelection,
} from '@/features/select-harness-items';
import { SyncToggle } from '@/features/toggle-sync';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { AppHeader } from '@/widgets/app-header';
import { ConfigPreview } from '@/widgets/config-preview';
import { RepositorySidebar } from '@/widgets/repository-sidebar';

type LoadState = 'loading' | 'ready' | 'error';

export function DashboardView() {
  const { status } = useSession();
  const [repositories, setRepositories] = useState<DashboardRepository[]>([]);
  const [requestedRepository] = useState(() =>
    typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('repo'),
  );
  const [selectedRepository, setSelectedRepository] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<RepositoryDashboardData | null>(null);
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [repositoriesState, setRepositoriesState] = useState<LoadState>('loading');
  const [dataState, setDataState] = useState<LoadState>('loading');
  const [error, setError] = useState<string | null>(null);

  const loadRepositories = useCallback(async () => {
    setRepositoriesState('loading');
    setError(null);

    try {
      const response = await fetch('/api/repositories');
      const nextRepositories = (await response.json()) as DashboardRepository[] & {
        message?: string;
      };
      if (response.status === 401) {
        setRepositoriesState('error');
        setError('GitHub 로그인이 필요합니다.');
        return;
      }
      if (!response.ok)
        throw new Error(nextRepositories.message ?? '관리 가능한 프로젝트를 불러오지 못했습니다.');

      setRepositories(nextRepositories);
      setSelectedRepository(
        nextRepositories.find((repository) => repository.fullName === requestedRepository)?.fullName ??
          nextRepositories[0]?.fullName ??
          null,
      );
      setRepositoriesState('ready');
    } catch (caughtError) {
      setRepositoriesState('error');
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : '관리 가능한 프로젝트를 불러오지 못했습니다.',
      );
    }
  }, [requestedRepository]);

  const loadRepositoryData = useCallback(async (fullName: string) => {
    setDataState('loading');
    setError(null);

    try {
      const response = await fetch(`/api/repositories/${fullName}`);
      const body = (await response.json()) as RepositoryDashboardData & {
        code?: string;
        message?: string;
      };
      if (!response.ok)
        throw new Error(
          getApiErrorMessage(body.code, body.message ?? '프로젝트 설정을 불러오지 못했습니다.'),
        );

      setDashboardData(body);
      setSelection(createSelectionState(body.config, body.selectedItemIds));
      setDataState('ready');
    } catch (caughtError) {
      setDataState('error');
      setError(
        caughtError instanceof Error ? caughtError.message : '프로젝트 설정을 불러오지 못했습니다.',
      );
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    void Promise.resolve().then(loadRepositories);
  }, [loadRepositories, status]);

  useEffect(() => {
    if (!selectedRepository) return;
    void Promise.resolve().then(() => loadRepositoryData(selectedRepository));
  }, [loadRepositoryData, selectedRepository]);

  const selectRepository = useCallback((fullName: string) => {
    setSelectedRepository(fullName);
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('repo', fullName);
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}?${searchParams.toString()}${window.location.hash}`,
    );
  }, []);

  const [owner = '', repo = ''] = selectedRepository?.split('/') ?? [];

  return (
    <main className="bg-bg text-fg min-h-screen">
      <AppHeader />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <div className="border-border border-b pb-8">
          <p className="text-fg-muted max-w-2xl text-base leading-relaxed">
            필요한 AI 도구 설정만 선택하고, 검토 가능한 설정 PR로 반영합니다.
          </p>
        </div>

        {error && (
          <section
            role="alert"
            className="mt-8 rounded-lg border border-[#d9aaa4] bg-[#fff5f3] px-4 py-3 text-sm text-[#8e3024]"
          >
            <p>{error}</p>
            {error === 'GitHub 로그인이 필요합니다.' && (
              <Link
                className="mt-2 inline-block font-semibold underline"
                href="/api/auth/signin/github?callbackUrl=/"
              >
                로그인 계속하기
              </Link>
            )}
          </section>
        )}

        {repositoriesState === 'loading' && (
          <p className="text-fg-muted mt-10 text-sm">프로젝트 목록을 불러오는 중…</p>
        )}

        {repositoriesState === 'ready' && repositories.length === 0 && (
          <section className="border-border bg-bg-subtle mt-10 max-w-xl rounded-xl border p-6">
            <h2 className="text-lg font-semibold">관리할 수 있는 프로젝트가 없습니다</h2>
            <p className="text-fg-muted mt-2 text-sm leading-6">
              GitHub App이 설치되어 있고, 본인에게 write 이상 권한이 있는 레포가 표시됩니다.
            </p>
          </section>
        )}

        {repositories.length > 0 && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[12rem_minmax(0,1fr)_18rem]">
            <div className="border-border pr-0 lg:border-r lg:pr-8">
              <RepositorySidebar
                repositories={repositories}
                selectedRepository={selectedRepository}
                onSelect={selectRepository}
              />
            </div>

            <section>
              {dataState === 'loading' && (
                <p className="text-fg-muted text-sm">설정을 불러오는 중…</p>
              )}
              {dataState === 'ready' && dashboardData && selection && (
                <>
                  <SyncToggle
                    checked={selection.enabled}
                    onChange={(enabled) => setSelection({ ...selection, enabled })}
                  />
                  {selection.mode === 'automatic' && (
                    <aside className="border-accent bg-bg-subtle text-fg-muted mt-5 border-l-2 px-4 py-3 text-sm leading-6">
                      이 프로젝트는 새 항목을 자동 수신합니다. 고정 선택으로 전환하면 현재 수신 중인
                      항목만 유지합니다.
                      <button
                        type="button"
                        onClick={() =>
                          setSelection(
                            switchToFixedSelection(selection, dashboardData.selectedItemIds),
                          )
                        }
                        className="text-accent ml-2 font-semibold underline underline-offset-2"
                      >
                        고정 선택으로 전환
                      </button>
                    </aside>
                  )}
                  <div className="mt-6">
                    <ItemSelector
                      manifest={dashboardData.manifest}
                      selection={selection}
                      onChange={setSelection}
                    />
                  </div>
                </>
              )}
            </section>

            <section className="border-border pt-8 lg:border-l lg:pt-0 lg:pl-8">
              {dashboardData && selection && (
                <ConfigPreview
                  owner={owner}
                  repo={repo}
                  currentYaml={dashboardData.syncConfigSource}
                  selection={selection}
                />
              )}
              {dataState === 'error' && (
                <p className="text-sm text-[#8e3024]">설정을 표시할 수 없습니다.</p>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
