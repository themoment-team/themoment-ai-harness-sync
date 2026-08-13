import "server-only";

import type { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";

import { getServerEnv } from "@/shared/config/env";

declare module "next-auth/jwt" {
  interface JWT {
    githubAccessToken?: string;
  }
}

export function getAuthOptions(): NextAuthOptions {
  const env = getServerEnv();

  return {
    providers: [
      GithubProvider({
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        authorization: { params: { scope: "read:user repo" } },
      }),
    ],
    secret: env.AUTH_SECRET,
    session: { strategy: "jwt" },
    callbacks: {
      jwt({ account, token }) {
        if (account?.access_token) token.githubAccessToken = account.access_token;
        return token;
      },
      session({ session }) {
        return session;
      },
    },
  };
}
