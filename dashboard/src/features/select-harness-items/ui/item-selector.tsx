'use client';

import { useState } from 'react';

import type { HarnessItem, HarnessManifest } from '@/entities/harness-config';

import { isItemSelected, type SelectionState, toggleGroup, toggleItem } from '../model/selection';

type ItemSelectorProps = {
  manifest: HarnessManifest;
  selection: SelectionState;
  onChange: (selection: SelectionState) => void;
};

const providerLabels: Record<string, string> = {
  claude: 'Claude',
  codex: 'Codex',
  gemini: 'Gemini',
  nextjs: 'Next.js',
};

const categoryLabels: Record<string, string> = {
  skills: 'Skills',
  agents: 'Agents',
  hooks: 'Hooks',
  settings: 'Settings',
  config: 'Config',
  fsd: 'FSD',
};

const providerOrder = ['claude', 'codex', 'gemini', 'nextjs'];
const categoryOrder = ['skills', 'agents', 'hooks', 'settings', 'config', 'fsd'];

function categoryFor(item: HarnessItem): string {
  const category = item.id.split('/')[1] ?? 'other';
  return category.startsWith('hooks') ? 'hooks' : category;
}

function labelFor(value: string, labels: Record<string, string>): string {
  return labels[value] ?? value;
}

function orderFor(value: string, order: string[]): number {
  const index = order.indexOf(value);
  return index === -1 ? order.length : index;
}

function groupHarnessItems(items: HarnessItem[]) {
  const providers = new Map<string, Map<string, HarnessItem[]>>();

  for (const item of items) {
    const [provider = 'other'] = item.id.split('/');
    const categories = providers.get(provider) ?? new Map<string, HarnessItem[]>();
    const category = categoryFor(item);
    categories.set(category, [...(categories.get(category) ?? []), item]);
    providers.set(provider, categories);
  }

  return [...providers.entries()]
    .sort(([left], [right]) => orderFor(left, providerOrder) - orderFor(right, providerOrder))
    .map(([id, categories]) => ({
      id,
      label: labelFor(id, providerLabels),
      categories: [...categories.entries()]
        .sort(([left], [right]) => orderFor(left, categoryOrder) - orderFor(right, categoryOrder))
        .map(([category, categoryItems]) => ({
          id: category,
          label: labelFor(category, categoryLabels),
          items: categoryItems,
        })),
    }));
}

export function ItemSelector({ manifest, selection, onChange }: ItemSelectorProps) {
  const groups = [...new Set(manifest.items.flatMap((item) => item.groups))].sort();
  const providers = groupHarnessItems(manifest.items);

  return (
    <section className="space-y-6" aria-labelledby="items-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-accent tracking-label text-xs font-medium uppercase">Sync scope</p>
          <h2 id="items-title" className="tracking-heading mt-1 text-xl font-bold">
            동기화 항목
          </h2>
        </div>
        <span className="text-fg-muted text-xs">{selection.itemIds.length}개 선택</span>
      </div>

      {selection.mode === 'automatic' && (
        <fieldset className="border-border border-y py-4">
          <legend className="text-sm font-medium">자동 수신 그룹</legend>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
            {groups.map((group) => (
              <label key={group} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selection.groups.includes(group)}
                  onChange={() => onChange(toggleGroup(selection, group))}
                  className="accent-accent size-4"
                />
                {group}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="space-y-6">
        {providers.map((provider) => {
          const providerSelectedCount = provider.categories
            .flatMap((category) => category.items)
            .filter((item) => isItemSelected(selection, item)).length;

          return (
            <section key={provider.id} aria-label={`${provider.label} 동기화 항목`}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold">{provider.label}</h3>
                <span className="text-fg-muted text-xs">{providerSelectedCount}개 선택</span>
              </div>
              <div className="space-y-2">
                {provider.categories.map((category) => (
                  <ItemCategory
                    key={category.id}
                    category={category}
                    selection={selection}
                    onChange={onChange}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}

function ItemCategory({
  category,
  selection,
  onChange,
}: {
  category: { id: string; label: string; items: HarnessItem[] };
  selection: SelectionState;
  onChange: (selection: SelectionState) => void;
}) {
  const selectedCount = category.items.filter((item) => isItemSelected(selection, item)).length;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <details
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      className="border-border rounded-lg border"
    >
      <summary className="flex cursor-pointer items-center justify-between px-3 py-3 text-sm font-medium">
        <span>{category.label}</span>
        <span className="text-fg-muted text-xs">
          {selectedCount}/{category.items.length}개 선택
        </span>
      </summary>
      <div className="border-border space-y-2 border-t p-2">
        {category.items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            selected={isItemSelected(selection, item)}
            onToggle={() => onChange(toggleItem(selection, item.id, item))}
          />
        ))}
      </div>
    </details>
  );
}

function ItemRow({
  item,
  selected,
  onToggle,
}: {
  item: HarnessItem;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={`focus-within:ring-accent focus-within:ring-offset-bg flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 transition-colors focus-within:ring-2 focus-within:ring-offset-2 ${selected ? 'border-accent/40 bg-bg-subtle' : 'border-border hover:border-fg/30'}`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="accent-accent mt-0.5 size-4 shrink-0"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{item.id.split('/').at(-1)}</span>
        <span className="text-fg-muted mt-1 block font-mono text-xs break-all">{item.id}</span>
      </span>
    </label>
  );
}
