import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { RatingService } from './rating.service';
import { CommonModule } from '@angular/common';
import { CognitoService } from './cognito.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'app';

  constructor(
    private ratingService: RatingService,
    private cognitoService: CognitoService,
  ) {}

  testApi() {
    this.ratingService.getRatingForCurrentUser('1').subscribe((rating) => {
      console.log('Rating: ', rating);
    });
  }

  isLoggedIn() {
    return this.cognitoService.getCurrentUser() !== null;
  }

  signOut() {
    this.cognitoService.signOut();
  }
}
