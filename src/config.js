require("dotenv").config()

module.exports = {
    s3Client: {
        region: process.env.DATAREGION,
        endpoint: process.env.ENDPOINT,
        credentials: {
            accessKeyId: process.env.ACCESS_KEY,
            secretAccessKey: process.env.SECRET_KEY,
        },
    },
    bucketName: process.env.BUCKETNAME,
};
