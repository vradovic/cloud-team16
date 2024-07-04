import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const tableName = process.env.TABLE_NAME || '';

const client = new DynamoDBClient({ region: 'eu-central-1' });
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const videoId = event.pathParameters?.movieId;
    if (!videoId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing videoId in path parameters' }),
      };
    }

    const requestBody = JSON.parse(event.body || '{}');
    const { title, description, actors, directors, genres } = requestBody;

    if (!title || !description || !actors || !directors || !genres) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required metadata fields' }),
      };
    }

    const params: PutCommandInput = {
      TableName: tableName,
      Item: {
        videoId: videoId,
        title: title,
        description: description,
        actors: actors,
        directors: directors,
        genres: genres,
        createdAt: new Date().toISOString(),
      },
    };

    await docClient.send(new PutCommand(params));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Video metadata stored successfully' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
