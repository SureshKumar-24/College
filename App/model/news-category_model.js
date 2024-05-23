const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema({
    category_name: {
        type: String,
        required: true,
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt timestamps to the document
});

const Staff = mongoose.model('NewsCategory', categorySchema);

module.exports = Staff;