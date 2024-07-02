import { Injectable } from '@angular/core';
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
  CognitoUserSession,
  ICognitoUserData,
  ISignUpResult,
} from 'amazon-cognito-identity-js';

@Injectable({
  providedIn: 'root',
})
export class CognitoService {
  private readonly userPool: CognitoUserPool;

  constructor() {
    this.userPool = new CognitoUserPool({
      UserPoolId: process.env.USER_POOL_ID!,
      ClientId: process.env.CLIENT_ID!,
    });
  }

  signUp(
    username: string,
    password: string,
    attributeList: CognitoUserAttribute[],
  ): Promise<ISignUpResult> {
    return new Promise((resolve, reject) => {
      this.userPool.signUp(
        username,
        password,
        attributeList,
        [],
        (error, result) => {
          if (error) {
            reject(error);
            return;
          } else if (result !== undefined) {
            resolve(result);
          }

          reject('Result is undefined');
        },
      );
    });
  }

  authenticateUser(
    username: string,
    password: string,
  ): Promise<CognitoUserSession> {
    return new Promise((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: username,
        Password: password,
      });

      const userData: ICognitoUserData = {
        Username: username,
        Pool: this.userPool,
      };

      const cognitoUser = new CognitoUser(userData);

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (session) => {
          resolve(session);
        },
        onFailure: (error) => {
          reject(error);
        },
      });
    });
  }

  signOut() {
    const cognitoUser = this.userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
    }
  }
}
