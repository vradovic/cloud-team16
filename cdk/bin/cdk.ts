#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth-stack';
import { ApiStack } from '../lib/api-stack';
import { StorageStack } from '../lib/storage-stack';
import { getConfig } from '../lib/config';

const config = getConfig();

const app = new cdk.App();

const authStack = new AuthStack(app, 'AuthStack', {
  poolName: config.POOL_NAME,
  domainName: config.DOMAIN_NAME,
  domainPrefix: config.DOMAIN_PREFIX,
});

const storageStack = new StorageStack(app, 'StorageStack');

new ApiStack(app, 'ApiStack', {
  contentBucket: storageStack.contentBucket,
  contentMetadataTable: storageStack.contentMetadataTable,
  subscriptionsTable: storageStack.subscriptionsTable,
  userPool: authStack.userPool,
  ratingTable: storageStack.ratingTable,
  sourceEmail: config.SOURCE_EMAIL,
  userPoolClient: authStack.userPoolClient,
});
