const mongoose = require('mongoose');

// Define a schema for the Admin model
const Sub_Category = new mongoose.Schema({
    sub_category_name: {
        type: String,
        required: true,
    },
    Category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category' // Reference to the StudyLevel model
    },
},
    { timestamps: true }
);

// Create the Admin model using the schema
const sub_category = mongoose.model('SubCategory', Sub_Category);

module.exports = sub_category;
