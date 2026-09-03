import { NextRequest, NextResponse } from 'next/server';

import { DashboardDataError } from '@/entities/repository/index.server';
import { requestSync, SyncRequestError } from '@/features/request-sync/index.server';
import { getGitHubAccessToken } from '@/shared/api';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ owner: string; repo: string }> },
) {
  let accessToken: string | null;
  try {
    accessToken = await getGitHubAccessToken(request);
  } catch {
    return NextResponse.json({ message: '서버 GitHub 연동 설정이 필요합니다.' }, { status: 503 });
  }
  if (!accessToken)
    return NextResponse.json({ message: 'GitHub 로그인이 필요합니다.' }, { status: 401 });

  const { owner, repo } = await context.params;
  try {
    return NextResponse.json(await requestSync({ owner, repo, userToken: accessToken }));
  } catch (error) {
    if (error instanceof DashboardDataError) {
      const status =
        error.code === 'NOT_FOUND'
          ? 404
          : error.code === 'FORBIDDEN'
            ? 403
            : error.code === 'INVALID_CONFIG'
              ? 422
              : 502;
      return NextResponse.json(
        { message: '동기화를 요청하지 못했습니다.', code: error.code },
        { status },
      );
    }
    if (error instanceof SyncRequestError) {
      return NextResponse.json(
        { message: '동기화를 요청하지 못했습니다.', code: error.code },
        { status: 409 },
      );
    }
    return NextResponse.json({ message: '동기화를 요청하지 못했습니다.' }, { status: 502 });
  }
}
