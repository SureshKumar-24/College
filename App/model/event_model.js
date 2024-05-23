const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    eventId: {
        type: String,
        required: true,
    },
    createdBy: { // Add a field to track the creator/owner
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff', // Reference to a User model (adjust the ref value as needed)
    },
    evnetcategory: {
        type: String,
    },
    eventTitle: {
        type: String,
        required: true,
    },
    expiryDate: {
        type: Date,
        required: true,
    },
    eventDescription: {
        type: String,
        required: true,
    },
    targetAudience: {
        type: Boolean,
    },
    eventDate: {
        type: Date,
        required: true,
    },
    eventTime: {
        type: String,
        required: true,
    },
    eventType: {
        type: String,
        enum: ['Paid', 'Free'],
        default: 'Free',
    },
    eventStatus: {
        type: String,
        enum: ['Live', 'Upcoming', 'Expired', 'Cancelled'],
        default: 'Upcoming',
    },
    previousEventStatus: {
        type: String,
        default: '',
    },
    eventLocation: {
        type: String,
    },
    eventSeats: {
        type: Number,
    },
    eventPriceTicket: {
        type: Number,
    },
    media: {
        type: String,
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
    totalAttendee: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
        }
    ],
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active' // Default status is 'active'
    },
},
    { timestamps: true }
);

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;