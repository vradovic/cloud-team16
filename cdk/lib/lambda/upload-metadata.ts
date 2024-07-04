import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const REGION = process.env.REGION!;
const client = new DynamoDBClient({ region: REGION });
const dynamoDb = DynamoDBDocumentClient.from(client);
const tableName = process.env.TABLE_NAME;

exports.handler = async (event: any) => {
  const body = JSON.parse(event.body);
  const { videoId, title, description, actors, directors, genres, releaseYear } = body;

  const params = {
    TableName: tableName!,
    Item: {
      videoId,
      title,
      description,
      actors,
      directors,
      genres,
      releaseYear,
    },
  };

  try {
    await dynamoDb.send(new PutCommand(params));
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Video metadata saved successfully!',
        data: params.Item,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to save video metadata.', error }),
    };
  }
};
