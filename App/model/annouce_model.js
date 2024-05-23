const mongoose = require('mongoose');
const moment = require('moment');

const announcementSchema = new mongoose.Schema({
    announcementId: {
        type: String,
        unique: true,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    expiryDate: {
        type: Date,
        required: true,
    },
    dateOfPosting: {
        type: Date,
    },
    targetAudience: {
        type: Boolean,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },
    action: {
        type: String,
        enum: ['accept', 'reject', 'view'],
    },
    studyLevels: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StudyLevel',
        },
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
},
    { timestamps: true }
);

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;
