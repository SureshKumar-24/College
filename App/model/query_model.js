const mongoose = require('mongoose');

const querySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    expiryDate: {
        type: Date,
        required: true,
    },
    publishDate: {
        type: Date,
        required: true,
    },
    targetAudience: {
        type: Boolean,
    },
    studyLevels: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StudyLevel'
        }
    ],
    courseTypes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
        },
    ],
    university: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
        required: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
    },
    type: {
        type: String,
        enum: ['Survey', 'Assessment'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active' // Default status is 'active'
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt timestamps to the document
});

const Query = mongoose.model('Query', querySchema);

module.exports = Query;