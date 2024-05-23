const { Semester, Subject, ListSemester } = require('../model/semester_model');
const University = require('../model/university_model');
const mongoose = require('mongoose');

module.exports.addSemester = async (req, res) => {
    try {
        const emailid = req.user.email;
        const university = await University.findOne({ business_email: emailid });

        if (!university) {
            return res.status(404).json({ success: false, status: 404, msg: 'University not found' });
        }
        const { semesterNumber, courseTypes, studyLevel } = req.body;


        const semestersToAdd = Array.from({ length: semesterNumber }, (_, index) => ({
            semesterNumber: index + 1,
            courseTypes: courseTypes,
            studyLevel: studyLevel,
            university: university._id
        }));

        const AddSemesterdetail = new ListSemester({
            courseTypes: courseTypes,
            studyLevel: studyLevel,
            length: semesterNumber,
            university: university._id
        });

        const addedSemesters = await Semester.insertMany(semestersToAdd);
        await AddSemesterdetail.save();

        return res.status(201).json({
            success: true,
            status: 201,
            msg: `${semesterNumber} Semester(s) Added Successfully`,
            data: addedSemesters,
            data1: AddSemesterdetail
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.getAllSemesterList = async (req, res) => {
    try {
        const emailid = req.user.email;
        const university = await University.findOne({ business_email: emailid });

        if (!university) {
            return res.status(404).json({ success: false, status: 404, msg: 'University not found' });
        }

        const study_id = req.query.study_id;

        if (study_id && !mongoose.isValidObjectId(study_id)) {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid ID" });
        }


        if (!study_id) {
            const findSemester = await ListSemester.find({ university: university._id }).select('length')
                .populate('studyLevel', 'study_name _id')
                .populate('courseTypes', 'course_name _id');
            return res.status(200).json({ success: true, status: 200, msg: "Get All Semester Data", data: findSemester });
        } else {
            const findSemester = await ListSemester.find({ university: university._id, studyLevel: study_id }).select('length')
                .populate('studyLevel', 'study_name _id')
                .populate('courseTypes', 'course_name _id');
            return res.status(200).json({ success: true, status: 200, msg: "Get All Semester Data", data: findSemester });
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.deleteAllSemester = async (req, res) => {
    try {
        const emailid = req.user.email;
        const university = await University.findOne({ business_email: emailid });

        if (!university) {
            return res.status(400).json({ success: false, status: 400, msg: 'University not found' });
        }

        const study_id = req.query.study_id;

        if (study_id && !mongoose.isValidObjectId(study_id)) {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid ID" });
        }

        const deleteSemester = await ListSemester.find({ studyLevel: study_id, university: university._id }).select('length');

        if (deleteSemester.length === 0) {
            await ListSemester.deleteOne({ studyLevel: study_id });
            return res.status(200).json({ success: true, status: 200, msg: "Semesters deleted successfully" });
        } else {
            return res.status(400).json({ success: false, status: 400, msg: "StudyLevel Contains Semester Value" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

module.exports.EditSemester = async (req, res) => {
    try {
        const emailid = req.user.email;
        const university = await University.findOne({ business_email: emailid });

        if (!university) {
            return res.status(404).json({ success: false, status: 404, msg: 'University not found' });
        }

        const { courseTypes, studyLevel } = req.query;

        const semesterdata = await Semester.find({ courseTypes: courseTypes, studyLevel: studyLevel, university: university._id });

        // Find the maximum semesterNumber
        const maxSemesterNumber = semesterdata.reduce((max, semester) => {
            return Math.max(max, semester.semesterNumber);
        }, 0);

        return res.status(200).json({
            success: true,
            status: 200,
            msg: "Semester List Edit Successfully",
            data: semesterdata,
            maxSemesterNumber: maxSemesterNumber
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.EditSingleSemester = async (req, res) => {
    try {
        const emailid = req.user.email;
        const university = await University.findOne({ business_email: emailid });

        if (!university) {
            return res.status(404).json({ success: false, status: 404, msg: 'University not found' });
        }

        const { semesterNumber, courseTypes, studyLevel } = req.body;
        console.log('ddddd', semesterNumber, courseTypes, studyLevel);
        let Semesterdetail = await ListSemester.findOne({
            courseTypes: courseTypes,
            studyLevel: studyLevel,
            university: university._id
        });
        console.log('Semeteter', Semesterdetail);
        if (!Semesterdetail) {
            return res.status(404).json({ success: false, status: 404, msg: 'Semester not found' });
        }

        if (semesterNumber == 1) {
            console.log('Semeteter', Semesterdetail.length);
            const newSemesterNumber = Semesterdetail.length + 1;

            const Semesteradd = new Semester({
                courseTypes: courseTypes,
                studyLevel: studyLevel,
                university: university._id,
                semesterNumber: newSemesterNumber
            });

            Semesterdetail.length = newSemesterNumber;

            await Semesterdetail.save();
            await Semesteradd.save();
            return res.status(200).json({ success: true, status: 200, msg: 'Semester updated successfully', data: Semesteradd });
        } else if (semesterNumber == -1) {
            if (Semesterdetail.length > 1) {
                // Find and delete the last semester
                const lastSemester = await Semester.findOneAndDelete({
                    courseTypes: courseTypes,
                    studyLevel: studyLevel,
                    university: university._id
                }).sort({ semesterNumber: -1 });

                Semesterdetail.length -= 1;
                await Semesterdetail.save();
                return res.status(200).json({ success: true, status: 200, msg: 'Semester updated successfully', data: lastSemester });
            }
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

//Subject Module
module.exports.getAllSemesteronSubject = async (req, res) => {
    try {
        const { course_id } = req.query;

        const emailid = req.user.email;
        const university = await University.findOne({ business_email: emailid });

        if (!university) {
            return res.status(400).json({ success: false, status: 400, msg: 'University not found' });
        }

        if (course_id && !mongoose.isValidObjectId(course_id)) {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid ID" });
        }
        const FindAllSemester = await Semester.find({ courseTypes: course_id, university: university._id }).select('semesterNumber');
        return res.status(200).json({ success: true, status: 200, msg: "Semester Get Successfully", data: FindAllSemester });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

module.exports.addSubject = async (req, res) => {
    try {
        const { id, name } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: true, status: 400, msg: 'Invalid Semester Id' });
        }

        // Make sure name is an array
        const namesArray = Array.isArray(name) ? name : [name];

        // Create an array to store the objects for each subject
        const subjectsArray = [];

        // Iterate over namesArray and create an object for each subject
        namesArray.forEach((subjectName) => {
            subjectsArray.push({
                subject_name: subjectName,
                semester: id
            });
        });

        // Use insertMany to insert all subjects at once
        const result = await Subject.insertMany(subjectsArray);
        if (!result) {
            return res.status(400).json({ success: false, status: 400, msg: "Subject Can't Added" });
        }
        return res.status(200).json({ success: true, status: 200, msg: 'Subjects added successfully', data: result });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

module.exports.getAllSubjectListing = async (req, res) => {
    try {
        const { course_id } = req.query;
        const emailid = req.user.email;

        const university = await University.findOne({ business_email: emailid });

        if (!university) {
            return res.status(400).json({ success: false, status: 400, msg: 'University not found' });
        }

        if (course_id && !mongoose.isValidObjectId(course_id)) {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid ID" });
        }

        if (!course_id) {
            const SemesterList = await Semester.find({ university: university._id }).select('semesterNumber')
                .populate('studyLevel', 'study_name _id')
                .populate('courseTypes', 'course_name _id');
            return res.status(200).json({ success: true, status: 200, msg: "Semester with Subject Get Successfully", data: SemesterList });
        }
        else {
            const SemesterList = await Semester.find({ courseTypes: course_id, university: university._id }).select('semesterNumber')
                .populate('studyLevel', 'study_name _id')
                .populate('courseTypes', 'course_name _id');
            return res.status(200).json({ success: true, status: 200, msg: "Semester with Subject Get Successfully", data: SemesterList });
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

module.exports.getAllSubject = async (req, res) => {
    try {
        const semester_id = req.query.semester_id;
        if (!mongoose.isValidObjectId(semester_id)) {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid ID" });
        }
        const Subjectdata = await Subject.find({ semester: semester_id }).select('subject_name');
        return res.status(200).json({ success: false, status: 200, msg: 'Subject Get Successfully', data: Subjectdata })
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

module.exports.deleteSubject = async (req, res) => {
    try {
        const subject_id = req.query.subject_id;

        if (!mongoose.isValidObjectId(subject_id)) {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid ID" });
        }

        const SubjectDelete = await Subject.findByIdAndDelete(subject_id);
        if (!SubjectDelete) {
            return res.status(400).json({ success: false, status: 400, msg: "Subject don't exist" });
        }
        return res.status(200).json({ success: false, status: 400, msg: "Subject Data Deleted" })
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

module.exports.updateSubject = async (req, res) => {
    try {
        let subjectsToUpdate;

        // Check if the request body contains an array of subjects or a single subject
        if (Array.isArray(req.body)) {
            // Update multiple subjects
            subjectsToUpdate = req.body;
        } else {
            // Update a single subject
            const { subject_id, name } = req.body;

            if (!mongoose.isValidObjectId(subject_id)) {
                return res.status(400).json({ success: false, status: 400, msg: "Invalid ID" });
            }

            subjectsToUpdate = [{ _id: subject_id, subject_name: name }];
        }

        // Update subjects in the database
        const updatedSubjects = await Promise.all(subjectsToUpdate.map(async (subject) => {
            try {
                const { _id, subject_name } = subject;
                if (!mongoose.isValidObjectId(_id)) {
                    throw new Error(`Invalid ID for subject: ${subject_name}`);
                }

                const subjectUpdate = await Subject.findByIdAndUpdate(_id, { subject_name }, { new: true });
                if (!subjectUpdate) {
                    throw new Error(`Subject not found: ${subject_name}`);
                }

                return {
                    success: true, status: 200, msg: "Subject updated successfully"
                };
            } catch (error) {
                return { success: false, status: 400, msg: error.message };
            }
        }));
        return res.status(200).json({ success: true, status: 200, msg: "Subjects Updated Successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, status: 500, msg: error.message });
    }
};

