import { Component, OnInit } from '@angular/core';
import { SubscriptionService } from '../subscription.service';
import { ISubscription } from '../model/subscription.model';

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [],
  templateUrl: './subscriptions.component.html',
  styleUrl: './subscriptions.component.scss',
})
export class SubscriptionsComponent implements OnInit {
  subscriptions: ISubscription[] = [];

  constructor(private subscriptionService: SubscriptionService) {}

  ngOnInit(): void {
    this.subscriptionService.getAllForUser().subscribe((subscriptions) => {
      this.subscriptions = subscriptions;
      console.log(subscriptions);
    });
  }
}
