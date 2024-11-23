const fs = require('fs');
const path = require('path');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const config = require('./config');
const s3Client = require('./s3Client'); 
const { createSignatureUrlObject } = require('./database');


const getPreSignedUrl = async (s3FilePath, expiresIn = 900) => {
    try {

        const command = new GetObjectCommand({
            Bucket: config.bucketName,
            Key: s3FilePath, 
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

const generatePreSignedUrlsV2 = async (baseFolderPath, clientId, expiresIn = 900) => {
    const processFolder = async (subfolderPath, type, name) => {
        const entries = fs.readdirSync(subfolderPath).filter(entry =>
            fs.lstatSync(path.join(subfolderPath, entry)).isFile()
        );

        const data = {};
        let cover = null;

        for (const [index, entry] of entries.entries()) {
            const entryPath = path.join(subfolderPath, entry);

            // Correctly calculate relative file path from the type folder (not base folder)
            const relativeFilePath = path.relative(subfolderPath, entryPath).replace(/\\/g, '/'); 
            const s3FilePath = `${clientId}/${type}/${name}/${relativeFilePath}`; 
            // console.log(`Constructed S3 File Path: ${s3FilePath}`);

            const preSignedUrl = await getPreSignedUrl(s3FilePath, expiresIn);

            data[entry] = preSignedUrl;

            // Assign the first image URL as the "cover"
            if (index === 0) {
                cover = preSignedUrl;
            }
        }

        return { data, cover };
    };

    const processTypeFolders = async (clientFolderPath, clientId) => {
        const typeFolders = fs.readdirSync(clientFolderPath); 

        for (const typeFolder of typeFolders) {
            const typeFolderPath = path.join(clientFolderPath, typeFolder);

            if (!fs.lstatSync(typeFolderPath).isDirectory()) continue;

            const type = typeFolder; // `final` or `thumbnail`

            const subfolders = fs.readdirSync(typeFolderPath); // e.g., `1`, `2`, etc.
            for (const subfolder of subfolders) {
                const subfolderPath = path.join(typeFolderPath, subfolder);

                if (!fs.lstatSync(subfolderPath).isDirectory()) continue;

                const name = subfolder; // `1`, `2`, etc.

                const { data, cover } = await processFolder(subfolderPath, type, name);

                await createSignatureUrlObject(clientId, type, name, cover, data)

            }
        }
    };

    const clientFolderPath = path.join(baseFolderPath, clientId); 
    await processTypeFolders(clientFolderPath, clientId);
};

module.exports = { generatePreSignedUrlsV2 }