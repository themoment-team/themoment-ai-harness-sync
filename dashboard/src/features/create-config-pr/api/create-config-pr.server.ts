import { Octokit } from '@octokit/rest';
import { Buffer } from 'node:buffer';

import {
  buildSyncConfig,
  parseSyncConfig,
  resolveSelectedItemIds,
} from '@/entities/harness-config';
import {
  DashboardDataError,
  getRepositoryDashboardData,
  type RepositoryDashboardData,
} from '@/entities/repository/index.server';
import { getInstallationTokenForApp } from '@/shared/api';

import type { ConfigChange } from '../model/schema';

import 'server-only';

export class ConfigPullRequestError extends Error {
  constructor(
    readonly code:
      'INVALID_ITEM' | 'BASE_BRANCH_MISSING' | 'REPOSITORY_EMPTY' | 'NO_CHANGES' | 'UPSTREAM',
  ) {
    super(code);
  }
}

export type CreateConfigPullRequestInput = {
  owner: string;
  repo: string;
  userToken: string;
  config: ConfigChange;
};

type PullRequest = { url: string; number: number };
type WriteInput = { owner: string; repo: string; branch: string; content: string };
type PullRequestServices = {
  getDashboardData: (input: {
    owner: string;
    repo: string;
    userToken: string;
  }) => Promise<RepositoryDashboardData>;
  findOpenConfigPullRequest: (input: {
    owner: string;
    repo: string;
    installationId: number;
  }) => Promise<PullRequest | null>;
  createReference: (input: {
    owner: string;
    repo: string;
    installationId: number;
    baseBranch: string;
    branch: string;
  }) => Promise<void>;
  writeSyncConfig: (input: WriteInput & { installationId: number }) => Promise<void>;
  createPullRequest: (input: {
    owner: string;
    repo: string;
    installationId: number;
    baseBranch: string;
    branch: string;
    body: string;
  }) => Promise<PullRequest>;
};

async function getInstallationOctokit(installationId: number): Promise<Octokit> {
  return new Octokit({ auth: await getInstallationTokenForApp(installationId) });
}

async function findOpenConfigPullRequest(input: {
  owner: string;
  repo: string;
  installationId: number;
}): Promise<PullRequest | null> {
  const octokit = await getInstallationOctokit(input.installationId);
  const pullRequests = await octokit.paginate(octokit.rest.pulls.list, {
    owner: input.owner,
    repo: input.repo,
    state: 'open',
    per_page: 100,
  });
  const pullRequest = pullRequests.find((candidate) =>
    candidate.head.ref.startsWith('harness-config/'),
  );

  return pullRequest ? { url: pullRequest.html_url, number: pullRequest.number } : null;
}

async function createReference(input: {
  owner: string;
  repo: string;
  installationId: number;
  baseBranch: string;
  branch: string;
}): Promise<void> {
  const octokit = await getInstallationOctokit(input.installationId);
  let baseRef: { object: { sha: string } };

  try {
    ({ data: baseRef } = await octokit.rest.git.getRef({
      owner: input.owner,
      repo: input.repo,
      ref: `heads/${input.baseBranch}`,
    }));
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'status' in error && error.status === 409) {
      throw new ConfigPullRequestError('REPOSITORY_EMPTY');
    }
    throw error;
  }

  await octokit.rest.git.createRef({
    owner: input.owner,
    repo: input.repo,
    ref: `refs/heads/${input.branch}`,
    sha: baseRef.object.sha,
  });
}

async function writeSyncConfig(input: WriteInput & { installationId: number }): Promise<void> {
  const octokit = await getInstallationOctokit(input.installationId);
  let sha: string | undefined;

  try {
    const { data } = await octokit.rest.repos.getContent({
      owner: input.owner,
      repo: input.repo,
      path: '.harness/sync.yml',
      ref: input.branch,
    });
    if (!Array.isArray(data) && data.type === 'file') sha = data.sha;
  } catch (error) {
    if (!(
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      error.status === 404
    )) {
      throw error;
    }
  }

  await octokit.rest.repos.createOrUpdateFileContents({
    owner: input.owner,
    repo: input.repo,
    path: '.harness/sync.yml',
    branch: input.branch,
    sha,
    message: 'chore: AI Harness 동기화 설정 변경',
    content: Buffer.from(input.content).toString('base64'),
  });
}

