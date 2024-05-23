const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notification = new Schema({
    title: {
        type: String,
        required: true,
    },
    body: {
        type: String,
        required: true,
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
    showto: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
        },
    ]

}, {
    timestamps: true, // Adds createdAt and updatedAt timestamps to the document
});

const Notification = mongoose.model('Notification', notification);

module.exports = Notification;