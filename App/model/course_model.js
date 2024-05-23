const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    course_name: {
        type: String,
        required: true,
    },
    studyLevels:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudyLevel' // Reference to the StudyLevel model
    },
    departments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Department' // Reference to the Course model
        }
    ]
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
