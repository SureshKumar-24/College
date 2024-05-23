const { DataExchange } = require('aws-sdk');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const newsSchema = new mongoose.Schema({
    newsId: {
        type: String,
        unique: true,
        required: true,
    },
    categoryname: {
        type: String,
        required: true,
    },
    newsTitle: {
        type: String,
        required: true,
    },
    expiryDate: {
        type: Date,
        required: true,
    },
    newsDescription: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    media: {
        type: String,
    },
    studyLevels: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StudyLevel' // Reference to the StudyLevel model
        }
    ],
    courseTypes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
        },
    ],
    targetAudience: {
        type: Boolean,
    },
    university: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
        required: true,
    },
    createdBy: { // Add a field to track the creator/owner
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff', // Reference to a User model (adjust the ref value as needed)
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active' // Default status is 'active'
    },
},
    { timestamps: true }
);
const News = mongoose.model('News', newsSchema);

module.exports = News;