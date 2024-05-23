const mongoose = require('mongoose');

const jobFeedSchema = new mongoose.Schema({
    jobId: {
        type: String,
        required: true,
    },
    targetAudience: {
        type: Boolean,
    },
    title: {
        type: String,
        required: true
    },
    jobType: {
        type: String,
        enum: ['Job', 'Internship'],
        required: true
    },
    position: {
        type: String,
        required: true
    },
    eligibility_criteria: {
        type: String,
    },
    totalVacancies: {
        type: Number,
        required: true
    },
    totalApplicationsReceived: {
        type: Number,
        default: 0
    },
    description: {
        type: String,
    },
    location: {
        type: String,
        required: true
    },
    jobDate: {
        type: Date,
        required: true,
    },
    LastDate: {
        type: Date,
        required: true,
    },
    media: {
        type: String
    },
    payScale: {
        type: String
    },
    studyLevels: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StudyLevel'
        }
    ],
    university: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
        required: true,
    },
    courseTypes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
        },
    ],
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    previousEventStatus: {
        type: String,
        default: '',
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
    },
    submittedBy: [{
        name: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
        },
        file: String
    }],
    resume: {
        type: String
    }
},
    { timestamps: true }
);


const JobFeedModel = mongoose.model('JobFeed', jobFeedSchema);

module.exports = JobFeedModel;
