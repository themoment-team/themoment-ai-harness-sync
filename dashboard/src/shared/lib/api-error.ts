const messages: Record<string, string> = {
  FORBIDDEN: '이 레포의 설정을 확인하거나 변경할 write 이상의 권한이 없습니다.',
  NOT_FOUND: 'GitHub App이 설치되어 있지 않거나 이 레포에 접근할 수 없습니다.',
  INVALID_CONFIG:
    '.harness/sync.yml 형식이 올바르지 않습니다. 파일을 직접 수정한 뒤 다시 시도해 주세요.',
  INVALID_ITEM: '선택한 동기화 항목이 최신 매니페스트에 없습니다. 화면을 새로고침해 주세요.',
  BASE_BRANCH_MISSING:
    '설정된 기준 브랜치를 찾을 수 없습니다. .harness/sync.yml의 base_branch를 확인해 주세요.',
  REPOSITORY_EMPTY: '이 레포지토리는 비어 있습니다. 초기 커밋을 만든 뒤 다시 시도해 주세요.',
  NO_CHANGES: '변경된 설정이 없습니다.',
  SYNC_DISABLED: '동기화가 비활성화되어 있습니다. 설정 PR로 활성화한 뒤 다시 요청해 주세요.',
  OPEN_SYNC_PR: '열린 동기화 PR이 있습니다. 해당 PR을 먼저 검토해 주세요.',
  RECENT_REQUEST: '최근에 동기화를 요청했습니다. 잠시 뒤 다시 시도해 주세요.',
};

export function getApiErrorMessage(code: string | undefined, fallback: string): string {
  return code ? (messages[code] ?? fallback) : fallback;
}
