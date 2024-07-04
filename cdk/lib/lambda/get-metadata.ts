import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const REGION = process.env.REGION!;
const client = new DynamoDBClient({ region: REGION });
const dynamoDb = DynamoDBDocumentClient.from(client);
const tableName = process.env.TABLE_NAME!;

exports.handler = async (event: any) => {
  const params = {
    TableName: tableName!,
  };

  try {
    const data = await dynamoDb.send(new ScanCommand(params));
    return {
      statusCode: 200,
      body: JSON.stringify(data.Items),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to fetch video metadata.', error }),
    };
  }
};
