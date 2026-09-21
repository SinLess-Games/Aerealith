export type ArtifactKind =
  | 'text'
  | 'code'
  | 'image'
  | 'audio'
  | 'video'
  | 'music'
  | 'dataset'
  | 'file';

export type ArtifactReference = {
  id: string;
  kind: ArtifactKind;
  contentType: string;
  createdAt: string;
  sizeBytes?: number;
  checksum?: string;
  metadata?: Record<string, string>;
};

export type ArtifactWrite = {
  kind: ArtifactKind;
  contentType: string;
  body: ArrayBuffer | ReadableStream<Uint8Array>;
  metadata?: Record<string, string>;
};

export interface ArtifactStore {
  put(
    namespace: string,
    artifact: ArtifactWrite,
  ): Promise<ArtifactReference>;
  get(
    namespace: string,
    artifactId: string,
  ): Promise<Response | undefined>;
  delete(namespace: string, artifactId: string): Promise<void>;
}
