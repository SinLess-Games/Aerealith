import {
  Tree,
  formatFiles,
  generateFiles,
  installPackagesTask,
} from '@nx/devkit'
import * as path from 'node:path'

interface ServiceGeneratorSchema {
  name: string
}

function toKebabCase(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .split('-')
    .filter(Boolean)
    .join('-')
    .toLowerCase()
}

function toPascalCase(value: string): string {
  const kebab = toKebabCase(value)
  return kebab
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('')
}

export default async function serviceGenerator(
  tree: Tree,
  schema: ServiceGeneratorSchema,
) {
  const serviceName = toKebabCase(schema.name)
  const className = toPascalCase(schema.name)
  const projectName = `service-${serviceName}`
  const projectRoot = `apps/services/${serviceName}`
  const routePrefix = `/api/v1/services/${serviceName}`

  const filesDir = path.join(__dirname, '..', 'templates')
  generateFiles(tree, filesDir, projectRoot, {
    serviceName,
    projectName,
    className,
    routePrefix,
    tmpl: '',
  })

  const frontendProjectPath = 'apps/frontend/src/app'
  const frontendRoutesFile = `${frontendProjectPath}/app.tsx`
  if (tree.exists(frontendRoutesFile)) {
    const current = tree.read(frontendRoutesFile, 'utf-8')

    if (current === null) {
      throw new Error(`Unable to read ${frontendRoutesFile}`)
    }

    const marker = "import { Routes, Route } from 'react-router-dom';"
    const serviceRoute = `import { ${className}Page } from '../services/${serviceName}/routes';`
    const serviceElement = `      <Route path="${routePrefix}" element={<${className}Page />} />`
    let updated = current

    if (!updated.includes(serviceRoute)) {
      updated = updated.replace(marker, `${marker}\n${serviceRoute}`)
    }

    if (!updated.includes(serviceElement)) {
      updated = updated.replace(
        '  return (\n    <Routes>',
        `  return (\n    <Routes>\n${serviceElement}`,
      )
    }

    tree.write(frontendRoutesFile, updated)
  }

  const workspacePackageJsonPath = 'package.json'
  const workspacePackageJson = tree.read(workspacePackageJsonPath, 'utf-8')

  if (workspacePackageJson === null) {
    throw new Error(`Unable to read ${workspacePackageJsonPath}`)
  }

  const packageJson = JSON.parse(workspacePackageJson)
  if (!packageJson.scripts?.['services:new']) {
    packageJson.scripts = {
      ...packageJson.scripts,
      'services:new': 'nx g @aerealith-ai/service-generator:service --name',
    }
  }
  tree.write(
    workspacePackageJsonPath,
    `${JSON.stringify(packageJson, null, 2)}\n`,
  )

  const projectJsonPath = `${projectRoot}/project.json`
  const projectConfig = {
    name: projectName,
    $schema: '../../../node_modules/nx/schemas/project-schema.json',
    sourceRoot: `${projectRoot}/src`,
    projectType: 'application',
    tags: ['scope:services', 'type:service'],
    targets: {
      build: {
        executor: '@nx/js:tsc',
        outputs: ['{options.outputPath}'],
        options: {
          outputPath: `dist/${projectRoot}`,
          main: `${projectRoot}/src/main.ts`,
          tsConfig: `${projectRoot}/tsconfig.app.json`,
        },
      },
      lint: {
        executor: '@nx/eslint:lint',
        options: {
          lintFilePatterns: [`${projectRoot}/**/*.{ts,tsx,js,jsx}`],
        },
      },
      test: {
        executor: '@nx/vitest:test',
        options: {
          passWithNoTests: true,
          configFile: `${projectRoot}/vitest.config.mts`,
        },
      },
      serve: {
        executor: '@nx/js:node',
        defaultConfiguration: 'development',
        options: {
          buildTarget: `${projectName}:build`,
        },
      },
    },
  }

  tree.write(projectJsonPath, `${JSON.stringify(projectConfig, null, 2)}\n`)

  const appTsConfigPath = `${projectRoot}/tsconfig.app.json`
  tree.write(
    appTsConfigPath,
    JSON.stringify(
      {
        extends: '../../../tsconfig.base.json',
        compilerOptions: {
          outDir: '../../../dist/out-tsc',
          rootDir: './src',
          declaration: true,
          types: ['node'],
        },
        include: ['src/**/*.ts'],
      },
      null,
      2,
    ),
  )

  tree.write(
    `${projectRoot}/tsconfig.json`,
    JSON.stringify(
      {
        extends: '../../../tsconfig.base.json',
        compilerOptions: {
          composite: true,
        },
        include: [],
        references: [
          { path: './tsconfig.app.json' },
          { path: './tsconfig.spec.json' },
        ],
      },
      null,
      2,
    ),
  )

  tree.write(
    `${projectRoot}/tsconfig.spec.json`,
    JSON.stringify(
      {
        extends: './tsconfig.json',
        compilerOptions: {
          outDir: '../../../dist/out-tsc',
          rootDir: './src',
          types: ['vitest/globals', 'node'],
        },
        include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
      },
      null,
      2,
    ),
  )

  tree.write(
    `${projectRoot}/vitest.config.mts`,
    `import { defineConfig } from 'vitest/config';\n\nexport default defineConfig({\n  test: {\n    environment: 'node',\n    globals: true,\n    include: ['src/**/*.spec.ts'],\n  },\n});\n`,
  )

  tree.write(
    `${projectRoot}/eslint.config.mjs`,
    `import js from '@eslint/js';\nimport tseslint from 'typescript-eslint';\n\nexport default [\n  js.configs.recommended,\n  ...tseslint.configs.recommended,\n  {\n    files: ['**/*.ts'],\n    rules: {},\n  },\n];\n`,
  )

  tree.write(
    `${projectRoot}/Dockerfile`,
    `FROM node:20-alpine\nWORKDIR /app\nCOPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./\nCOPY apps/services/${serviceName} ./apps/services/${serviceName}\nRUN corepack enable && pnpm install --frozen-lockfile\nCMD ["pnpm", "exec", "tsx", "apps/services/${serviceName}/src/main.ts"]\n`,
  )

  tree.write(
    `${projectRoot}/src/main.ts`,
    `import { Hono } from 'hono';\n\nconst app = new Hono();\n\napp.get('${routePrefix}', (c) => {\n  return c.json({ service: '${serviceName}', status: 'ok' });\n});\n\nexport default app;\n`,
  )

  tree.write(
    `${projectRoot}/src/app.spec.ts`,
    `import { describe, expect, it } from 'vitest';\n\ndescribe('${serviceName} service', () => {\n  it('returns ok', () => {\n    expect(true).toBe(true);\n  });\n});\n`,
  )

  tree.write(
    `${projectRoot}/README.md`,
    `# ${className} service\n\nGenerated Hono service scaffold for ${serviceName}.\n`,
  )

  await formatFiles(tree)
  return () => {
    installPackagesTask(tree)
  }
}
