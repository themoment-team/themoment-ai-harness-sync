import type { NextAuthOptions } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import GithubProvider from 'next-auth/providers/github';

import { getServerEnv } from '@/shared/config/env';

import 'server-only';

declare module 'next-auth' {
  interface Session {
    githubLogin?: string;
    githubTokenError?: 'RefreshAccessTokenError';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    githubAccessToken?: string;
    githubAccessTokenExpiresAt?: number;
    githubLogin?: string;
    githubRefreshToken?: string;
    githubTokenError?: 'RefreshAccessTokenError';
  }
}

type GitHubRefreshTokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
};

export async function refreshGitHubAccessToken(token: JWT): Promise<JWT> {
  if (!token.githubRefreshToken) {
    return { ...token, githubTokenError: 'RefreshAccessTokenError' };
  }

  try {
    const env = getServerEnv();
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: token.githubRefreshToken,
      }),
    });
    const refreshed = (await response.json()) as GitHubRefreshTokenResponse;
    if (
      !response.ok ||
      !refreshed.access_token ||
      !refreshed.refresh_token ||
      !refreshed.expires_in
    ) {
      throw new Error('GitHub 토큰 갱신에 실패했습니다.');
    }

    return {
      ...token,
      githubAccessToken: refreshed.access_token,
      githubAccessTokenExpiresAt: Date.now() + refreshed.expires_in * 1_000,
      githubRefreshToken: refreshed.refresh_token,
      githubTokenError: undefined,
    };
  } catch {
    return { ...token, githubTokenError: 'RefreshAccessTokenError' };
  }
}

export function getAuthOptions(): NextAuthOptions {
  const env = getServerEnv();

  return {
    providers: [
      GithubProvider({
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        authorization: { params: { scope: 'read:user repo' } },
      }),
    ],
    secret: env.AUTH_SECRET,
    session: { strategy: 'jwt' },
    callbacks: {
      async jwt({ account, profile, token }) {
        if (account?.access_token) {
          token.githubAccessToken = account.access_token;
          token.githubAccessTokenExpiresAt = account.expires_at
            ? account.expires_at * 1_000
            : undefined;
          token.githubRefreshToken = account.refresh_token;
          token.githubLogin =
            profile && 'login' in profile && typeof profile.login === 'string'
              ? profile.login
              : undefined;
          token.githubTokenError = undefined;
          return token;
        }
        if (
          !token.githubAccessTokenExpiresAt ||
          Date.now() < token.githubAccessTokenExpiresAt - 60_000
        ) {
          return token;
        }
        return refreshGitHubAccessToken(token);
      },
      session({ session, token }) {
        session.githubLogin = token.githubLogin;
        session.githubTokenError = token.githubTokenError;
        return session;
      },
    },
  };
}
