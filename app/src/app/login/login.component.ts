import { Component } from '@angular/core';
import { CognitoService } from '../cognito.service';
import { UserFeedService } from '../user-feed.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  username = '';
  password = '';

  constructor(
    private cognitoService: CognitoService,
    private userFeedService: UserFeedService,
    private router: Router,
  ) {}

  async login() {
    try {
      const session = await this.cognitoService.authenticateUser(
        this.username,
        this.password,
      );
      console.log('User login successful: ', session);

      // Populate user feed after successful login
      await this.populateUserFeed();

      // Navigate to another route if needed
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('User login failed: ', error);
    }
  }

  async populateUserFeed() {
    try {
      const result = await this.userFeedService.populateFeed().toPromise();
      console.log('User feed populated: ', result);
    } catch (error) {
      console.error('Error populating user feed: ', error);
    }
  }
}
