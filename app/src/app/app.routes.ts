import { Routes } from '@angular/router';
import { VerifyComponent } from './verify/verify.component';
import { AccountComponent } from './account/account.component';
import { SubscriptionsComponent } from './subscriptions/subscriptions.component';
import { CreateContentComponent } from './create-content/create-content.component';

export const routes: Routes = [
  { path: 'subscriptions', component: SubscriptionsComponent },
  { path: 'account', component: AccountComponent },
  { path: 'verify', component: VerifyComponent },
  { path: 'create-content', component: CreateContentComponent },
];
