import mongoose, { Schema, Model, Document } from "mongoose";

export interface ISignatureUrl extends Document {
    clientId: string
    type: 'thumbnail' | 'final'
    name: string
    cover: string
    data: IData[]
}

export interface IData {
    filename: string
    url: string
}

const SignatureUrlSchema = new mongoose.Schema <ISignatureUrl> ({
    clientId: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['thumbnail', 'final'],
        // required: true
    },
    name: {
        type: String,
        required: true
    },
    cover: {
        type: String,
        required: true
    },
    data: [
        {
            filename: { type: String, required: true },
            url: { type: String, required: true },
        },]
}, {
    timestamps: true
});

const SignatureUrl: Model<ISignatureUrl> = mongoose.model<ISignatureUrl>('SignatureUrl', SignatureUrlSchema);

module.exports = SignatureUrl
