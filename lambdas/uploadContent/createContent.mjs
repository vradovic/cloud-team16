import { PutItemCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";

export const handler = async (event) => {
  const dynamodb_client = new DynamoDBClient({"region": "eu-central-1"});

  const data = JSON.parse(event.body);

  const params = {
    TableName: "ContentMetadata",
    Item: {
      Id: { S: data.Id },
      ContentTitle: {S: data.ContentTitle},
      Description: {S: data.Description},
      Actors: { L: data.Actors.map(actor => ({ S: actor })) },
      Directors: { L: data.Directors.map(director => ({ S: director })) },
      Genres: { L: data.Genres.map(genre => ({ S: genre })) }
    },
  };

  const resp = await dynamodb_client.send(new PutItemCommand(params));
  return {
    statusCode: 201,
    headers: {},
    body: "Uploaded to db",
  };
};

