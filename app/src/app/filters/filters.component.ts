import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { FilterMoviesService } from '../filter-movie.service';

interface Movie {
  movieId: string;
  title: string;
  genres: string[];
  directors: string[];
  actors: string[];
  releaseYear: number;
}

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.scss'],
})
export class FiltersComponent {
  results: Movie[] = [];
  filterError: string | null = null;

  constructor(
    private filterMoviesService: FilterMoviesService,
    private router: Router,
  ) {}

  submitForm(form: NgForm): void {
    const { title, genres, directors, actors, releaseYear } = form.value;

    this.filterMoviesService
      .filterMovies({ title, genres, directors, actors, releaseYear })
      .subscribe(
        (data: { items: Movie[] }) => {
          this.results = data.items;
          this.filterError = null;
        },
        (error: { message: string }) => {
          console.error('Error fetching data:', error);
          this.filterError = 'Failed to fetch data. Please try again.';
        },
      );
  }

  clearFilters(form: NgForm): void {
    form.resetForm();
    this.filterMoviesService.getPersonalizedFeed().subscribe(
      (data: { items: Movie[] }) => {
        this.results = data.items;
        this.filterError = null;
      },
      (error: { message: string }) => {
        console.error('Error fetching data:', error);
        this.filterError = 'Failed to fetch data. Please try again.';
      },
    );
  }

  viewMovie(movieId: string): void {
    this.router.navigate(['/media', movieId]);
  }
}
