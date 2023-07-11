const { Stack, Duration, RemovalPolicy, CfnParameter, Fn} = require('aws-cdk-lib');
const s3 = require('aws-cdk-lib/aws-s3');
const {Function, Runtime} = require("aws-cdk-lib/aws-lambda");
const {PolicyStatement} = require("aws-cdk-lib/aws-iam");
const {NodejsFunction} = require("aws-cdk-lib/aws-lambda-nodejs");
const {TokenAuthorizer, Cors, RestApi, LambdaIntegration} = require("aws-cdk-lib/aws-apigateway");

class LooplendFileUploaderStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    // cfn name
    const authArn = new CfnParameter(this, 'authArn', {
      type: 'String',
      description: 'The name of exported auth arn',
    });

    // target bucket
    const bucket = new s3.Bucket(this, 'looplend-file-uploader-bucket', {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
      publicReadAccess: true,
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
    const authorizer = Function.fromFunctionArn(this, 'authorizer-fn', Fn.importValue(authArn.valueAsString));

    // rest api to generate upload presigned url
    const api = new RestApi(this, 'looplend-file-uploader-api', {
      restApiName: 'looplend-file-uploader-api',
      description: 'This service generates presigned url for upload',
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: Cors.DEFAULT_HEADERS,
        allowCredentials: true,
      },
    });
    const uploadResource = api.root.addResource('uploads');
    uploadResource.addMethod('POST', new LambdaIntegration(createUploadHandler(bucket.bucketName)), {
      authorizer: new TokenAuthorizer(this, 'authorizer', {
        handler: authorizer,
        identitySource: 'method.request.header.Authorization',
      })
    });
  }
}

function createUploadHandler(bucketName) {
  return new NodejsFunction(this, 'upload-handler', {
    entry: 'methods/upload.js',
    handler: 'createUpload',
    runtime: Runtime.NODEJS_18_X,
    initialPolicy: [
      new PolicyStatement({actions: ['s3:*'], resources: ['*']}),
    ],
    environment: {
      BUCKET_NAME: bucketName,
    },
  });
}

module.exports = { LooplendFileUploaderStack }
