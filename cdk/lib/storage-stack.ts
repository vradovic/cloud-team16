import * as cdk from 'aws-cdk-lib';
import { AttributeType, ITableV2, TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { Bucket, IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class StorageStack extends cdk.Stack {
  public readonly contentBucket: IBucket;
  public readonly contentMetadataTable: ITableV2;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.contentBucket = new Bucket(this, 'contentBucket', {
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    this.contentMetadataTable = new TableV2(this, 'contentMetadataTable', {
      partitionKey: {
        name: 'name',
        type: AttributeType.STRING,
      },
    });
  }
}
