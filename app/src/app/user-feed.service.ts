import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserFeedService {
  constructor(private http: HttpClient) {}

  populateFeed(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.apiUrl}/populate-feed`,
      {},
    );
  }

  logDownload(movieId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.apiUrl}/log-download/${movieId}`,
      {},
    );
  }
}
