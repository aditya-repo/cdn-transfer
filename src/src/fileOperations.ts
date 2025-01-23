import fs from 'fs';
import path from "path"
import s3Client from './s3Client';
import { ListObjectsV2Command, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import getContentType from './contentTypes'
import config from './config';
import { getPreSignedUrl } from './SignatureUrl';


interface FolderContent {
    [key: string]: string | FolderContent;
}

interface PreSignedUrlsResult {
    clientId: string;
    [key: string]: string | FolderContent;
}


// Function to list files and directories in the Space
const listFiles = async (): Promise<void> => {
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
const uploadFolder = async (folderPath: string, basePath:string = '') => {
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
const uploadFile = async (filePath: string, destinationKey: string) => {
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
const downloadFile = async (s3FilePath: string, localDownloadPath: string) => {
    try {
        // Create the GetObjectCommand to fetch the file
        const command = new GetObjectCommand({
            Bucket: config.bucketName,
            Key: s3FilePath // File path in the S3 bucket
        });

        const data = await s3Client.send(command);

        if (!data.Body) {
            return false
        }

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


const deleteLocalFolder = (folderPath: string) => {
    if (fs.existsSync(folderPath)) {
        const files = fs.readdirSync(folderPath);

        // Deleting files and subdirectories recursively
        for (const file of files) {
            const filePath = path.join(folderPath, file);
            if (fs.lstatSync(filePath).isDirectory()) {
                deleteLocalFolder(filePath); // Recursively delete subdirectories
            } else {
                fs.unlinkSync(filePath); // Delete file
            }
        }

        // Try to remove the directory itself
        try {
            fs.rmdirSync(folderPath); // Remove the empty directory
            console.log(`Directory ${folderPath} deleted successfully.`);
        } catch (err:any) {
            console.error(`Error deleting directory ${folderPath}:`, err.message);
        }
    } else {
        console.log(`Directory ${folderPath} does not exist.`);
    }
};


const generatePreSignedUrlsV1 = async (folderPath: string, clientId: string, expiresIn: number = 900) => {
    const result:PreSignedUrlsResult = { clientId };

    const processFolder = async (currentFolderPath: string): Promise<FolderContent> => {
        const entries = fs.readdirSync(currentFolderPath);
        const folderContent: FolderContent = {};

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

export { listFiles, uploadFolder, downloadFile, generatePreSignedUrlsV1, deleteLocalFolder };
