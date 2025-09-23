export interface SplittedUrn {
  agency?: string;
  id?: string;
  version?: string;
}

export interface ArtifactChildUrnParsed extends SplittedUrn {
  childId: string;
}
