import { Injectable } from '@angular/core';
import { IMetadata } from './model/metadata.model';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MetadataService {
  metadataCollection: IMetadata[] = [];

  constructor() {}

  getAllMetadata() {
    return of(this.metadataCollection);
  }

  getMetadata(id: string) {
    return of(
      this.metadataCollection.find((metadata) => id === metadata.mediaId),
    );
  }
}
