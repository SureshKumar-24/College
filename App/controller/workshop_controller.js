const moment = require('moment');
const imageUploadAws = require('../helper/imageUpload');
const University = require('../model/university_model');
const Student = require('../model/student_model');
const Workshop = require('../model/workshop_model');
const Staff = require('../model/staff_model');
const mongoose = require('mongoose');
const Notification = require('../model/notification_model');


module.exports.createAcademicWorkshop = async (req, res) => {
    try {
        const emailId = req.user.email; // Get the email of the currently logged-in user (Admin or Staff)

        // Extract relevant fields from the request body
        const {
            title,
            description,
            startDate,
            expiryDate,
            targetAudience,
            location,
            seats,
            time,
            studyLevels,
            courseTypes,
        } = req.body;

        const currentDate = new Date();
        const DateStore = moment(currentDate).format("YYYY-MM-DDTHH:mm:ss.SSSZ");
        const targetAudienced = req.body.targetAudience || false;
        const targetvalue = targetAudienced;

        let studyLeveldata = [];
        let courseTypedata = [];

        if (!targetAudience) {
            const studyLevelArray = studyLevels.split(',').map(id => id.trim()).filter(Boolean);
            const courseArray = courseTypes.split(',').map(id => id.trim()).filter(Boolean);

            if (studyLevelArray.length === 0 || courseArray.length === 0) {
                return res.status(400).json({ success: false, status: 400, msg: 'Study levels or courses cannot be empty' });
            }

            // Convert studyLevel and courses IDs to mongoose Schema Types
            studyLeveldata = studyLevelArray.map(id => new mongoose.Types.ObjectId(id));
            console.log('studylevels', studyLeveldata);
            courseTypedata = courseArray.map(id => new mongoose.Types.ObjectId(id));
            console.log('coursesdata', courseTypedata);
        }
        // Check if the university associated with the currently logged-in user's email exists
        const staffData = await Staff.findOne({ email: emailId });
        if (!staffData) {
            const university = await University.findOne({ business_email: emailId });
            if (!university) {
                return res.status(400).json({ success: false, status: 400, msg: 'University not found for the provided email' });
            }


            const formatstartDate = moment(startDate, 'DD-MM-YYYY').toDate();
            const startDateStore = moment(formatstartDate).format("YYYY-MM-DDTHH:mm:ss.SSSZ");

            const formatexpiryDate = moment(expiryDate, 'DD-MM-YYYY').toDate();
            const expiryDateStore = moment(formatexpiryDate).format("YYYY-MM-DDTHH:mm:ss.SSSZ");

            const duration = moment.duration(moment(expiryDateStore).diff(moment(startDateStore)));

            let result;

            if (duration.asDays() === 0) {
                result = '1 Day';
            } else if (duration.asDays() === 1) {
                result = '1 Day';
            } else if (duration.asDays() > 1 && duration.asDays() <= 30) {
                result = `${duration.asDays()} Day`;
            } else if (duration.asDays() > 30 && duration.asDays() <= 365) {
                result = `${Math.floor(duration.asDays() / 30)} Month`;
            } else {
                result = `${Math.floor(duration.asDays() / 365)} Year`;
            }

            console.log(result);
            const prefix = 'WS-';
            const randomDigits = Math.floor(10000 + Math.random() * 90000);
            const currentMonth = new Date().getMonth() + 1; // Note: Months are 0-based, so we add 1.
            const academicWorkshopId = `${prefix}${randomDigits}${currentMonth}`;
            let url = ""; // Initialize the URL variable for image upload

            if (req.file) {
                // Assuming you have an imageUploadAws function to handle image upload
                let imageObj = await imageUploadAws(req.file, "univ-connect-profile", "workshop-profile");

                if (!imageObj.error) {
                    url = imageObj.uploadData?.Location;
                } else {
                    return res.status(400).json({ success: false, status: 400, msg: 'Image upload error', error: imageObj.error });
                }
            }

            const newAcademicWorkshop = new Workshop({
                workshopId: academicWorkshopId,
                title,
                description,
                expiryDate: expiryDateStore,
                startDate: startDateStore,
                seats,
                date: DateStore,
                time,
                media: url,
                targetAudience: targetvalue,
                location,
                duration: result,
                studyLevels: studyLeveldata,
                courseTypes: courseTypedata,
                university: university._id,
                createdBy: university._id,  // Assuming the university created it
            });

            // Save the new Academic Workshop document to the database
            await newAcademicWorkshop.save();
            const notificationData = new Notification({
                title: 'New Workshop: ' + title,
                body: 'Check out the latest Workshop!',
                studyLevels: studyLeveldata,
                courseTypes: courseTypedata,
                university: university._id,
            });
            await notificationData.save();
            return res.status(201).json({ success: true, status: 201, msg: 'Academic Workshop created successfully', data: newAcademicWorkshop });
        }

        // Staff member created the workshop
        const academicWorkshopId = 'WORKSHOP-' + Math.floor(10000 + Math.random() * 90000);

        const newAcademicWorkshop = new Workshop({
            workshopId: academicWorkshopId,
            title,
            description,
            expiryDate,
            startDate,
            seats,
            date: DateStore,
            time,
            targetAudience,
            location,
            studyLevels,
            courseTypes,
            createdBy: staffData._id, // Assuming the university created it
        });

        // Save the new Academic Workshop document to the database
        await newAcademicWorkshop.save();
        const notificationData = new Notification({
            title: 'New Workshop: ' + title,
            body: 'Check out the latest Workshop!',
            studyLevels: studyLeveldata,
            courseTypes: courseTypedata,
            university: staffData.university,
        });
        await notificationData.save();
        return res.status(201).json({ success: true, status: 201, msg: 'Academic Workshop created successfully', data: newAcademicWorkshop });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, status: 500, msg: 'Internal Server Error' });
    }
};

