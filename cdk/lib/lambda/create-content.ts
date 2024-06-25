import { PutItemCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  const dynamodb_client = new DynamoDBClient({ region: 'eu-central-1' });

  if (!event.body) {
    return {
      statusCode: 400,
      body: 'Missing metadata',
    };
  }
  const data = JSON.parse(event.body);

  const params = {
    TableName: 'ContentMetadata',
    Item: {
      Id: { S: data.Id },
      ContentTitle: { S: data.ContentTitle },
      Description: { S: data.Description },
      Actors: { L: data.Actors.map((actor: string) => ({ S: actor })) },
      Directors: {
        L: data.Directors.map((director: string) => ({ S: director })),
      },
      Genres: { L: data.Genres.map((genre: string) => ({ S: genre })) },
    },
  };

  await dynamodb_client.send(new PutItemCommand(params));
  return {
    statusCode: 201,
    headers: {},
    body: 'Uploaded to db',
  };
};
