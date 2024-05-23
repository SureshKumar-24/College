const moment = require('moment');
const imageUploadAws = require('../helper/imageUpload');
const University = require('../model/university_model');
const Student = require('../model/student_model');
const Event = require('../model/event_model');
const Staff = require('../model/staff_model');
const mongoose = require('mongoose');
const Notification = require('../model/notification_model');

module.exports.createEvent = async (req, res) => {
    try {
        const emailId = req.user.email; // Get the email of the currently logged-in user (Admin or Staff)

        // Extract relevant fields from the request body
        const {
            eventTitle,
            eventDescription,
            expiryDate,
            eventDate,
            eventTime,
            eventType,
            eventStatus,
            eventLocation,
            studyLevels,
            courseTypes,
            eventSeats,
            eventPriceTicket,
        } = req.body;

        const targetAudienced = req.body.targetAudience || false;
        const targetvalue = targetAudienced;

        let studyLeveldata = [];
        let courseTypedata = [];

        if (targetAudienced == 'false') {
            const studyLevelArray = studyLevels.split(',').map(id => id.trim()).filter(Boolean);
            const courseArray = courseTypes.split(',').map(id => id.trim()).filter(Boolean);

            if (studyLevelArray.length === 0 || courseArray.length === 0) {
                return res.status(400).json({ success: false, status: 400, msg: 'Study levels or courses cannot be empty' });
            }
            studyLeveldata = studyLevelArray.map(id => new mongoose.Types.ObjectId(id));
            courseTypedata = courseArray.map(id => new mongoose.Types.ObjectId(id));
        }

        const Staffdata = await Staff.findOne({ email: emailId });
        if (!Staffdata) {
            const university = await University.findOne({
                business_email: emailId
            });

            if (!university) {
                return res.status(400).json({ success: false, status: 400, msg: 'University not found for the provided email' });
            }

            let url = ""; // Initialize the URL variable for image upload

            if (req.file) {
                // Assuming you have an imageUploadAws function to handle image upload
                let imageObj = await imageUploadAws(req.file, "univ-connect-profile", "event-profile");

                if (!imageObj.error) {
                    url = imageObj.uploadData?.Location;
                } else {
                    return res.status(400).json({ success: false, status: 400, msg: 'Image upload error', error: imageObj.error });
                }
            }

            const formatDate = moment(expiryDate, 'DD-MM-YYYY').toDate();

            // Format the date as required
            const expiryDateStore = moment(formatDate).format("YYYY-MM-DDTHH:mm:ss.SSSZ");
            const prefix = 'ET-';
            const randomDigits = Math.floor(10000 + Math.random() * 90000);
            const currentMonth = new Date().getMonth() + 1;
            const eventId = `${prefix}${randomDigits}${currentMonth}`;

            const newEvent = new Event({
                eventId,
                eventTitle,
                eventDescription,
                expiryDate: expiryDateStore,
                eventDate: expiryDateStore,
                eventTime,
                eventType,
                eventStatus,
                eventLocation,
                media: url,
                eventSeats: eventSeats,
                targetAudience: targetvalue,
                eventPriceTicket: eventPriceTicket,
                studyLevels: studyLeveldata,
                courseTypes: courseTypedata,
                university: university._id,
            });

            // Save the new Event document to the database
            await newEvent.save();
            const notificationData = new Notification({
                title: 'New Event: ' + title,
                body: 'Check out the latest Event!',
                studyLevels: studyLeveldata,
                courseTypes: courseTypedata,
                university: university._id,
            });
            await notificationData.save();
            return res.status(201).json({ success: true, status: 201, msg: 'Event created successfully', data: newEvent });
        }


        const randomDigits = Math.floor(10000 + Math.random() * 90000);
        const eventId = req.body.eventTitle.substring(0, 3).toUpperCase() + randomDigits;

        // Capture the current date and time
        const newEvent = new Event({
            eventId,
            eventTitle,
            eventDescription,
            expiryDate,
            eventDate,
            eventTime,
            eventType,
            eventStatus,
            eventLocation,
            media: mediaUrl,
            eventSeats,
            eventPriceTicket,
            studyLevels: studyLevels,
            courseTypes: courseTypes,
            university: Staffdata.university,
            createdBy: Staffdata._id
        });

        // Save the new Event document to the database
        await newEvent.save();
        const notificationData = new Notification({
            title: 'New Event: ' + title,
            body: 'Check out the latest Event!',
            studyLevels: studyLeveldata,
            courseTypes: courseTypedata,
            university: Staffdata.university,
        });
        await notificationData.save();
        return res.status(201).json({ success: true, status: 201, msg: 'Event created successfully', data: newEvent });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.getEvent = async (req, res) => {
    try {
        let { eventStatus, date, time, sort } = req.query;
        const email = req.user.email;
        const studentdata = await Student.findOne({ email });
        // Create a base query for filtering
        const filter = {};

        if (studentdata) {
            filter.studyLevels = studentdata.studyLevel;
            filter.courseTypes = studentdata.courseEnrolled;
            filter.university = studentdata.university;
        }

        // Create a base query for filtering based on the event type
        let eventTypeFilter = {};
        if (eventStatus) {
            eventTypeFilter = { eventStatus: eventStatus };
        }

        // Define the sorting order based on the query parameters
        let sortOption = { eventDate: 1 }; // Default to sorting by event date in descending order (most recent events first)

        // If 'sort' is provided and set to "Oldest," sort in ascending order (oldest events first)
        if (sort === 'Oldest') {
            sortOption = { eventDate: -1 };
        }

        // Create a query object for finding events
        const query = {
            ...eventTypeFilter,
            studyLevels: filter.studyLevels,
            university: filter.university,
            courseTypes: filter.courseTypes,
        };

        // Check if the date is provided, and add it to the query if it exists
        if (date) {
            const parsedDate = moment(date, 'DD-MM-YYYY').toDate();
            const nextDay = moment(parsedDate).add(1, 'days').toDate(); // To get the date range for one day

            // Use the $gte and $lt operators to match the date in the database
            query.eventDate = {
                $gte: parsedDate,
                $lt: nextDay
            };
        }

        // Check if the time is provided, and add it to the query if it exists
        if (time) {
            query.eventTime = { $regex: time, $options: 'i' };
        }

        const events = await Event.aggregate([
            { $match: query }, // Match based on the query conditions
            {
                $project: {
                    _id: 1,
                    eventId: 1,
                    eventTitle: 1,
                    eventDescription: 1,
                    eventDate: {
                        $dateToString: {
                            format: '%d-%m-%Y', // Use '%d-%m-%Y' instead of 'DD-MM-YYYY'
                            date: '$eventDate'
                        }
                    },
                    eventTime: 1,
                    eventType: 1,
                    eventStatus: 1,
                    eventLocation: 1,
                    media: 1,
                    totalAttendee: 1
                }
            },
            { $sort: sortOption }
        ]);

        const formattedEvents = events.map((event) => {
            const { totalAttendee, ...eventWithoutTotalAttendee } = event;
            const isStudentAttending = totalAttendee ? totalAttendee.map(id => id.toString()).includes(studentdata._id.toString()) : false;

            return {
                ...eventWithoutTotalAttendee,
                StudentAttend: isStudentAttending,
            };
        });

        const filteredEvent = formattedEvents.filter(event => event.eventStatus !== 'Cancelled');

        return res.status(200).json({ success: true, status: 200, msg: 'Events retrieved successfully', events: filteredEvent });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.getEventById = async (req, res) => {
    try {
        const id = req.query.id;
        const studentId = req.user.id; // Assuming you pass studentId in the query parameters

        // Find the student by ID
        const studentdata = await Student.findById(studentId);

        if (!studentdata) {
            return res.status(404).json({ success: false, status: 404, error: 'Student not found' });
        }

        // Use the 'findById' method to find an event by its '_id' and select specific fields
        const Eventdetail = await Event.findById(id)
            .select('_id eventId eventTitle eventDescription eventDate eventTime eventType eventStatus eventLocation media eventSeats eventPriceTicket totalAttendee');

        if (!Eventdetail) {
            return res.status(404).json({ success: false, status: 404, error: 'Event detail not found' });
        }

        const isStudentAttending = Eventdetail.totalAttendee && Eventdetail.totalAttendee.includes(studentdata._id.toString());

        // Create the formattedEvent object without totalAttendee
        const { totalAttendee, ...formattedEventWithoutTotalAttendee } = Eventdetail.toObject();

        const formattedEvent = {
            ...formattedEventWithoutTotalAttendee,
            eventDate: moment(Eventdetail.eventDate).format('DD-MM-YYYY'),
            StudentAttend: isStudentAttending
        };

        if (formattedEvent.eventType === 'Paid') {
            // If the event is of type 'Paid', check if the student has attended this event
            return res.status(200).json({ success: true, status: 200, msg: 'Event Get successfully', data: formattedEvent });
        }

        // If the event is not 'Paid', remove the extra fields
        delete formattedEvent.eventSeats;
        delete formattedEvent.eventPriceTicket;

        return res.status(200).json({ success: true, status: 200, msg: 'Event Get successfully', data: formattedEvent });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.searchEvent = async (req, res) => {
    try {
        const email = req.user.email;
        const studentdata = await Student.findOne({ email });
        // Create a base query for filtering
        const filter = {};

        if (studentdata) {
            filter.studyLevel = studentdata.studyLevel;
            filter.courses = studentdata.courseEnrolled;
            filter.university = studentdata.university;
        }
        let sortOption = { eventDate: 1 };

        // Get the search value from the query parameters
        const value = req.query.value;

        // Create a dynamic query based on the 'value' in the request
        const searchQuery = {
            studyLevels: filter.studyLevel,
            university: filter.university,
            courseTypes: filter.courses,
        };
        // If a value is provided, add the search conditions
        if (value) {
            searchQuery.$or = [
                { eventTitle: { $regex: value, $options: 'i' } }, // Case-insensitive search for eventTitle
                { eventLocation: { $regex: value, $options: 'i' } },
            ];
        }
        // Use the searchQuery and sorting options to query the Event model
        const filteredEvent = await Event.find(searchQuery)
            .select('_id eventId eventTitle eventDescription eventDate eventTime eventType eventStatus eventLocation media totalAttendee')
            .sort(sortOption);

        const formattedevent = filteredEvent.map((event) => {
            const { totalAttendee, ...eventWithoutTotalAttendee } = event.toObject();
            const isStudentAttending = totalAttendee ? totalAttendee.map(id => id.toString()).includes(studentdata._id.toString()) : false;

            return {
                ...eventWithoutTotalAttendee,
                eventDate: moment(event.eventDate).format('DD-MM-YYYY'),
                StudentAttend: isStudentAttending,
            };
        });

        const filteredEvents = formattedevent.filter(event => event.eventStatus !== 'Cancelled');

        return res.status(200).json({ success: true, status: 200, msg: 'Events retrieved successfully', events: filteredEvents });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.getLatestEvent = async (req, res) => {
    try {
        const email = req.user.email;
        const studentdata = await Student.findOne({ email });

        // Create a base query for filtering
        const filter = {};

        if (studentdata) {
            filter.studyLevel = studentdata.studyLevel;
            filter.courses = studentdata.courseEnrolled;
            filter.university = studentdata.university;
        }

        // Define the sorting option to retrieve the latest event article
        const sortOption = { eventDate: 1 };

        // Use the sorting option and the filter to query the Event model to get the latest event
        const Eventdata = await Event.find({
            studyLevels: filter.studyLevel,
            university: filter.university,
            courseTypes: filter.courses
        })
            .select('_id eventId eventTitle eventDescription eventDate eventTime eventType eventStatus eventLocation media totalAttendee') // Include 'createdAt' field
            .sort(sortOption);

        if (!Eventdata) {
            return res.status(404).json({ success: false, status: 404, error: 'Latest Event article not found' });
        }

        const nonEnrolledevent = Eventdata.filter(event => event.eventStatus !== 'Cancelled');

        const formattedevent = nonEnrolledevent.slice(0, 3).map((event) => {
            const { totalAttendee, ...eventWithoutTotalAttendee } = event.toObject();
            const isStudentAttending = totalAttendee ? totalAttendee.map(id => id.toString()).includes(studentdata._id.toString()) : false;
            return {
                ...eventWithoutTotalAttendee,
                eventDate: moment(event.eventDate).format('DD-MM-YYYY'),
                StudentAttend: isStudentAttending,
            };
        })
        return res.status(200).json({ success: true, status: 200, msg: 'Latest Event retrieved successfully', data: formattedevent });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.getEventByAdmin = async (req, res) => {
    try {
        const email = req.user.email;
        const university = await University.find({ business_email: email });
        let { page, limit, searchValue } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        // Calculate the number of documents to skip
        const skip = (page - 1) * limit;
        // Create a filter object to build the search query
        let filter = { university: university[0]._id };
        if (searchValue) {
            // Define the search criteria for each field with case-insensitive search
            filter.$or = [
                { eventId: { $regex: searchValue, $options: 'i' } },
                { eventTitle: { $regex: searchValue, $options: 'i' } },
                { eventTime: { $regex: searchValue, $options: 'i' } },
                { eventType: { $regex: searchValue, $options: 'i' } },
                { eventStatus: { $regex: searchValue, $options: 'i' } },
                { 'createdBy.staffId': { $regex: searchValue, $options: 'i' } },
            ];
        }
        // Perform the lookup and filter the results
        const totalCountQuery = Event.find(filter).countDocuments(); // Query to get the total count
        // Find events based on the filter and populate the createdBy and totalAttendee fields
        const eventData = await Event.aggregate([
            {
                $lookup: {
                    from: "staffs",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "createdBy"
                },
            },
            {
                $lookup: {
                    from: "students",
                    localField: "totalAttendee",
                    foreignField: "_id",
                    as: "TotalAttendee"
                },
            },
            {
                $match: filter // Apply the filter criteria
            },
            {
                $sort: {
                    eventDate: -1 // Sort by date field in descending order (latest first)
                }
            },
            {
                $project: {
                    _id: 1,
                    eventId: 1,
                    eventTitle: 1,
                    eventDate: {
                        $dateToString: {
                            format: '%d-%m-%Y',
                            date: '$eventDate'
                        }
                    },
                    eventTime: 1,
                    eventType: 1,
                    eventStatus: 1,
                    status: 1,
                    eventSeats: 1,
                    eventPriceTicket: 1,
                    targetAudience: 1,
                    "createdBy.staffId": 1,// Include staffId from the data field
                    TotalAttendee: { $size: "$TotalAttendee.studentId" }, // Use $size to get the count
                    "studyLevel.study_name": 1,
                    "course.course_name": 1
                }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        ]);
        const totalCount = await totalCountQuery;
        return res.status(200).json({ success: true, status: 200, msg: "Event Data Successfully", data: eventData, count: totalCount });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.studentEnrollEvent = async (req, res) => {
    try {
        const email = req.user.email;
        const eventId = req.body.eventId;
        const studentdata = await Student.findOne({ email });
        const event = await Event.findById(eventId);

        if (!studentdata) {
            return res.status(404).json({ success: false, status: 404, msg: "Student not found" });
        }

        if (!event) {
            return res.status(404).json({ success: false, status: 404, msg: "Event not found" });
        }

        // Ensure event.totalAttendee is an array or initialize it as an empty array if it's undefined
        if (!Array.isArray(event.totalAttendee)) {
            event.totalAttendee = [];
        }

        // Check if the student is already enrolled in the event
        if (event.totalAttendee.includes(studentdata._id)) {
            return res.status(400).json({ success: false, status: 400, msg: "Student is already registered for this event" });
        }

        // If not already enrolled, then enroll the student
        event.totalAttendee.push(studentdata._id);
        await event.save();

        return res.status(200).json({ success: true, status: 200, msg: "Registered for the event successfully", data: event });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.studentUnenrollEvent = async (req, res) => {
    try {
        const email = req.user.email;
        const eventId = req.body.eventId;
        const studentdata = await Student.findOne({ email });
        const event = await Event.findById(eventId);

        if (!studentdata) {
            return res.status(404).json({ success: false, status: 404, msg: "Student not found" });
        }

        if (!event) {
            return res.status(404).json({ success: false, status: 404, msg: "Event not found" });
        }

        // Ensure event.totalAttendee is an array or initialize it as an empty array if it's undefined
        if (!Array.isArray(event.totalAttendee)) {
            event.totalAttendee = [];
        }

        // Check if the student is already enrolled in the event
        if (!event.totalAttendee.includes(studentdata._id)) {
            return res.status(400).json({ success: false, status: 400, msg: "Student is not registered for this event" });
        }

        // If the student is enrolled, remove them from the event
        event.totalAttendee = event.totalAttendee.filter(id => id.toString() !== studentdata._id.toString());

        await event.save();

        return res.status(200).json({ success: true, status: 200, msg: "Unenrolled from the event successfully", data: event });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.studentEnrollEventall = async (req, res) => {
    try {
        const email = req.user.email;
        const studentdata = await Student.findOne({ email });

        if (!studentdata) {
            return res.status(404).json({ success: false, status: 404, msg: "Student not found" });
        }

        const events = await Event.find({ totalAttendee: studentdata._id })
            .select('_id eventTitle eventDescription eventDate eventTime eventType eventStatus eventLocation media');

        return res.status(200).json({ success: true, status: 200, msg: 'Events retrieved successfully', events: events });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.deleteEvent = async (req, res) => {
    const { id } = req.query;
    try {
        const deleteEvent = await Event.findByIdAndDelete(id);
        if (deleteEvent == null) {
            return res.status(400).json({ success: false, status: 400, msg: "Event doesn't exist" });
        } else {
            return res.status(200).json({ success: true, status: 200, msg: "Event Deleted" });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.getEventone = async (req, res) => {
    try {
        const email = req.user.email;
        const id = req.query.id;
        const universityid = await University.findOne({ business_email: email });

        // Find the event with the given _id and the associated university
        const filter = {
            _id: new mongoose.Types.ObjectId(id),
            university: universityid._id,
        };
        const eventData = await Event.findOne(filter)
            .select('_id eventId eventTitle eventDate eventDescription targetAudience eventTime eventPriceTicket eventSeats eventType eventStatus status eventLocation media totalAttendee')
            .populate('createdBy', 'staffId -_id')
            .populate('studyLevels', 'study_name _id')
            .populate('courseTypes', 'course_name _id')
            .populate({
                path: 'totalAttendee',
                select: 'studentId firstName lastName studyLevel courseEnrolled',
                populate: [
                    { path: 'studyLevel', select: 'study_name _id' },
                    { path: 'courseEnrolled', select: 'course_name _id' }
                ]
            });

        if (!eventData) {
            return res.status(404).json({ success: false, status: 404, msg: "Event not found" });
        }

        const formattedEvent = {
            ...eventData._doc, // Include all fields from _doc
            eventDate: moment(eventData.eventDate).format('DD-MM-YYYY'), // Format eventDate
        };

        return res.status(200).json({
            success: true,
            status: 200,
            msg: "Event Data Successfully",
            data: formattedEvent,
        });


    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.statusUpdate = async (req, res) => {
    try {
        const { id, eventStatus } = req.body;
        // Check that the studentStatus is either 'active' or 'inactive'
        if (eventStatus !== 'active' && eventStatus !== 'inactive') {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid eventStatus. It should be 'active' or 'inactive'." });
        }

        // Find the student by ID
        const eventStatusdata = await Event.findById(id);


        if (!eventStatusdata) {
            return res.status(404).json({ success: false, status: 404, msg: "Event not found" });
        }

        // Check if the requested status is the same as the current status
        if (eventStatus === eventStatusdata.status) {
            return res.status(400).json({ success: false, status: 400, msg: `Event is already ${eventStatus}` });
        }

        // Define the update query
        const updateQuery = { _id: id };
        let archive = "";
        if (eventStatus == 'inactive') {
            archive = "Cancelled"
            const updateFields = { status: eventStatus, eventStatus: archive, previousEventStatus: eventStatusdata.eventStatus };
            const updatedEvent = await Event.findOneAndUpdate(updateQuery, updateFields, { new: true });

            return res.status(200).json({ success: true, status: 200, msg: 'Event status Inactive updated successfully', data: updatedEvent });
        } else if (eventStatus == 'active') {
            const updateFields = { status: eventStatus, eventStatus: eventStatusdata.previousEventStatus, };
            const updatedEvent = await Event.findOneAndUpdate(updateQuery, updateFields, { new: true });

            return res.status(200).json({ success: true, status: 200, msg: 'Event status active updated successfully', data: updatedEvent });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.updateEvent = async (req, res) => {
    try {
        const { id, eventTitle, eventDescription, eventDate, eventTime, eventType, eventSeats, eventStatus, eventLocation, studyLevels, courseTypes } = req.body;
        console.log('body', req.body)
        console.log('di', id);
        // Create an empty object to hold the fields that will be updated
        const updateFields = {};

        const formatDate = moment(eventDate, 'DD-MM-YYYY').toDate();
        const eventdate = moment(formatDate).format("YYYY-MM-DDTHH:mm:ss.SSSZ");

        const targetAudienced = req.body.targetAudience || false;
        const targetvalue = targetAudienced;

        let studyLeveldata;
        let courseTypedata;

        if (targetAudienced == 'false') {
            const studyLevelArray = studyLevels.split(',').map(id => id.trim()).filter(Boolean);
            const courseArray = courseTypes.split(',').map(id => id.trim()).filter(Boolean);

            if (studyLevelArray.length === 0 || courseArray.length === 0) {
                return res.status(400).json({ success: false, status: 400, msg: 'Study levels or courses cannot be empty' });
            }

            // Convert studyLevel and courses IDs to mongoose Schema Types
            studyLeveldata = studyLevelArray.map(id => new mongoose.Types.ObjectId(id));
            courseTypedata = courseArray.map(id => new mongoose.Types.ObjectId(id));
        }

        let url = ""; // Initialize the URL variable for image upload

        if (req.file) {
            // Assuming you have an imageUploadAws function to handle image upload
            let imageObj = await imageUploadAws(req.file, "univ-connect-profile", "event-profile");

            if (!imageObj.error) {
                url = imageObj.uploadData?.Location;
            } else {
                return res.status(400).json({ success: false, status: 400, msg: 'Image upload error', error: imageObj.error });
            }
        }
        // Check if each field is present in the request body and add it to the updateFields object if it is
        if (eventTitle) updateFields.eventTitle = eventTitle;
        if (eventDescription) updateFields.eventDescription = eventDescription;
        if (eventDate) {
            updateFields.eventDate = eventdate;
            updateFields.expiryDate = eventdate;
        }
        if (eventTime) updateFields.eventTime = eventTime;
        if (eventType) updateFields.eventType = eventType;
        if (eventStatus) updateFields.eventStatus = eventStatus;
        if (eventLocation) updateFields.eventLocation = eventLocation;
        if (eventSeats) updateFields.eventSeats = eventSeats;
        if (url) updateFields.media = url;
        if (studyLeveldata) updateFields.studyLevels = studyLeveldata;
        if (courseTypedata) updateFields.courseTypes = courseTypedata;
        if (targetvalue) updateFields.targetAudience = targetvalue;

        // Use findByIdAndUpdate to find and update the event item by its ID
        const updatedEvent = await Event.findByIdAndUpdate(id, updateFields, { new: true });

        if (!updatedEvent) {
            return res.status(404).json({ success: false, status: 404, msg: 'Event not found' });
        }

        return res.status(200).json({ success: true, status: 200, msg: 'Event updated successfully', data: updatedEvent });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

