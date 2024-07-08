import * as cdk from 'aws-cdk-lib';
import {
  AuthorizationType,
  AwsIntegration,
  ContentHandling,
  Cors,
  LambdaIntegration,
  RestApi,
  TokenAuthorizer,
} from 'aws-cdk-lib/aws-apigateway';
import { IUserPool, IUserPoolClient } from 'aws-cdk-lib/aws-cognito';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import {
  ManagedPolicy,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { SqsSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import path from 'path';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export interface ApiStackProps {
  contentBucket: IBucket;
  contentMetadataTable: ITable;
  subscriptionsTable: ITable;
  userPool: IUserPool;
  ratingTable: ITable;
  userFeedTable: ITable;
  downloadsTable: ITable;
  sourceEmail: string;
  userPoolClient: IUserPoolClient;
}

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id);

    const newMediaTopic = new Topic(this, 'NewMediaTopic', {
      displayName: 'New media topic',
    });

    const authorizerFunction = new NodejsFunction(this, 'AuthorizerFunction', {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, './lambda/authorizer.ts'),
      handler: 'handler',
      environment: {
        USER_POOL_ID: props.userPool.userPoolId,
        CLIENT_ID: props.userPoolClient.userPoolClientId,
      },
    });

    const authorizer = new TokenAuthorizer(this, 'Authorizer', {
      handler: authorizerFunction,
      identitySource: 'method.request.header.Authorization',
      resultsCacheTtl: cdk.Duration.minutes(0),
    });

    const uploadMetadataFunction = new NodejsFunction(
      this,
      'uploadMetadataFunction',
      {
        runtime: Runtime.NODEJS_20_X,
        entry: path.join(__dirname, './lambda/upload-metadata.ts'),
        handler: 'handler',
        environment: {
          TABLE_NAME: props.contentMetadataTable.tableName,
          TITLE_INDEX: 'titleIndex',
          GENRE_INDEX: 'genreIndex',
          DIRECTOR_INDEX: 'directorIndex',
          ACTOR_INDEX: 'actorIndex',
          RELEASE_YEAR_INDEX: 'releaseYearIndex',
          REGION: this.region,
          TOPIC_ARN: newMediaTopic.topicArn,
        },
      },
    );
    props.contentMetadataTable.grantWriteData(uploadMetadataFunction);
    newMediaTopic.grantPublish(uploadMetadataFunction);

    const deleteMetadataFunction = new NodejsFunction(
      this,
      'deleteMetadataFunction',
      {
        runtime: Runtime.NODEJS_20_X,
        entry: path.join(__dirname, './lambda/delete-metadata.ts'),
        handler: 'handler',
        environment: {
          TABLE_NAME: props.contentMetadataTable.tableName,
          REGION: this.region,
        },
      },
    );
    const editMetadataFunction = new NodejsFunction(
      this,
      'editMetadataFunction',
      {
        runtime: Runtime.NODEJS_20_X,
        entry: path.join(__dirname, './lambda/edit-metadata.ts'),
        handler: 'handler',
        environment: {
          TABLE_NAME: props.contentMetadataTable.tableName,
          REGION: this.region,
        },
      },
    );

    props.contentMetadataTable.grantWriteData(deleteMetadataFunction);
    props.contentMetadataTable.grantWriteData(editMetadataFunction);

    const deleteVideoFunction = new NodejsFunction(
      this,
      'deleteVideoFunction',
      {
        runtime: Runtime.NODEJS_20_X,
        entry: path.join(__dirname, './lambda/delete-video.ts'),
        handler: 'handler',
        environment: {
          BUCKET_NAME: props.contentBucket.bucketName,
          REGION: this.region,
        },
      },
    );

    props.contentBucket.grantDelete(deleteVideoFunction);

    const updateFeedFunction = new NodejsFunction(this, 'updateFeedFunction', {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, './lambda/update-feed.ts'),
      handler: 'handler',
      environment: {
        USER_FEED_TABLE: props.userFeedTable.tableName,
        CONTENT_METADATA_TABLE: props.contentMetadataTable.tableName,
        RATING_TABLE: props.ratingTable.tableName,
        SUBSCRIPTIONS_TABLE: props.subscriptionsTable.tableName,
        DOWNLOADS_TABLE: props.downloadsTable.tableName,
        REGION: this.region,
      },
    });
    props.userFeedTable.grantWriteData(updateFeedFunction);
    props.contentMetadataTable.grantReadData(updateFeedFunction);
    props.ratingTable.grantReadData(updateFeedFunction);
    props.subscriptionsTable.grantReadData(updateFeedFunction);
    props.downloadsTable.grantReadData(updateFeedFunction);

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
          UPDATE_FEED_FUNCTION: updateFeedFunction.functionName,
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
          INDEX_NAME: 'emailIndex',
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
          UPDATE_FEED_FUNCTION: updateFeedFunction.functionName,
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

    const notifySubscribersQueue = new Queue(this, 'notifySubscribersQueue');
    const notifySubscribersFunction = new NodejsFunction(
      this,
      'notifySubscribersFunction',
      {
        runtime: Runtime.NODEJS_20_X,
        entry: path.join(__dirname, './lambda/notify-subscribers.ts'),
        handler: 'handler',
        environment: {
          REGION: this.region,
          TABLE_NAME: props.subscriptionsTable.tableName,
          SOURCE_EMAIL: props.sourceEmail,
        },
      },
    );
    props.subscriptionsTable.grantReadData(notifySubscribersFunction);
    notifySubscribersFunction.addToRolePolicy(
      new PolicyStatement({
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: ['*'],
      }),
    );

    notifySubscribersQueue.grantConsumeMessages(notifySubscribersFunction);
    notifySubscribersFunction.addEventSource(
      new SqsEventSource(notifySubscribersQueue),
    );
    newMediaTopic.addSubscription(
      new SqsSubscription(notifySubscribersQueue, {
        rawMessageDelivery: true,
      }),
    );

    const api = new RestApi(this, 'srbflixApi', {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
      },
      binaryMediaTypes: ['video/*'],
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

    const uploadMetadataFunctionIntegration = new LambdaIntegration(
      uploadMetadataFunction,
      {
        proxy: true,
      },
    );

    const deleteMetadataFunctionIntegration = new LambdaIntegration(
      deleteMetadataFunction,
      {
        proxy: true,
      },
    );

    const deleteVideoFunctionIntegration = new LambdaIntegration(
      deleteVideoFunction,
      {
        proxy: true,
      },
    );
    const editMetadataFunctionIntegration = new LambdaIntegration(
      editMetadataFunction,
      {
        proxy: true,
      },
    );

    const subscriptionResource = api.root.addResource('subscriptions');
    const topicResource = subscriptionResource.addResource('{topic}');
    subscriptionResource.addMethod('POST', createSubscriptionIntegration, {
      authorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    topicResource.addMethod('DELETE', deleteSubscriptionIntegration, {
      authorizer,
      authorizationType: AuthorizationType.CUSTOM,
      requestParameters: {
        'method.request.path.topic': true,
      },
    });

    subscriptionResource.addMethod('GET', getUserSubscriptionsIntegration, {
      authorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    const mediaResource = api.root.addResource('media');
    const mediaId = mediaResource.addResource('{movieId}');
    const ratingResource = mediaId.addResource('rating');
    const contentResource = mediaId.addResource('content');

    ratingResource.addMethod('POST', createRatingIntegration, {
      authorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    ratingResource.addMethod('DELETE', deleteRatingIntegration, {
      authorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    ratingResource.addMethod('GET', getRatingIntegration, {
      authorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    const filterMetadataFunction = new NodejsFunction(
      this,
      'filterMetadataFunction',
      {
        runtime: Runtime.NODEJS_20_X,
        entry: path.join(__dirname, './lambda/filter-content.ts'),
        handler: 'handler',
        environment: {
          TABLE_NAME: props.contentMetadataTable.tableName,
          REGION: this.region,
        },
      },
    );
    props.contentMetadataTable.grantReadData(filterMetadataFunction);

    const filterMetadataFunctionIntegration = new LambdaIntegration(
      filterMetadataFunction,
      {
        proxy: true,
      },
    );

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

    const uploadIntegration = new AwsIntegration({
      service: 's3',
      integrationHttpMethod: 'PUT',
      path: `${props.contentBucket.bucketName}/{movieId}`,
      options: {
        credentialsRole: new Role(this, 'ApiGatewayS3RoleUpload', {
          assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
          inlinePolicies: {
            S3UploadPolicy: new PolicyDocument({
              statements: [
                new PolicyStatement({
                  actions: ['s3:PutObject'],
                  resources: [`${props.contentBucket.bucketArn}/*`],
                }),
              ],
            }),
          },
        }),
        requestParameters: {
          'integration.request.path.movieId': 'method.request.path.movieId',
          'integration.request.header.Content-Type':
            'method.request.header.Content-Type',
        },
        integrationResponses: [
          {
            statusCode: '201',
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
      authorizer,
    });

    contentResource.addMethod('POST', uploadIntegration, {
      requestParameters: {
        'method.request.path.movieId': true,
        'method.request.header.Content-Type': true,
      },
      methodResponses: [
        {
          statusCode: '201',
        },
      ],
      authorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    contentResource.addMethod('DELETE', deleteVideoFunctionIntegration, {
      requestParameters: {
        'method.request.path.movieId': true,
        'method.request.header.Content-Type': false,
      },
      methodResponses: [
        {
          statusCode: '200',
        },
      ],
      authorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    mediaId.addMethod('POST', uploadMetadataFunctionIntegration, {
      requestParameters: {
        'method.request.path.movieId': true,
      },
      authorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    mediaId.addMethod('DELETE', deleteMetadataFunctionIntegration, {
      requestParameters: {
        'method.request.path.movieId': true,
      },
      authorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });
    mediaId.addMethod('PUT', editMetadataFunctionIntegration, {
      requestParameters: {
        'method.request.path.movieId': true,
        'method.request.header.Content-Type': true,
      },
      authorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    mediaResource.addMethod('GET', filterMetadataFunctionIntegration, {
      authorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    const getUserFeedFunction = new NodejsFunction(
      this,
      'getUserFeedFunction',
      {
        runtime: Runtime.NODEJS_20_X,
        entry: path.join(__dirname, './lambda/get-user-feed.ts'),
        handler: 'handler',
        environment: {
          USER_FEED_TABLE: props.userFeedTable.tableName,
          REGION: this.region,
        },
      },
    );
    props.userFeedTable.grantReadData(getUserFeedFunction);

    const getUserFeedIntegration = new LambdaIntegration(getUserFeedFunction);

    const userFeedResource = api.root.addResource('user-feed');
    userFeedResource.addMethod('GET', getUserFeedIntegration, {
      authorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    const populateFeedFunction = new NodejsFunction(
      this,
      'PopulateFeedFunction',
      {
        runtime: Runtime.NODEJS_20_X,
        entry: path.join(__dirname, './lambda/create-feed-for-user.ts'),
        handler: 'index.handler',
        environment: {
          USER_FEED_TABLE: props.userFeedTable.tableName,
          CONTENT_METADATA_TABLE: props.contentMetadataTable.tableName,
        },
      },
    );

    props.userFeedTable.grantReadWriteData(populateFeedFunction);
    props.contentMetadataTable.grantReadWriteData(populateFeedFunction);

    const populateFeedIntegration = new LambdaIntegration(populateFeedFunction);

    userFeedResource.addMethod('POST', populateFeedIntegration, {
      authorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    const videoTranscodeFunction = new NodejsFunction(
      this,
      'videoTranscodeFunction',
      {
        runtime: Runtime.NODEJS_20_X,
        entry: path.join(__dirname, './lambda/video-transcode.ts'),
        handler: 'handler',
        environment: {
          REGION: this.region,
          BUCKET_NAME: props.contentBucket.bucketName,
        },
      },
    );

    props.contentBucket.grantReadWrite(videoTranscodeFunction);

    const videoTranscodeFunctionIntegration = new LambdaIntegration(
      videoTranscodeFunction,
      {
        proxy: false,
      },
    );

    contentResource.addMethod('PUT', videoTranscodeFunctionIntegration, {
      requestParameters: {
        'method.request.path.movieId': true,
      },
      authorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });
  }
}
