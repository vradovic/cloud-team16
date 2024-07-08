import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IMetadata } from '../app/model/metadata.model';
import { MediaService } from '../media.service';
import { ActivatedRoute } from '@angular/router';
import { RatingService } from '../app/rating.service';
import { FormsModule } from '@angular/forms';
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

  downloadContent() {
    this.mediaService.getContent(this.id).subscribe((blob) => {
      this.fileSaverService.save(blob, 'download');
    });
  }
}
