const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
    RequestId: {
        type: String,
        required: true,
    },
    info: {
        type: String,
        default: " "
    },
    status: {
        type: String,
        enum: ['active', 'completed'],
        default: 'active' // Set default value to 'Unverified'
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
    },
    studyLevels: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudyLevel'
    },
    courseTypes: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
    },
    university: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
        required: true,
    },
},
    { timestamps: true }
);
const Admission = mongoose.model('Admission', admissionSchema);

module.exports = Admission;