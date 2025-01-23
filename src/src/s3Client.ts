import { S3Client } from '@aws-sdk/client-s3';
import config from './config';

// Configure the S3 client with your DigitalOcean Spaces credentials
const s3Client = new S3Client(config.s3Client);

export default s3Client;
