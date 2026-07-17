import type { TranslationProvider } from './translation-provider'

interface LibreLanguage {
  code: string
}
interface LibreTranslation {
  translatedText: string
}

export class LibreTranslateProvider implements TranslationProvider {
  readonly name = 'libretranslate'
  readonly baseUrl: string
  readonly apiKey?: string
  readonly maxConcurrency: number
  readonly requestTimeoutMs: number
  private activeRequests = 0
  private readonly requestWaiters: Array<() => void> = []

  constructor(
    options: {
      baseUrl?: string
      apiKey?: string
      maxConcurrency?: number
      requestTimeoutMs?: number
    } = {},
  ) {
    this.baseUrl = (
      options.baseUrl ??
      process.env['LIBRETRANSLATE_URL'] ??
      'http://localhost:5000'
    ).replace(/\/$/, '')
    this.apiKey = options.apiKey ?? process.env['LIBRETRANSLATE_API_KEY']
    this.maxConcurrency = Math.max(1, Math.floor(options.maxConcurrency ?? 4))
    this.requestTimeoutMs = Math.max(1, options.requestTimeoutMs ?? 120_000)
  }

  async getSupportedLanguages(): Promise<ReadonlySet<string>> {
    const response = await this.request('/languages', { method: 'GET' })
    const body = (await response.json()) as unknown
    if (!Array.isArray(body) || !body.every(isLanguage)) {
      throw new Error('LibreTranslate returned an invalid /languages response.')
    }
    return new Set(body.map((language) => language.code))
  }

  async translateText(input: {
    text: string
    sourceLanguage: string
    targetLanguage: string
    context?: string
  }): Promise<string> {
    return this.withRequestSlot(async () => {
      const body: Record<string, string> = {
        q: input.text,
        source: input.sourceLanguage,
        target: input.targetLanguage,
        format: 'text',
      }
      if (this.apiKey) body['api_key'] = this.apiKey
      const response = await this.request('/translate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = (await response.json()) as Partial<LibreTranslation>
      if (typeof result.translatedText !== 'string') {
        throw new Error(
          'LibreTranslate returned an invalid translation response.',
        )
      }
      return result.translatedText
    })
  }

  private async withRequestSlot<T>(operation: () => Promise<T>): Promise<T> {
    if (this.activeRequests >= this.maxConcurrency) {
      await new Promise<void>((resolve) => this.requestWaiters.push(resolve))
    }
    this.activeRequests += 1
    try {
      return await operation()
    } finally {
      this.activeRequests -= 1
      this.requestWaiters.shift()?.()
    }
  }

  private async request(path: string, init: RequestInit): Promise<Response> {
    let lastError: unknown
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const controller = new AbortController()
      const timeout = setTimeout(
        () => controller.abort(),
        this.requestTimeoutMs,
      )
      try {
        const response = await fetch(`${this.baseUrl}${path}`, {
          ...init,
          signal: controller.signal,
        })
        if (response.ok) return response
        const message = await response.text()
        if (response.status === 429)
          throw new Error(
            `LibreTranslate rate limit exceeded: ${message || 'HTTP 429'}`,
          )
        if (response.status < 500)
          throw new Error(
            `LibreTranslate request failed (${response.status}): ${message}`,
          )
        lastError = new Error(
          `LibreTranslate temporary failure (${response.status}): ${message}`,
        )
      } catch (error) {
        lastError = error
        if (
          error instanceof Error &&
          /rate limit|request failed/.test(error.message)
        )
          throw error
      } finally {
        clearTimeout(timeout)
      }
      if (attempt < 2) await delay(250 * (attempt + 1))
    }
    const detail =
      lastError instanceof Error ? lastError.message : String(lastError)
    throw new Error(
      `Could not connect to LibreTranslate at ${this.baseUrl}. Start the self-hosted server and try again. ${detail}`,
    )
  }
}

function isLanguage(value: unknown): value is LibreLanguage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    typeof value.code === 'string'
  )
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
