const https = require('https');

const AWS = require('aws-sdk');

const s3 = new AWS.S3({apiVersion: '2006-03-01'});

const Base64 = require('js-base64').Base64;

exports.handler = (event, context, callback) => {
	var data = 'client_secret=' + process.env.clientSecret + '&grant_type=refresh_token&refresh_token=' + process.env.refreshToken + '&client_id=' + process.env.clientId;

	var options = {
		hostname: 'www.googleapis.com',
		path: '/oauth2/v4/token',
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		}
	};

	var request = https.request(options, (response) => {
		var body = '';

		response.on('data', (data) => {
			body += data;
		});

		response.on('end', () => {

			var params = {
				Bucket: '', //TODO: Get bucket name from SNS
				Key: JSON.parse(event.Records[0].Sns.Message).receipt.action.objectKey
			};

			s3.getObject(params, (error, data) => {
				if (error) {
					callback(error);
				}
				else {
					var options = {
						hostname: 'www.googleapis.com',
						path: '/gmail/v1/users/me/messages/import?access_token=' + JSON.parse(body).access_token,
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						}
					};

					var request = https.request(options, (response) => {
						//var body = '';

						//response.on('data', (data) => {
						//	body += data;
						//});

						//response.on('end', () => {
						//	console.log(body);
						//});
					});

					request.write(JSON.stringify({
						"labelIds": [
							"UNREAD",
							"INBOX"
						],
						"raw": Base64.encodeURI(data.Body)
					}));

					request.end();
				}
			});
		});
	});

	request.write(data);
	request.end();
}
