const fs = require('fs'); // Required for file system operations
const path = require('path');
const s3Client = require('./s3Client'); // Import the S3 client
const { ListObjectsV2Command, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const getContentType = require('./contentTypes'); // Import content type function
const config = require('./config');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Function to list files and directories in the Space
const listFiles = async () => {
    try {
        const command = new ListObjectsV2Command({
            Bucket: config.bucketName, // Use the bucket name from the config
            Delimiter: '/' // This will group the results into "folders"
        });

        const data = await s3Client.send(command);

        if (data.CommonPrefixes && data.CommonPrefixes.length > 0) {
            console.log("Directories in the Space:");
            data.CommonPrefixes.forEach(prefix => {
                console.log(prefix.Prefix);
            });
        } else {
            console.log("No directories found in the Space.");
        }

        if (data.Contents && data.Contents.length > 0) {
            console.log("Files in the Space:");
            data.Contents.forEach(file => {
                console.log(file.Key);
            });
        } else {
            console.log("No files found in the Space.");
        }
    } catch (error) {
        console.error("Error listing files:", error);
    }
};

// Function to upload files from a folder to the Space
const uploadFolder = async (folderPath, basePath = '') => {
    const files = fs.readdirSync(folderPath); // Read all files in the folder

    for (const file of files) {
        const filePath = path.join(folderPath, file); // Full path of the file
        const destinationKey = path.join(basePath, file); // Key in the Space maintaining the folder structure

        if (fs.lstatSync(filePath).isDirectory()) {
            // Recursively upload folders
            await uploadFolder(filePath, destinationKey);
        } else {
            // Upload files
            await uploadFile(filePath, destinationKey);
        }
    }
};

// Function to upload a single file to the Space
const uploadFile = async (filePath, destinationKey) => {
    try {
        const fileStream = fs.createReadStream(filePath);
        const stats = fs.statSync(filePath);

        const command = new PutObjectCommand({
            Bucket: config.bucketName,
            Key: destinationKey, // The name of the file in the Space
            Body: fileStream,
            ContentType: getContentType(filePath), // Dynamically set content type
            ContentLength: stats.size // Size of the file
        });

        await s3Client.send(command);
    } catch (error) {
        console.error('Error uploading file:', error);
    }
};


// Function to download a file from S3
const downloadFile = async (s3FilePath, localDownloadPath) => {
    try {
        // Create the GetObjectCommand to fetch the file
        const command = new GetObjectCommand({
            Bucket: config.bucketName,
            Key: s3FilePath // File path in the S3 bucket
        });

        const data = await s3Client.send(command);

        // Create a write stream to download the file to the local system
        const fileStream = fs.createWriteStream(localDownloadPath);

        // Pipe the S3 stream data into the file stream
        data.Body.pipe(fileStream);

        // Handle stream events
        fileStream.on('close', () => {
            console.log(`File downloaded successfully to ${localDownloadPath}`);
        });

        fileStream.on('error', (error) => {
            console.error('Error downloading file:', error);
        });
    } catch (error) {
        console.error("Error fetching file:", error);
    }
};


const getPreSignedUrl = async (s3FilePath, expiresIn = 900) => {
    try {
        console.log(`Generating URL for S3 Key: ${s3FilePath}`);

        const command = new GetObjectCommand({
            Bucket: config.bucketName,
            Key: s3FilePath, // Ensure this key matches your S3 structure
        });

        // Generate the pre-signed URL
        const url = await getSignedUrl(s3Client, command, { expiresIn });
        return url;
    } catch (error) {
        // Log specific S3 errors like NoSuchKey
        if (error.name === 'NoSuchKey') {
            console.error(`No such key found in the bucket: ${s3FilePath}`);
        } else {
            console.error(`Error generating pre-signed URL for ${s3FilePath}:`, error);
        }
        return 'Error or file not found';
    }
};

const generatePreSignedUrls = async (folderPath, clientId, expiresIn = 900) => {
    const result = { clientId };

    const processFolder = async (currentFolderPath) => {
        const entries = fs.readdirSync(currentFolderPath);
        const folderContent = {};

        for (const entry of entries) {
            const entryPath = path.join(currentFolderPath, entry);

            if (fs.lstatSync(entryPath).isDirectory()) {
                // Recursively process nested folders
                folderContent[entry] = await processFolder(entryPath);
            } else {
                // Construct the correct S3 file path with clientId prepended
                const relativeFilePath = path.relative(folderPath, entryPath).replace(/\\/g, '/'); // Ensure forward slashes
                const s3FilePath = `${clientId}/${relativeFilePath}`; // Prepend clientId to the path
                console.log(`Constructed S3 File Path: ${s3FilePath}`);

                const preSignedUrl = await getPreSignedUrl(s3FilePath, expiresIn);
                folderContent[entry] = preSignedUrl;
            }
        }

        return folderContent;
    };

    // Start processing the folder
    result[clientId] = await processFolder(folderPath);
    return result;
};

module.exports = { listFiles, uploadFolder, downloadFile, getPreSignedUrl, generatePreSignedUrls };
