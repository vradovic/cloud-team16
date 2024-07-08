import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IMetadata } from '../app/model/metadata.model';
import { MediaService } from '../media.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-media-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './media-detail.component.html',
  styleUrl: './media-detail.component.scss',
})
export class MediaDetailComponent implements OnInit {
  metadata?: IMetadata;

  constructor(
    private mediaService: MediaService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    const id: string = this.route.snapshot.params['id'];
    console.log(id);

    this.mediaService.getMetadata(id).subscribe((metadata) => {
      this.metadata = metadata;
      console.log(metadata);
    });
  }
}
