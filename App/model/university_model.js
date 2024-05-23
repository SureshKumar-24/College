const mongoose = require('mongoose');

// Define a schema for the University model
const universitySchema = new mongoose.Schema(
  {
    university_logo: {
      type: String,
    },
    university_type: {
      type: String,
    },
    university_name: {
      type: String,
    },
    founded: {
      type: String,
    },
    university_address: [
      {
        country: String, // Lowercase field name
        state: String,
        city: String,
        pincode: String // Lowercase field name
      }
    ],
    business_email: {
      type: String,
      required: true // Make business_email required
    },
    password: {
      type: String,
      required: true // Make password required
    },
    total_courses: String, // Only an array of strings
    total_students: String,
    total_staff: String,
    contact_person: [
      {
        firstname: String,
        lastname: String,
        email: String,
        position: String,
        contact: String,
        valid_id: String
      }
    ],
    status: {
      type: String,
      enum: ['Accepted', 'Unverified', 'Rejected'],
      default: 'Unverified' // Set default value to 'Unverified'
    },
    studyLevels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudyLevel' // Reference to the StudyLevel model
      }
    ],
    accountStatus: {
      type: String,
      enum: ['Active', 'Inactive'], // Assuming staff accounts can be either active or inactive
      default: 'Inactive', // Default status is set to Active
    },
  },
  { timestamps: true } // Enable timestamps
);

// Create the University model using the schema
const University = mongoose.model('University', universitySchema);
module.exports = University;

