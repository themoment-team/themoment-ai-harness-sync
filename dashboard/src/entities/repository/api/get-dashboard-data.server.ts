import "server-only";

import { Buffer } from "node:buffer";

import { Octokit } from "@octokit/rest";

import { parseManifest, parseSyncConfig, resolveSelectedItemIds } from "@/entities/harness-config";
import {
  getInstallationTokenForApp,
  getRepositoryInstallationId,
} from "@/shared/api/github-app";
import {
  canManageHarness,
  createUserOctokit,
  getAuthenticatedUsername,
  getRepositoryPermission,
  getUserRepositoryPermission,
  type RepositoryPermission,
} from "@/shared/api/github-user";
import { getServerEnv } from "@/shared/config/env";

import type { DashboardRepository, RepositoryDashboardData } from "../model/types";

export class DashboardDataError extends Error {
  constructor(readonly code: "FORBIDDEN" | "NOT_FOUND" | "INVALID_CONFIG" | "UPSTREAM") {
    super(code);
  }
}

type RepositoryInput = {
  owner: string;
  repo: string;
  userToken: string;
};

type DashboardServices = {
  getRepositories: (userToken: string) => Promise<DashboardRepository[]>;
  getUsername: (userToken: string) => Promise<string>;
  getPermission: (input: RepositoryInput & { username: string }) => Promise<RepositoryPermission>;
  readManifest: () => Promise<string>;
  readSyncConfig: (repository: DashboardRepository) => Promise<string | null>;
};

function decodeRepositoryFile(content: { content?: string; encoding?: string }): string {
  if (!content.content || content.encoding !== "base64") {
    throw new DashboardDataError("UPSTREAM");
  }

  return Buffer.from(content.content, "base64").toString("utf8");
}

async function readFile(input: {
  installationId: number;
  owner: string;
  repo: string;
  path: string;
  ref: string;
}): Promise<string | null> {
  const token = await getInstallationTokenForApp(input.installationId);
  const octokit = new Octokit({ auth: token });

  try {
    const { data } = await octokit.rest.repos.getContent(input);
    if (Array.isArray(data) || data.type !== "file") throw new DashboardDataError("UPSTREAM");
    return decodeRepositoryFile(data);
  } catch (error) {
    if (typeof error === "object" && error !== null && "status" in error && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function getDashboardRepositories(userToken: string): Promise<DashboardRepository[]> {
  const env = getServerEnv();
  const userOctokit = createUserOctokit(userToken);
  const { data } = await userOctokit.request("GET /user/installations");
  const installations = data.installations.filter((installation) => installation.app_id === Number(env.GITHUB_APP_ID));
  const repositories = await Promise.all(
    installations.map(async (installation) => {
      const { data: installationRepositories } = await userOctokit.request(
        "GET /user/installations/{installation_id}/repositories",
        { installation_id: installation.id },
      );

      return installationRepositories.repositories.flatMap((repository) =>
        canManageHarness(getRepositoryPermission(repository.permissions))
          ? [{ fullName: repository.full_name, installationId: installation.id, defaultBranch: repository.default_branch }]
          : [],
      );
    }),
  );

  return repositories.flat().sort((left, right) => left.fullName.localeCompare(right.fullName));
}

async function readHarnessManifest(): Promise<string> {
  const env = getServerEnv();
  const [owner, repo] = env.HARNESS_REPOSITORY.split("/");
  const installationId = await getRepositoryInstallationId(owner, repo);
  const installationOctokit = new Octokit({ auth: await getInstallationTokenForApp(installationId) });
  const { data: repository } = await installationOctokit.rest.repos.get({ owner, repo });
  const content = await readFile({
    installationId,
    owner,
    repo,
    path: "sync-manifest.yml",
    ref: repository.default_branch,
  });

  if (content === null) throw new DashboardDataError("UPSTREAM");
  return content;
}

async function readTargetSyncConfig(repository: DashboardRepository): Promise<string | null> {
  const [owner, repo] = repository.fullName.split("/");
  return readFile({
    installationId: repository.installationId,
    owner,
    repo,
    path: ".harness/sync.yml",
    ref: repository.defaultBranch,
  });
}

const defaultServices: DashboardServices = {
  getRepositories: getDashboardRepositories,
  getUsername: getAuthenticatedUsername,
  getPermission: ({ userToken, owner, repo, username }) =>
    getUserRepositoryPermission({ accessToken: userToken, owner, repo, username }),
  readManifest: readHarnessManifest,
  readSyncConfig: readTargetSyncConfig,
};

export async function getRepositoryDashboardData(
  input: RepositoryInput,
  services: DashboardServices = defaultServices,
): Promise<RepositoryDashboardData> {
  const repository = (await services.getRepositories(input.userToken))
    .find((candidate) => candidate.fullName === `${input.owner}/${input.repo}`);

  if (!repository) throw new DashboardDataError("NOT_FOUND");

  const username = await services.getUsername(input.userToken);
  const permission = await services.getPermission({ ...input, username });
  if (!canManageHarness(permission)) throw new DashboardDataError("FORBIDDEN");

  try {
    const [manifestSource, configSource] = await Promise.all([
      services.readManifest(),
      services.readSyncConfig(repository),
    ]);
    const manifest = parseManifest(manifestSource);
    const config = parseSyncConfig(configSource, manifest.defaults);

    return { repository, manifest, config, selectedItemIds: resolveSelectedItemIds(manifest, config) };
  } catch (error) {
    if (error instanceof DashboardDataError) throw error;
    throw new DashboardDataError("INVALID_CONFIG");
  }
}
