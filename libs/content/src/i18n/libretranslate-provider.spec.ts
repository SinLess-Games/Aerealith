import { afterEach, describe, expect, it, vi } from 'vitest'

import { LibreTranslateProvider } from '../../scripts/providers/libretranslate.provider'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('LibreTranslateProvider', () => {
  it('normalizes its URL and returns supported language codes', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ code: 'en' }, { code: 'es' }]), {
        status: 200,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const provider = new LibreTranslateProvider({
      baseUrl: 'https://translate.example/',
    })

    await expect(provider.getSupportedLanguages()).resolves.toEqual(
      new Set(['en', 'es']),
    )
    expect(provider.baseUrl).toBe('https://translate.example')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://translate.example/languages',
      expect.objectContaining({
        method: 'GET',
        signal: expect.any(AbortSignal),
      }),
    )
  })

  it('rejects malformed language responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify([{ language: 'English' }]), {
          status: 200,
        }),
      ),
    )

    await expect(
      new LibreTranslateProvider().getSupportedLanguages(),
    ).rejects.toThrow('invalid /languages response')
  })

  it('sends translations with an API key and returns translated text', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ translatedText: 'Hola' }), {
        status: 200,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const provider = new LibreTranslateProvider({ apiKey: 'secret' })

    await expect(
      provider.translateText({
        text: 'Hello',
        sourceLanguage: 'en',
        targetLanguage: 'es',
      }),
    ).resolves.toBe('Hola')

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(JSON.parse(String(request.body))).toEqual({
      q: 'Hello',
      source: 'en',
      target: 'es',
      format: 'text',
      api_key: 'secret',
    })
  })

  it('limits concurrent translation requests', async () => {
    let activeRequests = 0
    let peakRequests = 0
    const releases: Array<() => void> = []
    const fetchMock = vi.fn().mockImplementation(async () => {
      activeRequests += 1
      peakRequests = Math.max(peakRequests, activeRequests)
      await new Promise<void>((resolve) => releases.push(resolve))
      activeRequests -= 1
      return new Response(JSON.stringify({ translatedText: 'Hola' }), {
        status: 200,
      })
    })
    vi.stubGlobal('fetch', fetchMock)
    const provider = new LibreTranslateProvider({ maxConcurrency: 2 })
    const translate = (text: string) =>
      provider.translateText({
        text,
        sourceLanguage: 'en',
        targetLanguage: 'es',
      })

    const translations = [
      translate('One'),
      translate('Two'),
      translate('Three'),
    ]
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    releases.shift()?.()
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3))
    while (releases.length > 0) releases.shift()?.()

    await expect(Promise.all(translations)).resolves.toEqual([
      'Hola',
      'Hola',
      'Hola',
    ])
    expect(peakRequests).toBe(2)
  })

  it('rejects malformed translation responses and non-retriable errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response('{}', { status: 200 }))
        .mockResolvedValueOnce(new Response('slow down', { status: 429 }))
        .mockResolvedValueOnce(new Response('bad request', { status: 400 })),
    )
    const provider = new LibreTranslateProvider()
    const input = {
      text: 'Hello',
      sourceLanguage: 'en',
      targetLanguage: 'es',
    }

    await expect(provider.translateText(input)).rejects.toThrow(
      'invalid translation response',
    )
    await expect(provider.translateText(input)).rejects.toThrow(
      'rate limit exceeded',
    )
    await expect(provider.translateText(input)).rejects.toThrow(
      'request failed (400)',
    )
  })

  it('retries temporary failures and reports the final connection error', async () => {
    vi.useFakeTimers()
    const fetchMock = vi
      .fn()
      .mockImplementation(
        async () => new Response('unavailable', { status: 503 }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const request = new LibreTranslateProvider().getSupportedLanguages()
    const rejection = expect(request).rejects.toThrow(
      'Could not connect to LibreTranslate',
    )
    await vi.runAllTimersAsync()

    await rejection
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})
