import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';


const REGION = process.env.REGION!;
const tableName = process.env.TABLE_NAME!;
const TOPIC_ARN = process.env.TOPIC_ARN!;

const client = new DynamoDBClient({ region: REGION });
const dynamoDb = DynamoDBDocumentClient.from(client);
const sns = new SNSClient({ region: REGION });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  if (!event.pathParameters || !event.pathParameters.movieId) {
    return {
      statusCode: 400,
      body: JSON.stringify({message: "Missing movieId in path parameters"}),
    };
  }

  const movieId = event.pathParameters.movieId;

  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid input' }),
    };
  }

  const body = JSON.parse(event.body);

  const {
    title,
    description,
    actors,
    directors,
    genres,
    releaseYear,
    fileType,
    fileSize,
    creationTime,
    lastModifiedTime
  } = body;

  // Convert lists to concatenated strings
  const actorsString = Array.isArray(actors) ? actors.join(', ') : '';
  const directorsString = Array.isArray(directors) ? directors.join(', ') : '';
  const genresString = Array.isArray(genres) ? genres.join(', ') : '';

  try {


    const metadata = {
      movieId,
      title,
      description,
      actors: actorsString,
      directors: directorsString,
      genres: genresString,
      releaseYear: releaseYear,
      fileType,
      fileSize,
      creationTime,
      lastModifiedTime,
    };

    const params = {
      TableName: tableName,
      Item: metadata
    };

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
