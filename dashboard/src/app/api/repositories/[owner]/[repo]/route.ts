import { NextRequest, NextResponse } from "next/server";

import { DashboardDataError, getRepositoryDashboardData } from "@/entities/repository/index.server";
import { getGitHubAccessToken } from "@/shared/api/github-user";

export async function GET(
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

  const { owner, repo } = await context.params;

  try {
    return NextResponse.json(await getRepositoryDashboardData({ owner, repo, userToken: accessToken }));
  } catch (error) {
    if (error instanceof DashboardDataError) {
      const status = error.code === "NOT_FOUND" ? 404 : error.code === "FORBIDDEN" ? 403 : error.code === "INVALID_CONFIG" ? 422 : 502;
      return NextResponse.json({ message: "설정을 불러오지 못했습니다.", code: error.code }, { status });
    }

    return NextResponse.json({ message: "설정을 불러오지 못했습니다." }, { status: 502 });
  }
}
