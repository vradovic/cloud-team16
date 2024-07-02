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
import { environment } from '../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class CognitoService {
  private readonly userPool: CognitoUserPool;

  constructor() {
    this.userPool = new CognitoUserPool({
      UserPoolId: environment.userPoolId,
      ClientId: environment.clientId,
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

  verifyUser(username: string, code: string) {
    const userData: ICognitoUserData = {
      Username: username,
      Pool: this.userPool,
    };

    const cognitoUser = new CognitoUser(userData);

    return new Promise((resolve, reject) => {
      cognitoUser.confirmRegistration(code, true, (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      });
    });
  }

  async getSession() {
    const currentUser = this.userPool.getCurrentUser();
    if (currentUser) {
      return new Promise<CognitoUserSession>((resolve, reject) => {
        currentUser.getSession(
          (error: Error | null, session: CognitoUserSession | null) => {
            if (error) {
              reject(error);
            } else if (session) {
              resolve(session);
            } else {
              console.error('Session is null');
            }
          },
        );
      });
    } else {
      return null;
    }
  }
}
