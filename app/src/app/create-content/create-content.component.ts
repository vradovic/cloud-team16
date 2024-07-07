import { Component } from '@angular/core';
import { IMetadata } from '../model/metadata.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CreateContentService } from '../create-content.service';


@Component({
  selector: 'app-create-content',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './create-content.component.html',
  styleUrl: './create-content.component.scss'
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
    releaseYear: null
  };

  actorsInput: string = '';
  directorsInput: string = '';
  genresInput: string = '';

  constructor (private createContentService : CreateContentService) {}


  onFileSelected(event: any) {
    this.videoFile = event.target.files[0];
  }

  submitForm() {
    if(this.videoFile == null) {
      alert('Please select a video file');
      return;
    }

    // Split comma-separated values into arrays
    this.videoMetadata.actors = this.actorsInput.split(',').map(actor => actor.trim());
    this.videoMetadata.directors = this.directorsInput.split(',').map(director => director.trim());
    this.videoMetadata.genres = this.genresInput.split(',').map(genre => genre.trim());

    this.createContentService.uploadVideo(this.mediaId, this.videoFile);

    console.log('Uploading video file: ', this.videoFile);
    console.log('Video metadata: ', this.videoMetadata);

    // Clear form fields after submission
    this.videoFile = null;
    this.videoMetadata = {
      mediaId: '',
      title: '',
      description: null,
      genres: [],
      actors: [],
      directors: [],
      releaseYear: null
    };
  }

  generateMediaId(): string {
    // Example of generating a random alphanumeric ID
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
