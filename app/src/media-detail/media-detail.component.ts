import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IMetadata } from '../app/model/metadata.model';
import { MediaService } from '../media.service';
import { ActivatedRoute, Router } from '@angular/router';
import { RatingService } from '../app/rating.service';
import { FormsModule } from '@angular/forms';
import { ContentService } from '../app/content.service';

@Component({
  selector: 'app-media-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
}
