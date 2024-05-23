"use strict";
const mongoose = require("mongoose");
require('dotenv').config();

// Define connection options
const connectionParams = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

// DB CONNECTION
async function dbConnection() {
    try {
        await mongoose.connect(process.env.MONGO_URL, connectionParams);
        console.log("Connected Successfully to the db");
    } catch (err) {
        console.error("Could not connect to the database:", err.message);
    }
}

// Event listeners for MongoDB connection
mongoose.connection.on('connected', () => {
    console.log('Mongoose Connected to db');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose Connection Error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose Connection is disconnected');
});

process.on('SIGINT', async () => {
    await mongoose.connection.close();
    process.exit(0);
});

// Call the dbConnection function to establish the connection
module.exports = dbConnection;
