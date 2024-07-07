import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

interface IBody {
  topic?: string;
}

const REGION = process.env.REGION!;
const TABLE_NAME = process.env.TABLE_NAME!;

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: 'Missing body',
      };
    }

    const { topic } = JSON.parse(event.body) as IBody;
    const email = event.requestContext.authorizer?.email;

    if (!topic || !email) {
      return {
        statusCode: 400,
        body: 'Missing required fields',
      };
    }

    const params: PutCommandInput = {
      TableName: TABLE_NAME,
      Item: {
        topic,
        email,
      },
    };

    await docClient.send(new PutCommand(params));

    return {
      statusCode: 201,
      body: JSON.stringify({ topic, email }),
    };
  } catch (error) {
    console.error('Error inserting item: ', error);

    return {
      statusCode: 500,
      body: 'Internal server error',
    };
  }
};
