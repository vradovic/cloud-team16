import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { IMetadata } from './model/metadata.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ContentService {
  constructor(private http: HttpClient) {}

  uploadContent(mediaId: string, file: File): Observable<unknown> {
    const headers = new HttpHeaders();
    headers.append('Content-Type', 'video/mp4');

    return this.http.post(
      environment.apiUrl + `/media/${mediaId}/content`,
      file,
      { headers },
    );
  }

  uploadMetadata(metadata: IMetadata) {
    return this.http.post(
      environment.apiUrl + `/media/${metadata.mediaId}`,
      metadata,
    );
  }

  getMetadata(mediaId: string): Observable<IMetadata> {
    return this.http.get<IMetadata>(environment.apiUrl + `/media/${mediaId}`);
  }

  editMetadata(metadata: IMetadata) {
    const headers = new HttpHeaders();
    headers.append('Content-Type', 'application/json');
    return this.http.put(
      environment.apiUrl + `/media/${metadata.mediaId}`,
      metadata,
      { headers },
    );
  }
}
