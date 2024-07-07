import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';

const REGION = process.env.REGION!;
const TABLE_NAME = process.env.TABLE_NAME!;

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  const username: string = event.requestContext.authorizer?.claims.username;
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

  const params: GetCommandInput = {
    TableName: TABLE_NAME,
    Key: {
      username,
      movie_id: movieId,
    },
  };

  let item;
  try {
    item = await docClient.send(new GetCommand(params));
  } catch (error) {
    console.error('Error getting item: ', error);

    return {
      statusCode: 500,
      body: 'Internal server error',
    };
  }

  if (!item.Item) {
    return {
      statusCode: 404,
      body: 'Rating not found',
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(item.Item),
  };
};