async function createPullRequest(input: {
  owner: string;
  repo: string;
  installationId: number;
  baseBranch: string;
  branch: string;
  body: string;
}): Promise<PullRequest> {
  const octokit = await getInstallationOctokit(input.installationId);
  const { data } = await octokit.rest.pulls.create({
    owner: input.owner,
    repo: input.repo,
    head: input.branch,
    base: input.baseBranch,
    title: 'chore: AI Harness 동기화 설정 변경',
    body: input.body,
  });

  return { url: data.html_url, number: data.number };
}

const defaultServices: PullRequestServices = {
  getDashboardData: getRepositoryDashboardData,
  findOpenConfigPullRequest,
  createReference,
  writeSyncConfig,
  createPullRequest,
};

function buildPullRequestBody(input: {
  content: string;
  currentItemIds: string[];
  selectedItemIds: string[];
}): string {
  const added = input.selectedItemIds.filter((itemId) => !input.currentItemIds.includes(itemId));
  const removed = input.currentItemIds.filter((itemId) => !input.selectedItemIds.includes(itemId));
  const changes = [
    ...added.map((itemId) => `- 추가: \`${itemId}\``),
    ...removed.map((itemId) => `- 제거: \`${itemId}\``),
  ];

  return [
    '## AI Harness 동기화 설정',
    '',
    changes.length > 0 ? changes.join('\n') : '- 동기화 활성화 상태 또는 수신 방식 변경',
    '',
    '```yaml',
    input.content.trimEnd(),
    '```',
  ].join('\n');
}

export async function createConfigPullRequest(
  input: CreateConfigPullRequestInput,
  services: PullRequestServices = defaultServices,
): Promise<PullRequest> {
  const dashboard = await services.getDashboardData(input);
  const knownItemIds = new Set(dashboard.manifest.items.map((item) => item.id));
  const groups = input.config.groups ?? [];
  const overrides = input.config.overrides ?? {};
  if (
    input.config.itemIds.some((itemId) => !knownItemIds.has(itemId)) ||
    Object.keys(overrides).some((itemId) => !knownItemIds.has(itemId))
  ) {
    throw new ConfigPullRequestError('INVALID_ITEM');
  }

  const existing = await services.findOpenConfigPullRequest({
    owner: input.owner,
    repo: input.repo,
    installationId: dashboard.repository.installationId,
  });
  if (existing) return existing;

  const content = buildSyncConfig({
    ...dashboard.config,
    enabled: input.config.enabled,
    mode: input.config.mode,
    itemIds: input.config.itemIds,
    groups,
    overrides,
  });
  if (content === dashboard.syncConfigSource) throw new ConfigPullRequestError('NO_CHANGES');

  const baseBranch = dashboard.config.baseBranch ?? dashboard.repository.defaultBranch;
  if (!baseBranch) throw new ConfigPullRequestError('BASE_BRANCH_MISSING');

  const branch = `harness-config/${new Date().toISOString().replace(/[-:.]/g, '')}`;
  const selectedItemIds = resolveSelectedItemIds(
    dashboard.manifest,
    parseSyncConfig(content, dashboard.manifest.defaults),
  );

  await services.createReference({
    owner: input.owner,
    repo: input.repo,
    installationId: dashboard.repository.installationId,
    baseBranch,
    branch,
  });
  await services.writeSyncConfig({
    owner: input.owner,
    repo: input.repo,
    installationId: dashboard.repository.installationId,
    branch,
    content,
  });

  return services.createPullRequest({
    owner: input.owner,
    repo: input.repo,
    installationId: dashboard.repository.installationId,
    baseBranch,
    branch,
    body: buildPullRequestBody({
      content,
      currentItemIds: dashboard.selectedItemIds,
      selectedItemIds,
    }),
  });
}

export { DashboardDataError };
