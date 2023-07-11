import {Duration, Fn, RemovalPolicy, Stack} from "aws-cdk-lib";

import {
  aws_s3 as s3,
  aws_lambda as lambda,
  aws_iam as iam,
  aws_apigateway as apigateway,
} from "aws-cdk-lib";

import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";

class LooplendFileUploaderStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // target bucket
    const bucket = new s3.Bucket(this, 'looplend-file-uploader-bucket', {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.POST,
            s3.HttpMethods.PUT,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
      lifecycleRules: [
        {
          expiration: Duration.days(1),
          prefix: 'tmp/'
        }]
    });
    const authorizer = lambda.Function.fromFunctionArn(this, 'authorizer-fn', Fn.importValue("authorizerArn"));

    // rest api to generate upload presigned url
    const api = new apigateway.RestApi(this, 'looplend-file-uploader-api', {
      restApiName: 'looplend-file-uploader-api',
      description: 'This service generates presigned url for upload',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
        allowCredentials: true,
      },
    });
    const uploadResource = api.root.addResource('uploads');
    const tokenAuth = new apigateway.TokenAuthorizer(this, 'authorizer', {
      handler: authorizer,
      identitySource: 'method.request.header.Authorization',
    });
    uploadResource.addMethod('POST', new apigateway.LambdaIntegration(createUploadHandler(this, bucket.bucketName)), {
      authorizer: tokenAuth
    });
  }
}

function createUploadHandler(stack, bucketName) {
  return new NodejsFunction(stack, 'upload-handler', {
    entry: 'methods/upload.js',
    handler: 'createUpload',
    runtime: lambda.Runtime.NODEJS_18_X,
    initialPolicy: [
      new iam.PolicyStatement({actions: ['s3:*'], resources: ['*']}),
    ],
    environment: {
      BUCKET_NAME: bucketName,
    },
  });
}

export default LooplendFileUploaderStack;
