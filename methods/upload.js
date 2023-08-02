import AWS from "aws-sdk";

export async function createUpload(event, context) {
	// create preSigned upload link for s3
	// return url
	const s3 = new AWS.S3();
	const bucketName = process.env.BUCKET_NAME;
	const {name, type} = JSON.parse(event.body);
	const key = `uploads/${name}`;

	const params = {
		Bucket: bucketName,
		Key: key,
		Expires: 5 * 60,
		ContentType: type,
		ACL: 'public-read',
	};

	const url = await s3.getSignedUrlPromise('putObject', params);

	return {
		statusCode: 200,
		body: JSON.stringify({
			url,
		}),
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Credentials': true,
			'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS,POST,PUT',
			'Access-Control-Allow-Headers': '*'
		}
	}
}
