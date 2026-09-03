import type { NextRequest } from 'next/server';

import { Octokit } from '@octokit/rest';
import { getToken } from 'next-auth/jwt';

import { getServerEnv } from '@/shared/config/env';

import 'server-only';

export type RepositoryPermission = 'admin' | 'maintain' | 'write' | 'triage' | 'read' | 'none';
type GitHubRepositoryPermissions = {
  admin?: boolean;
  maintain?: boolean;
  push?: boolean;
  triage?: boolean;
  pull?: boolean;
};

export function createUserOctokit(accessToken: string) {
  return new Octokit({ auth: accessToken });
}

export async function getGitHubAccessToken(request: NextRequest): Promise<string | null> {
  const token = await getToken({ req: request, secret: getServerEnv().AUTH_SECRET });
  if (
    token?.githubTokenError ||
    (token?.githubAccessTokenExpiresAt &&
      token.githubAccessTokenExpiresAt - 60_000 <= Date.now())
  ) {
    return null;
  }
  return typeof token?.githubAccessToken === 'string' ? token.githubAccessToken : null;
}

export async function getAuthenticatedUsername(accessToken: string): Promise<string> {
  const octokit = createUserOctokit(accessToken);
  const { data } = await octokit.rest.users.getAuthenticated();
  return data.login;
}

export async function getUserRepositoryPermission(input: {
  accessToken: string;
  owner: string;
  repo: string;
  username: string;
}): Promise<RepositoryPermission> {
  const octokit = createUserOctokit(input.accessToken);
  const { data } = await octokit.rest.repos.getCollaboratorPermissionLevel({
    owner: input.owner,
    repo: input.repo,
    username: input.username,
  });

  return getRepositoryPermission(data.user?.permissions);
}

export function getRepositoryPermission(
  permissions: GitHubRepositoryPermissions | undefined,
): RepositoryPermission {
  return permissions?.admin
    ? 'admin'
    : permissions?.maintain
      ? 'maintain'
      : permissions?.push
        ? 'write'
        : permissions?.triage
          ? 'triage'
          : permissions?.pull
            ? 'read'
            : 'none';
}

export function canManageHarness(permission: RepositoryPermission): boolean {
  return permission === 'admin' || permission === 'maintain' || permission === 'write';
}
