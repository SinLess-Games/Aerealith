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
  put(artifact: ArtifactWrite): Promise<ArtifactReference>;
  get(artifactId: string): Promise<Response | undefined>;
  delete(artifactId: string): Promise<void>;
}
