import { describe, expect, it, vi } from 'vitest';

import { getInstallationToken } from './github-app';

describe('getInstallationToken', () => {
  it('설치 ID로 토큰을 요청한다', async () => {
    const createAppAuth = vi.fn().mockResolvedValue({ token: 'installation-token' });

    await expect(getInstallationToken(42, createAppAuth)).resolves.toBe('installation-token');
    expect(createAppAuth).toHaveBeenCalledWith({ type: 'installation', installationId: 42 });
  });
});
