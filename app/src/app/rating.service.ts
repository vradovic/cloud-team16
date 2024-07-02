import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IRating } from './model/rating.model';
import { environment } from '../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class RatingService {
  constructor(private http: HttpClient) {}

  getRatingForCurrentUser(mediaId: string): Observable<IRating> {
    return this.http.get<IRating>(
      `${environment.apiUrl}/media/${mediaId}/rating`,
    );
  }
}
