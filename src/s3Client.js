const { S3Client } = require('@aws-sdk/client-s3');
const config = require('./config');

// Configure the S3 client with your DigitalOcean Spaces credentials
const s3Client = new S3Client(config.s3Client);

module.exports = s3Client;
