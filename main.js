require('dotenv').config();
const { fetchClientId, startingTransfer, updateTransferStatus } = require('./src/database.js');
const { uploadFolder, generatePreSignedUrls } = require('./src/fileOperations.js'); // Import your uploadFolder function
const { saveJsonToFile } = require('./src/util.js');

const main = async () => {
    try {
        const clientId = await fetchClientId();

        if (!clientId) {
            console.log("No folders to upload. Exiting...");
            return;
        }

        // Define the path to the client's folder based on the fetched clientId
        const folderPath = `/home/me/Desktop/current/space-transfer/output/${clientId}`;

        console.log(`Uploading folder: ${folderPath}`);

        // Start measuring time
        const startTime = Date.now(); 

        await updateTransferStatus(clientId, "processing")

        // Start uploading the folder
        // await uploadFolder(folderPath, clientId);

        // Generate pre-signed URLs
        // const preSignedUrls = await generatePreSignedUrls(folderPath, clientId);
        // console.log("Generated pre-signed URLs:", JSON.stringify(preSignedUrls, null, 900));


        // const jsonFileName = `${clientId}.json`; // You can customize the filename as needed
        // saveJsonToFile(preSignedUrls, jsonFileName);

        // Calculate total time taken in seconds
        const endTime = Date.now(); // Record the end time
        const totalTime = (endTime - startTime) / 1000; // Convert milliseconds to seconds

        console.log(`Total time taken for upload: ${totalTime.toFixed(2)} seconds`);


        await updateTransferStatus(clientId, "completed")

        console.log("Folder upload completed.");
    } catch (error) {
        console.error("Error in main execution:", error);
    } finally {
        process.exit(0);
    }
};

main();
