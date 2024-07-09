import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ISubscription } from './model/subscription.model';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  URL = `${environment.apiUrl}/subscriptions`;

  constructor(private http: HttpClient) {}

  createSubscription(subscription: ISubscription): Observable<ISubscription> {
    return this.http.post<ISubscription>(this.URL, subscription);
  }

  deleteSubscription(topicName: string): Observable<void> {
    const encoded = encodeURI(topicName);
    return this.http.delete<void>(`${this.URL}/${encoded}`);
  }

  getAllForUser(): Observable<ISubscription[]> {
    return this.http.get<ISubscription[]>(this.URL);
  }
}
