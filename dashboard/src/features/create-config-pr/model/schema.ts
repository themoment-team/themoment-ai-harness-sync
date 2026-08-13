import { z } from "zod";

export const configChangeSchema = z.object({
  enabled: z.boolean(),
  mode: z.enum(["automatic", "fixed"]),
  itemIds: z.array(z.string().min(1)).max(200).transform((itemIds) => [...new Set(itemIds)]),
  groups: z.array(z.string().min(1)).max(20).default([]),
  overrides: z.record(z.string().min(1), z.union([z.boolean(), z.string().min(1)])).default({}),
});

export type ConfigChange = z.output<typeof configChangeSchema>;
