"use client";

import type { HarnessItem, HarnessManifest } from "@/entities/harness-config";

import { isItemSelected, toggleGroup, toggleItem, type SelectionState } from "../model/selection";

type ItemSelectorProps = {
  manifest: HarnessManifest;
  selection: SelectionState;
  onChange: (selection: SelectionState) => void;
};

export function ItemSelector({ manifest, selection, onChange }: ItemSelectorProps) {
  const groups = [...new Set(manifest.items.flatMap((item) => item.groups))].sort();

  return (
    <section className="space-y-6" aria-labelledby="items-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-accent text-xs uppercase tracking-label">Sync scope</p>
          <h2 id="items-title" className="mt-1 font-bold text-xl tracking-heading">동기화 항목</h2>
        </div>
        <span className="text-fg-muted text-xs">{selection.itemIds.length}개 선택</span>
      </div>

      {selection.mode === "automatic" && (
        <fieldset className="border-border border-y py-4">
          <legend className="text-sm font-medium">자동 수신 그룹</legend>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
            {groups.map((group) => (
              <label key={group} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selection.groups.includes(group)}
                  onChange={() => onChange(toggleGroup(selection, group))}
                  className="size-4 accent-accent"
                />
                {group}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="space-y-2">
        {manifest.items.map((item) => (
          <ItemRow key={item.id} item={item} selected={isItemSelected(selection, item)} onToggle={() => onChange(toggleItem(selection, item.id, item))} />
        ))}
      </div>
    </section>
  );
}

function ItemRow({ item, selected, onToggle }: { item: HarnessItem; selected: boolean; onToggle: () => void }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 transition-colors focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-bg ${selected ? "border-accent/40 bg-bg-subtle" : "border-border hover:border-fg/30"}`}>
      <input type="checkbox" checked={selected} onChange={onToggle} className="mt-0.5 size-4 shrink-0 accent-accent" />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{item.id.split("/").at(-1)}</span>
        <span className="mt-1 block break-all font-mono text-fg-muted text-xs">{item.id}</span>
      </span>
    </label>
  );
}
