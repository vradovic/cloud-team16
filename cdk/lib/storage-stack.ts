import * as cdk from 'aws-cdk-lib';
import { ITable, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Bucket, IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class StorageStack extends cdk.Stack {
  public readonly contentBucket: IBucket;
  public readonly contentMetadataTable: ITable;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.contentBucket = Bucket.fromBucketName(
      this,
      'contentBucket',
      'srbflixbucket',
    );
    this.contentMetadataTable = Table.fromTableArn(
      this,
      'contentMetadataTable',
      'arn:aws:dynamodb:eu-central-1:590183779262:table/ContentMetadata',
    );
  }
}
