import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export class AuthStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pool = new cognito.UserPool(this, 'srbflixUserPool', {
      selfSignUpEnabled: true,
      signInAliases: {
        username: true,
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: false,
        },
        fullname: {
          required: true,
          mutable: true,
        },
        address: {
          required: true,
          mutable: true,
        },
      },
    });

    pool.addDomain('srbflixDomain', {
      cognitoDomain: {
        domainPrefix: 'srbflix-auth',
      },
    });

    pool.addClient('srbflixClient', {
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
          cognito.OAuthScope.PHONE,
        ],
        callbackUrls: ['http://localhost:4200'],
        logoutUrls: ['http://localhost:4200'],
      },
    });
  }
}
