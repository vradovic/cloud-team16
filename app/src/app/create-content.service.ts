import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class CreateContentService {

  constructor(private http: HttpClient) { }

  uploadVideo(mediaId: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    const headers = new HttpHeaders({
      'Content-Type': 'multipart/form-data'
    });

    // Replace 'YOUR_API_ENDPOINT' with your actual API endpoint
    return this.http.put(environment.apiUrl + `media/${mediaId}`, formData, { headers })
      .toPromise()
      .then(() => {
        console.log('Video uploaded successfully');
      })
      .catch(error => {
        console.error('Error uploading video:', error);
        throw error; // Rethrow or handle the error as needed
      });
  }
}
