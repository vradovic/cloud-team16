import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { IMetadata } from '../app/model/metadata.model';
import { MediaService } from '../media.service';
import { ActivatedRoute, Router } from '@angular/router';
import { RatingService } from '../app/rating.service';
import { FormsModule } from '@angular/forms';
import { ContentService } from '../app/content.service';
import { FileSaverModule, FileSaverService } from 'ngx-filesaver';

@Component({
  selector: 'app-media-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, FileSaverModule],
  templateUrl: './media-detail.component.html',
  styleUrl: './media-detail.component.scss',
})
export class MediaDetailComponent implements OnInit {
  id: string = '';
  metadata?: IMetadata;
  rating = 'none';

  constructor(
    private mediaService: MediaService,
    private ratingService: RatingService,
    private route: ActivatedRoute,
    private router: Router,
    private contentService: ContentService,
    private fileSaverService: FileSaverService,
  ) {}

  ngOnInit() {
    this.id = this.route.snapshot.params['id'];
    console.log(this.id);

    this.mediaService.getMetadata(this.id).subscribe((metadata) => {
      this.metadata = metadata;
    });

    this.ratingService.getRating(this.id).subscribe((rating) => {
      console.log(rating);
      this.rating = rating.rating;
    });
  }

  updateRating() {
    if (!this.id) {
      return;
    }

    if (this.rating === 'none') {
      this.ratingService.deleteRating(this.id).subscribe(() => {
        console.log('deleted');
      });
    }

    this.ratingService
      .createRating(this.id, {
        rating: this.rating,
      })
      .subscribe((rating) => {
        console.log(rating);
      });
  }


  editContent(mediaId: string) {
    this.router.navigate(['/edit-content', mediaId]);
  }
  
  downloadContent() {
    this.mediaService.getContent(this.id).subscribe((blob) => {
      this.fileSaverService.save(blob, 'download');
    });
  }


  onDeleteClick() {
    // Call Lambda functions to delete file from S3 and metadata from DynamoDB
    this.contentService.deleteVideo(this.id).subscribe(
      () => {
        console.log('Video successfully deleted from S3');
        alert('Video successfully deleted from S3');
        
        this.contentService.removeMetadata(this.id).subscribe(
          () => {
            console.log('Metadata successfully deleted from DynamoDB');
            alert('Metadata successfully deleted from DynamoDB');
          },
          (error) => {
            console.error('Failed to delete metadata from DynamoDB', error);
            alert('Failed to delete metadata from DynamoDB');
          }
        );
      },
      (error) => {
        console.error('Failed to delete video from S3', error);
        alert('Failed to delete video from S3');
      }
    );
  }
}
