"use client";

type SyncToggleProps = {
  checked: boolean;
  onChange: (enabled: boolean) => void;
};

export function SyncToggle({ checked, onChange }: SyncToggleProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 border-border border-b pb-4">
      <span>
        <span className="block text-sm font-semibold">AI Harness 동기화</span>
        <span className="mt-1 block text-fg-muted text-xs leading-5">
          {checked ? "새 변경을 동기화 PR로 받습니다." : "새 동기화 및 정리 PR을 만들지 않습니다."}
        </span>
      </span>
      <input
        type="checkbox"
        role="switch"
        aria-label="AI Harness 동기화 활성화"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-9 accent-accent"
      />
    </label>
  );
}
