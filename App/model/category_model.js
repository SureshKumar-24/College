const mongoose = require('mongoose');

// Define a schema for the Admin model
const Category = new mongoose.Schema({
    category_name: {
        type: String,
        required: true,
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
    university: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
        required: true,
    },
    resourceType: {
        type: String,
        enum: ['academic', 'pastpaper', 'library'],
        required: true,
    },
},
    { timestamps: true }
);

// Create the Admin model using the schema
const category = mongoose.model('Category', Category);

module.exports = category;
