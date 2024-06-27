import * as cdk from 'aws-cdk-lib';
import {
  AuthorizationType,
  AwsIntegration,
  CognitoUserPoolsAuthorizer,
  ContentHandling,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { IUserPool } from 'aws-cdk-lib/aws-cognito';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Code } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import path from 'path';

export interface ApiStackProps {
  contentBucket: IBucket;
  contentMetadataTable: ITable;
  userPool: IUserPool;
}

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id);

    const createContentFunction = new NodejsFunction(
      this,
      'createContentFunction',
      {
        handler: 'create-content.handler',
        code: Code.fromAsset(path.join(__dirname, 'lambda')),
      },
    );
    props.contentMetadataTable.grantWriteData(createContentFunction);

    const api = new RestApi(this, 'srbflixApi', {
      binaryMediaTypes: ['video/*'],
    });

    const auth = new CognitoUserPoolsAuthorizer(this, 'srbflixAuthorizer', {
      cognitoUserPools: [props.userPool],
    });

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

    const bucketResource = api.root.addResource(props.contentBucket.bucketName);
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
