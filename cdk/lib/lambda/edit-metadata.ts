import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const region = process.env.REGION!;
const dynamoDbClient = new DynamoDBClient({ region: region });
const tableName = process.env.TABLE_NAME!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { movieId } = event.pathParameters || {};
    if (!movieId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing movieId in path parameters' }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Request body is empty' }),
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

    // Build the update expression and expression attribute values dynamically
    let updateExpression = 'SET';
    const expressionAttributeValues: { [key: string]: any } = {};

    if (title !== undefined) {
      updateExpression += ' title = :title,';
      expressionAttributeValues[':title'] = { S: title };
    }
    if (description !== undefined) {
      updateExpression += ' description = :description,';
      expressionAttributeValues[':description'] = { S: description };
    }
    if (actors !== undefined) {
      updateExpression += ' actors = :actors,';
      expressionAttributeValues[':actors'] = { S: Array.isArray(actors) ? actors.join(', ') : '' };
    }
    if (directors !== undefined) {
      updateExpression += ' directors = :directors,';
      expressionAttributeValues[':directors'] = { S: Array.isArray(directors) ? directors.join(', ') : '' };
    }
    if (genres !== undefined) {
      updateExpression += ' genres = :genres,';
      expressionAttributeValues[':genres'] = { S: Array.isArray(genres) ? genres.join(', ') : '' };
    }
    if (releaseYear !== undefined) {
      updateExpression += ' releaseYear = :releaseYear,';
      expressionAttributeValues[':releaseYear'] = { N: releaseYear.toString() };
    }
    if (fileType !== undefined) {
      updateExpression += ' fileType = :fileType,';
      expressionAttributeValues[':fileType'] = { S: fileType };
    }
    if (fileSize !== undefined) {
      updateExpression += ' fileSize = :fileSize,';
      expressionAttributeValues[':fileSize'] = { N: fileSize.toString() };
    }
    if (creationTime !== undefined) {
      updateExpression += ' creationTime = :creationTime,';
      expressionAttributeValues[':creationTime'] = { S: creationTime };
    }
    if (lastModifiedTime !== undefined) {
      updateExpression += ' lastModifiedTime = :lastModifiedTime,';
      expressionAttributeValues[':lastModifiedTime'] = { S: lastModifiedTime };
    }

    // Remove the trailing comma from the update expression
    updateExpression = updateExpression.slice(0, -1);

    if (Object.keys(expressionAttributeValues).length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Request body does not contain any updatable fields' }),
      };
    }

    const updateParams = {
      TableName: tableName,
      Key: {
        movieId: { S: movieId },
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    };

    await dynamoDbClient.send(new UpdateItemCommand(updateParams));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Updated metadata for video with ID ${movieId}` }),
    };
  } catch (error) {
    console.error('Error updating video metadata:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to update video metadata', error }),
    };
  }
};
