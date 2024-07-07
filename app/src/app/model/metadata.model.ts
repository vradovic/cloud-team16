export interface IMetadata {
  mediaId: string;
  title: string;
  description: string | null;
  genres: string[];
  actors: string[];
  directors: string[];
  releaseYear: number | null;
}
