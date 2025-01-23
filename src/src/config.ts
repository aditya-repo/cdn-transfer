import dotenv from "dotenv"
dotenv.config()

export default {
    s3Client: {
        region: process.env.DATAREGION as string,
        endpoint: process.env.ENDPOINT as string,
        credentials: {
            accessKeyId: process.env.ACCESS_KEY as string,
            secretAccessKey: process.env.SECRET_KEY as string,
        },
    },
    bucketName: process.env.BUCKETNAME as string,
};
