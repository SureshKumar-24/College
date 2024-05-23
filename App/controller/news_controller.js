const moment = require('moment');
const imageUploadAws = require('../helper/imageUpload');
const News = require('../model/news_model');
const University = require('../model/university_model');
const Student = require('../model/student_model');
const Staff = require('../model/staff_model');
const NewsCategory = require('../model/news-category_model');
const mongoose = require('mongoose');
const Notification = require('../model/notification_model');

module.exports.createNews = async (req, res) => {
    try {
        const emailid = req.user.email; // Get the email of the currently logged-in user (Admin or Staff)

        // Extract relevant fields from the request body
        const {
            categoryname,
            newsTitle,
            expiryDate,
            newsDescription,
            studyLevel,
            targetAudience, // Assuming this is an array of StudyLevel IDs
            courses,    // Assuming this is an array of Course IDs
        } = req.body;


        const targetAudienced = req.body.targetAudience || false;
        const targetvalue = targetAudienced;

        let studyLeveldata = [];
        let courseTypedata = [];
        console.log('target audien', targetAudience);
        if (targetAudienced == 'false') {
            const studyLevelArray = studyLevel.split(',').map(id => id.trim()).filter(Boolean);
            const courseArray = courses.split(',').map(id => id.trim()).filter(Boolean);

            if (studyLevelArray.length === 0 || courseArray.length === 0) {
                return res.status(400).json({ success: false, status: 400, msg: 'Study levels or courses cannot be empty' });
            }
            // Convert studyLevel and courses IDs to mongoose Schema Types
            studyLeveldata = studyLevelArray.map(id => new mongoose.Types.ObjectId(id));
            courseTypedata = courseArray.map(id => new mongoose.Types.ObjectId(id));
        }

        // Check if the university associated with the currently logged-in user's email exists
        const Staffdata = await Staff.findOne({ email: emailid });
        if (!Staffdata) {
            const university = await University.findOne({ business_email: emailid });

            if (!university) {
                return res.status(404).json({ success: false, status: 404, msg: 'University not found' });
            }
            const currentDate = new Date();
            const DateStore = moment(currentDate).format("YYYY-MM-DDTHH:mm:ss.SSSZ"); // Format the date as required

            // Parse the expiryDate into a JavaScript Date object
            const formatDate = moment(expiryDate, 'DD-MM-YYYY').toDate();

            // Format the date as required
            const expiryDateStore = moment(formatDate).format("YYYY-MM-DDTHH:mm:ss.SSSZ");

            const prefix = 'NS-';
            const randomDigits = Math.floor(10000 + Math.random() * 90000);
            const currentMonth = new Date().getMonth() + 1;
            const newsId = `${prefix}${randomDigits}${currentMonth}`;

            let url = ""; // Initialize the URL variable for image upload

            if (req.file) {
                // Assuming you have an imageUploadAws function to handle image upload
                let imageObj = await imageUploadAws(req.file, "univ-connect-profile", "news-profile");

                if (!imageObj.error) {
                    url = imageObj.uploadData?.Location;
                } else {
                    return res.status(400).json({ success: false, status: 400, msg: 'Image upload error', error: imageObj.error });
                }
            }
            // Create a new News document with the uploaded image URL and the current date
            const newNews = new News({
                newsId: newsId,
                categoryname,
                newsTitle,
                expiryDate: expiryDateStore,
                newsDescription,
                targetAudience: targetvalue,
                media: url,
                date: DateStore, // Set the date to the current date and time
                studyLevels: studyLeveldata, // Populate the studyLevels array
                courseTypes: courseTypedata,   // Populate the courseTypes array
                university: university._id,
            });

            // Save the new News document to the database
            await newNews.save();
            const notificationData = new Notification({
                title: 'New News: ' + title,
                body: 'Check out the latest News!',
                studyLevels: studyLeveldata,
                courseTypes: courseTypedata,
                university: university._id,
            });
            await notificationData.save();

            return res.status(201).json({ success: true, status: 201, msg: 'News created successfully', data: newNews });

        }
        // Capture the current date and time
        const currentDate = new Date();
        const date = moment(currentDate).format("D MMMM YYYY");
        const prefix = 'NEWS-';
        const randomDigits = Math.floor(10000 + Math.random() * 90000);
        const currentMonth = new Date().getMonth() + 1;
        const newsId = `${prefix}${randomDigits}${currentMonth}`;
        // Create a new News document with the uploaded image URL and the current date
        const newNews = new News({
            newsId: newsId,
            categoryname,
            newsTitle,
            expiryDate,
            newsDescription,
            media: mediaUrl,
            selectAll: selectAllValue,
            date: date, // Set the date to the current date and time
            studyLevels: studyLevel, // Populate the studyLevels array
            courseTypes: courses,   // Populate the courseTypes array
            university: Staffdata.university,
            createdBy: Staffdata._id
        });

        // Save the new News document to the database
        await newNews.save();

        const notificationData = new Notification({
            title: 'New News: ' + title,
            body: 'Check out the latest News!',
            studyLevels: studyLeveldata,
            courseTypes: courseTypedata,
            university: Staffdata.university,
        });
        await notificationData.save();
        return res.status(201).json({ success: true, status: 201, msg: 'News created successfully', data: newNews });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.getNews = async (req, res) => {
    try {
        let { categoryname, date, dateString } = req.query;

        const email = req.user.email;
        const studentdata = await Student.findOne({ email });

        // Create a base query for filtering
        const filter = {};

        if (studentdata) {
            filter.studyLevel = studentdata.studyLevel;
            filter.courses = studentdata.courseEnrolled;
            filter.university = studentdata.university;
        }

        // Create a base query for filtering based on the category
        let categoryFilter = {};
        if (categoryname) {
            const categories = categoryname.split(','); // Split comma-separated categories into an array
            categoryFilter = { categoryname: { $in: categories } };
        }
        console.log('categoryfilter', categoryFilter);

        let sortOption = { date: -1 };

        if (dateString === 'Oldest') {
            sortOption = { date: 1 }; // Sort by oldest first
        }

        // Create a query object for finding news items
        const query = {
            ...categoryFilter,
            studyLevels: filter.studyLevel, // Adjust the filtering for studyLevels
            university: filter.university,
            courseTypes: filter.courses, // Adjust the filtering for courseTypes
        };
        console.log('query', query);
        if (date) {
            const parsedDate = moment(date, 'DD-MM-YYYY').toDate();
            const nextDay = moment(parsedDate).add(1, 'days').toDate(); // To get the date range for one day

            // Use the $gte and $lt operators to match the date in the database
            query.date = {
                $gte: parsedDate,
                $lt: nextDay
            };
        }


        const filteredNews = await News.aggregate([
            { $match: query }, // Use aggregation framework for filtering
            {
                $project: {
                    _id: 1,
                    newsTitle: 1,
                    newsDescription: 1,
                    date: {
                        $dateToString: {
                            format: '%d-%m-%Y',
                            date: '$date'
                        }
                    },
                    media: 1,
                    categoryname: 1
                }
            },
            { $sort: sortOption }
        ]);

        return res.status(200).json({ success: true, status: 200, msg: 'News Get successfully', news: filteredNews });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.getNewsById = async (req, res) => {
    try {
        const id = req.body.id;

        // Use the 'findById' method to find a news article by its '_id' and select specific fields
        const newsArticle = await News.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(id) } }, // Match based on the provided ID
            {
                $project: {
                    _id: 1,
                    categoryname: 1,
                    newsTitle: 1,
                    newsDescription: 1,
                    media: 1,
                    date: {
                        $dateToString: {
                            format: '%d-%m-%Y',
                            date: '$date'
                        }
                    },
                }
            }
        ]);

        if (!newsArticle || newsArticle.length === 0) {
            return res.status(404).json({ success: false, status: 404, error: 'News article not found' });
        }

        // Extract the first (and only) element from the array
        const formattedNewsArticle = newsArticle[0];

        return res.status(200).json({ success: true, status: 200, msg: 'News Get successfully', news: formattedNewsArticle });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.getLatestNews = async (req, res) => {
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
        const latestNews = await News.aggregate([
            {
                $match: {
                    studyLevels: filter.studyLevel,
                    university: filter.university,
                    courseTypes: filter.courses
                }
            },
            {
                $project: {
                    _id: 1,
                    categoryname: 1,
                    newsTitle: 1,
                    newsDescription: 1,
                    media: 1,
                    date: {
                        $dateToString: {
                            format: '%d-%m-%Y',
                            date: '$date'
                        }
                    },
                }
            },
            { $sort: sortOption },
            { $limit: 1 } // Limit to one result, as we want the latest news
        ]);

        if (!latestNews || latestNews.length === 0) {
            return res.status(404).json({ success: false, status: 404, error: 'Latest news article not found' });
        }

        // Extract the first (and only) element from the array
        const formattedLatestNews = latestNews[0];

        return res.status(200).json({ success: true, status: 200, msg: 'Latest news retrieved successfully', news: formattedLatestNews });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

module.exports.searchNews = async (req, res) => {
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
                { newsTitle: { $regex: value, $options: 'i' } }, // Case-insensitive search for newsTitle
                { categoryname: { $regex: value, $options: 'i' } }
            ];
        }

        // Use the searchQuery and sorting options to query the News model
        const formattedNews = await News.aggregate([
            { $match: searchQuery }, // Match based on the search conditions
            {
                $project: {
                    _id: 1,
                    categoryname: 1,
                    newsTitle: 1,
                    newsDescription: 1,
                    media: 1,
                    date: {
                        $dateToString: {
                            format: '%d-%m-%Y',
                            date: '$date'
                        }
                    },
                }
            },
            { $sort: sortOption }
        ]);

        // Ensure that formattedNews is an array
        if (!formattedNews || formattedNews.length === 0) {
            return res.status(404).json({ success: false, status: 404, error: 'No matching news found' });
        }

        return res.status(200).json({ success: true, status: 200, msg: 'News retrieved successfully', news: formattedNews });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

module.exports.createCategory = async (req, res) => {
    try {
        const name = req.body.name;
        const category = new NewsCategory({
            category_name: name
        });
        await category.save();
        return res.status(201).json({ success: true, status: 201, msg: 'News-Category created successfully', data: category });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

module.exports.getNewsCategory = async (req, res) => {
    try {
        const newsCateData = await NewsCategory.find().select('_id category_name');
        return res.status(200).json({ success: true, status: 200, msg: "Category Retrieve Successfully", data: newsCateData });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

module.exports.getallNews = async (req, res) => {
    try {
        const email = req.user.email;
        let { page, limit, searchValue } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        // Calculate the number of documents to skip
        const skip = (page - 1) * limit;

        const university = await University.findOne({ business_email: email });
        const filter = {
            university: university._id
        };

        if (searchValue) {
            // Define the search criteria for each field with case-insensitive search
            filter.$or = [
                { newsTitle: { $regex: searchValue, $options: 'i' } },
                { categoryname: { $regex: searchValue, $options: 'i' } },
                { newsDescription: { $regex: searchValue, $options: 'i' } },
                { media: { $regex: searchValue, $options: 'i' } },
                // { date: { $regex: searchValue, $options: 'i' } },
                { "studyLevel.study_name": { $regex: searchValue, $options: 'i' } },
                { "course.course_name": { $regex: searchValue, $options: 'i' } },
            ];
        }

        const totalCountQuery = News.find(filter).countDocuments(); // Query to get the total count
        const newsdata = await News.aggregate([
            {
                $lookup: {
                    from: 'studylevels',
                    localField: 'studyLevels',
                    foreignField: '_id',
                    as: 'studyLevel'
                }
            },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'courseTypes',
                    foreignField: '_id',
                    as: 'course'
                }
            },
            {
                $match: filter // Apply the filter criteria
            },
            {
                $sort: {
                    date: -1 // Sort by date field in descending order (latest first)
                }
            },
            {
                $project: {
                    newsId: 1,
                    newsTitle: 1,
                    categoryname: 1,
                    newsDescription: 1,
                    media: 1,
                    date: {
                        $dateToString: {
                            format: '%d-%m-%Y', // Use '%d-%m-%Y' instead of 'DD-MM-YYYY'
                            date: '$date'
                        }
                    },
                    expiryDate: {
                        $dateToString: {
                            format: '%d-%m-%Y', // Use '%d-%m-%Y' instead of 'DD-MM-YYYY'
                            date: '$expiryDate'
                        }
                    },
                    status: 1,
                    targetAudience: 1,
                    "studyLevel.study_name": 1,
                    "course.course_name": 1
                }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            },
        ]);

        // No need for a separate formatDateField function
        const formattedNewsData = newsdata;

        // Check if there are news articles
        if (!formattedNewsData || formattedNewsData.length === 0) {
            return res.status(404).json({ success: false, status: 404, error: 'No matching news found' });
        }

        const totalCount = await totalCountQuery; // Execute the count query to get the total count

        return res.status(200).json({
            success: true,
            status: 200,
            msg: "News Retrieve Successfully",
            data: formattedNewsData,
            count: totalCount
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

module.exports.getoneNews = async (req, res) => {
    try {
        const id = req.query.id;
        const email = req.user.email;
        const university = await University.findOne({ business_email: email });
        const filter = {
            _id: new mongoose.Types.ObjectId(id), // Corrected usage, no 'new' keyword
            university: university._id,
        };
        const newsdata = await News.aggregate([
            {
                $match: filter // Apply the filter criteria
            },
            {
                $lookup: {
                    from: 'studylevels',
                    localField: 'studyLevels',
                    foreignField: '_id',
                    as: 'studyLevel'
                }
            },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'courseTypes',
                    foreignField: '_id',
                    as: 'course'
                }
            },
            {
                $project: {
                    newsId: 1,
                    newsTitle: 1,
                    categoryname: 1,
                    newsDescription: 1,
                    media: 1,
                    date: {
                        $dateToString: {
                            format: '%d-%m-%Y', // Use '%d-%m-%Y' instead of 'DD-MM-YYYY'
                            date: '$date'
                        }
                    },
                    expiryDate: {
                        $dateToString: {
                            format: '%d-%m-%Y', // Use '%d-%m-%Y' instead of 'DD-MM-YYYY'
                            date: '$expiryDate'
                        }
                    },
                    status: 1,
                    targetAudience: 1,
                    "studyLevel": 1,
                    "course": 1
                }
            },
        ]);

        const findCategory = await NewsCategory.findOne({ category_name: newsdata[0].categoryname }).select('_id category_name');

        return res.status(200).json({ success: true, status: 200, msg: "News Retrieve Successfully", data: newsdata, category: findCategory });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

module.exports.deleteNews = async (req, res) => {
    const { id } = req.query;
    try {
        const deleteNews = await News.findByIdAndDelete(id);
        if (deleteNews == null) {
            return res.status(400).json({ success: false, status: 400, msg: "News doesn't exist" });
        } else {
            return res.status(200).json({ success: true, status: 200, msg: "News Deleted" });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

module.exports.updateNews = async (req, res) => {
    try {
        const { id, categoryname, newsTitle, expiryDate, newsDescription, studyLevel, courses } = req.body;

        // You should validate the incoming data to ensure it's in the correct format.

        // Find the news item by its ID
        const existingNews = await News.findById(id);

        if (!existingNews) {
            return res.status(404).json({ success: false, status: 404, msg: 'News not found' });
        }

        const targetAudienced = req.body.targetAudience || false;
        const targetvalue = targetAudienced;

        let studyLeveldata;
        let courseTypedata;

        if (targetAudienced == 'false') {
            const studyLevelArray = studyLevel.split(',').map(id => id.trim()).filter(Boolean);
            const courseArray = courses.split(',').map(id => id.trim()).filter(Boolean);

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
            let imageObj = await imageUploadAws(req.file, "univ-connect-profile", "news-profile");

            if (!imageObj.error) {
                url = imageObj.uploadData?.Location;
            } else {
                return res.status(400).json({ success: false, status: 400, msg: 'Image upload error', error: imageObj.error });
            }
        }
        // Create an update object with the fields that are present in the request body
        const updateFields = {};

        if (categoryname) updateFields.categoryname = categoryname;
        if (newsTitle) updateFields.newsTitle = newsTitle;
        if (expiryDate) {
            const formatDate = moment(expiryDate, 'DD-MM-YYYY').toDate();
            updateFields.expiryDate = moment(formatDate).format("YYYY-MM-DDTHH:mm:ss.SSSZ");
        }
        if (newsDescription) updateFields.newsDescription = newsDescription;
        if (studyLeveldata) updateFields.studyLevels = studyLeveldata;
        if (courseTypedata) updateFields.courseTypes = courseTypedata;
        if (url) updateFields.media = url;
        if (targetvalue) updateFields.targetAudience = targetvalue;

        // Update the news item with the fields that were present in the request
        const updatedNews = await News.findByIdAndUpdate(id, updateFields, { new: true });

        return res.status(200).json({ success: true, status: 200, msg: 'News updated successfully', data: updatedNews });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.statusUpdate = async (req, res) => {
    try {
        const { id, newsStatus } = req.body;

        // Check that the studentStatus is either 'active' or 'inactive'
        if (newsStatus !== 'active' && newsStatus !== 'inactive') {
            return res.status(400).json({ success: false, status: 400, msg: "Invalid NewsStatus. It should be 'active' or 'inactive'." });
        }

        // Find the student by ID
        const newsStatusdata = await News.findById(id);

        if (!newsStatusdata) {
            return res.status(404).json({ success: false, status: 404, msg: "News not found" });
        }

        // Check if the requested status is the same as the current status
        if (newsStatus === newsStatusdata.status) {
            return res.status(400).json({ success: false, status: 400, msg: `News is already ${newsStatus}` });
        }

        // Define the update query
        const updateQuery = { _id: id };

        // Define the update fields
        const updateFields = { status: newsStatus };

        // Use findOneAndUpdate to update the student's status
        const updatedNews = await News.findOneAndUpdate(updateQuery, updateFields, { new: true });

        return res.status(200).json({ success: true, status: 200, msg: 'News status updated successfully', data: updatedNews });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};
