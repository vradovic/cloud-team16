import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CognitoService } from '../cognito.service';
import { LoginComponent } from '../login/login.component';
import { RegisterComponent } from '../register/register.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, LoginComponent, RegisterComponent, RouterModule],
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss',
})
export class AccountComponent implements OnInit {
  name?: string;
  email?: string;
  state = 'login';

  constructor(private cognitoService: CognitoService) {}

  async ngOnInit() {
    try {
      const attributes = await this.cognitoService.getUserAttributes();
      if (attributes) {
        this.name = attributes.find(
          (attribute) => attribute.Name === 'name',
        )?.Value;
        this.email = attributes.find(
          (attribute) => attribute.Name === 'email',
        )?.Value;
      }
    } catch (error) {
      console.error(error);
    }
  }

  isLoggedIn() {
    return this.cognitoService.isLoggedIn();
  }
}
