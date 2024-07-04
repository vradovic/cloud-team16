import { Component } from '@angular/core';
import { CognitoService } from '../cognito.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verify.component.html',
  styleUrl: './verify.component.scss',
})
export class VerifyComponent {
  username = '';
  code = '';

  constructor(private cognitoService: CognitoService) {}

  async verify() {
    try {
      const result = await this.cognitoService.verifyUser(
        this.username,
        this.code,
      );
      console.log('User verification successful: ', result);
    } catch (error) {
      console.error('User verification failed: ', error);
    }
  }
}
