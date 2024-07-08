import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ContentService } from '../content.service';
import { IMetadata } from '../model/metadata.model';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-edit-content',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './edit-content.component.html',
  styleUrls: ['./edit-content.component.scss'],
})
export class EditContentComponent implements OnInit {
  contentForm: FormGroup;
  movieId: string = '';
  file: File | null = null;

  constructor(
    private route: ActivatedRoute,
    private contentService: ContentService,
    private fb: FormBuilder,
  ) {
    this.contentForm = this.fb.group({
      title: [{ value: '', disabled: true }],
      description: [''],
      actors: [''],
      directors: [''],
      genres: [''],
      releaseYear: ['', Validators.required],
      fileType: [{ value: '', disabled: true }],
      fileSize: [{ value: '', disabled: true }],
      creationTime: [{ value: '', disabled: true }],
      lastModifiedTime: [{ value: '', disabled: true }],
      file: [''],
    });
  }

  ngOnInit(): void {
    this.movieId = this.route.snapshot.paramMap.get('id')!;
    this.contentService
      .getMetadata(this.movieId)
      .subscribe((data: IMetadata) => {
        this.contentForm.patchValue({
          title: data.title,
          description: data.description,
          actors: data.actors.join(', '),
          directors: data.directors.join(', '),
          genres: data.genres.join(', '),
          releaseYear: data.releaseYear,
          fileType: data.fileType,
          fileSize: data.fileSize,
          creationTime: data.creationTime,
          lastModifiedTime: data.lastModifiedTime,
        });
      });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.file = input.files[0];
      this.contentForm.patchValue({
        title: this.file.name,
        fileType: this.file.type,
        fileSize: this.file.size,
        creationTime: new Date(this.file.lastModified).toISOString(),
        lastModifiedTime: new Date().toISOString(),
      });
    }
  }

  onSubmit(): void {
    if (this.contentForm.valid) {
      const formData = this.contentForm.value;
      const metadata: IMetadata = {
        mediaId: this.movieId,
        title: this.contentForm.get('title')!.value,
        description: formData.description,
        actors: formData.actors.split(',').map((s: string) => s.trim()),
        directors: formData.directors.split(',').map((s: string) => s.trim()),
        genres: formData.genres.split(',').map((s: string) => s.trim()),
        releaseYear: formData.releaseYear,
        fileType: this.contentForm.get('fileType')!.value,
        fileSize: this.contentForm.get('fileSize')!.value,
        creationTime: this.contentForm.get('creationTime')!.value,
        lastModifiedTime: this.contentForm.get('lastModifiedTime')!.value,
      };

      this.contentService.editMetadata(metadata).subscribe(
        () => {
          if (this.file) {
            this.contentService
              .uploadContent(this.movieId, this.file)
              .subscribe(
                () => alert('Content updated successfully'),
                (error) => console.error('File upload error:', error),
              );
          } else {
            alert('Content updated successfully');
          }
        },
        (error) => console.error('Update error:', error),
      );
    }
  }
}
