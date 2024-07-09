import {
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const REGION = process.env.REGION!;
const TABLE_NAME = process.env.TABLE_NAME!;
const DYNAMO_DB = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: REGION }),
);

interface QueryParams {
  TableName: string;
  Limit: number;
  ExclusiveStartKey?: Record<string, unknown>;
  FilterExpression?: string;
  ExpressionAttributeValues?: Record<string, string | number>;
  IndexName?: string;
  KeyConditionExpression?: string;
}

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const { title, actors, directors, genres, releaseYear, limit, lastKey } =
    event.queryStringParameters || {};

  const params: QueryParams = {
    TableName: TABLE_NAME,
    Limit: limit ? Number(limit) : 7,
    ExclusiveStartKey: lastKey ? JSON.parse(lastKey) : undefined,
  };

  const filterConditions: string[] = [];
  const expressionAttributeValues: Record<string, string | number> = {};

  if (title) {
    filterConditions.push('contains(title, :title)');
    expressionAttributeValues[':title'] = title;
  }
  if (actors) {
    const actorsArray = actors.split(',');
    actorsArray.forEach((actor, index) => {
      filterConditions.push(`contains(actors, :actor${index})`);
      expressionAttributeValues[`:actor${index}`] = actor.trim();
    });
  }
  if (directors) {
    const directorsArray = directors.split(',');
    directorsArray.forEach((director, index) => {
      filterConditions.push(`contains(directors, :director${index})`);
      expressionAttributeValues[`:director${index}`] = director.trim();
    });
  }
  if (genres) {
    const genresArray = genres.split(',');
    genresArray.forEach((genre, index) => {
      filterConditions.push(`contains(genres, :genre${index})`);
      expressionAttributeValues[`:genre${index}`] = genre.trim();
    });
  }
  if (releaseYear) {
    filterConditions.push('releaseYear = :releaseYear');
    expressionAttributeValues[':releaseYear'] = Number(releaseYear);
    params.IndexName = 'releaseYearIndex';
    params.KeyConditionExpression = 'releaseYear = :releaseYear';
  }

  if (filterConditions.length > 0) {
    params.FilterExpression = filterConditions.join(' AND ');
    params.ExpressionAttributeValues = expressionAttributeValues;
  }

  try {
    const data =
      filterConditions.length > 0
        ? releaseYear
          ? await DYNAMO_DB.send(new QueryCommand(params))
          : await DYNAMO_DB.send(new ScanCommand(params))
        : await DYNAMO_DB.send(
            new ScanCommand({
              ...params,
              FilterExpression: undefined,
              ExpressionAttributeValues: undefined,
            }),
          );

    const items =
      data.Items?.map((item) => ({
        movieId: item.movieId,
        title: item.title,
        genres: item.genres.split(', '),
        actors: item.actors.split(', '),
        directors: item.directors.split(', '),
        releaseYear: item.releaseYear,
      })) || [];

    return {
      statusCode: 200,
      body: JSON.stringify({
        items,
        lastKey: data.LastEvaluatedKey,
      }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to search metadata',
        error: (error as Error).message,
      }),
    };
  }
};
