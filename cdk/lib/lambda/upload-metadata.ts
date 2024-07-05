import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const region = process.env.REGION!;
const client = new DynamoDBClient({ region: region });
const dynamoDb = DynamoDBDocumentClient.from(client);
const tableName = process.env.TABLE_NAME!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid input' }),
    };
  }

  const body = JSON.parse(event.body);
  const {
    movieId,
    title,
    description,
    actors,
    directors,
    genres,
    releaseYear,
  } = body;

  // Convert lists to concatenated strings
  const actorsString = Array.isArray(actors) ? actors.join(', ') : '';
  const directorsString = Array.isArray(directors) ? directors.join(', ') : '';
  const genresString = Array.isArray(genres) ? genres.join(', ') : '';

  const params = {
    TableName: tableName,
    Item: {
      movieId,
      title,
      description,
      actors: actorsString,
      directors: directorsString,
      genres: genresString,
      releaseYear,
    },
  };

  try {
    await dynamoDb.send(new PutCommand(params));
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Video metadata saved successfully!', data: params.Item }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to save video metadata.',
        error: (error as Error).message,
      }),
    };
  }
};
