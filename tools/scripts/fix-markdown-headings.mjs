import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = process.cwd()
const codeFence = String.fromCodePoint(96).repeat(3)

const ignoredDirs = new Set([
  '.git',
  '.nx',
  '.turbo',
  '.wrangler',
  'node_modules',
  'dist',
  'coverage',
  'tmp',
  'temp',
])

async function collectMarkdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) {
      continue
    }

    const fullPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await collectMarkdownFiles(fullPath)))
      continue
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath)
    }
  }

  return files
}

function normalizeHeadings(content) {
  const lines = content.split('\n')
  let seenH1 = false
  let inFence = false

  return lines
    .map((line) => {
      if (line.trim().startsWith(codeFence)) {
        inFence = !inFence
        return line
      }

      if (inFence) {
        return line
      }

      if (line.startsWith('# ')) {
        if (!seenH1) {
          seenH1 = true
          return line
        }

        return `#${line}`
      }

      return line
    })
    .join('\n')
}

const files = await collectMarkdownFiles(root)
let changed = 0

for (const file of files) {
  const before = await readFile(file, 'utf8')
  const after = normalizeHeadings(before)

  if (after !== before) {
    await writeFile(file, after)
    changed += 1
    console.log(`fixed headings: ${file}`)
  }
}

console.log(`Updated ${changed} Markdown file(s).`)
