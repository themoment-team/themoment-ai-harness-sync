import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  GITHUB_APP_ID: z.string().regex(/^\d+$/),
  GITHUB_APP_PRIVATE_KEY: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  HARNESS_REPOSITORY: z.string().regex(/^[^/]+\/[^/]+$/),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(input: Record<string, string | undefined>): ServerEnv {
  return serverEnvSchema.parse(input);
}

export function getServerEnv(): ServerEnv {
  return parseServerEnv(process.env);
}
