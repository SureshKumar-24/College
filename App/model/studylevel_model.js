const mongoose = require('mongoose');

const studyLevelSchema = new mongoose.Schema({
  study_name: {
    type: String,
  },
  university: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University',
    required: true, // University reference is required
  },
  courseTypes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
  ],
});

// Create a compound unique index on study_name and university fields
studyLevelSchema.index({ study_name: 1, university: 1 }, { unique: true });

const StudyLevel = mongoose.model('StudyLevel', studyLevelSchema);

module.exports = StudyLevel;