module.exports.getWorkshop = async (req, res) => {
    try {
        let { date } = req.query;
        const email = req.user.email;
        const studentdata = await Student.findOne({ email });
        // Create a base query for filtering
        const filter = {};

        if (studentdata) {
            filter.studyLevels = studentdata.studyLevel;
            filter.courseTypes = studentdata.courseEnrolled;
            filter.university = studentdata.university;
        }

        let sortOption = { date: 1 }; // Default to sorting by workshop date in descending order (most recent workshops first)

        // Create a query object for finding workshops
        const query = {
            studyLevels: filter.studyLevels,
            university: filter.university,
            courseTypes: filter.courseTypes,
        };

        if (date) {
            const parsedDate = moment(date, 'DD-MM-YYYY').toDate();
            const nextDay = moment(parsedDate).add(1, 'days').toDate(); // To get the date range for one day

            // Use the $gte and $lt operators to match the date in the database
            query.startDate = {
                $gte: parsedDate,
                $lt: nextDay
            };
        };

        const workshop = await Workshop.find(query)
            .select('workshopId title description startDate expiryDate seats time media workshopStatus location duration totalAttendee')
            .sort(sortOption);

        const formattedworkshop = workshop.map((works) => {
            const { totalAttendee, ...workshopWithoutTotalAttendee } = works.toObject();
            const isStudentAttending = totalAttendee ? totalAttendee.map(id => id.toString()).includes(studentdata._id.toString()) : false;

            return {
                ...workshopWithoutTotalAttendee,
                startDate: moment(works.startDate).format('DD-MM-YYYY'),
                expiryDate: moment(works.expiryDate).format('DD-MM-YYYY'),
                StudentAttend: isStudentAttending,
            };
        });

        const filteredworkshop = formattedworkshop.filter(workshop => workshop.workshopStatus !== 'Cancelled');

        return res.status(200).json({ success: true, status: 200, msg: 'Workshop retrieved successfully', data: filteredworkshop });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.getWorkshopById = async (req, res) => {
    try {
        const id = req.query.id;
        const studentId = req.user.id; // Assuming you pass studentId in the query parameters

        // Find the student by ID
        const studentdata = await Student.findById(studentId);

        if (!studentdata) {
            return res.status(404).json({ success: false, status: 404, error: 'Student not found' });
        }
        // Use the 'findById' method to find an workshop by its '_id' and select specific fields
        const Workshopdetail = await Workshop.findById(id)
            .select('workshopId title description startDate expiryDate seats time media workshopStatus location duration totalAttendee');

        if (!Workshopdetail) {
            return res.status(404).json({ success: false, status: 404, error: 'Workshop detail not found' });
        }

        const isStudentAttending = Workshopdetail.totalAttendee && Workshopdetail.totalAttendee.includes(studentdata._id.toString());

        // Create the formattedEvent object without totalAttendee
        const { totalAttendee, ...formattedWorksShopWithoutTotalAttendee } = Workshopdetail.toObject();

        const formattedEvent = {
            ...formattedWorksShopWithoutTotalAttendee,
            startDate: moment(Workshopdetail.startDate).format('DD-MM-YYYY'),
            expiryDate: moment(Workshopdetail.expiryDate).format('DD-MM-YYYY'),
            StudentAttend: isStudentAttending,
        };

        return res.status(200).json({ success: true, status: 200, msg: 'Event Get successfully', data: formattedEvent });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.searchWorkshop = async (req, res) => {
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
        let sortOption = { createdAt: -1 };

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
                { title: { $regex: value, $options: 'i' } }, // Case-insensitive search for newsTitle
                { location: { $regex: value, $options: 'i' } },
                { workshopStatus: { $regex: value, $options: 'i' } },
                { duration: { $regex: value, $options: 'i' } }
            ];
        }
        // Use the searchQuery and sorting options to query the News model
        const filteredWorkshop = await Workshop.find(searchQuery)
            .select('workshopId title description startDate expiryDate seats time media workshopStatus location duration totalAttendee')
            .sort(sortOption);


        const formattedworkshop = filteredWorkshop.map((works) => {
            const { totalAttendee, ...workshopWithoutTotalAttendee } = works.toObject();
            const isStudentAttending = totalAttendee ? totalAttendee.map(id => id.toString()).includes(studentdata._id.toString()) : false;

            return {
                ...workshopWithoutTotalAttendee,
                startDate: moment(works.startDate).format('DD-MM-YYYY'),
                expiryDate: moment(works.expiryDate).format('DD-MM-YYYY'),
                StudentAttend: isStudentAttending,
            };
        });

        const filteredworkshop = formattedworkshop.filter(workshop => workshop.workshopStatus !== 'Cancelled');


        return res.status(200).json({ success: true, status: 200, msg: 'Workshop Get successfully', data: filteredworkshop });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.getLatestWorkshop = async (req, res) => {
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

        // Define the sorting option to retrieve the latest news article
        const sortOption = { date: -1 }; // Sort by the 'date' field in descending order

        // Use the sorting option and the filter to query the News model to get the latest news
        const latestWorkshop = await Workshop.findOne({
            studyLevels: filter.studyLevel,
            university: filter.university,
            courseTypes: filter.courses
        })
            .select('workshopId title description startDate expiryDate seats time media workshopStatus location duration totalAttendee')
            .sort(sortOption);

        if (!latestWorkshop) {
            return res.status(400).json({ success: false, status: 400, error: 'Workshop not found' });
        }

        // Check if the student has attended this workshop
        const isStudentAttendingWorkshop = latestWorkshop.totalAttendee.includes(studentdata._id);

        // Format the 'date' field to "13 October 2023"
        const { totalAttendee, ...formattedLatestWorkshop } = {
            ...latestWorkshop.toObject(),
            startDate: moment(latestWorkshop.startDate).format('DD-MM-YYYY'),
            expiryDate: moment(latestWorkshop.expiryDate).format('DD-MM-YYYY'),
            studentAttend: isStudentAttendingWorkshop, // Set to true or false based on attendance
        };

        return res.status(200).json({
            success: true,
            status: 200,
            msg: 'Latest workshop retrieved successfully',
            data: formattedLatestWorkshop,
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.studentEnrollWorkshop = async (req, res) => {
    try {
        const email = req.user.email;
        const WorkshopId = req.body.id;
        const studentdata = await Student.findOne({ email });
        const workshop = await Workshop.findById(WorkshopId);

        if (!studentdata) {
            return res.status(404).json({ success: false, status: 404, msg: "Student not found" });
        }

        if (!workshop) {
            return res.status(404).json({ success: false, status: 404, msg: "Workshop not found" });
        }

        // Ensure workshop.totalAttendee is an array or initialize it as an empty array if it's undefined
        if (!Array.isArray(workshop.totalAttendee)) {
            workshop.totalAttendee = [];
        }

        // Check if the student is already enrolled in the workshop
        if (workshop.totalAttendee.includes(studentdata._id)) {
            return res.status(400).json({ success: false, status: 400, msg: "Already Registered" });
        }

        // If not already enrolled, then enroll the student
        workshop.totalAttendee.push(studentdata._id);
        await workshop.save();

        return res.status(200).json({ success: true, status: 200, msg: "Registered for the workshop successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.studentUnenrollWorkshop = async (req, res) => {
    try {
        const email = req.user.email;
        const workshopId = req.body.id;
        const studentdata = await Student.findOne({ email });
        const workshop = await Workshop.findById(workshopId);

        if (!studentdata) {
            return res.status(404).json({ success: false, status: 404, msg: "Student not found" });
        }

        if (!workshop) {
            return res.status(404).json({ success: false, status: 404, msg: "Workshop not found" });
        }

        // Ensure workshop.totalAttendee is an array or initialize it as an empty array if it's undefined
        if (!Array.isArray(workshop.totalAttendee)) {
            workshop.totalAttendee = [];
        }

        // Check if the student is already enrolled in the workshop
        if (!workshop.totalAttendee.includes(studentdata._id)) {
            return res.status(400).json({ success: false, status: 400, msg: "Student is not registered for this workshop" });
        }

        // If the student is enrolled, remove them from the workshop
        workshop.totalAttendee = workshop.totalAttendee.filter(id => id.toString() !== studentdata._id.toString());

        await workshop.save();

        return res.status(200).json({ success: true, status: 200, msg: "Unenrolled from the workshop successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.studentEnrollWorkshopall = async (req, res) => {
    try {
        const email = req.user.email;
        const studentdata = await Student.findOne({ email });

        if (!studentdata) {
            return res.status(404).json({ success: false, status: 404, msg: "Student not found" });
        }

        const workshop = await Workshop.find({ totalAttendee: studentdata._id })
            .select('workshopId title description startDate expiryDate seats time media workshopStatus location');

        function formatDateField(dateField) {
            return moment(dateField).format('DD-MM-YYYY');
        }

        const formattedWorkshop = workshop.map((works) => {
            return {
                ...works.toObject(),
                startDate: formatDateField(works.startDate),
                expiryDate: formatDateField(works.expiryDate)
            };
        });

        return res.status(200).json({ success: true, status: 200, msg: 'Workshops retrieved successfully', data: formattedWorkshop });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.getallWorkshop = async (req, res) => {
    try {
        const email = req.user.email;
        const university = await University.find({ business_email: email });
        let { page, limit, searchValue } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        const skip = (page - 1) * limit;
        let filter = { university: university[0]._id };
        if (searchValue) {
            // Define the search criteria for each field with case-insensitive search
            filter.$or = [
                { workshopId: { $regex: searchValue, $options: 'i' } },
                { title: { $regex: searchValue, $options: 'i' } },
                { workshopStatus: { $regex: searchValue, $options: 'i' } },
                { duration: { $regex: searchValue, $options: 'i' } }
            ];
        }
        const totalCountQuery = Workshop.find(filter).countDocuments();
        const workshop = await Workshop.aggregate([
            {
                $lookup: {
                    from: 'students',
                    localField: 'totalAttendee',
                    foreignField: '_id',
                    as: 'totalAttendee'
                }
            },
            {
                $match: filter
            },
            {
                $sort: {
                    startDate: -1
                }
            },
            {
                $project:
                {
                    workshopId: 1,
                    title: 1,
                    description: 1,
                    startDate: 1,
                    expiryDate: 1,
                    seats: 1,
                    time: 1,
                    date: 1,
                    workshopStatus: 1,
                    targetAudience: 1,
                    status: 1,
                    location: 1,
                    duration: 1
                }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        ]);

        const workshopdata = workshop.map((works) => {
            return {
                ...works,
                startDate: moment(works.startDate).format('DD-MM-YYYY'),
                expiryDate: moment(works.expiryDate).format('DD-MM-YYYY'),
                date: moment(works.date).format('DD-MM-YYYY')
            }
        });
        const totalCount = await totalCountQuery;
        return res.status(200).json({ success: true, status: 200, msg: "All Get Workshop Successfully", data: workshopdata, count: totalCount });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.admingetworkshopId = async (req, res) => {
    try {
        const id = req.query.id;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid workshop ID" });
        }

        const email = req.user.email;
        const university = await University.findOne({ business_email: email });

        if (!university) {
            return res.status(404).json({ success: false, status: 404, msg: "University not found" });
        }

        const filter = {
            _id: new mongoose.Types.ObjectId(id),
            university: university._id,
        };

        const workshop = await Workshop.findOne(
            filter).select('_id  workshopId title description startDate expiryDate seats time date workshopStatus targetAudience status media media location duration')
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

        if (!workshop) {
            return res.status(404).json({ success: false, status: 404, msg: "workshop not found" });
        }

        const formattedEvent = {
            ...workshop._doc, // Include all fields from _doc
            startDate: moment(workshop.startDate).format('DD-MM-YYYY'),
            expiryDate: moment(workshop.expiryDate).format('DD-MM-YYYY'),
            date: moment(workshop.date).format('DD-MM-YYYY'),
        };

        return res.status(200).json({ success: true, status: 200, msg: "Get One Workshop Successfully", data: formattedEvent });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.deleteWorkshop = async (req, res) => {
    const { id } = req.query;
    try {
        const deleteworkshop = await Workshop.findByIdAndDelete(id);
        if (deleteworkshop == null) {
            return res.status(400).json({ success: false, status: 400, msg: "workshop doesn't exist" });
        } else {
            return res.status(200).json({ success: true, status: 200, msg: "Workshop Deleted" });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.updateWorkshop = async (req, res) => {
    try {
        const { id, title, description, startDate, expiryDate, seats, time, status, location, studyLevels, courseTypes } = req.body;
        // Create an empty object to hold the fields that will be updated
        const updateFields = {};
        let studyLeveldata;
        let courseTypedata;

        const targetAudienced = req.body.targetAudience || false;


        const formatstartDate = moment(startDate, 'DD-MM-YYYY').toDate();
        const startDateStore = moment(formatstartDate).format("YYYY-MM-DDTHH:mm:ss.SSSZ");

        const formatexpiryDate = moment(expiryDate, 'DD-MM-YYYY').toDate();
        const expiryDateStore = moment(formatexpiryDate).format("YYYY-MM-DDTHH:mm:ss.SSSZ");

        const duration = moment.duration(moment(expiryDateStore).diff(moment(startDateStore)));

        let result;

        if (duration.asDays() === 0) {
            result = '1 Day';
        } else if (duration.asDays() === 1) {
            result = '1 Day';
        } else if (duration.asDays() > 1 && duration.asDays() <= 30) {
            result = `${duration.asDays()} Day`;
        } else if (duration.asDays() > 30 && duration.asDays() <= 365) {
            result = `${Math.floor(duration.asDays() / 30)} Month`;
        } else {
            result = `${Math.floor(duration.asDays() / 365)} Year`;
        }

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

        //Initialize the URL variable for image upload
        let url = "";

        if (req.file) {
            // Assuming you have an imageUploadAws function to handle image upload
            let imageObj = await imageUploadAws(req.file, "univ-connect-profile", "workshop-profile");

            if (!imageObj.error) {
                url = imageObj.uploadData?.Location;
            } else {
                return res.status(400).json({ success: false, status: 400, msg: 'Image upload error', error: imageObj.error });
            }
        }

        // Check if each field is present in the request body and add it to the updateFields object if it is
        if (title) updateFields.title = title;
        if (description) updateFields.description = description;
        if (startDate) updateFields.startDate = startDateStore;
        if (expiryDate) updateFields.expiryDate = expiryDateStore;
        if (seats) updateFields.seats = seats;
        if (time) updateFields.time = time;
        if (targetAudienced) updateFields.targetAudience = targetAudienced;
        if (status) updateFields.status = status;
        if (url) updateFields.media = url;
        if (location) updateFields.location = location;
        if (studyLeveldata) updateFields.studyLevels = studyLeveldata;
        if (courseTypedata) updateFields.courseTypes = courseTypedata;
        if (startDate && expiryDate) {
            updateFields.duration = result;
        }

        // Use findByIdAndUpdate to find and update the workshop item by its ID
        const updatedWorkshop = await Workshop.findByIdAndUpdate(id, updateFields, { new: true });

        if (!updatedWorkshop) {
            return res.status(404).json({ success: false, status: 404, msg: 'Workshop not found' });
        }

        return res.status(200).json({ success: true, status: 200, msg: 'Workshop updated successfully', data: updatedWorkshop });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.statusUpdate = async (req, res) => {
    try {
        const { id, status } = req.body;
        // Check that the studentStatus is either 'active' or 'inactive'
        if (status !== 'active' && status !== 'inactive') {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid Workshop Status. It should be 'active' or 'inactive'." });
        }

        // Find the student by ID
        const workShopStatusdata = await Workshop.findById(id);


        if (!workShopStatusdata) {
            return res.status(404).json({ success: false, status: 404, msg: "Workshop not found" });
        }

        // Check if the requested status is the same as the current status
        if (status === workShopStatusdata.status) {
            return res.status(400).json({ success: false, status: 400, msg: `Workshop is already ${workShopStatusdata.status}` });
        }

        // Define the update query
        const updateQuery = { _id: id };
        let archive = "";
        if (status == 'inactive') {
            archive = "Cancelled"

            const updateFields = { status: status, workshopStatus: archive, previousWorkStatus: workShopStatusdata.workshopStatus };

            const updatedWorkshop = await Workshop.findOneAndUpdate(updateQuery, updateFields, { new: true });

            return res.status(200).json({ success: true, status: 200, msg: 'Workshop status Inactive updated successfully', data: updatedWorkshop });
        } else if (status == 'active') {

            const updateFields = { status: status, workshopStatus: workShopStatusdata.previousWorkStatus };

            const updatedWorkshop = await Workshop.findOneAndUpdate(updateQuery, updateFields, { new: true });

            return res.status(200).json({ success: true, status: 200, msg: 'Workshop status active updated successfully', data: updatedWorkshop });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};
