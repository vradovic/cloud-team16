import { Component } from '@angular/core';
import { CreateContentService } from '../create-content.service';

@Component({
  selector: 'app-create-content',
  templateUrl: './create-content.component.html',
  styleUrls: ['./create-content.component.scss']
})
export class CreateContentComponent {

  constructor(private createContentService: CreateContentService) {}

  submitForm(event: Event): void {
    event.preventDefault();

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const videoFile = formData.get('videoFile') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const actors = (formData.get('actors') as string)?.split(',').map(actor => actor.trim()) || [];
    const directors = (formData.get('directors') as string)?.split(',').map(director => director.trim()) || [];
    const genres = (formData.get('genres') as string)?.split(',').map(genre => genre.trim()) || [];
    const releaseYear = parseInt(formData.get('releaseYear') as string, 10);

    if (!videoFile) {
      alert('Please select a video file');
      return;
    }

    const mediaId = this.generateMediaId();

    const videoMetadata = {
      mediaId,
      title,
      description,
      actors,
      directors,
      genres,
      releaseYear
    };

    this.createContentService.uploadContent(mediaId, videoFile);

    // Optional: Clear form fields after submission
    form.reset();
  }

  generateMediaId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
