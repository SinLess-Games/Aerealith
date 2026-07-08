/**
 * Application runtime environment values.
 */
export declare const AppEnvironment: {
  readonly Local: 'local';
  readonly Development: 'development';
  readonly Test: 'test';
  readonly Preview: 'preview';
  readonly Staging: 'staging';
  readonly Production: 'production';
};
export type AppEnvironment =
  (typeof AppEnvironment)[keyof typeof AppEnvironment];
export declare const DefaultAppEnvironment: 'development';
export declare const AppEnvironmentValues: (
  'local' | 'development' | 'test' | 'preview' | 'staging' | 'production'
)[];
export declare function isAppEnvironment(
  value: unknown,
): value is AppEnvironment;
