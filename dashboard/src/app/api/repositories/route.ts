import { NextRequest, NextResponse } from 'next/server';

import { getDashboardRepositories } from '@/entities/repository/index.server';
import { getGitHubAccessToken } from '@/shared/api';

export async function GET(request: NextRequest) {
  let accessToken: string | null;
  try {
    accessToken = await getGitHubAccessToken(request);
  } catch {
    return NextResponse.json({ message: '서버 GitHub 연동 설정이 필요합니다.' }, { status: 503 });
  }
  if (!accessToken)
    return NextResponse.json({ message: 'GitHub 로그인이 필요합니다.' }, { status: 401 });

  try {
    return NextResponse.json(await getDashboardRepositories(accessToken));
  } catch {
    return NextResponse.json({ message: '레포 목록을 불러오지 못했습니다.' }, { status: 502 });
  }
}
