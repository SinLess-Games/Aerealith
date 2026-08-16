import { remarkMdxMermaid } from 'fumadocs-core/mdx-plugins'
import { pageSchema } from 'fumadocs-core/source/schema'
import { defineConfig, defineDocs } from 'fumadocs-mdx/config'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import { z } from 'zod'

const frontmatterDate = z.union([
  z.number().int().min(1000).max(9999),
  z.iso.date(),
  z.iso.datetime({ offset: true }),
])

export const docs = defineDocs({
  dir: '../../libs/content/src/en/docs',

  docs: {
    files: ['user/**/*.{md,mdx}', 'developer/**/*.{md,mdx}'],
    schema: ({ path }) =>
      pageSchema
        .extend({
          title: z.string().trim().min(1),
          description: z.string().trim().min(1),
          order: z.number().int().nonnegative().default(999),
          audience: z.enum(['user', 'developer']).optional(),
          keywords: z.array(z.string().trim().min(1)).default([]),
          draft: z.boolean().default(false),
          hidden: z.boolean().default(false),
          icon: z.string().trim().min(1).optional(),
          badge: z.string().trim().min(1).optional(),
          updated: frontmatterDate.optional(),

          // Research document metadata.
          status: z.string().trim().min(1).optional(),
          confidence: z.string().trim().min(1).optional(),
          researchType: z.string().trim().min(1).optional(),
          owners: z.array(z.string().trim().min(1)).default([]),
          researchStarted: frontmatterDate.optional(),
          decisionDate: frontmatterDate.optional(),
          related: z.array(z.string().trim().min(1)).default([]),
        })
        .superRefine((value, context) => {
          const audience = getPathAudience(path)

          if (!audience) {
            context.addIssue({
              code: 'custom',
              message: `documentation must be inside user/ or developer/ (received "${path}")`,
            })
          } else if (value.audience && value.audience !== audience) {
            context.addIssue({
              code: 'custom',
              path: ['audience'],
              message: `audience "${value.audience}" does not match directory audience "${audience}"`,
            })
          }
        }),

    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
})

function getPathAudience(path: string) {
  const segments = path.replaceAll('\\', '/').split('/').filter(Boolean)
  return segments.find(
    (segment): segment is 'user' | 'developer' =>
      segment === 'user' || segment === 'developer',
  )
}

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkMath, remarkMdxMermaid],

    rehypePlugins: (plugins) => [rehypeKatex, ...plugins],
  },
})
