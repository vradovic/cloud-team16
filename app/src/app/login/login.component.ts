import { Component } from '@angular/core';
import { CognitoService } from '../cognito.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  username = '';
  password = '';

  constructor(private cognitoService: CognitoService) {}

  async login() {
    try {
      const session = await this.cognitoService.authenticateUser(
        this.username,
        this.password,
      );
      console.log('User login successful: ', session);
    } catch (error) {
      console.error('User login failed: ', error);
    }
  }
}
