"use client";

import type { DashboardRepository } from "@/entities/repository/model/types";

type RepositorySidebarProps = {
  repositories: DashboardRepository[];
  selectedRepository: string | null;
  onSelect: (fullName: string) => void;
};

export function RepositorySidebar({ repositories, selectedRepository, onSelect }: RepositorySidebarProps) {
  return (
    <aside aria-label="관리할 프로젝트">
      <p className="font-medium text-accent text-xs uppercase tracking-label">Projects</p>
      <h2 className="mt-1 font-bold text-lg tracking-heading">내 프로젝트</h2>
      <div className="mt-4 space-y-1">
        {repositories.map((repository) => (
          <button
            key={repository.fullName}
            type="button"
            onClick={() => onSelect(repository.fullName)}
            className={`w-full rounded-lg border px-3 py-3 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              selectedRepository === repository.fullName
                ? "border-accent/40 bg-bg-subtle font-semibold text-accent"
                : "border-transparent text-fg-muted hover:border-border hover:text-fg"
            }`}
          >
            {repository.fullName}
          </button>
        ))}
      </div>
    </aside>
  );
}
