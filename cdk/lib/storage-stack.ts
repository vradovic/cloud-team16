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

export class StorageStack extends cdk.Stack {
  public readonly contentBucket: IBucket;
  public readonly contentMetadataTable: ITableV2;
  public readonly subscriptionsTable: ITableV2;

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
      billing: Billing.provisioned({
        readCapacity: Capacity.fixed(1),
        writeCapacity: Capacity.autoscaled({ maxCapacity: 1, seedCapacity: 1 }),
      }),
    });

    const subscriptionsTable = new TableV2(this, 'subscriptionsTable', {
      partitionKey: {
        name: 'topic',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'username',
        type: AttributeType.STRING,
      },
      billing: Billing.provisioned({
        readCapacity: Capacity.fixed(1),
        writeCapacity: Capacity.autoscaled({ maxCapacity: 1, seedCapacity: 1 }),
      }),
    });
    subscriptionsTable.addGlobalSecondaryIndex({
      indexName: 'usernameIndex',
      partitionKey: {
        name: 'username',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'topic',
        type: AttributeType.STRING,
      },
      projectionType: ProjectionType.ALL,
    });
    this.subscriptionsTable = subscriptionsTable;
  }
}
