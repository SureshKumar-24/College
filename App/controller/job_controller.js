const moment = require('moment');
const imageUploadAws = require('../helper/imageUpload');
const University = require('../model/university_model');
const Student = require('../model/student_model');
const Job = require('../model/job_model');
const Staff = require('../model/staff_model');
const mongoose = require('mongoose');
const Notification = require('../model/notification_model');

module.exports.createAcademicJob = async (req, res) => {
    try {
        const emailId = req.user.email; // Get the email of the currently logged-in user (Admin or Staff)

        // Extract relevant fields from the request body
        const {
            targetAudience,
            jobType,
            position,
            description,
            eligibility_criteria,
            totalVacancies,
            location,
            LastDate,
            payScale,
            studyLevels,
            courseTypes,
            title,
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
            courseTypedata = courseArray.map(id => new mongoose.Types.ObjectId(id));
        }
        // Check if the university associated with the currently logged-in user's email exists
        const staffData = await Staff.findOne({ email: emailId });
        if (!staffData) {
            const university = await University.findOne({ business_email: emailId });
            if (!university) {
                return res.status(400).json({ success: false, status: 400, msg: 'University not found for the provided email' });
            }
            console.log('LastDate', LastDate);
            const lastDate = moment(LastDate, 'DD-MM-YYYY').toDate();
            console.log('LastDatewithdate', lastDate);
            const LastDateStore = moment(lastDate).format("YYYY-MM-DDTHH:mm:ss.SSSZ");

            const prefix = 'JF-';
            const randomDigits = Math.floor(10000 + Math.random() * 90000);
            const currentMonth = new Date().getMonth() + 1; // Note: Months are 0-based, so we add 1.
            const jobId = `${prefix}${randomDigits}${currentMonth}`;
            let url = ""; // Initialize the URL variable for image upload

            if (req.file) {
                // Assuming you have an imageUploadAws function to handle image upload
                let imageObj = await imageUploadAws(req.file, "univ-connect-profile", "job-profile");

                if (!imageObj.error) {
                    url = imageObj.uploadData?.Location;
                } else {
                    return res.status(400).json({ success: false, status: 400, msg: 'Image upload error', error: imageObj.error });
                }
            }

            const newJob = new Job({
                jobId,
                title,
                targetAudience: targetvalue,
                media: url,
                jobType,
                position,
                description,
                totalVacancies,
                jobDate: LastDate,
                LastDate: LastDate,
                location,
                eligibility_criteria,
                payScale,
                studyLevels: studyLeveldata,
                courseTypes: courseTypedata,
                university: university._id
            });

            // Save the new Academic Workshop document to the database
            await newJob.save();
            const notificationData = new Notification({
                title: 'New Job: ' + title,
                body: 'Check out the latest Job!',
                studyLevels: studyLeveldata,
                courseTypes: courseTypedata,
                university: university._id,
            });
            await notificationData.save();
            return res.status(201).json({ success: true, status: 201, msg: 'Job Feed created successfully', data: newJob });
        }

        // Staff member created the job
        const academicWorkshopId = 'WORKSHOP-' + Math.floor(10000 + Math.random() * 90000);

        const newAcademicWorkshop = new Workshop({
            jobId: academicWorkshopId,
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
            title: 'New Job: ' + title,
            body: 'Check out the latest Job!',
            studyLevels: studyLeveldata,
            courseTypes: courseTypedata,
            university: staffData.university,
        });
        await notificationData.save();
        return res.status(201).json({ success: true, status: 201, msg: 'Academic Workshop created successfully', data: newAcademicWorkshop });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.getJob = async (req, res) => {
    try {
        let { JobType, date } = req.query;
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
        let jobTypeFilter = {};
        if (JobType) {
            jobTypeFilter = { jobType: JobType };
        }

        // Create a query object for finding events
        const query = {
            ...jobTypeFilter,
            studyLevels: filter.studyLevels,
            university: filter.university,
            courseTypes: filter.courseTypes,
        };

        let sortOption = { LastDate: 1 };
        // Check if the date is provided, and add it to the query if it exists
        if (date) {
            const parsedDate = moment(date, 'DD-MM-YYYY').toDate();
            const nextDay = moment(parsedDate).add(1, 'days').toDate(); // To get the date range for one day

            // Use the $gte and $lt operators to match the date in the database
            query.LastDate = {
                $gte: parsedDate,
                $lt: nextDay
            };
        }


        const jobs = await Job.find(query)
            .select('_id jobId media jobType position totalVacancies LastDate location totalApplicationsReceived description eligibility_criteria payScale submittedBy title')
            .sort(sortOption);

        const formattedJobs = jobs.map((job) => {
            const isStudentAttending = job.submittedBy.some(submission => submission.name.equals(studentdata._id));

            const { submittedBy, ...jobWithoutsubmittedBy } = job.toObject();

            return {
                ...jobWithoutsubmittedBy,
                LastDate: moment(job.LastDate).format('DD-MM-YYYY'),
                StudentAttend: isStudentAttending,
            };
        });

        return res.status(200).json({ success: true, status: 200, msg: 'Job retrieved successfully', data: formattedJobs });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.getJobById = async (req, res) => {
    try {
        const id = req.query.id;
        const email = req.user.email;
        const studentdata = await Student.findOne({ email });
        // Use the 'findById' method to find an job by its '_id' and select specific fields
        const jobdetail = await Job.findById(id)
            .select('_id jobId media jobType position totalVacancies LastDate location totalApplicationsReceived description eligibility_criteria payScale title submittedBy')

        if (!jobdetail) {
            return res.status(400).json({ success: false, status: 400, error: 'Job detail not found' });
        }
        const isStudentAttending = jobdetail.submittedBy.some(submission => submission.name.equals(studentdata._id));
        const { submittedBy, ...formattedWorksShopWithoutSubmittedBy } = jobdetail.toObject();

        const formattedJob = {
            ...formattedWorksShopWithoutSubmittedBy,
            LastDate: moment(jobdetail.LastDate).format('DD-MM-YYYY'),
            StudentAttend: isStudentAttending
        };


        return res.status(200).json({ success: true, status: 200, msg: 'Job Feed Get successfully', data: formattedJob });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.searchJob = async (req, res) => {
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
        let sortOption = { LastDate: 1 };


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
                { title: { $regex: value, $options: 'i' } },
                { jobType: { $regex: value, $options: 'i' } }, // Case-insensitive search for newsTitle
                { position: { $regex: value, $options: 'i' } },
                { location: { $regex: value, $options: 'i' } },
            ];
        }
        // Use the searchQuery and sorting options to query the News model
        const jobs = await Job.find(searchQuery)
            .select('_id jobId media jobType position totalVacancies LastDate location totalApplicationsReceived description eligibility_criteria payScale submittedBy title')
            .sort(sortOption);

        const formattedJobs = jobs.map((job) => {
            const isStudentAttending = job.submittedBy.some(submission => submission.name.equals(studentdata._id));

            const { submittedBy, ...jobWithoutsubmittedBy } = job.toObject();

            return {
                ...jobWithoutsubmittedBy,
                LastDate: moment(job.LastDate).format('DD-MM-YYYY'),
                StudentAttend: isStudentAttending,
            };
        });

        return res.status(200).json({ success: true, status: 200, msg: 'Job Get successfully', data: formattedJobs });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.getLatestJob = async (req, res) => {
    try {
        const email = req.user.email;
        const studentdata = await Student.findOne({ email });

        // Create a base query for filtering
        const baseFilter = {};

        if (studentdata) {
            baseFilter.studyLevels = studentdata.studyLevel;
            baseFilter.courseTypes = studentdata.courseEnrolled;
            baseFilter.university = studentdata.university;
        }

        // Create a query object for finding events
        const query = {
            studyLevels: baseFilter.studyLevels,
            university: baseFilter.university,
            courseTypes: baseFilter.courseTypes,
        };

        let sortOption = { createdAt: -1 };

        // Fetch the latest active job
        const latestJob = await Job.findOne({ ...query, status: 'active' })
            .select('_id jobId media jobType position totalVacancies LastDate location totalApplicationsReceived description eligibility_criteria payScale title submittedBy')
            .sort(sortOption);

        if (!latestJob) {
            // If no active jobs, try to find the latest job with any status
            const latestJobAnyStatus = await Job.findOne(query)
                .select('_id jobId media jobType position totalVacancies LastDate location totalApplicationsReceived description eligibility_criteria payScale title submittedBy')
                .sort(sortOption);

            if (latestJobAnyStatus) {
                // Check if the student has submitted an application for this job
                const isStudentAttendingAnyStatus = latestJobAnyStatus.submittedBy.some(submission => submission.name.equals(studentdata._id));

                // Format the latest job response without the submittedBy field
                const { submittedBy, ...formattedLatestJobAnyStatus } = latestJobAnyStatus.toObject();
                delete formattedLatestJobAnyStatus.submittedBy; // Remove the submittedBy field
                formattedLatestJobAnyStatus.LastDate = moment(latestJobAnyStatus.LastDate).format('DD-MM-YYYY');
                formattedLatestJobAnyStatus.StudentAttend = isStudentAttendingAnyStatus; // Set to true or false based on submission

                return res.status(200).json({
                    success: true,
                    status: 200,
                    msg: 'Latest job retrieved successfully',
                    data: formattedLatestJobAnyStatus,
                });

            } else {
                return res.status(404).json({ success: false, status: 404, msg: 'No jobs found' });
            }
        }

        const isStudentAttendingAnyStatus = latestJob.submittedBy.some(submission => submission.name.equals(studentdata._id));

        // Format the latest job response without the submittedBy field
        const { submittedBy, ...formattedLatestJobAnyStatus } = latestJob.toObject();
        delete formattedLatestJobAnyStatus.submittedBy; // Remove the submittedBy field
        formattedLatestJobAnyStatus.LastDate = moment(latestJob.LastDate).format('DD-MM-YYYY');
        formattedLatestJobAnyStatus.StudentAttend = isStudentAttendingAnyStatus; // Set to true or false based on submission

        return res.status(200).json({
            success: true,
            status: 200,
            msg: 'Latest job retrieved successfully',
            data: formattedLatestJobAnyStatus,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.studentEnrollJob = async (req, res) => {
    try {
        const email = req.user.email;
        const id = req.body.id;
        const studentdata = await Student.findOne({ email });
        const job = await Job.findById(id);

        let url = ""; // Initialize the URL variable for image upload

        if (req.file) {
            console.log('file', req.file);
            // Assuming you have an imageUploadAws function to handle image upload
            let imageObj = await imageUploadAws(req.file, "univ-connect-profile", "student-resume");

            if (!imageObj.error) {
                url = imageObj.uploadData?.Location;
            } else {
                return res.status(400).json({ success: false, status: 400, msg: 'Image upload error', error: imageObj.error });
            }
        }

        if (!studentdata) {
            return res.status(404).json({ success: false, status: 404, msg: "Student not found" });
        }

        if (!job) {
            return res.status(404).json({ success: false, status: 404, msg: "Job not found" });
        }

        // Check if the student is already enrolled in the job
        const isEnrolled = job.submittedBy.some(submission => submission.name.equals(studentdata._id));

        if (isEnrolled) {
            return res.status(400).json({ success: false, status: 400, msg: "Already Registered" });
        }

        // If not already enrolled, then enroll the student
        job.submittedBy.push({
            name: studentdata._id,
            file: url,
        });
        job.totalApplicationsReceived += 1;
        await job.save();

        return res.status(200).json({ success: true, status: 200, msg: "Registered for the job successfully", data: job });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

//Admin Side Api
module.exports.getallJob = async (req, res) => {
    try {
        const email = req.user.email;
        const university = await University.find({ business_email: email });
        let { page, limit, searchValue } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        const skip = (page - 1) * limit;
        let filter = { university: university[0]._id };
        if (searchValue) {
            filter.$or = [
                { jobId: { $regex: searchValue, $options: 'i' } },
                { jobType: { $regex: searchValue, $options: 'i' } },
                { position: { $regex: searchValue, $options: 'i' } },
                { title: { $regex: searchValue, $options: 'i' } }
            ];
        }

        const totalCountQuery = Job.find(filter).countDocuments();
        const Jobdata = await Job.aggregate([
            {
                $match: filter
            },
            {
                $sort: {
                    LastDate: 1,
                }
            },
            {
                $project: {
                    jobId: 1,
                    jobType: 1,
                    position: 1,
                    totalVacancies: 1,
                    LastDate: 1,
                    status: 1,
                    title: 1,
                    createdBy: 1,
                    // totalApplicationsReceived: { $size: '$totalAttendee' }, // Count of totalAttendee array
                    targetAudience: 1,
                }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        ]);

        const jobfilterdata = Jobdata.map((job) => {
            return {
                ...job,
                LastDate: moment(job.LastDate).format('DD-MM-YYYY'),
            };
        });

        const totalCount = await totalCountQuery;
        return res.status(200).json({ success: true, status: 200, msg: "All Get Job Successfully", data: jobfilterdata, count: totalCount });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.admingetjobId = async (req, res) => {
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

        const Jobdata = await Job.findOne(filter)
            .select('_id jobId media jobType position totalVacancies LastDate location totalApplicationsReceived description eligibility_criteria targetAudience payScale totalAttendee status title')
            .populate('studyLevels', 'study_name _id')
            .populate('courseTypes', 'course_name _id')
            .populate({
                path: 'submittedBy.name',
                select: 'studentId firstName lastName studyLevel courseEnrolled',
                populate: [
                    { path: 'studyLevel', select: 'study_name _id' },
                    { path: 'courseEnrolled', select: 'course_name _id' }
                ],
            });

        if (!Jobdata) {
            return res.status(404).json({ success: false, status: 404, msg: "Job not found" });
        }


        const totalApplicationsReceived = Jobdata.submittedBy.length;

        const jobDetails = {
            ...Jobdata._doc,
            LastDate: moment(Jobdata.LastDate).format('DD-MM-YYYY'),
            totalApplicationsReceived: totalApplicationsReceived,
        };

        return res.status(200).json({
            success: true,
            status: 200,
            msg: "Job Data Successfully",
            data: jobDetails,
        });

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
            return res.status(400).json({ success: false, status: 400, msg: "Invalid JobStatus. It should be 'active' or 'inactive'." });
        }

        // Find the student by ID
        const jobStatus = await Job.findById(id);

        if (!jobStatus) {
            return res.status(404).json({ success: false, status: 404, msg: "Job not found" });
        }

        // Check if the requested status is the same as the current status
        if (status === jobStatus.status) {
            return res.status(400).json({ success: false, status: 400, msg: `Job is already ${status}` });
        }
        // Define the update query
        const updateQuery = { _id: id };
        // Define the update fields
        const updateFields = { status: status };

        // Use findOneAndUpdate to update the student's status
        const updatedJob = await Job.findOneAndUpdate(updateQuery, updateFields, { new: true });

        return res.status(200).json({ success: true, status: 200, msg: 'Job status updated successfully', data: updatedJob });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.updateJob = async (req, res) => {
    try {
        const { id, jobType, position, title, totalVacancies, LastDate, location, description, eligibility_criteria, payScale, studyLevels, courseTypes } = req.body;

        // Create an empty object to hold the fields that will be updated
        const updateFields = {};

        const formatDate = moment(LastDate, 'DD-MM-YYYY').toDate();
        const joblastdate = moment(formatDate).format("YYYY-MM-DDTHH:mm:ss.SSSZ");

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
            let imageObj = await imageUploadAws(req.file, "univ-connect-profile", "job-profile");

            if (!imageObj.error) {
                url = imageObj.uploadData?.Location;
            } else {
                return res.status(400).json({ success: false, status: 400, msg: 'Image upload error', error: imageObj.error });
            }
        }
        // Check if each field is present in the request body and add it to the updateFields object if it is
        if (jobType) updateFields.jobType = jobType;
        if (title) updateFields.title = title;
        if (position) updateFields.position = position;
        if (totalVacancies) updateFields.totalVacancies = totalVacancies;
        if (location) updateFields.location = location;
        if (description) updateFields.description = description;
        if (eligibility_criteria) updateFields.eligibility_criteria = eligibility_criteria;
        if (url) updateFields.media = url;
        if (payScale) updateFields.payScale = payScale;
        if (targetvalue) updateFields.targetAudience = targetvalue;
        if (studyLeveldata) updateFields.studyLevels = studyLeveldata;
        if (courseTypedata) updateFields.courseTypes = courseTypedata;
        if (joblastdate) updateFields.LastDate = joblastdate;

        // Use findByIdAndUpdate to find and update the event item by its ID
        const updatedJob = await Job.findByIdAndUpdate(id, updateFields, { new: true });

        if (!updatedJob) {
            return res.status(404).json({ success: false, status: 404, msg: 'Job not found' });
        }
        return res.status(200).json({ success: true, status: 200, msg: 'Job updated successfully', data: updatedJob });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};
