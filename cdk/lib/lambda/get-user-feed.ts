import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  GetCommand,
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

  // Retrieve the list of movie IDs from the user's feed table
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

  const movieIds = userFeedResult.Items?.map((item) => item.movie_id) || [];
  if (movieIds.length === 0) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'No movies found in user feed',
        movies: [],
      }),
    };
  }

  // Fetch the metadata for each movie ID
  const movieMetadataPromises = movieIds.map(async (movieId) => {
    const getMovieParams = {
      TableName: CONTENT_METADATA_TABLE,
      Key: { movieId },
    };

    try {
      const movieResult = await docClient.send(new GetCommand(getMovieParams));
      if (movieResult.Item) {
        return {
          movieId,
          title: movieResult.Item.title,
          genres: movieResult.Item.genres.split(', '),
          actors: movieResult.Item.actors.split(', '),
          directors: movieResult.Item.directors.split(', '),
        };
      } else {
        console.warn(`Movie with ID ${movieId} not found`);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching metadata for movie ID ${movieId}:`, error);
      return null;
    }
  });

  const moviesMetadata = await Promise.all(movieMetadataPromises);
  const filteredMoviesMetadata = moviesMetadata.filter(
    (movie) => movie !== null,
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ movies: filteredMoviesMetadata }),
  };
};
