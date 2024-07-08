import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const REGION = process.env.REGION!;
const DOWNLOADS_TABLE = process.env.DOWNLOADS_TABLE!;
const UPDATE_FEED_FUNCTION = process.env.UPDATE_FEED_FUNCTION!;

const docClient = new DynamoDB.DocumentClient();
const lambdaClient = new LambdaClient({ region: REGION });

export const handler: APIGatewayProxyHandler = async (event) => {
  const username = event.requestContext.authorizer?.username;
  const email = event.requestContext.authorizer?.email;
  const movieId = event.pathParameters?.movieId;

  if (!username || !email || !movieId) {
    return {
      statusCode: 400,
      body: 'Missing username, email, or movieId',
    };
  }

  // Log the download
  const params = {
    TableName: DOWNLOADS_TABLE,
    Item: {
      username,
      movie_id: movieId,
      timestamp: new Date().toISOString(),
    },
  };

  try {
    await docClient.put(params).promise();
  } catch (error) {
    console.error('Error logging download: ', error);
    return {
      statusCode: 500,
      body: 'Internal server error',
    };
  }

  // Trigger the feed update function
  const updateParams = {
    FunctionName: UPDATE_FEED_FUNCTION,
    InvocationType: 'Event',
    Payload: JSON.stringify({ username, email }),
  };

  try {
    await lambdaClient.send(new InvokeCommand(updateParams));
  } catch (error) {
    console.error('Error invoking update feed function: ', error);
    return {
      statusCode: 500,
      body: 'Internal server error',
    };
  }

  return {
    statusCode: 200,
    body: 'Download logged and feed update triggered',
  };
};
