import mongoose from "mongoose";
import Service from "../models/service"
import dotenv from "dotenv"
import { IData } from "../models/signatureUrl";
dotenv.config()

const uri = process.env.MONGODB_URI as string;
const SignatureUrl = require("../models/signatureUrl")

// Connect to MongoDB
const connectToDatabase = async (): Promise<void> => {
    if (!mongoose.connection.readyState) {
        const start: number = Date.now()
        await mongoose.connect(uri);
        const end: number = Date.now()
        console.log('Database connected in', ((end - start)/1000), 'sec');
    }
};

// Fetch client ID where the status is "cdn-queued"
const fetchCDNtransferStatus = async (): Promise<string | null> => {
    await connectToDatabase();
    const service = await Service.findOne({ status: 'cdn-transfering' });
    return service ? service.clientId : null;
};

// Fetch client ID where the status is "cdn-queued"
const fetchClientId = async (): Promise<string | null> => {
    await connectToDatabase();
    const service = await Service.findOne({ status: 'cdn-queued' });
    return service ? service.clientId : null;
};

// Update transfer status for a given client ID
const updateTransferStatus = async (clientId: string, currentStatus: string): Promise<string | null> => {
    await connectToDatabase();
    const updatedService = await Service.findOneAndUpdate(
        { clientId },
        { $set: { status: currentStatus } },
        { new: true } // Returns the updated document
    );
    return updatedService ? updatedService.clientId : null;
};

// Create a new SignatureUrl document
const createSignatureUrlObject = async (clientId: string, type: string, name: string, cover: string | null, data: any): Promise<void> => {
    await connectToDatabase();

    const dataArray = Object.entries(data).map(([key, value]) => ({
        filename: key,
        url: value,
    }));

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
        // return "success"
    } catch (error: any) {
        console.error('Error saving document:', error.message);
        // return "failed"
    }
};

export { fetchClientId, updateTransferStatus, createSignatureUrlObject, fetchCDNtransferStatus };
