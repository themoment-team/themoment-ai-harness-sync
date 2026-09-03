import { parse } from 'yaml';
import { z } from 'zod';

import type { HarnessManifest } from '../model/types';

const manifestSchema = z.object({
  defaults: z.array(z.string()).default([]),
  items: z.array(
    z.object({
      id: z.string().min(1),
      src: z.string().min(1),
      dest: z.string().min(1),
      groups: z.array(z.string()),
    }),
  ),
});

export function parseManifest(source: string): HarnessManifest {
  const manifest = manifestSchema.parse(parse(source));
  const itemIds = new Set<string>();

  for (const item of manifest.items) {
    if (itemIds.has(item.id)) {
      throw new Error(`중복된 동기화 항목 ID입니다: ${item.id}`);
    }

    itemIds.add(item.id);
  }

  return manifest;
}
