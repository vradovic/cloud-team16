import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const REGION = process.env.REGION!;
const TABLE_NAME = process.env.TABLE_NAME!;
const UPDATE_FEED_FUNCTION = process.env.UPDATE_FEED_FUNCTION!;

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);
const lambdaClient = new LambdaClient({ region: REGION });

type TRating = 'love' | 'like' | 'dislike';

interface IBody {
  rating?: TRating;
}

const isRating = (value: string): value is TRating => {
  return value === 'love' || value === 'like' || value === 'dislike';
};

export const handler = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: 'Missing body',
    };
  }

  const { rating } = JSON.parse(event.body) as IBody;
  if (!rating) {
    return {
      statusCode: 400,
      body: 'Missing rating',
    };
  }

  if (!isRating(rating)) {
    return {
      statusCode: 400,
      body: 'Rating must be love, like or dislike',
    };
  }

  const username: string = event.requestContext.authorizer?.username;
  const email: string = event.requestContext.authorizer?.email;
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
    rating,
  };

  const params: PutCommandInput = {
    TableName: TABLE_NAME,
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

  // Poziv funkciji za ažuriranje feeda
  await updateFeed(username, email);

  return {
    statusCode: 201,
    body: JSON.stringify(item),
  };
};

const updateFeed = async (username: string, email: string) => {
  const params = {
    FunctionName: UPDATE_FEED_FUNCTION,
    InvocationType: 'Event',
    Payload: JSON.stringify({ username, email }),
  };
  await lambdaClient.send(new InvokeCommand(params));
};
