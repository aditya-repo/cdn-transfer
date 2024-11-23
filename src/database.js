const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI;
const Service = require("../models/service")
const SignatureUrl = require("../models/signatureUrl")

// Connect to MongoDB
const connectToDatabase = async () => {
    if (!mongoose.connection.readyState) {
        const start = new Date()
        await mongoose.connect(uri);
        const end = new Date()
        console.log('Database connected in', ((end - start)/1000), 'sec');
    }
};

// Fetch client ID where the status is "cdn-queued"
const fetchCDNtransferStatus = async () => {
    await connectToDatabase();
    const service = await Service.findOne({ status: 'cdn-transfering' });
    return service ? service.clientId : null;
};

// Fetch client ID where the status is "cdn-queued"
const fetchClientId = async () => {
    await connectToDatabase();
    const service = await Service.findOne({ status: 'cdn-queued' });
    return service ? service.clientId : null;
};

// Update transfer status for a given client ID
const updateTransferStatus = async (clientId, currentStatus) => {
    await connectToDatabase();
    const updatedService = await Service.findOneAndUpdate(
        { clientId },
        { $set: { status: currentStatus } },
        { new: true } // Returns the updated document
    );
    return updatedService ? updatedService.clientId : null;
};

// Create a new SignatureUrl document
const createSignatureUrlObject = async (clientId, type, name, cover, data) => {
    await connectToDatabase();

    // Prepare the data array
    const dataArray = Object.entries(data).map(([key, value]) => ({
        filename: key,
        url: value,
    }));

    // Create a new instance
    const newSignatureUrl = new SignatureUrl({
        clientId,
        type,
        name,
        cover,
        data: dataArray,
    });

    try {
        // await newSignatureUrl.save();
        console.log('Document saved successfully');
    } catch (error) {
        console.error('Error saving document:', error.message);
    }
};

module.exports = { fetchClientId, updateTransferStatus, createSignatureUrlObject, fetchCDNtransferStatus };
