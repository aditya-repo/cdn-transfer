require('dotenv').config();
const { fetchClientId, updateTransferStatus, fetchCDNtransferStatus } = require('./src/database.js');
const { uploadFolder, deleteLocalFolder } = require('./src/fileOperations.js');
const { generatePreSignedUrlsV2 } = require("./src/SignatureUrl.js")

const main = async () => {
    try {
        const startTime = Date.now();
        let INPUT_PATH
        if (process.env.SERVER == 'local') {
            INPUT_PATH = process.env.INPUT_DIRECTORY
        } else {
            INPUT_PATH = process.env.SERVER_INPUT_DIRECTORY
        }

        const clienttransfer = await fetchCDNtransferStatus()

        if (clienttransfer) {
            console.log("Worker busy, try later");
            return
        }

        const clientId = await fetchClientId();

        if (!clientId) {
            console.log("No folders to upload. Exiting...");
            return;
        }

        // Define the path to the client's folder based on the fetched clientId
        const folderPath = `${INPUT_PATH}/${clientId}`;

        console.log(`Uploading folder: ${folderPath}`);

        // await updateTransferStatus(clientId, "cdn-transfering")

        // Start uploading the folder
        // await uploadFolder(folderPath, clientId);

        // Generate pre-signed URLs
        const expirationTime = 60 * 60 * 24 * 7; // One Week Expiration
        // await generatePreSignedUrlsV2(INPUT_PATH, clientId, expirationTime);

        // Calculate total time taken in seconds
        const endTime = Date.now();
        const totalTime = (endTime - startTime) / 1000;

        console.log(`Total time taken for upload: ${totalTime.toFixed(2)} seconds`);

        // await updateTransferStatus(clientId, "completed")

        await deleteLocalFolder(folderPath, clientId)

        console.log("Folder upload completed.");
    } catch (error) {
        console.error("Error in main execution:", error);
    } finally {
        process.exit(0);
    }
};

main();
