'use client';

import type { DashboardRepository } from '@/entities/repository';

type RepositorySidebarProps = {
  repositories: DashboardRepository[];
  selectedRepository: string | null;
  onSelect: (fullName: string) => void;
};

export function RepositorySidebar({
  repositories,
  selectedRepository,
  onSelect,
}: RepositorySidebarProps) {
  return (
    <aside aria-label="관리할 프로젝트">
      <p className="text-accent tracking-label text-xs font-medium uppercase">Projects</p>
      <h2 className="tracking-heading mt-1 text-lg font-bold">내 프로젝트</h2>
      <div className="mt-4 space-y-1">
        {repositories.map((repository) => (
          <button
            key={repository.fullName}
            type="button"
            onClick={() => onSelect(repository.fullName)}
            className={`focus-visible:outline-accent w-full rounded-lg border px-3 py-3 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
              selectedRepository === repository.fullName
                ? 'border-accent/40 bg-bg-subtle text-accent font-semibold'
                : 'text-fg-muted hover:border-border hover:text-fg border-transparent'
            }`}
          >
            {repository.fullName}
          </button>
        ))}
      </div>
    </aside>
  );
}
