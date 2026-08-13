import { NextRequest, NextResponse } from "next/server";

import { DashboardDataError } from "@/entities/repository/index.server";
import {
  ConfigPullRequestError,
  configChangeSchema,
  createConfigPullRequest,
} from "@/features/create-config-pr/index.server";
import { getGitHubAccessToken } from "@/shared/api/github-user";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ owner: string; repo: string }> },
) {
  let accessToken: string | null;
  try {
    accessToken = await getGitHubAccessToken(request);
  } catch {
    return NextResponse.json({ message: "서버 GitHub 연동 설정이 필요합니다." }, { status: 503 });
  }
  if (!accessToken) return NextResponse.json({ message: "GitHub 로그인이 필요합니다." }, { status: 401 });

  const body = configChangeSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ message: "요청 형식이 올바르지 않습니다." }, { status: 400 });

  const { owner, repo } = await context.params;

  try {
    return NextResponse.json(await createConfigPullRequest({
      owner,
      repo,
      userToken: accessToken,
      config: body.data,
    }));
  } catch (error) {
    if (error instanceof DashboardDataError) {
      const status = error.code === "NOT_FOUND" ? 404 : error.code === "FORBIDDEN" ? 403 : error.code === "INVALID_CONFIG" ? 422 : 502;
      return NextResponse.json({ message: "설정 PR을 만들지 못했습니다.", code: error.code }, { status });
    }
    if (error instanceof ConfigPullRequestError) {
      const status = error.code === "INVALID_ITEM" ? 422 : error.code === "BASE_BRANCH_MISSING" ? 404 : 502;
      return NextResponse.json({ message: "설정 PR을 만들지 못했습니다.", code: error.code }, { status });
    }

    return NextResponse.json({ message: "설정 PR을 만들지 못했습니다." }, { status: 502 });
  }
}
