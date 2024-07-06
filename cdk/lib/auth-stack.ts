import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export interface AuthStackProps {
  poolName: string;
  domainName: string;
  domainPrefix: string;
}

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.IUserPool;
  public readonly userPoolClient: cognito.IUserPoolClient;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id);

    const userPool = new cognito.UserPool(this, props.poolName, {
      selfSignUpEnabled: true,
      signInAliases: {
        username: true,
        email: true,
      },
      autoVerify: {
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

    userPool.addDomain(props.domainName, {
      cognitoDomain: {
        domainPrefix: props.domainPrefix,
      },
    });

    const userPoolClient = userPool.addClient('srbflixClient', {
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

    new cognito.CfnUserPoolGroup(this, 'users-group', {
      groupName: 'users',
      description: 'Default users.',
      userPoolId: userPool.userPoolId,
    });

    new cognito.CfnUserPoolGroup(this, 'admins-group', {
      groupName: 'admins',
      description: 'Admin group',
      userPoolId: userPool.userPoolId,
    });

    this.userPool = userPool;
    this.userPoolClient = userPoolClient;
  }
}
