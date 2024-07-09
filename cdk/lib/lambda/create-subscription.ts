import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const REGION = process.env.REGION!;
const TABLE_NAME = process.env.TABLE_NAME!;
const UPDATE_FEED_FUNCTION = process.env.UPDATE_FEED_FUNCTION!;

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);
const lambdaClient = new LambdaClient({ region: REGION });

interface IBody {
  topic?: string;
}

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
    const username = event.requestContext.authorizer?.username;
    const email = event.requestContext.authorizer?.email;

    if (!topic || !username || !email) {
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

    // Invoke the function to update the feed
    await updateFeed(username, email);

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

const updateFeed = async (username: string, email: string) => {
  const params = {
    FunctionName: UPDATE_FEED_FUNCTION,
    InvocationType: 'Event',
    Payload: JSON.stringify({ username, email }),
  };
  await lambdaClient.send(new InvokeCommand(params));
};
