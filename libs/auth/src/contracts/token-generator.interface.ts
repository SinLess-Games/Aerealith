export interface GeneratedToken {
  readonly token: string;
  readonly digest: string;
}

export interface TokenGenerator {
  generate(entropyBytes: number): Promise<GeneratedToken>;
  digest(token: string): Promise<string>;
}
