const jwt = require('jsonwebtoken');
const Admin = require('../model/admin_model');
const Student=require('../model/student_model');
const mongoose = require("mongoose");
require("dotenv").config();

module.exports = {
    verify:async (req, res, next) => {
        const bearerHeader = req.headers['authorization'];
        try {
            if (typeof bearerHeader !== 'undefined') {
                const bearerToken = bearerHeader.split(' ');
                const token = bearerToken[1];
                jwt.verify(token, process.env.JWT_KEY, (err, payload) => {
                    if (err) {
                        return res.status(401).json({ success: false, status: 401, msg: 'Token not Valid' });
                    }
                    // Set the payload in req.user
                    req.user = payload;
                    next();
                });
            } else {
                return res.status(401).json({ success: false, status: 401, msg: 'Token not provided' });
            }
        } catch (error) {
            return res.status(400).json({ success: false, status: 401, msg: 'Token not Passing' });
        }
    },

    SuperAdmin: async (req, res, next) => {
        const email = req.user.email;
        try {
            const superadmin = await Admin.findOne({ email, role: 'SuperAdmin' });
            if (!superadmin) {
                return res.status(403).json({ success: false, status: 403, msg: "You are not Super admin " });
            }
            else {
                next();
            }
        } catch (error) {
            console.log(error);
            return res.status(401).json({ success: false, status: 401, error: error.message });
        }
    },

    Admin: async (req, res, next) => {
        const email  = req.user.email;
        try {
            const admin = await Admin.findOne({ email, role: 'Admin' });
            if (!admin) {
                return res.status(403).json({ msg: "You are not admin " });
            }
            else {
                next();
            }
        } catch (error) {
            console.log(error);
            return res.status(401).json({ success: false, status: 401, error: error.message });
        }
    }
};
