import { Component } from '@angular/core';
import { CognitoService } from '../cognito.service';
import { CognitoUserAttribute } from 'amazon-cognito-identity-js';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  username = '';
  address = '';
  name = '';
  email = '';
  password = '';

  constructor(private cognitoService: CognitoService) {}

  async register() {
    const attributeList: CognitoUserAttribute[] = [
      new CognitoUserAttribute({
        Name: 'email',
        Value: this.email,
      }),
      new CognitoUserAttribute({
        Name: 'address',
        Value: this.address,
      }),
      new CognitoUserAttribute({
        Name: 'name',
        Value: this.name,
      }),
    ];

    try {
      const result = await this.cognitoService.signUp(
        this.username,
        this.password,
        attributeList,
      );
      console.log('User registration successful: ', result);
    } catch (error) {
      console.error('User registration failed: ', error);
    }
  }
}
