const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SemesterSchema = new Schema({
    semesterNumber: {
        type: Number,
        required: true,
    },
    courseTypes:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
    },
    studyLevel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudyLevel' // Reference to the StudyLevel model
    },
    university: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
        required: true,
    },
});

const SubjectSchema = new Schema({
    subject_name: {
        type: String,
        required: true,
    },
    semester:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester',
    },
});

const AllSemester = new Schema({
    courseTypes:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
    },
    studyLevel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudyLevel' // Reference to the StudyLevel model
    },
    length: {
        type: Number,
    },
    university: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
        required: true,
    },
})
const Semester = mongoose.model('Semester', SemesterSchema);
const ListSemester = mongoose.model('ListSemester', AllSemester);
const Subject = mongoose.model('Subject', SubjectSchema);
module.exports = {
    Semester,
    Subject,
    ListSemester
}