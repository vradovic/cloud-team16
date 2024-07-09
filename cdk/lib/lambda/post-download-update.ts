import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const REGION = process.env.REGION!;
const DOWNLOADS_TABLE = process.env.DOWNLOADS_TABLE!;
const UPDATE_FEED_FUNCTION = process.env.UPDATE_FEED_FUNCTION!;

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);
const lambdaClient = new LambdaClient({ region: REGION });

export const handler = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const username = event.requestContext.authorizer?.username;
    const email = event.requestContext.authorizer?.email;

    if (!username || !email) {
      return {
        statusCode: 400,
        body: 'Missing username or email',
      };
    }

    const movieId = event.pathParameters?.movieId;
    if (!movieId) {
      return {
        statusCode: 400,
        body: 'Missing movie id',
      };
    }

    const item = {
      username,
      movie_id: movieId,
    };

    const params: PutCommandInput = {
      TableName: DOWNLOADS_TABLE,
      Item: item,
    };

    try {
      await docClient.send(new PutCommand(params));
    } catch (error) {
      console.error('Error inserting item: ', error);
      return {
        statusCode: 500,
        body: 'Internal server error',
      };
    }

    // Invoke the function to update the feed
    await updateFeed(username, email);

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Download logged successfully', item }),
    };
  } catch (error) {
    console.error('Error processing request: ', error);
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
