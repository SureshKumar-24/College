const mongoose = require('mongoose');

// Define a schema for the Admin model
const Resources = new mongoose.Schema({
    ID: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    category:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category' // Reference to the StudyLevel model
    },
    sub_category: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SubCategory' // Reference to the StudyLevel model
        }
    ],
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
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    res: [
        {
            file: String,
            name: String
        }
    ],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
    },
    resourceType: {
        type: String,
        enum: ['academic', 'library'],
        required: true,
    },
},
    { timestamps: true }
);

const PastPaperResources = new mongoose.Schema({
    ID: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    topic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic' // Reference to the StudyLevel model
    },
    semester:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester' // Reference to the StudyLevel model
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject' // Reference to the StudyLevel model
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
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    res: [
        {
            file: String,
            name: String
        }
    ],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
    },
    resourceType: {
        type: String,
        default: 'pastpaper',
    },
},
    { timestamps: true }
);

const TopicModel = new mongoose.Schema({
    topicname: {
        type: String,
        required: true,
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject' // Reference to the StudyLevel model
    },
});

const TopicListModel = new mongoose.Schema({
    semester:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester' // Reference to the StudyLevel model
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject' // Reference to the StudyLevel model
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
})

const Resource = mongoose.model('Resouce', Resources);
const PastPaper = mongoose.model('PastPaper', PastPaperResources);
const Topic = mongoose.model('Topic', TopicModel);
const TopicList = mongoose.model('TopicList', TopicListModel);
module.exports = {
    Resource,
    PastPaper,
    Topic,
    TopicList
}
