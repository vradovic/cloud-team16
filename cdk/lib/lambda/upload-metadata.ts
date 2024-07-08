import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  ScanCommand,
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

  let username;
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

  // Check if the user feed is empty
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

  if (userFeedResult.Count > 0) {
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

  // Write each item to the user feed table
  try {
    for (const item of contentItems) {
      const putParams = {
        TableName: USER_FEED_TABLE,
        Item: {
          username,
          movie_id: item.movieId,
          ...item,
        },
      };
      await docClient.send(new PutCommand(putParams));
    }
  } catch (error) {
    console.error('Error writing to user feed table:', error);
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
