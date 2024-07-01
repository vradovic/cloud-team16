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
  ratingTable: ITableV2;
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

    const deleteSubscriptionFunction = new NodejsFunction(
      this,
      'deleteSubscriptionFunction',
      {
        runtime: Runtime.NODEJS_20_X,
        entry: path.join(__dirname, './lambda/delete-subscription.ts'),
        handler: 'handler',
        environment: {
          TABLE_NAME: props.subscriptionsTable.tableName,
          REGION: this.region,
        },
      },
    );
    props.subscriptionsTable.grantWriteData(deleteSubscriptionFunction);

    const getUserSubscriptionsFunction = new NodejsFunction(
      this,
      'getUserSubscriptionsFunction',
      {
        runtime: Runtime.NODEJS_20_X,
        entry: path.join(__dirname, './lambda/get-user-subscriptions.ts'),
        handler: 'handler',
        environment: {
          TABLE_NAME: props.subscriptionsTable.tableName,
          REGION: this.region,
          INDEX_NAME: 'usernameIndex',
        },
      },
    );
    props.subscriptionsTable.grantReadData(getUserSubscriptionsFunction);

    const createRatingFunction = new NodejsFunction(
      this,
      'createRatingFunction',
      {
        runtime: Runtime.NODEJS_20_X,
        entry: path.join(__dirname, './lambda/create-rating.ts'),
        handler: 'handler',
        environment: {
          REGION: this.region,
          TABLE_NAME: props.ratingTable.tableName,
        },
      },
    );
    props.ratingTable.grantWriteData(createRatingFunction);

    const deleteRatingFunction = new NodejsFunction(
      this,
      'deleteRatingFunction',
      {
        runtime: Runtime.NODEJS_20_X,
        entry: path.join(__dirname, './lambda/delete-rating.ts'),
        handler: 'handler',
        environment: {
          REGION: this.region,
          TABLE_NAME: props.ratingTable.tableName,
        },
      },
    );
    props.ratingTable.grantWriteData(deleteRatingFunction);

    const getRatingFunction = new NodejsFunction(this, 'getRatingFunction', {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, './lambda/get-rating.ts'),
      handler: 'handler',
      environment: {
        REGION: this.region,
        TABLE_NAME: props.ratingTable.tableName,
      },
    });
    props.ratingTable.grantReadData(getRatingFunction);

    const api = new RestApi(this, 'srbflixApi', {
      binaryMediaTypes: ['video/*'],
    });

    const auth = new CognitoUserPoolsAuthorizer(this, 'srbflixAuthorizer', {
      cognitoUserPools: [props.userPool],
    });

    const createSubscriptionIntegration = new LambdaIntegration(
      createSubscriptionFunction,
    );

    const deleteSubscriptionIntegration = new LambdaIntegration(
      deleteSubscriptionFunction,
    );

    const getUserSubscriptionsIntegration = new LambdaIntegration(
      getUserSubscriptionsFunction,
    );

    const createRatingIntegration = new LambdaIntegration(createRatingFunction);

    const deleteRatingIntegration = new LambdaIntegration(deleteRatingFunction);

    const getRatingIntegration = new LambdaIntegration(getRatingFunction);

    const subscriptionResource = api.root.addResource('subscriptions');
    subscriptionResource.addMethod('POST', createSubscriptionIntegration, {
      authorizer: auth,
      authorizationType: AuthorizationType.COGNITO,
    });

    subscriptionResource.addMethod('DELETE', deleteSubscriptionIntegration, {
      authorizer: auth,
      authorizationType: AuthorizationType.COGNITO,
    });

    subscriptionResource.addMethod('GET', getUserSubscriptionsIntegration, {
      authorizer: auth,
      authorizationType: AuthorizationType.COGNITO,
    });

    const mediaResource = api.root.addResource('media');
    const mediaId = mediaResource.addResource('{movieId}');
    const ratingResource = mediaId.addResource('rating');
    const contentResource = mediaId.addResource('content');

    ratingResource.addMethod('POST', createRatingIntegration, {
      authorizer: auth,
      authorizationType: AuthorizationType.COGNITO,
    });

    ratingResource.addMethod('DELETE', deleteRatingIntegration, {
      authorizer: auth,
      authorizationType: AuthorizationType.COGNITO,
    });

    ratingResource.addMethod('GET', getRatingIntegration, {
      authorizer: auth,
      authorizationType: AuthorizationType.COGNITO,
    });

    const getIntegration = new AwsIntegration({
      service: 's3',
      integrationHttpMethod: 'GET',
      path: `${props.contentBucket.bucketName}/{movieId}`,
      options: {
        credentialsRole: new Role(this, 'ApiGatewayS3Role', {
          assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
          managedPolicies: [
            ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
          ],
        }),
        requestParameters: {
          'integration.request.path.movieId': 'method.request.path.movieId',
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

    contentResource.addMethod('GET', getIntegration, {
      requestParameters: {
        'method.request.path.movieId': true,
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
