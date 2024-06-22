import * as cdk from 'aws-cdk-lib';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { Code } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import path from 'path';

export interface ApiStackProps {
  contentBucket: IBucket;
  contentMetadataTable: ITable;
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
  }
}
