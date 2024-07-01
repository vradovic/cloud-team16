import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DeleteCommandInput,
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb';
import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';

const REGION = process.env.REGION!;
const TABLE_NAME = process.env.TABLE_NAME!;

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
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

  const params: DeleteCommandInput = {
    TableName: TABLE_NAME,
    Key: {
      username,
      movieId,
    },
  };

  try {
    await docClient.send(new DeleteCommand(params));
  } catch (error) {
    console.error('Error deleting item: ', error);

    return {
      statusCode: 500,
      body: 'Internal server error',
    };
  }

  return {
    statusCode: 204,
    body: '',
  };
};
