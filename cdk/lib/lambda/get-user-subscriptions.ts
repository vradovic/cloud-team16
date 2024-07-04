import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const REGION = process.env.REGION!;
const TABLE_NAME = process.env.TABLE_NAME!;
const INDEX_NAME = process.env.INDEX_NAME!;

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const username = event.requestContext.authorizer?.claims['cognito:email'];

    if (!username) {
      return {
        statusCode: 400,
        body: 'Missing username',
      };
    }

    const params: QueryCommandInput = {
      TableName: TABLE_NAME,
      IndexName: INDEX_NAME,
      KeyConditionExpression: 'username = :username',
      ExpressionAttributeValues: {
        ':username': username,
      },
    };
    const dynamoResponse = await docClient.send(new QueryCommand(params));

    return {
      statusCode: 200,
      body: JSON.stringify(dynamoResponse.Items),
    };
  } catch (error) {
    console.error('Error inserting item: ', error);

    return {
      statusCode: 500,
      body: 'Internal server error',
    };
  }
};
