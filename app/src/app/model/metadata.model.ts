export interface IMetadata {
  mediaId: string;
  title: string;
  description: string | null;
  genres: string[];
  actors: string[];
  directors: string[];
  releaseYear: number | null;
  fileType: string; 
  fileSize: number; 
  creationTime: string | null; 
  lastModifiedTime: string | null;
}
