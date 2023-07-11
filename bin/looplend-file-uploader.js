#!/usr/bin/env node
import cdk from "aws-cdk-lib";
import {LooplendFileUploaderStack} from "../lib/looplend-file-uploader-stack";

const env = { account: '925477059004', region: 'eu-west-1' }

const app = new cdk.App();
new LooplendFileUploaderStack(app, 'looplend-file-uploader', {
	env
});
