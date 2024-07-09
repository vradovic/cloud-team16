import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
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

  constructor(private cognitoService: CognitoService) {}

  isLoggedIn() {
    return this.cognitoService.isLoggedIn();
  }

  signOut() {
    this.cognitoService.signOut();
  }
}
