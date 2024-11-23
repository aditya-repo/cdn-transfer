const mongoose = require('mongoose');

const SignatureUrlSchema = new mongoose.Schema({
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

const SignatureUrl = mongoose.model('SignatureUrl', SignatureUrlSchema);

module.exports = SignatureUrl
