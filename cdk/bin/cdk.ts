#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth-stack';
import { ApiStack } from '../lib/api-stack';
import { StorageStack } from '../lib/storage-stack';

const app = new cdk.App();

const authStack = new AuthStack(app, 'AuthStack');

const storageStack = new StorageStack(app, 'StorageStack');

new ApiStack(app, 'ApiStack', {
  contentBucket: storageStack.contentBucket,
  contentMetadataTable: storageStack.contentMetadataTable,
  subscriptionsTable: storageStack.subscriptionsTable,
  userPool: authStack.userPool,
});
