import { describe, expect, it } from 'vitest';

import app from './worker';

describe('api service', () => {
  it('uses the canonical uppercase API version path', async () => {
    expect((await app.request('/api/V1/services/api/health')).status).toBe(200);
    expect((await app.request('/api/v1/services/api/health')).status).toBe(404);
  });
});
