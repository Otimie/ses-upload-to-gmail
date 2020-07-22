const https = require('https');

const AWS = require('aws-sdk');

const s3 = new AWS.S3({apiVersion: '2006-03-01'});

const Base64 = require('js-base64').Base64;

exports.handler = (event, context, callback) => {
	var data = 'client_secret=' + process.env.clientSecret + '&grant_type=refresh_token&refresh_token=' + process.env.refreshToken + '&client_id=' + process.env.clientId;

	var options = {
		hostname: 'oauth2.googleapis.com',
		path: '/token',
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
			Promise.all(event.Records.map((currentValue) => {
				return new Promise((resolve, reject) => {
					var params = {
						Bucket: JSON.parse(currentValue.Sns.Message).receipt.action.bucketName,
						Key: JSON.parse(currentValue.Sns.Message).receipt.action.objectKey
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

								response.on('end', () => {
									resolve();
								});
							});
							
							request.write(JSON.stringify({
								'labelIds': [
									'UNREAD',
									'INBOX'
								],
								'raw': Base64.encodeURI(data.Body)
							}));
							
							request.end();
						}
					});
				});
			})).then(() => {
				callback(null);
			});
		});
	});
	request.write(data);
	request.end();
};
