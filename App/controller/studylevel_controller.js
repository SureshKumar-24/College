const StudyLevel = require('../model/studylevel_model');
const Course = require('../model/course_model');
const University = require('../model/university_model');
const mongoose = require('mongoose');
// Create a new study level
module.exports.createStudyLevel = async (req, res) => {
    try {
        const { study_name } = req.body;
        const email = req.user.email;

        // Check if the study level already exists
        console.log('study_name', study_name);
        const university = await University.findOne({ business_email: email });

        const newStudyLevel = new StudyLevel({
            study_name,
            university: university._id // Initialize the universities array with the current university
        });

        await newStudyLevel.save();
        university.studyLevels = newStudyLevel._id;
        await university.save();

        return res.status(200).json({ success: true, status: 200, msg: 'Study level created successfully', studyLevel: newStudyLevel });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.getAllStudyLevelsByUniversity = async (req, res) => {
    try {
        const email = req.user.email;

        // Find the university document based on the user's email
        const university = await University.findOne({
            business_email: email
        });

        if (!university) {
            return res.status(404).json({ success: false, status: 404, msg: 'University not found' });
        }

        // Find all study levels that belong to the found university,
        // projecting only the desired fields using the `select` option
        const studyLevels = await StudyLevel.find(
            {
                university: university._id
            },
            {
                _id: 1,
                study_name: 1,
                courseTypes: 1, // Include course types
            }
        ).populate({
            path: 'courseTypes',
            select: {
                _id: 1,
                course_name: 1,
            }
        });

        return res.status(200).json({ success: true, status: 200, studyLevels });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.getStudy = async (req, res) => {
    try {
        const email = req.user.email;
        const university = await University.findOne({ business_email: email });

        if (!university) {
            return res.status(404).json({ success: false, status: 404, msg: 'University not found for the given email' });
        }

        const studylevel = await StudyLevel.find({ university: university._id }).select('_id study_name');

        return res.status(200).json({ success: true, status: 200, msg: "Study Level Retrieve", data: studylevel });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.createCourse = async (req, res) => {
    try {
        const { course_name, studyLevelId } = req.body; // Assuming studyLevelId is provided in the request

        const studyLevel = await StudyLevel.findById(studyLevelId);

        if (!studyLevel) {
            return res.status(400).json({ success: false, status: 400, msg: 'Invalid studyLevelId' });
        }

        const newCourse = new Course({
            course_name,
            studyLevels: studyLevelId
        });

        await newCourse.save();

        // Add the new course's ID to the courses field of the existing StudyLevel
        studyLevel.courseTypes.push(newCourse._id);
        await studyLevel.save();

        return res.status(201).json({ success: true, status: 201, msg: 'Course created successfully', data: newCourse });
    }catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.allcourse = async (req, res) => {
    try {
        const studyid = req.body.id;
        const coursedata = await Course.find({ studyLevels: studyid }).select('-studyLevels -__v');

        const studylevelname = await StudyLevel.findById(studyid).select('study_name -_id');
        if (!coursedata) {
            return res.status(400).json({ success: false, status: 400, msg: "Study Level Not Correct" });
        } else {
            return res.status(200).json({ success: true, status: 200, msg: "Course Data Reterive", data: coursedata, studyName: studylevelname });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.deleteCourse = async (req, res) => {
    const { id } = req.query;
    try {
        const deleteCourse = await Course.findByIdAndDelete(id);
        if (deleteCourse == null) {
            return res.status(400).json({ success: false, status: 400, msg: "Course doesn't exist" });
        } else {
            return res.status(200).json({ success: true, status: 200, msg: "Course Deleted" });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

module.exports.deleteStudy = async (req, res) => {
    const { id } = req.query;
    try {
        const deleteStudy = await StudyLevel.findByIdAndDelete(id);
        if (deleteStudy == null) {
            return res.status(400).json({ success: false, status: 400, msg: "Study Level doesn't exist" });
        } else {
            return res.status(200).json({ success: true, status: 200, msg: "Study Level Deleted" });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

module.exports.courseToStudylevel = async (req, res) => {
    try {
        const studyarr = req.body.studyIds; // Assuming studyIds is an array of strings in the request body
        const studyIdsAsObjectId = studyarr.map(id => new mongoose.Types.ObjectId(id));

        const data = await StudyLevel.find({ _id: { $in: studyIdsAsObjectId } })
            .select('-_id -study_name -university -__v')
            .populate('courseTypes', '_id course_name');

        // Restructure the data
        const restructuredData = data.map(studyLevel => studyLevel.courseTypes);
        const flattenedData = restructuredData.reduce((acc, val) => acc.concat(val), []);

        return res.status(200).json({ success: true, status: 200, msg: "Courses Retrieved Successfully", data: flattenedData });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}
