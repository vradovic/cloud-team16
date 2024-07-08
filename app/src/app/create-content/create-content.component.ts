import { Component } from '@angular/core';
import { ContentService } from '../content.service';
import { IMetadata } from '../model/metadata.model';
import { CognitoService } from '../cognito.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-content',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-content.component.html',
  styleUrls: ['./create-content.component.scss']
})
export class CreateContentComponent {
  videoFile: File | null = null;
  mediaId: string = this.generateMediaId();
  videoMetadata: IMetadata = {
    mediaId: this.mediaId,
    title: '',
    description: null,
    actors: [],
    directors: [],
    genres: [],
    releaseYear: null,
    fileType: '',
    fileSize: 0,
    creationTime: null,
    lastModifiedTime: null
  };
  uploadError: string | null = null;
  years: number[] = [];

  constructor(
    private contentService: ContentService,
    private cognitoService: CognitoService,
  ) 
  {
    this.years = this.generateYears();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.videoFile = input.files[0];

      // Fetch additional file metadata
      this.videoMetadata.title = this.videoFile.name;
      this.videoMetadata.fileType = this.videoFile.type;
      this.videoMetadata.fileSize = this.videoFile.size;
      this.videoMetadata.lastModifiedTime = this.formatDate(new Date());
      this.videoMetadata.creationTime = this.formatDate(new Date(this.videoFile.lastModified)); // For example, same as lastModified
    }
  }

  submitForm(form: any): void {
    if (!form.value.description || !form.value.actors || !form.value.directors || !form.value.genres || !this.videoFile) {
      alert('Please fill in all required fields and select a video file.');
      return;
    }

    this.videoMetadata = {
      mediaId: this.mediaId,
      title: this.videoMetadata.title,
      description: form.value.description,
      actors: form.value.actors ? form.value.actors.split(',').map((actor: string) => actor.trim()) : [],
      directors: form.value.directors ? form.value.directors.split(',').map((director: string) => director.trim()) : [],
      genres: form.value.genres ? form.value.genres.split(',').map((genre: string) => genre.trim()) : [],
      releaseYear: form.value.releaseYear ? parseInt(form.value.releaseYear, 10) : null,
      fileType: this.videoMetadata.fileType,
      fileSize: this.videoMetadata.fileSize,
      creationTime: this.videoMetadata.creationTime,
      lastModifiedTime: this.videoMetadata.lastModifiedTime
    };

    if (!this.videoFile) {
      alert('Please select a video file');
      return;
    }

    // Call your service method to upload video and metadata
    this.contentService.uploadContent(this.mediaId, this.videoFile)
      .subscribe(
        () => {
          console.log('Video uploaded successfully');
          this.uploadError = null;
          // Reload the page to clear form and show success message
          //setTimeout(() => window.location.reload(), 1000); // Reload after 1 second
        },
        (error) => {
          console.error('Error uploading video:', error);
          this.uploadError = 'Error uploading video. Please try again.';
        }
      );

    this.contentService.uploadMetadata(this.videoMetadata)
      .subscribe(
        () => {
          console.log("Video metadata uploaded successfully");
          this.uploadError = null;
          //setTimeout(() => window.location.reload(), 1000);
        },
        (error) => {
          console.error('Error uploading video metadata: ', error);
          this.uploadError = 'Error uploading video metadata. Please try again.';
        }
      );

    console.log('Video metadata:', this.videoMetadata);
    console.log('Uploading video file:', this.videoFile);

    // Clear form fields after submission
    form.reset();
    this.videoFile = null;
  }

  generateMediaId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  isLoggedIn() {
    return this.cognitoService.isLoggedIn();
  }

  formatDate(date: Date): string {
    // Format date as desired, e.g., 'yyyy-MM-dd HH:mm:ss'
    return date.toLocaleString(); // Adjust format using toLocaleString options
  }

  private generateYears(): number[] {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= currentYear - 150; year--) {
      years.push(year);
    }
    return years;
  }
}
