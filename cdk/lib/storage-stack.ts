import * as cdk from 'aws-cdk-lib';
import {
  AttributeType,
  Billing,
  Capacity,
  ITableV2,
  ProjectionType,
  TableV2,
} from 'aws-cdk-lib/aws-dynamodb';
import { Bucket, IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class StorageStack extends cdk.Stack {
  public readonly contentBucket: IBucket;
  public readonly contentMetadataTable: ITableV2;
  public readonly subscriptionsTable: ITableV2;
  public readonly ratingTable: ITableV2;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.contentBucket = new Bucket(this, 'contentBucket', {
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    
    const contentMetadataTable = new dynamodb.Table(this, 'contentMetadataTable', {
      partitionKey: {
        name: 'movieId',
        type: AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
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

    const subscriptionsTable = new TableV2(this, 'subscriptionsTable', {
      partitionKey: {
        name: 'topic',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'email',
        type: AttributeType.STRING,
      },
      billing: Billing.provisioned({
        readCapacity: Capacity.fixed(1),
        writeCapacity: Capacity.autoscaled({ maxCapacity: 1 }),
      }),
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

    this.ratingTable = new TableV2(this, 'ratingTable', {
      partitionKey: {
        name: 'username',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'movie_id',
        type: AttributeType.STRING,
      },
      billing: Billing.provisioned({
        readCapacity: Capacity.fixed(1),
        writeCapacity: Capacity.autoscaled({ maxCapacity: 1 }),
      }),
    });
  }
}
