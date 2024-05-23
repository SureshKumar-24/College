const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    roles: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role' // Reference to the Role model
        }
    ]
});

const Department = mongoose.model('Department', departmentSchema);

module.exports = Department;
