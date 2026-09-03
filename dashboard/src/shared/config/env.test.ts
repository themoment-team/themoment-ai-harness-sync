import { describe, expect, it } from 'vitest';

import { parseServerEnv } from './env';

describe('parseServerEnv', () => {
  it('필수 GitHub 비밀값이 없으면 실패한다', () => {
    expect(() => parseServerEnv({})).toThrow('GITHUB_CLIENT_ID');
  });
});
