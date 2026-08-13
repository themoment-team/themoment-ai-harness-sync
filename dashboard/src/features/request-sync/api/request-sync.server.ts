import "server-only";

import { Octokit } from "@octokit/rest";

import { getRepositoryDashboardData, type RepositoryDashboardData } from "@/entities/repository/index.server";
import { getInstallationTokenForApp, getRepositoryInstallationId } from "@/shared/api/github-app";
import { getServerEnv } from "@/shared/config/env";

export class SyncRequestError extends Error {
  constructor(readonly code: "SYNC_DISABLED" | "OPEN_SYNC_PR" | "RECENT_REQUEST" | "UPSTREAM") {
    super(code);
  }
}

type SyncRun = { url: string; createdAt: string; status: "queued" | "in_progress" | "completed" };
type Services = {
  getDashboardData: (input: { owner: string; repo: string; userToken: string }) => Promise<RepositoryDashboardData>;
  findOpenSyncPullRequest: (installationId: number, owner: string, repo: string) => Promise<{ url: string } | null>;
  findRecentWorkflowRun: (targetRepo: string) => Promise<SyncRun | null>;
  dispatch: (targetRepo: string) => Promise<{ url: string }>;
};

async function installationOctokit(installationId: number) {
  return new Octokit({ auth: await getInstallationTokenForApp(installationId) });
}

async function findOpenSyncPullRequest(installationId: number, owner: string, repo: string) {
  const octokit = await installationOctokit(installationId);
  const { data } = await octokit.rest.pulls.list({ owner, repo, state: "open", per_page: 100 });
  const pullRequest = data.find((candidate) => candidate.head.ref.startsWith("harness-sync/"));
  return pullRequest ? { url: pullRequest.html_url } : null;
}

async function harnessOctokit() {
  const [owner, repo] = getServerEnv().HARNESS_REPOSITORY.split("/");
  const installationId = await getRepositoryInstallationId(owner, repo);
  return { octokit: await installationOctokit(installationId), owner, repo };
}

async function findRecentWorkflowRun(targetRepo: string): Promise<SyncRun | null> {
  const { octokit, owner, repo } = await harnessOctokit();
  const { data } = await octokit.rest.actions.listWorkflowRuns({ owner, repo, workflow_id: "sync.yml", event: "workflow_dispatch", per_page: 100 });
  const threshold = Date.now() - 10 * 60 * 1000;
  const run = data.workflow_runs.find((candidate) =>
    candidate.display_title === `Sync AI Harness files · ${targetRepo}`
    && (candidate.status === "queued" || candidate.status === "in_progress" || new Date(candidate.created_at).getTime() >= threshold),
  );
  if (!run) return null;
  const status = run.status === "queued" || run.status === "in_progress" ? run.status : "completed";
  return { url: run.html_url, createdAt: run.created_at, status };
}

async function dispatch(targetRepo: string) {
  const { octokit, owner, repo } = await harnessOctokit();
  await octokit.rest.actions.createWorkflowDispatch({ owner, repo, workflow_id: "sync.yml", ref: "main", inputs: { target_repo: targetRepo } });
  return { url: `https://github.com/${owner}/${repo}/actions/workflows/sync.yml` };
}

const defaultServices: Services = { getDashboardData: getRepositoryDashboardData, findOpenSyncPullRequest, findRecentWorkflowRun, dispatch };

export async function requestSync(input: { owner: string; repo: string; userToken: string }, services: Services = defaultServices) {
  const dashboard = await services.getDashboardData(input);
  if (!dashboard.config.enabled) throw new SyncRequestError("SYNC_DISABLED");
  const openPullRequest = await services.findOpenSyncPullRequest(dashboard.repository.installationId, input.owner, input.repo);
  if (openPullRequest) return { url: openPullRequest.url, status: "open-pr" as const };
  const run = await services.findRecentWorkflowRun(dashboard.repository.fullName);
  if (run) return { url: run.url, status: "existing-run" as const };
  return { ...(await services.dispatch(dashboard.repository.fullName)), status: "created" as const };
}
