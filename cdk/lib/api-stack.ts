import * as cdk from 'aws-cdk-lib';
import {
  AuthorizationType,
  AwsIntegration,
  CognitoUserPoolsAuthorizer,
  ContentHandling,
  LambdaIntegration,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { IUserPool } from 'aws-cdk-lib/aws-cognito';
import { ITableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import path from 'path';

export interface ApiStackProps {
  contentBucket: IBucket;
  contentMetadataTable: ITableV2;
  subscriptionsTable: ITableV2;
  userPool: IUserPool;
}

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id);

    const createContentFunction = new NodejsFunction(
      this,
      'createContentFunction',
      {
        runtime: Runtime.NODEJS_20_X,
        entry: path.join(__dirname, './lambda/create-content.ts'),
        handler: 'handler',
      },
    );
    props.contentMetadataTable.grantWriteData(createContentFunction);

    const createSubscriptionFunction = new NodejsFunction(
      this,
      'createSubscriptionFunction',
      {
        runtime: Runtime.NODEJS_20_X,
        entry: path.join(__dirname, './lambda/create-subscription.ts'),
        handler: 'handler',
        environment: {
          TABLE_NAME: props.subscriptionsTable.tableName,
          REGION: this.region,
        },
      },
    );
    props.subscriptionsTable.grantWriteData(createSubscriptionFunction);

    const api = new RestApi(this, 'srbflixApi', {
      binaryMediaTypes: ['video/*'],
    });

    const auth = new CognitoUserPoolsAuthorizer(this, 'srbflixAuthorizer', {
      cognitoUserPools: [props.userPool],
    });

    const createSubscriptionIntegration = new LambdaIntegration(
      createSubscriptionFunction,
    );

    const subscriptionResource = api.root.addResource('subscriptions');
    subscriptionResource.addMethod('POST', createSubscriptionIntegration);

    const getIntegration = new AwsIntegration({
      service: 's3',
      integrationHttpMethod: 'GET',
      path: `${props.contentBucket.bucketName}/{object}`,
      options: {
        credentialsRole: new Role(this, 'ApiGatewayS3Role', {
          assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
          managedPolicies: [
            ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
          ],
        }),
        requestParameters: {
          'integration.request.path.object': 'method.request.path.object',
        },
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Content-Type':
                'integration.response.header.Content-Type',
            },
            contentHandling: ContentHandling.CONVERT_TO_BINARY,
          },
        ],
      },
    });

    const bucketResource = api.root.addResource('media');
    const objectResource = bucketResource.addResource('{object}');

    objectResource.addMethod('GET', getIntegration, {
      requestParameters: {
        'method.request.path.object': true,
      },
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Content-Type': true,
          },
        },
      ],
      authorizer: auth,
      authorizationType: AuthorizationType.COGNITO,
    });
  }
}
