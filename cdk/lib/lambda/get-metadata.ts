import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';

const REGION = process.env.REGION!;
const TABLE_NAME = process.env.TABLE_NAME!;

const client = new DynamoDBClient({
  region: REGION,
});
const dynamodb = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEvent) => {
  const movieId = event.pathParameters?.movieId;
  if (!movieId) {
    return {
      statusCode: 400,
      body: 'Missing movie id',
    };
  }

  const input: GetCommandInput = {
    Key: {
      movieId,
    },
    TableName: TABLE_NAME,
  };

  try {
    const item = await dynamodb.send(new GetCommand(input));
    return {
      statusCode: 200,
      body: JSON.stringify(item.Item),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: 'Internal server error',
    };
  }
};
