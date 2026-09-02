import { describe, expect, it } from 'vitest';

import { getApiErrorMessage } from './api-error';

describe('getApiErrorMessage', () => {
  it('권한 부족 오류를 설정 권한 안내로 변환한다', () => {
    expect(getApiErrorMessage('FORBIDDEN', '설정을 불러오지 못했습니다.')).toBe(
      '이 레포의 설정을 확인하거나 변경할 write 이상의 권한이 없습니다.',
    );
  });

  it('YAML 오류를 수동 수정 안내로 변환한다', () => {
    expect(getApiErrorMessage('INVALID_CONFIG', '설정을 불러오지 못했습니다.')).toBe(
      '.harness/sync.yml 형식이 올바르지 않습니다. 파일을 직접 수정한 뒤 다시 시도해 주세요.',
    );
  });

  it('빈 저장소 오류를 초기 커밋 안내로 변환한다', () => {
    expect(getApiErrorMessage('REPOSITORY_EMPTY', '설정 PR을 만들지 못했습니다.')).toBe(
      '이 레포지토리는 비어 있습니다. 초기 커밋을 만든 뒤 다시 시도해 주세요.',
    );
  });

  it('변경 없음 오류를 설정 유지 안내로 변환한다', () => {
    expect(getApiErrorMessage('NO_CHANGES', '설정 PR을 만들지 못했습니다.')).toBe(
      '변경된 설정이 없습니다.',
    );
  });
});
