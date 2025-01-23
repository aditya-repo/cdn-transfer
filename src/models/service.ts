import mongoose, { Schema, Document, Model} from "mongoose"

export interface IService extends Document {
    clientId: string,
    cloudpackage?: 'silver' | 'gold' | 'platinum' | 'none'
    maxupload?: number,
    studiocode?: string
    folder: Folder[],
    status?: 'inactive' | 'optimizing' | 'queued' | 'processing' | 'cdn-queued' | 'cdn-transfering' | 'completed'
    time?:Date,
    totalfile?: string
    processedfile? :string
    stringprocessedfile?: string
}

interface Folder {
    foldername: string
    locationname?: string
    indexname?: string
    size?: number
    count?: number
    status?: string
    uploadtime?: Date
}

const serviceSchema = new Schema <IService>({
    clientId: {
        type: String,
        required: [true, "Client  Id should be required"],
    },
    cloudpackage: {
        type: String,
        enum: ['silver', 'gold', 'platinum', 'none'],
        default: 'none'
    },
    maxupload: {
        type: Number
    },
    studiocode: {
        type: String
    },
    folder: [
        {
            foldername: {
                type: String,
                required: [true, "Folder name is required"]
            },
            locationname: { type: String },
            indexname: { type: String },
            size: {
                type: Number,
                required: false
            },
            count: {
                type: Number,
                required: false
            },
            status: {
                type: String
            },
            uploadtime: {
                type: Date,
                default: Date.now,
            }
        },
    ],
    status: {
        type: String,
        default: "inactive",
        enum: ['inactive', 'optimizing', 'queued', 'processing', 'cdn-queued', 'cdn-transfering', 'completed']
    },
    time: {
        type: Date
    },
    totalfile: {
        type: String
    },
    processedfile:{
        type: String
    }

}, { timestamps : true })

const Service: Model <IService> = mongoose.model<IService>("Services", serviceSchema)

export default Service