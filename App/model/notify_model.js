const mongoose = require('mongoose');

const fcmtoken = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
    },
    fcmtoken: {
        type: String,
        required: true
    }
}, { timestamps: true }
);

const Fcmtoken = mongoose.model('fcmtoken', fcmtoken);

module.exports = Fcmtoken;