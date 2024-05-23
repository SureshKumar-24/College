const mongoose = require('mongoose');

// Define a schema for the Idea model
const ideaModel = new mongoose.Schema({
    file: {
        type: String,
        default: null
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    postby: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
    },
    university: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
        required: true,
    },
    comments: [{
        commenter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student'
        },
        text: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true, // Adds createdAt and updatedAt timestamps to the document
});

const CommunityModel = new mongoose.Schema({
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CategoryCommunity',
        required: true
    },
    file: {
        type: String,
        default: null
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    postby: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
    },
    university: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
        required: true,
    },
    comments: [{
        commenter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student'
        },
        text: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true, // Adds createdAt and updatedAt timestamps to the document
});

const CategoryCommunity = new mongoose.Schema({
    category_name: {
        type: String,
        required: true
    },
    university: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
        required: true,
    },
});

// Create the Idea model using the schema
const Idea = mongoose.model('Idea', ideaModel);
const Community = mongoose.model('Community', CommunityModel);
const CommunityCategory = mongoose.model('CategoryCommunity', CategoryCommunity);
module.exports = {
    Idea,
    Community,
    CommunityCategory
}