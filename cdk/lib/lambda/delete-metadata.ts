import { DynamoDBClient, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { APIGatewayProxyHandler } from 'aws-lambda';

const REGION = process.env.REGION!;
const TABLE_NAME = process.env.TABLE_NAME!;

const dynamoDBClient = new DynamoDBClient({ region: REGION });

export const handler: APIGatewayProxyHandler = async (event) => {
  const movieId = event.pathParameters?.movieId;

  if (!movieId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing movie ID' }),
    };
  }

  try {
    await deleteMovie(movieId);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Movie with ID ${movieId} deleted successfully.`,
      }),
    };
  } catch (error) {
    console.error(`Error deleting movie with ID ${movieId}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};

async function deleteMovie(movieId: string) {
  await deleteFromDynamoDB(movieId);
}

async function deleteFromDynamoDB(movieId: string) {
  const deleteItemCommand = new DeleteItemCommand({
    TableName: TABLE_NAME,
    Key: {
      movieId: { S: movieId },
    },
  });

  await dynamoDBClient.send(deleteItemCommand);
  console.log(`Deleted movie from DynamoDB with ID: ${movieId}`);
}
