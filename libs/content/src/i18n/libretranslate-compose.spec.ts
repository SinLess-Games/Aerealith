import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { CONTENT_ROOT } from '../../scripts/utils/collect-content'

describe('LibreTranslate Docker workflow', () => {
  it('defines a localhost-only, persistent, health-checked service', async () => {
    const compose = await readFile(
      join(CONTENT_ROOT, 'docker-compose.libretranslate.yml'),
      'utf8',
    )

    expect(compose).toContain('libretranslate/libretranslate:latest')
    expect(compose).toContain('127.0.0.1:${LIBRETRANSLATE_PORT:-5000}:5000')
    expect(compose).toContain('/languages')
    expect(compose).toContain('argospm-index/main/index.json')
    expect(compose).toContain('until python')
    expect(compose).toContain(
      '--load-only en,es,pt,fr,de,ja,it,nl,pl,tr,ko,zh,zt,id,vi,ru,uk,sv,da,fi,nb,cs,hu,ro,ar,he',
    )
    expect(compose).toContain('http://libretranslate:5000')
    expect(compose).toContain('/workspace/node_modules/.bin/tsx')
    expect(compose).toContain(
      'libretranslate-models:/home/libretranslate/.local',
    )
  })

  it('starts the healthy service only for explicit translation', async () => {
    const project = JSON.parse(
      await readFile(join(CONTENT_ROOT, 'project.json'), 'utf8'),
    ) as {
      targets: Record<
        string,
        { dependsOn?: string[]; options?: { command?: string } }
      >
    }

    expect(project.targets['translate']?.dependsOn).toEqual([
      'libretranslate-up',
    ])
    expect(project.targets['libretranslate-up']?.options?.command).toContain(
      'up -d --wait --wait-timeout 900 libretranslate',
    )
    expect(project.targets['translate']?.options?.command).toContain(
      'run --rm translator libs/content/scripts/translate-json.ts',
    )
    expect(project.targets['translate']?.options?.command).not.toContain(
      'allow-fallback',
    )
    expect(project.targets['build']?.dependsOn).toEqual(['translate-build'])
    expect(project.targets['translate-build']?.dependsOn).toEqual([
      'libretranslate-up',
    ])
  })
})
