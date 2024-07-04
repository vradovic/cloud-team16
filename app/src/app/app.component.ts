import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RatingService } from './rating.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'app';

  constructor(private ratingService: RatingService) {}

  testApi() {
    this.ratingService.getRatingForCurrentUser('1').subscribe((rating) => {
      console.log('Rating: ', rating);
    });
  }
}
