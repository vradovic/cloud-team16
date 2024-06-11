import { PutItemCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

export const handler = async (event) => {
  const dynamodb_client = new DynamoDBClient({"region": "eu-central-1"});

  const params = {
    TableName: "ContentMetadata",
    Item: marshall(event)

  };

  try {
    const data = await dynamodb_client.send(new PutItemCommand(params));
    return data;
  } catch (ex) {
    console.error(ex);
  }
};


