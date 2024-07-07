import { Component, OnInit } from '@angular/core';
import { SubscriptionService } from '../subscription.service';
import { ISubscription } from '../model/subscription.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CognitoService } from '../cognito.service';

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './subscriptions.component.html',
  styleUrl: './subscriptions.component.scss',
})
export class SubscriptionsComponent implements OnInit {
  subscriptions: ISubscription[] = [];
  topic = '';

  constructor(
    private cognitoService: CognitoService,
    private subscriptionService: SubscriptionService,
  ) {}

  ngOnInit(): void {
    this.subscriptionService.getAllForUser().subscribe((subscriptions) => {
      this.subscriptions = subscriptions;
      console.log(subscriptions);
    });
  }

  createSubscription() {
    if (this.topic) {
      this.subscriptionService
        .createSubscription({
          topic: this.topic,
        })
        .subscribe((topic) => {
          console.log(`Created topic: ${topic}`);
        });
    }
  }

  deleteSubscription() {
    if (this.topic) {
      this.subscriptionService.deleteSubscription(this.topic).subscribe(() => {
        console.log('Deleted topic');
      });
    }
  }

  isLoggedIn() {
    return this.cognitoService.isLoggedIn();
  }
}
