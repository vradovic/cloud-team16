import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { CognitoIdTokenPayload } from 'aws-jwt-verify/jwt-model';
import {
  APIGatewayAuthorizerResult,
  APIGatewayTokenAuthorizerEvent,
  APIGatewayTokenAuthorizerHandler,
  PolicyDocument,
} from 'aws-lambda';

const USER_POOL_ID = process.env.USER_POOL_ID!;
const CLIENT_ID = process.env.CLIENT_ID!;

const verifier = CognitoJwtVerifier.create({
  userPoolId: USER_POOL_ID,
  tokenUse: 'id',
  clientId: CLIENT_ID,
});

type TGroup = 'users' | 'admins' | 'test';

const paths: Record<TGroup, RegExp[]> = {
  users: [],
  admins: [],
  test: [/GET\/media\/.+\/content/],
};

const isAuthorized = (methodArn: string, groups: TGroup[]): boolean => {
  for (const group of groups) {
    if (
      paths[group].some((path) => {
        console.log(`Testing ${path}`);
        path.test(methodArn);
      })
    ) {
      return true;
    }
  }

  return false;
};

const generatePolicy = (
  effect: 'Allow' | 'Deny',
  resource: string,
): PolicyDocument => {
  return {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: resource,
      },
    ],
  };
};

const isValidGroup = (value: string): value is TGroup => {
  return value === 'users' || value === 'admins' || value === 'test';
};

export const handler: APIGatewayTokenAuthorizerHandler = async (
  event: APIGatewayTokenAuthorizerEvent,
): Promise<APIGatewayAuthorizerResult> => {
  const { authorizationToken, methodArn } = event;
  console.log('Arn: ', methodArn);
  console.log('User pool id: ', USER_POOL_ID);
  console.log('Client id: ', CLIENT_ID);
  console.log('Token: ', authorizationToken);

  let payload: CognitoIdTokenPayload;
  try {
    payload = await verifier.verify(authorizationToken);
  } catch (error) {
    console.error(error);
    throw new Error('Unauthorized');
  }

  const sub = payload.sub;

  const groups = payload['cognito:groups'];
  if (!groups) {
    console.log('No groups');
    return {
      principalId: sub,
      policyDocument: generatePolicy('Deny', methodArn),
    };
  }

  if (groups.some((group) => !isValidGroup(group))) {
    console.log('One of the groups is invalid');
    return {
      principalId: sub,
      policyDocument: generatePolicy('Deny', methodArn),
    };
  }

  if (isAuthorized(methodArn, groups as TGroup[])) {
    console.log('Authorized');
    return {
      principalId: sub,
      policyDocument: generatePolicy('Allow', methodArn),
    };
  } else {
    console.log('Not authorized');
    return {
      principalId: sub,
      policyDocument: generatePolicy('Deny', methodArn),
    };
  }
};
