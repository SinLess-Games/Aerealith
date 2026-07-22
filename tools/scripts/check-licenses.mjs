// SPDX-FileCopyrightText: 2026 SinLess Games LLC
// SPDX-License-Identifier: AGPL-3.0-only

import { createHash } from 'node:crypto'
import { readFile, readdir, stat } from 'node:fs/promises'
import { join, relative, resolve, sep } from 'node:path'
import process from 'node:process'

const root = process.cwd()
const errors = []

const requiredFiles = [
  'LICENSE',
  'LICENSE-POLICY.md',
  'TRADEMARKS.md',
  'COMMERCIAL-LICENSE.md',
  'CONTRIBUTING.md',
  'CLA.md',
  'NOTICE',
  'LICENSES/AGPL-3.0-only.txt',
  'LICENSES/Apache-2.0.txt',
  'LICENSES/CC-BY-4.0.txt',
  'docs/LICENSE.md',
  'docs/images/LICENSE.md',
  'docs/images/brand/LICENSE.md',
  'apps/frontend/public/images/LICENSE.md',
  'apps/frontend/public/images/brand/LICENSE.md',
  '.github/project/LICENSE',
  '.github/workflows/LICENSE',
]

const officialLicenseHashes = new Map([
  [
    'LICENSES/AGPL-3.0-only.txt',
    '0d96a4ff68ad6d4b6f1f30f713b18d5184912ba8dd389f86aa7710db079abcb0',
  ],
  [
    'LICENSES/Apache-2.0.txt',
    'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30',
  ],
  [
    'LICENSES/CC-BY-4.0.txt',
    '9ba9550ad48438d0836ddab3da480b3b69ffa0aac7b7878b5a0039e7ab429411',
  ],
])
const expectedPackages = new Map([
  ['package.json', 'AGPL-3.0-only'],
  ['libs/content/package.json', 'AGPL-3.0-only'],
  ['libs/core/package.json', 'AGPL-3.0-only'],
  ['libs/db/package.json', 'AGPL-3.0-only'],
  ['libs/ui/package.json', 'AGPL-3.0-only'],
  ['libs/utils/package.json', 'AGPL-3.0-only'],
  ['tools/generators/service/package.json', 'AGPL-3.0-only'],
])

const policyPaths = [
  'apps/frontend/**',
  'apps/frontend-e2e/**',
  'libs/content/**',
  'libs/core/**',
  'libs/db/**',
  'libs/ui/**',
  'libs/utils/**',
  'tools/generators/service/**',
  'tools/scripts/**',
  'docs/**/*.md',
  'docs/images/brand/**',
  'apps/frontend/public/images/brand/**',
  '.github/project/**',
  '.github/workflows/**',
  'apps/frontend/worker-configuration.d.ts',
  'libs/content/src/generated/**',
  'libs/content/translations/**',
]

const ignoredDirectories = new Set([
  '.git',
  '.nx',
  '.wrangler',
  'coverage',
  'dist',
  'node_modules',
  'tmp',
])

async function exists(path) {
  try {
    await stat(resolve(root, path))
    return true
  } catch {
    return false
  }
}

async function read(path) {
  return readFile(resolve(root, path), 'utf8')
}

async function findPackageManifests(directory) {
  const manifests = []
  const entries = await readdir(directory, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      continue
    }

    const absolute = join(directory, entry.name)

    if (entry.isDirectory()) {
      manifests.push(...(await findPackageManifests(absolute)))
    } else if (entry.name === 'package.json') {
      manifests.push(relative(root, absolute).split(sep).join('/'))
    }
  }

  return manifests
}

for (const path of requiredFiles) {
  if (!(await exists(path))) {
    errors.push(`${path}: required licensing file is missing`)
  }
}

for (const [path, expectedHash] of officialLicenseHashes) {
  if (!(await exists(path))) {
    continue
  }

  const hash = createHash('sha256')
    .update(await readFile(resolve(root, path)))
    .digest('hex')
  if (hash !== expectedHash) {
    errors.push(
      `${path}: official license text hash does not match its canonical source`,
    )
  }
}
for (const [path, expectedLicense] of expectedPackages) {
  if (!(await exists(path))) {
    errors.push(`${path}: expected owned package manifest is missing`)
    continue
  }

  try {
    const manifest = JSON.parse(await read(path))

    if (manifest.license !== expectedLicense) {
      errors.push(
        `${path}: expected license "${expectedLicense}", found ${JSON.stringify(manifest.license)}`,
      )
    }
  } catch (error) {
    errors.push(`${path}: cannot parse package manifest: ${error.message}`)
  }
}

for (const path of await findPackageManifests(root)) {
  if (!expectedPackages.has(path)) {
    errors.push(
      `${path}: package ownership or license is not represented in the license policy`,
    )
  }
}

if (await exists('LICENSE-POLICY.md')) {
  const policy = await read('LICENSE-POLICY.md')

  for (const path of policyPaths) {
    if (!policy.includes('`' + path + '`')) {
      errors.push(
        `LICENSE-POLICY.md: path matrix is missing the required entry "${path}"`,
      )
    }
  }
}

const contentChecks = new Map([
  ['LICENSE', ['AGPL-3.0-only', 'LICENSE-POLICY.md']],
  ['docs/LICENSE.md', ['CC-BY-4.0', 'Aerealith documentation']],
  ['docs/images/brand/LICENSE.md', ['All Rights Reserved', 'TRADEMARKS.md']],
  [
    'apps/frontend/public/images/brand/LICENSE.md',
    ['All Rights Reserved', 'TRADEMARKS.md'],
  ],
  ['.github/project/LICENSE', ['All Rights Reserved', 'proprietary']],
  ['.github/workflows/LICENSE', ['All Rights Reserved', 'proprietary']],
])

for (const [path, markers] of contentChecks) {
  if (!(await exists(path))) {
    continue
  }

  const value = await read(path)

  for (const marker of markers) {
    if (!value.includes(marker)) {
      errors.push(`${path}: expected licensing marker "${marker}" is missing`)
    }
  }
}

const thirdPartyNoticePath = 'apps/frontend/worker-configuration.d.ts'
if (await exists(thirdPartyNoticePath)) {
  const notice = await read(thirdPartyNoticePath)
  for (const marker of [
    'Copyright (c) Cloudflare',
    'Licensed under the Apache License, Version 2.0',
  ]) {
    if (!notice.includes(marker)) {
      errors.push(
        `${thirdPartyNoticePath}: existing third-party notice marker "${marker}" is missing`,
      )
    }
  }
}

if (errors.length > 0) {
  console.error('License policy validation failed:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exitCode = 1
} else {
  console.log(
    `License policy validation passed for ${expectedPackages.size} owned packages and ${requiredFiles.length} required files.`,
  )
}
