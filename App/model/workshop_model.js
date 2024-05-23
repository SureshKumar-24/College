const mongoose = require('mongoose');

const academicWorkshopSchema = new mongoose.Schema({
    workshopId: {
        type: String,
        required: true,
        unique: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    targetAudience: {
        type: Boolean,
    },
    date: {
        type: Date,
        required: true,
    },
    time: {
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
    duration: {
        type: String,
        required: true
    },
    media: {
        type: String,
    },
    location: {
        type: String,
    },
    seats: {
        type: Number,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
    },
    workshopStatus: {
        type: String,
        enum: ['Live', 'Upcoming', 'Expired', 'Cancelled'],
        default: 'Upcoming',
    },
    previousWorkStatus: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active' // Default status is 'active'
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
    totalAttendee: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
        },
    ],
}, { timestamps: true });

const AcademicWorkshop = mongoose.model('AcademicWorkshop', academicWorkshopSchema);

module.exports = AcademicWorkshop;
