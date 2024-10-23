// mongodb_operations.js
const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI; // MongoDB connection URI from environment variables
let db;

const updateTransferStatus = async (clientId, currentStatus) => {
    const database = await connectToDatabase();
    const Service = database.collection('services'); // Your MongoDB collection name

    const result = await Service.findOneAndUpdate(
        { clientId },
        { $set: { status: currentStatus } }, // Use $set to update the field
        { returnOriginal: false } // Optional: returns the updated document
    );

    return result.value ? result.value.clientId : null; 
};


const connectToDatabase = async () => {
    if (!db) {
        const client = new MongoClient(uri);
        await client.connect();
        db = client.db(process.env.DATABASE_NAME); // Database name from environment variable
    }
    return db;
};

const fetchClientId = async () => {
    const database = await connectToDatabase();
    const Service = database.collection('services'); // Your MongoDB collection name

    
    const result = await Service.findOne({ cdn: "queued" });
    // console.log(result);
    return result ? result.clientId : null; // Return clientId or null if not found
};

module.exports = { fetchClientId, updateTransferStatus };
