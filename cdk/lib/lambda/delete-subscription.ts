import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DeleteCommand,
  DeleteCommandInput,
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const REGION = process.env.REGION!;
const TABLE_NAME = process.env.TABLE_NAME!;

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    let topic = event.pathParameters?.topic;
    if (!topic) {
      return {
        statusCode: 400,
        body: 'Missing topic name',
      };
    }

    topic = decodeURI(topic);

    const email = event.requestContext.authorizer?.email;
    if (!email) {
      return {
        statusCode: 400,
        body: 'Missing email',
      };
    }

    const params: DeleteCommandInput = {
      TableName: TABLE_NAME,
      Key: {
        topic,
        email,
      },
    };

    const dynamoResponse = await docClient.send(new DeleteCommand(params));

    let response: APIGatewayProxyResult;
    if (dynamoResponse.$metadata.httpStatusCode === 200) {
      response = {
        statusCode: 204,
        body: '',
      };
    } else {
      response = {
        statusCode: 400,
        body: 'Could not delete item',
      };
    }

    return response;
  } catch (error) {
    console.error('Error deleting item: ', error);

    return {
      statusCode: 500,
      body: 'Internal server error',
    };
  }
};
