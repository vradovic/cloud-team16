import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
  BatchWriteCommand,
  WriteRequest,
} from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const REGION = process.env.REGION!;
const USER_FEED_TABLE = process.env.USER_FEED_TABLE!;
const CONTENT_METADATA_TABLE = process.env.CONTENT_METADATA_TABLE!;

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  let username: string | undefined;
  try {
    username = event.requestContext.authorizer?.username;
    console.log('Username:', username);
  } catch (error) {
    console.error('Error retrieving authorizer context:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid request context' }),
    };
  }

  if (!username) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing username in request context' }),
    };
  }

  // Check if the user feed already has items
  const userFeedParams = {
    TableName: USER_FEED_TABLE,
    KeyConditionExpression: 'username = :username',
    ExpressionAttributeValues: {
      ':username': username,
    },
  };

  let userFeedResult;
  try {
    userFeedResult = await docClient.send(new QueryCommand(userFeedParams));
    console.log('User feed query result:', userFeedResult);
  } catch (error) {
    console.error('Error querying user feed table:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error querying user feed table',
      }),
    };
  }

  if (userFeedResult.Count && userFeedResult.Count > 0) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'User feed already populated' }),
    };
  }

  // Fetch all content metadata
  const contentParams = {
    TableName: CONTENT_METADATA_TABLE,
  };

  let contentResult;
  try {
    contentResult = await docClient.send(new ScanCommand(contentParams));
    console.log('Content metadata scan result:', contentResult);
  } catch (error) {
    console.error('Error scanning content metadata table:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error scanning content metadata table',
      }),
    };
  }

  const contentItems = contentResult.Items || [];
  if (contentItems.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'No content metadata found' }),
    };
  }

  // Extract the first 10 movieId values
  const movieIds = contentItems
    .slice(0, 10)
    .map((item: { movieId: string }) => item.movieId);

  // Prepare batch write requests to insert each movie ID into the user feed table
  const putRequests: WriteRequest[] = movieIds.map((movieId: string) => ({
    PutRequest: {
      Item: {
        username,
        movie_id: movieId,
      },
    },
  }));

  const chunkSize = 25;
  const chunks: WriteRequest[][] = [];
  for (let i = 0; i < putRequests.length; i += chunkSize) {
    chunks.push(putRequests.slice(i, i + chunkSize));
  }

  try {
    for (const chunk of chunks) {
      const batchWriteParams = {
        RequestItems: {
          [USER_FEED_TABLE]: chunk,
        },
      };
      const batchWriteResult = await docClient.send(
        new BatchWriteCommand(batchWriteParams),
      );
      console.log('Batch write result:', batchWriteResult);

      if (
        batchWriteResult.UnprocessedItems &&
        Object.keys(batchWriteResult.UnprocessedItems).length > 0
      ) {
        console.warn('Unprocessed items:', batchWriteResult.UnprocessedItems);
        // Retry logic for unprocessed items can be added here
      }
    }
  } catch (error) {
    console.error('Error batch writing to user feed table:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error writing to user feed table',
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'User feed populated successfully' }),
  };
};
