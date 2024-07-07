import {
  AdminAddUserToGroupCommand,
  AdminAddUserToGroupCommandInput,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  PostConfirmationTriggerEvent,
  PostConfirmationTriggerHandler,
} from 'aws-lambda';

const REGION = process.env.REGION!;

const cognito = new CognitoIdentityProviderClient({ region: REGION });

export const handler: PostConfirmationTriggerHandler = async (
  event: PostConfirmationTriggerEvent,
) => {
  const { userPoolId, userName } = event;
  const group = 'users';

  const input: AdminAddUserToGroupCommandInput = {
    GroupName: group,
    Username: userName,
    UserPoolId: userPoolId,
  };

  try {
    await cognito.send(new AdminAddUserToGroupCommand(input));
    console.log(`Added ${userName} to group ${group}`);
  } catch (error) {
    console.error('Failed to add user to group');
  }
};
