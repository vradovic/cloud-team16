import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { VerifyComponent } from './verify/verify.component';
import { AccountComponent } from './account/account.component';
import { SubscriptionsComponent } from './subscriptions/subscriptions.component';

export const routes: Routes = [
  { path: 'subscriptions', component: SubscriptionsComponent },
  { path: 'account', component: AccountComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'verify', component: VerifyComponent },
];
