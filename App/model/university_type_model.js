const mongoose = require('mongoose');

// Define a schema for the University_type model
const universityTypeSchema = new mongoose.Schema({
  typeNames:
  {
    type: String,
    required: true,
    unique: true // Ensure type names are unique within the array
  }
}, {
  timestamps: true // Enable timestamps
});

// Create the University_type model using the schema
const UniversityType = mongoose.model('UniversityType', universityTypeSchema);

module.exports = UniversityType;

