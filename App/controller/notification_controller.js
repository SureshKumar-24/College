const Notification = require('../model/notification_model');
const Student = require('../model/student_model');
const { validationResult } = require("express-validator");
const moment = require('moment');

module.exports.makeNotification = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    try {
        const { title, body, studylevel, courses, university } = req.body;
        const Notifydata = new Notification({
            title,
            body,
            studyLevels: studylevel,
            courseTypes: courses,
            university: university
        });
        await Notifydata.save();
        return res.status(200).json({ success: true, status: 200, msg: "Notification Created Successfully" });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

module.exports.getNotification = async (req, res) => {
    try {
        const email = req.user.email;
        const studentdata = await Student.findOne({ email });

        // Create a query object for finding notifications
        const filter = {};

        if (studentdata) {
            filter.studyLevel = studentdata.studyLevel;
            filter.courses = studentdata.courseEnrolled;
            filter.university = studentdata.university;

            // Check if the studyLevels and courseTypes are empty for the student
            if (filter.studyLevel.length === 0 && filter.courses.length === 0) {
                // If they are empty, only match with the student's university
                filter.university = studentdata.university;
            }
        }
        // Create a query object for finding news items
        const query = {
            studyLevels: { $in: filter.studyLevel }, // Adjust the filtering for studyLevels
            university: filter.university,
            courseTypes: { $in: filter.courses }, // Adjust the filtering for courseTypes
        };

        const notifications = await Notification.find({
            ...query,
            showto: { $ne: studentdata._id }
        }).select('title body createdAt').sort({ createdAt: -1 });

        if (!notifications || notifications.length === 0) {
            return res.status(400).json({ success: false, status: 400, msg: "Notification Not Found" });
        }

        // Format the createdAt date for each notification using Moment.js
        const formattedNotifications = notifications.map((notification) => {
            const createdAt = moment(notification.createdAt);
            const currentTime = moment();
            const timeDifference = moment.duration(currentTime.diff(createdAt));

            if (timeDifference.asSeconds() < 60) {
                return {
                    id: notification._id,
                    title: notification.title,
                    body: notification.body,
                    createdAt: timeDifference.seconds() + 's',
                };
            } else if (timeDifference.asMinutes() < 60) {
                return {
                    id: notification._id,
                    title: notification.title,
                    body: notification.body,
                    createdAt: timeDifference.minutes() + 'm',
                };
            } else if (timeDifference.asHours() < 24) {
                return {
                    id: notification._id,
                    title: notification.title,
                    body: notification.body,
                    createdAt: timeDifference.hours() + 'h',
                };
            } else if (timeDifference.asDays() < 30) {
                return {
                    id: notification._id,
                    title: notification.title,
                    body: notification.body,
                    createdAt: timeDifference.days() + 'd',
                };
            } else {
                return {
                    id: notification._id,
                    title: notification.title,
                    body: notification.body,
                    createdAt: timeDifference.months() + 'mo',
                };
            }
        });

        return res.status(200).json({ success: true, status: 200, msg: "Notification Get Successfully", data: formattedNotifications });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.deleteNotification = async (req, res) => {
    try {
        const email = req.user.email;
        const id = req.body.id;
        const studentdata = await Student.findOne({ email });
        const Notificationdelete = await Notification.findByIdAndUpdate(id, { showto: studentdata._id }, { new: true });
        return res.status(200).json({ success: true, status: 200, msg: "Delete Message Successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}
