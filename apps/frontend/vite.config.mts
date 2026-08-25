/// <reference types="vitest" />

import meticulous from '@alwaysmeticulous/recorder-plugin/vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import mdx from 'fumadocs-mdx/vite';
import { defineConfig, loadEnv } from 'vite';

/**
 * Hosts that may access the local Vite development/preview server.
 *
 * These are HOSTNAMES only:
 *
 *   localhost
 *
 * Not:
 *
 *   http://localhost:4200
 */
const allowedHosts = ['localhost', '127.0.0.1', 'local.sinlessgames.com'];

/**
 * Browser origins allowed to make cross-origin requests to the
 * Vite development/preview server.
 *
 * Origins include:
 *
 *   protocol://hostname[:port]
 *
 * These settings apply only to Vite itself. Authentication/API services
 * maintain their own independent CORS and trusted-origin policies.
 */
const allowedOrigins = [
  // Standard local frontend development.
  'http://localhost:4200', // NOSONAR -- loopback-only Vite development origin
  'http://127.0.0.1:4200', // NOSONAR -- loopback-only Vite development origin

  // Aerealith local development domain.
  'http://local.sinlessgames.com:4200', // NOSONAR -- local development DNS only
  'https://local.sinlessgames.com:4200',

  // Production frontend origins.
  'https://aerealith.com',
  'https://www.aerealith.com',
];

