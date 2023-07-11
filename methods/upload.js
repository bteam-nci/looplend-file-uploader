import AWS from "aws-sdk";

export async function createUpload(event, context) {
	// create preSigned upload link for s3
	// return url
	const s3 = new AWS.S3();
	const bucketName = process.env.BUCKET_NAME;
	const name = JSON.parse(event.body).name;
	const key = `uploads/${name}`;

	const params = {
		Bucket: bucketName,
		Key: key,
		Expires: 5 * 60,
		ContentType: 'application/octet-stream',
		ACL: 'public-read',
	};

	const url = await s3.getSignedUrlPromise('putObject', params);

	return {
		statusCode: 200,
		body: JSON.stringify({
			url,
		})
	}
}
