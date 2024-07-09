import { Routes } from '@angular/router';
import { VerifyComponent } from './verify/verify.component';
import { AccountComponent } from './account/account.component';
import { SubscriptionsComponent } from './subscriptions/subscriptions.component';
import { CreateContentComponent } from './create-content/create-content.component';
import { MediaDetailComponent } from '../media-detail/media-detail.component';
import { FiltersComponent } from './filters/filters.component';
import { EditContentComponent } from './edit-content/edit-content.component';

export const routes: Routes = [
  { path: 'subscriptions', component: SubscriptionsComponent },
  { path: 'account', component: AccountComponent },
  { path: 'verify', component: VerifyComponent },
  { path: 'create-content', component: CreateContentComponent },
  { path: 'media/:id', component: MediaDetailComponent },
  { path: 'all', component: FiltersComponent },
  { path: 'edit-content/:id', component: EditContentComponent },
];
