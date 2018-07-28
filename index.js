const https = require('https');

const AWS = require('aws-sdk');

const s3 = new AWS.S3({apiVersion: '2006-03-01'});

const Base64 = require('js-base64').Base64;
