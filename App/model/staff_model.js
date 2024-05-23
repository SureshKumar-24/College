const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const staffSchema = new Schema({
    staffId: {
        type: String,
        required: true,
        unique: true,
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    department:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
    },
    role: {
        type: String,
        required: true,
        enum:["Hod","Teacher"]
    },
    createdBy: {
        type: String,
        required: true,
    },
    accountType: {
        type: String,
        enum: ['Permanent', 'Temporary'],
        required: true,
    },
    accountExpiryDate: {
        type: Date,
    },
    profilePicture: {
        type: String, // You can store the URL of the image here
    },
    password: {
        type: String,
        required: true,
    },
    bio: {
        type: String,
    },
    university: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
    },
    accountStatus: {
        type: String,
        enum: ['Active', 'Inactive'], // Assuming staff accounts can be either active or inactive
        default: 'Active', // Default status is set to Active
    },
    lastLoginTime: {
        type: Date,
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt timestamps to the document
});

staffSchema.index({ email: 1, university: 1 }, { unique: false });
const Staff = mongoose.model('Staff', staffSchema);

module.exports = Staff;
