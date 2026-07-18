import { describe, expect, it, vi } from 'vitest'

import worker, { type FrontendWorkerEnvironment } from './worker'

function createEnvironment(response: Response) {
  return {
    ASSETS: { fetch: vi.fn().mockResolvedValue(response) },
  } satisfies FrontendWorkerEnvironment
}

describe('frontend worker', () => {
  it('serves an uncached health response', async () => {
    const environment = createEnvironment(new Response('asset'))
    const response = await worker.fetch(
      new Request('https://aerealith.com/__aerealith/health'),
      environment,
    )
    expect(await response.json()).toEqual({ status: 'ok' })
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(environment.ASSETS.fetch).not.toHaveBeenCalled()
  })

  it('delegates application routes to the asset binding', async () => {
    const assetResponse = new Response('<html></html>')
    const environment = createEnvironment(assetResponse)
    const request = new Request('https://aerealith.com/pricing')
    await expect(worker.fetch(request, environment)).resolves.toBe(
      assetResponse,
    )
    expect(environment.ASSETS.fetch).toHaveBeenCalledWith(request)
  })
})
