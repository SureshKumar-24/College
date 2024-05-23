const mongoose = require('mongoose');

// Define a schema for the Admin model
const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true // Ensure usernames are unique
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true // Ensure emails are unique
  },
  profilePicture: {
    type: String,
  },
  role: {
    type: String,
    enum: ['SuperAdmin', 'Admin'], // Define possible roles
    default: 'Admin' // Default role is 'Admin'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Create the Admin model using the schema
const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
