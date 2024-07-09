import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { IRating } from './model/rating.model';

@Injectable({
  providedIn: 'root',
})
export class RatingService {
  constructor(private http: HttpClient) {}

  getUrl(mediaId: string) {
    return `${environment.apiUrl}/media/${mediaId}/rating`;
  }

  getRating(mediaId: string) {
    return this.http.get<IRating>(this.getUrl(mediaId));
  }

  createRating(mediaId: string, rating: IRating) {
    return this.http.post<IRating>(this.getUrl(mediaId), rating);
  }

  deleteRating(mediaId: string) {
    return this.http.delete<void>(this.getUrl(mediaId));
  }
}
