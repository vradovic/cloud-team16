import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { SQSEvent, SQSHandler, SQSRecord } from 'aws-lambda';

interface IMetadata {
  title: string;
  description: string;
  actors: string[];
  directors: string[];
  genres: string[];
}

const REGION = process.env.REGION!;
const TABLE_NAME = process.env.TABLE_NAME!;
const SOURCE_EMAIL = process.env.SOURCE_EMAIL!;

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);
const ses = new SESClient({ region: REGION });

// eslint-disable-next-line
const isMetadata = (obj: any): obj is IMetadata => {
  return (
    'title' in obj &&
    'description' in obj &&
    'actors' in obj &&
    'directors' in obj &&
    'genres' in obj
  );
};

export const handler: SQSHandler = (event: SQSEvent): void => {
  for (const message of event.Records) {
    console.log(message);
    handleMessage(message);
  }
};

const handleMessage = async (message: SQSRecord) => {
  const body = JSON.parse(message.body);
  if (!isMetadata(body)) {
    return;
  }

  const topics = [...body.actors, ...body.directors, ...body.genres];
  const recipients: string[] = [];

  for (const topic of topics) {
    const params: QueryCommandInput = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'topic = :topic',
      ExpressionAttributeValues: {
        ':topic': topic,
      },
    };

    const result = await docClient.send(new QueryCommand(params));
    const emails: string[] = result.Items?.map((item) => item.email) ?? [];
    recipients.push(...emails);
  }

  if (recipients.length <= 0) {
    return;
  }

  const emailMessage = getMessage(body);
  await sendEmails(recipients, emailMessage);
  console.log('Emails sent');
};

const sendEmails = async (recipients: string[], message: string) => {
  const command = new SendEmailCommand({
    Destination: {
      ToAddresses: recipients,
    },
    Message: {
      Subject: {
        Data: 'New content is out!',
      },
      Body: {
        Html: {
          Data: message,
        },
      },
    },
    Source: SOURCE_EMAIL,
  });

  try {
    const result = await ses.send(command);
    console.log('Received');
    console.log(result);
  } catch (error) {
    console.error('Unable to send email: ', error);
  }
};

const getMessage = (metadata: IMetadata) => `
<html>
  <body>
    <p>Based on your subscription, we are notifying you about the following release:</p>
    <h1>${metadata.title}</h1>
    <p>${metadata.description}</p>
    <h2>Genres</h2>
    <p>${metadata.genres}</p>
    <h2>Directors</h2>
    <p>${metadata.directors}</p>
    <h2>Actors</h2>
    <p>${metadata.actors}</p>
  </body>
</html>
`;
