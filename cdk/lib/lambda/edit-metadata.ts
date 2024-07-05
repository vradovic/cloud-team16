import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const region = process.env.REGION!;
const dynamoDbClient = new DynamoDBClient({ region: region });
const tableName = process.env.TABLE_NAME!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { movieId } = event.pathParameters || {};
    if (!movieId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing movieId in path parameters' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { title, description, actors, directors, genres, releaseYear } = body;

    // Convert lists to concatenated strings
    const actorsString = Array.isArray(actors) ? actors.join(', ') : '';
    const directorsString = Array.isArray(directors) ? directors.join(', ') : '';
    const genresString = Array.isArray(genres) ? genres.join(', ') : '';

    const updateParams = {
      TableName: tableName,
      Key: {
        movieId: { S: movieId },  // Ensure this matches your table's primary key schema
      },
      UpdateExpression: 'SET title = :title, description = :description, actors = :actors, directors = :directors, genres = :genres, releaseYear = :releaseYear',
      ExpressionAttributeValues: {
        ':title': { S: title || '' },
        ':description': { S: description || '' },
        ':actors': { S: actorsString },
        ':directors': { S: directorsString },
        ':genres': { S: genresString },
        ':releaseYear': { N: releaseYear?.toString() || '0' },
      },
    };

    await dynamoDbClient.send(new UpdateItemCommand(updateParams));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Updated metadata for video with ID ${movieId}` }),
    };
  } catch (error) {
    console.error('Error updating video metadata:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to update video metadata', error }),
    };
  }
};
