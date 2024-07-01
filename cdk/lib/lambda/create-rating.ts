import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';

const REGION = process.env.REGION!;
const TABLE_NAME = process.env.TABLE_NAME!;

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

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

  const username: string =
    event.requestContext.authorizer?.claims['cognito:username'];
  if (!username) {
    return {
      statusCode: 400,
      body: 'Missing username',
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

  return {
    statusCode: 201,
    body: JSON.stringify(item),
  };
};
