import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, extname } from 'node:path'

export async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8')) as unknown
}

export async function writeJson(path: string, value: unknown): Promise<void> {
  if (extname(path).toLowerCase() !== '.json') {
    throw new Error(`Refusing to write JSON to a non-JSON path: ${path}`)
  }
  await mkdir(dirname(path), { recursive: true })
  // lgtm[js/http-to-file-access] Callers choose fixed repository-owned JSON
  // paths; remote translation text can affect serialized content, never the path.
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}