/**
 * Vite configuration for the Aerealith frontend.
 *
 * Production builds use Rolldown's manual code-splitting groups to keep the
 * application entry point small and isolate large dependency families into
 * independently cacheable chunks.
 */
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  const environment = loadEnv(mode, '../..', '');

  const browserEnvironment = Object.fromEntries(
    Object.entries(environment).filter(([key]) => key.startsWith('VITE_')),
  );

  const authServiceUrl =
    environment['AUTH_SERVICE_URL'] ??
    (isProduction
      ? 'https://aerealith-auth-preview.sinless-deploy.workers.dev'
      : 'http://localhost:8787');

  const apiServiceUrl =
    environment['API_SERVICE_URL'] ??
    (isProduction
      ? 'https://aerealith-api-preview.sinless-deploy.workers.dev'
      : 'http://localhost:8788');

  const serviceProxy: Record<string, string> = {
    '^/api/V1/(?:auth|users|account|profile|admin)(?:/|$)': authServiceUrl,

    '^/api/V1/services/auth(?:/|$)': authServiceUrl,

    '^/api/V1/flags$': authServiceUrl,

    '/api/V1': apiServiceUrl,

    '/graphql': authServiceUrl,

    '/trpc': authServiceUrl,
  };

  const previewProxy: Record<string, string> =
    environment['E2E_ENABLE_SERVICE_PROXY'] === 'true' ? serviceProxy : {};

  return {
    root: import.meta.dirname,

    envDir: '../..',

    cacheDir: '../../node_modules/.vite/apps/frontend',

    define: {
      __AEREALITH_FARO_URL__: JSON.stringify(
        environment['VITE_GRAFANA_FARO_URL'] ?? '',
      ),

      __AEREALITH_APP_ENVIRONMENT__: JSON.stringify(
        environment['VITE_APP_ENVIRONMENT'] ?? mode,
      ),

      __AEREALITH_APP_VERSION__: JSON.stringify(
        environment['VITE_APP_VERSION'] ?? 'development',
      ),

      __AEREALITH_ENV__: JSON.stringify({
        ...browserEnvironment,
        MODE: mode,
        DEV: mode === 'development',
      }),
    },

    /**
     * Resolve aliases declared in the frontend TypeScript configuration.
     */
    resolve: {
      tsconfigPaths: true,
    },

    /**
     * Local development server.
     */
    server: {
      /**
       * Listen on all local interfaces.
       *
       * This allows localhost as well as configured local development
       * hostnames such as local.sinlessgames.com to reach Vite.
       */
      host: '0.0.0.0',

      port: 4200,

      strictPort: true,

      /**
       * Protect the Vite development server from unexpected Host headers.
       */
      allowedHosts,

      /**
       * CORS policy for resources served directly by Vite.
       *
       * This does NOT replace the auth/API service CORS configuration.
       */
      cors: {
        origin: allowedOrigins,
        credentials: true,
      },

      /**
       * Development API proxy.
       *
       * Browser requests remain same-origin with the frontend while Vite
       * forwards the request to the appropriate local backend service.
       *
       * This is preferable during development because the browser sees:
       *
       *   http://localhost:4200/api/...
       *
       * rather than making direct cross-origin requests to:
       *
       *   http://localhost:8787
       *   http://localhost:8788
       */
      proxy: serviceProxy,
    },

    /**
     * Local preview server for testing production builds.
     */
    preview: {
      host: '0.0.0.0',

      port: 4200,

      strictPort: true,

      allowedHosts,

      cors: {
        origin: allowedOrigins,
        credentials: true,
      },

      // The live Playwright suite exercises the built application through
      // `vite preview`, so its same-origin auth/API requests need the same
      // service routing as development mode. Keep mock-only preview runs
      // isolated from services that intentionally are not started.
      // Vite otherwise inherits `server.proxy`, so use an explicit empty
      // object for mock preview runs.
      proxy: previewProxy,
    },

    /**
     * Generate the browser-safe documentation collection from
     * `apps/frontend/source.config.ts` alongside the standard frontend
     * plugins.
     */
    plugins: [
      mdx(),
      react(),
      tailwindcss(),
      meticulous({
        recordingToken: 'ZGbrQaFcTtkVa3XXVGOhAWPQ9PTq2NUFEjF6GmpG',
        enabled: 'always',
      }),
    ],

    build: {
      outDir: '../../dist/apps/frontend',

      assetsDir: 'assets',

      emptyOutDir: true,

      /**
       * Target modern browsers supported by the Aerealith frontend.
       */
      target: 'es2022',

      /**
       * Use Vite's Oxc-powered JavaScript minifier.
       */
      minify: 'oxc',

      /**
       * Keep styles imported by lazy chunks separate so they load only when
       * the related route or feature is requested.
       */
      cssCodeSplit: true,

      /**
       * Inline only small assets. Larger assets remain cacheable files.
       */
      assetsInlineLimit: 4096,

      /**
       * Hidden source maps support production error reporting without adding
       * sourceMappingURL comments to deployed JavaScript files.
       */
      sourcemap: isProduction ? 'hidden' : false,

      /**
       * Continue showing gzip output information after each build.
       */
      reportCompressedSize: true,

      /**
       * Rolldown's maxSize option is a target rather than a hard ceiling.
       * Some single modules cannot be divided further, so 750 kB is used as
       * the warning threshold after applying the chunking strategy below.
       */
      chunkSizeWarningLimit: 750,

      commonjsOptions: {
        transformMixedEsModules: true,
      },

      rolldownOptions: {
        output: {
          /**
           * Split large dependency families into separate browser-cacheable
           * files instead of placing the entire application in one bundle.
           */
          codeSplitting: {
            minSize: 20_000,

            maxSize: 400_000,

            minModuleSize: 10_000,

            maxModuleSize: 500_000,

            minShareCount: 2,

            includeDependenciesRecursively: false,

            groups: [
              /**
               * React runtime.
               */
              {
                name: 'react-core',

                test: /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/,

                priority: 100,

                minSize: 0,

                maxSize: 300_000,
              },

              /**
               * React Router and routing utilities.
               */
              {
                name: 'react-router',

                test: /node_modules[\\/](?:react-router|react-router-dom)[\\/]/,

                priority: 95,

                minSize: 0,

                maxSize: 300_000,
              },

              /**
               * TanStack libraries.
               */
              {
                name: 'tanstack',

                test: /node_modules[\\/]@tanstack[\\/]/,

                priority: 90,

                minSize: 0,

                maxSize: 350_000,
              },

              /**
               * Large code editors and language tooling.
               */
              {
                name: 'editors',

                test: /node_modules[\\/](?:monaco-editor|@monaco-editor|codemirror|@codemirror)[\\/]/,

                priority: 90,

                minSize: 0,

                maxSize: 400_000,
              },

              /**
               * Charts, graphing, and visualization packages.
               */
              {
                name: 'charts',

                test: /node_modules[\\/](?:recharts|chart\.js|react-chartjs-2|echarts|d3|d3-[^\\/]+|victory|plotly\.js|react-plotly\.js)[\\/]/,

                priority: 85,

                minSize: 0,

                maxSize: 350_000,
              },

              /**
               * Markdown, MDX, Fumadocs, Mermaid, and math rendering.
               */
              {
                name: 'documentation',

                test: /node_modules[\\/](?:fumadocs-(?:core|ui|mdx)|mermaid|katex|react-markdown|(?:remark|rehype|mdast|hast)-[^\\/]+|unified|micromark)[\\/]/,

                priority: 85,

                minSize: 0,

                maxSize: 400_000,
              },

              /**
               * Syntax highlighting packages can contain substantial language
               * grammars, so they receive their own chunk family.
               */
              {
                name: 'syntax-highlighting',

                test: /node_modules[\\/](?:prismjs|highlight\.js|shiki|@shikijs)[\\/]/,

                priority: 85,

                minSize: 0,

                maxSize: 350_000,
              },

              /**
               * Authentication and identity clients.
               */
              {
                name: 'authentication',

                test: /node_modules[\\/](?:@auth0|@clerk|next-auth|oidc-client-ts|keycloak-js|@azure[\\/]msal)[\\/]/,

                priority: 80,

                minSize: 0,

                maxSize: 300_000,
              },

              /**
               * Form state libraries.
               */
              {
                name: 'forms',

                test: /node_modules[\\/](?:react-hook-form|@hookform|formik|final-form|react-final-form)[\\/]/,

                priority: 80,

                minSize: 0,

                maxSize: 250_000,
              },

              /**
               * Validation libraries.
               */
              {
                name: 'validation',

                test: /node_modules[\\/](?:zod|valibot|yup|joi|ajv)[\\/]/,

                priority: 80,

                minSize: 0,

                maxSize: 250_000,
              },

              /**
               * Animation libraries.
               */
              {
                name: 'animation',

                test: /node_modules[\\/](?:motion|framer-motion|@react-spring|gsap|lottie-web)[\\/]/,

                priority: 75,

                minSize: 0,

                maxSize: 300_000,
              },

              /**
               * Icon packages.
               *
               * Tree-shaken icon imports should remain small, but separating
               * these protects the main application chunk when many icons are
               * used across the interface.
               */
              {
                name: 'icons',

                test: /node_modules[\\/](?:lucide-react|react-icons|@heroicons|@fortawesome)[\\/]/,

                priority: 75,

                minSize: 0,

                maxSize: 250_000,
              },

              /**
               * Date and time utilities.
               */
              {
                name: 'dates',

                test: /node_modules[\\/](?:date-fns|dayjs|luxon|moment)[\\/]/,

                priority: 70,

                minSize: 0,

                maxSize: 250_000,
              },

              /**
               * Internationalization packages and locale handling.
               */
              {
                name: 'internationalization',

                test: /node_modules[\\/](?:i18next|react-i18next|@formatjs|intl-messageformat)[\\/]/,

                priority: 70,

                minSize: 0,

                maxSize: 300_000,
              },

              /**
               * Network clients and data serialization utilities.
               */
              {
                name: 'networking',

                test: /node_modules[\\/](?:axios|ky|graphql|graphql-request|urql|@apollo)[\\/]/,

                priority: 65,

                minSize: 0,

                maxSize: 300_000,
              },

              /**
               * General UI component frameworks.
               */
              {
                name: 'ui-frameworks',

                test: /node_modules[\\/](?:@radix-ui|@headlessui|@floating-ui|react-aria|@react-aria|@react-stately)[\\/]/,

                priority: 65,

                minSize: 0,

                maxSize: 350_000,
              },

              /**
               * Error reporting and observability clients.
               */
              {
                name: 'observability',

                test: /node_modules[\\/](?:@sentry|@datadog|web-vitals|@opentelemetry)[\\/]/,

                priority: 65,

                minSize: 0,

                maxSize: 350_000,
              },

              /**
               * Aerealith workspace packages shared across multiple routes.
               */
              {
                name: 'aerealith-shared',

                test: /(?:^|[\\/])libs[\\/](?:ui|content|shared|utils|types|config)[\\/]/,

                priority: 55,

                minShareCount: 2,

                minSize: 10_000,

                maxSize: 300_000,
              },

              /**
               * Remaining third-party dependencies.
               *
               * This fallback comes after all focused groups so large
               * dependency families are not merged into one vendor bundle.
               */
              {
                name: 'vendor',

                test: /node_modules[\\/]/,

                priority: 20,

                minSize: 25_000,

                maxSize: 400_000,
              },

              /**
               * Application modules shared by two or more chunks.
               */
              {
                name: 'shared',

                priority: 10,

                minShareCount: 2,

                minSize: 15_000,

                maxSize: 300_000,
              },
            ],
          },

          /**
           * Content hashes allow immutable production caching.
           */
          entryFileNames: 'assets/entry/[name]-[hash].js',

          chunkFileNames: 'assets/chunks/[name]-[hash].js',

          assetFileNames: 'assets/static/[name]-[hash][extname]',
        },
      },
    },

    test: {
      name: 'frontend',

      watch: false,

      globals: true,

      environment: 'jsdom',

      include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

      exclude: [
        '**/node_modules/**',
        '../../dist/**',
        '../../coverage/**',
        '**/.{git,cache,output,temp}/**',
      ],

      reporters: ['default'],

      coverage: {
        provider: 'v8',

        reportsDirectory: '../../coverage/apps/frontend',

        reporter: ['text', 'json', 'html', 'lcov'],

        include: ['src/**/*.{ts,tsx}'],

        exclude: [
          'src/**/*.d.ts',
          'src/**/*.{test,spec}.{ts,tsx}',
          'src/**/__tests__/**',
          'src/**/__mocks__/**',
          'src/main.tsx',
          'src/vite-env.d.ts',
        ],

        /**
         * New code must meet the documented 80% coverage requirement.
         */
        thresholds: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
        },
      },
    },
  };
});
