import "server-only";

import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

import { getServerEnv } from "@/shared/config/env";

type InstallationAuth = (options: { type: "installation"; installationId: number }) => Promise<{ token: string }>;

export async function getInstallationToken(
  installationId: number,
  appAuth: InstallationAuth,
): Promise<string> {
  const authentication = await appAuth({ type: "installation", installationId });
  return authentication.token;
}

export async function getInstallationTokenForApp(installationId: number): Promise<string> {
  const env = getServerEnv();
  const appAuth = createAppAuth({
    appId: env.GITHUB_APP_ID,
    privateKey: env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, "\n"),
  });

  return getInstallationToken(installationId, async (options) => appAuth(options));
}

export async function createAppOctokit(): Promise<Octokit> {
  const env = getServerEnv();
  const appAuth = createAppAuth({
    appId: env.GITHUB_APP_ID,
    privateKey: env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, "\n"),
  });
  const authentication = await appAuth({ type: "app" });

  return new Octokit({ auth: authentication.token });
}

export async function getRepositoryInstallationId(owner: string, repo: string): Promise<number> {
  const octokit = await createAppOctokit();
  const { data } = await octokit.request("GET /repos/{owner}/{repo}/installation", { owner, repo });
  return data.id;
}
