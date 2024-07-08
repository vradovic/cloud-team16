import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from './environments/environment';
import { IMetadata } from './app/model/metadata.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MediaService {
  URL = `${environment.apiUrl}/media`;

  constructor(private http: HttpClient) {}

  getMetadata(mediaId: string): Observable<IMetadata> {
    return this.http.get<IMetadata>(`${this.URL}/${mediaId}`);
  }
}
