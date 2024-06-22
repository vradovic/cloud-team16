import * as cdk from 'aws-cdk-lib';
import { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export class AuthStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    UserPool.fromUserPoolId(
      this,
      'srbflixUserPool',
      'eu-central-1_A16JOJsMT', // user pool id
    );
    UserPoolClient.fromUserPoolClientId(
      this,
      'srbflixUserPoolClient',
      '4ius91dsuomduu3bjlqcshndqf', // app client id
    );
  }
}
