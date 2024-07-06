import * as cdk from 'aws-cdk-lib';
import {
  AttributeType,
  ProjectionType,
  Table,
  ITable,
  BillingMode,
} from 'aws-cdk-lib/aws-dynamodb';
import { Bucket, IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class StorageStack extends cdk.Stack {
  public readonly contentBucket: IBucket;
  public readonly contentMetadataTable: ITable;
  public readonly subscriptionsTable: ITable;
  public readonly ratingTable: ITable;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.contentBucket = new Bucket(this, 'contentBucket', {
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const contentMetadataTable = new Table(this, 'contentMetadataTable', {
      partitionKey: {
        name: 'movieId',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
    });
    contentMetadataTable.addGlobalSecondaryIndex({
      indexName: 'titleIndex',
      partitionKey: { name: 'title', type: dynamodb.AttributeType.STRING },
    });

    contentMetadataTable.addGlobalSecondaryIndex({
      indexName: 'genreIndex',
      partitionKey: { name: 'genre', type: dynamodb.AttributeType.STRING },
    });

    contentMetadataTable.addGlobalSecondaryIndex({
      indexName: 'directorIndex',
      partitionKey: { name: 'director', type: dynamodb.AttributeType.STRING },
    });

    contentMetadataTable.addGlobalSecondaryIndex({
      indexName: 'actorIndex',
      partitionKey: { name: 'actor', type: dynamodb.AttributeType.STRING },
    });

    contentMetadataTable.addGlobalSecondaryIndex({
      indexName: 'releaseYearIndex',
      partitionKey: {
        name: 'releaseYear',
        type: dynamodb.AttributeType.NUMBER,
      },
    });
    this.contentMetadataTable = contentMetadataTable;

    const subscriptionsTable = new Table(this, 'subscriptionsTable', {
      partitionKey: {
        name: 'topic',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'email',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
    });
    subscriptionsTable.addGlobalSecondaryIndex({
      indexName: 'emailIndex',
      partitionKey: {
        name: 'email',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'topic',
        type: AttributeType.STRING,
      },
      projectionType: ProjectionType.ALL,
    });
    this.subscriptionsTable = subscriptionsTable;

    this.ratingTable = new Table(this, 'ratingTable', {
      partitionKey: {
        name: 'username',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'movie_id',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
    });
  }
}
