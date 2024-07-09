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
const RATING_TABLE = process.env.RATING_TABLE!;
const SUBSCRIPTIONS_TABLE = process.env.SUBSCRIPTIONS_TABLE!;
const DOWNLOADS_TABLE = process.env.DOWNLOADS_TABLE!;

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

interface UserData {
  ratings: Array<{ movie_id: string; rating: string }>;
  subscriptions: Array<{ topic: string }>;
  downloads: Array<{ movie_id: string }>;
}

interface ContentItem {
  movieId: string;
  title: string;
  genres: string;
  actors: string;
  directors: string;
  releaseYear: number;
  rating?: number;
}

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const username = event.username;
  const email = event.email;

  if (!username || !email) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Missing username or email in request context',
      }),
    };
  }

  const userData = await getUserData(username, email);
  if (!userData) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error fetching user data',
      }),
    };
  }

  const feed = await rankContent(userData);

  const putRequests: WriteRequest[] = feed.map((item) => ({
    PutRequest: {
      Item: {
        username,
        movie_id: item.movieId,
        title: item.title,
        genres: item.genres,
        actors: item.actors,
        directors: item.directors,
        releaseYear: item.releaseYear,
      },
    },
  }));

  const chunkSize = 25;
  const chunks = [];
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

const getUserData = async (
  username: string,
  email: string,
): Promise<UserData | null> => {
  try {
    const ratingsParams = {
      TableName: RATING_TABLE,
      KeyConditionExpression: 'username = :username',
      ExpressionAttributeValues: {
        ':username': username,
      },
    };
    const ratingsResult = await docClient.send(new QueryCommand(ratingsParams));
    const ratings =
      (ratingsResult.Items as Array<{ movie_id: string; rating: string }>) ||
      [];

    const subscriptionsParams = {
      TableName: SUBSCRIPTIONS_TABLE,
      IndexName: 'emailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    };
    const subscriptionsResult = await docClient.send(
      new QueryCommand(subscriptionsParams),
    );
    const subscriptions =
      (subscriptionsResult.Items as Array<{ topic: string }>) || [];

    const downloadsParams = {
      TableName: DOWNLOADS_TABLE,
      KeyConditionExpression: 'username = :username',
      ExpressionAttributeValues: {
        ':username': username,
      },
    };
    const downloadsResult = await docClient.send(
      new QueryCommand(downloadsParams),
    );
    const downloads =
      (downloadsResult.Items as Array<{ movie_id: string }>) || [];

    return { ratings, subscriptions, downloads };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

const rankContent = async (userData: UserData): Promise<ContentItem[]> => {
  const { ratings, subscriptions, downloads } = userData;
  const rankedContent: ContentItem[] = [];

  try {
    const contentResult = await docClient.send(
      new ScanCommand({ TableName: CONTENT_METADATA_TABLE }),
    );
    const contentItems = (contentResult.Items as ContentItem[]) || [];

    const ratingMap = new Map<string, string>();
    ratings.forEach((rating) => {
      ratingMap.set(rating.movie_id, rating.rating);
    });

    const subscriptionTopics = new Set(
      subscriptions.map((subscription) => subscription.topic),
    );
    const downloadSet = new Set(downloads.map((download) => download.movie_id));

    contentItems.forEach((item) => {
      const isSubscribed =
        item.genres
          .split(', ')
          .some((genre) => subscriptionTopics.has(genre)) ||
        item.actors
          .split(', ')
          .some((actor) => subscriptionTopics.has(actor)) ||
        item.directors
          .split(', ')
          .some((director) => subscriptionTopics.has(director));

      const isDownloaded = downloadSet.has(item.movieId);
      const rating = ratingMap.get(item.movieId);

      if (isSubscribed || isDownloaded || rating) {
        rankedContent.push({
          ...item,
          rating: rating
            ? rating === 'love'
              ? 5
              : rating === 'like'
                ? 3
                : 1
            : 0,
        });
      }
    });

    rankedContent.sort(
      (a, b) =>
        (b.rating || 0) - (a.rating || 0) || b.releaseYear - a.releaseYear,
    );
    return rankedContent.slice(0, 10); // Limit to top 10
  } catch (error) {
    console.error('Error ranking content:', error);
    return [];
  }
};
