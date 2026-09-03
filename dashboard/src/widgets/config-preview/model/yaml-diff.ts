export type YamlDiffLine = {
  type: 'added' | 'context' | 'removed';
  value: string;
};

function splitLines(source: string): string[] {
  return source.trimEnd().split('\n').filter(Boolean);
}

export function createYamlDiff(currentSource: string | null, nextSource: string): YamlDiffLine[] {
  const current = currentSource ? splitLines(currentSource) : [];
  const next = splitLines(nextSource);
  const lengths = Array.from({ length: current.length + 1 }, () =>
    Array<number>(next.length + 1).fill(0),
  );

  for (let currentIndex = current.length - 1; currentIndex >= 0; currentIndex -= 1) {
    for (let nextIndex = next.length - 1; nextIndex >= 0; nextIndex -= 1) {
      lengths[currentIndex][nextIndex] =
        current[currentIndex] === next[nextIndex]
          ? lengths[currentIndex + 1][nextIndex + 1] + 1
          : Math.max(lengths[currentIndex + 1][nextIndex], lengths[currentIndex][nextIndex + 1]);
    }
  }

  const diff: YamlDiffLine[] = [];
  let currentIndex = 0;
  let nextIndex = 0;
  while (currentIndex < current.length || nextIndex < next.length) {
    if (current[currentIndex] === next[nextIndex]) {
      diff.push({ type: 'context', value: current[currentIndex] });
      currentIndex += 1;
      nextIndex += 1;
    } else if (
      nextIndex === next.length ||
      (currentIndex < current.length &&
        lengths[currentIndex + 1][nextIndex] >= lengths[currentIndex][nextIndex + 1])
    ) {
      diff.push({ type: 'removed', value: current[currentIndex] });
      currentIndex += 1;
    } else {
      diff.push({ type: 'added', value: next[nextIndex] });
      nextIndex += 1;
    }
  }

  return diff;
}
