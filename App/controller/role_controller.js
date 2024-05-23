const Department = require('../model/department_model');
const Role = require('../model/role_model');
const Course = require('../model/course_model');


module.exports.departmentregister = async (req, res) => {
    try {
        const { courseId, name } = req.body;
        const newdept = new Department({
            name,
        });
        await newdept.save();
        await Course.findByIdAndUpdate(courseId, {
            $push: { departments: newdept._id },
        });
        return res.status(200).json({ success: true, status: 200, msg: "Department Created Successfully", data: newdept, });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

module.exports.getDepartment = async (req, res) => {
    try {
        const id = req.query.id;
        const course = await Course.findById(id).populate('departments', '_id name');
        const departments = course.departments; // Extract the departments from the course object
        return res.status(200).json({ success: true, status: 200, msg: "Department get Successfully", data: departments });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

module.exports.roleregister = async (req, res) => {
    try {
        const { departmentId, name } = req.body;
        const newrole = new Role({
            name,
        });
        await newrole.save();
        await Department.findByIdAndUpdate(departmentId, {
            $push: { roles: newrole._id },
        });
        return res.status(200).json({ success: true, status: 200, msg: "Department Created Successfully", data: newrole, });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

module.exports.getrole = async (req, res) => {
    try {
        const { id } = req.query;
        const roledata = await Department.findById(id).populate('roles','-__v');
        const data = roledata.roles;
        return res.status(200).json({ success: true, status: 200, msg: "Role get Successfully", data: data });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}