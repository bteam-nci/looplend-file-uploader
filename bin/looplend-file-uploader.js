#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { LooplendFileUploaderStack } = require('../lib/looplend-file-uploader-stack');
const env = { account: '925477059004', region: 'eu-west-1' }

const app = new cdk.App();
new LooplendFileUploaderStack(app, 'looplend-file-uploader', {
	env
});
