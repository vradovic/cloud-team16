import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';


const REGION = process.env.REGION!;
const tableName = process.env.TABLE_NAME!;
const TOPIC_ARN = process.env.TOPIC_ARN!;

const client = new DynamoDBClient({ region: REGION });
const dynamoDb = DynamoDBDocumentClient.from(client);
const sns = new SNSClient({ region: REGION });

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

  const metadata = body;



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

    const result = await sns.send(
      new PublishCommand({
        Message: JSON.stringify(metadata),
        TopicArn: TOPIC_ARN,
      }),
    );
    console.log(result);

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'Video metadata saved successfully!',
        data: metadata,
      }),
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
