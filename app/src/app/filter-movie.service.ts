import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';

interface Movie {
  movieId: string;
  title: string;
  genres: string[];
  directors: string[];
  actors: string[];
  releaseYear: number;
}

@Injectable({
  providedIn: 'root',
})
export class FilterMoviesService {
  constructor(private http: HttpClient) {}

  filterMovies(filters: {
    title?: string;
    genres?: string;
    directors?: string;
    actors?: string;
    releaseYear?: number;
  }): Observable<{ items: Movie[] }> {
    const params = new URLSearchParams();

    if (filters.title) params.append('title', filters.title);
    if (filters.genres) params.append('genres', filters.genres);
    if (filters.directors) params.append('directors', filters.directors);
    if (filters.actors) params.append('actors', filters.actors);
    if (filters.releaseYear)
      params.append('releaseYear', filters.releaseYear.toString());

    return this.http.get<{ items: Movie[] }>(
      `${environment.apiUrl}/media?${params.toString()}`,
    );
  }

  getPersonalizedFeed(): Observable<{ items: Movie[] }> {
    return this.http.get<{ items: Movie[] }>(`${environment.apiUrl}/user-feed`);
  }
}
