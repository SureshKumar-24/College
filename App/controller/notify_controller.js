

const Token = require('../model/notify_model');
const Student = require('../model/student_model');
var admin = require("firebase-admin");
var serviceAccount = require("../../service_account_key.json");
// Check if the default app is already initialized
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const imageUploadAws = require('../helper/imageUpload');

module.exports.storefcm = async (req, res) => {
    try {
        const userid = req.user.id;
        const token = req.body.token;
        console.log('token------------', token);
        let matchingTokenFound = false;

        // Find the existing FcmToken document for the user
        const storefcmtoken = await Token.find({ user: userid });

        storefcmtoken.forEach((tokens) => {
            if (tokens.fcmtoken === token) {
                matchingTokenFound = true;
            }
        });

        if (matchingTokenFound) {
            return res.status(400).json({ success: false, status: 400, msg: "Token Can't Be the Same" });
        } else {
            const newFcmToken = await Token.create({
                user: userid,
                fcmtoken: token
            });
            return res.status(200).json({ success: true, status: 200, msg: "Token Saved Successfully", data: newFcmToken });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
};

module.exports.sendNotification = async (req, res) => {
    try {
        const userid = req.user.id;
        const studentdata = await Student.findById(userid).select('status');
        console.log('studentdata', studentdata);
        const token = await Token.find({ user: userid });
        console.log('token---------', token);
        if (studentdata.status !== 'inactive') {
            token.forEach(async (user) => {
                let message = {
                    notification: {
                        title: "Hello From UnivConnect👋👋", body: `UnivConnect platforms manages the University Management`,
                    },
                    token: user.fcmtoken
                };
                try {
                    await admin.messaging().send(message);
                } catch (error) {
                    console.log('error--------', error);
                    if (error.code === "messaging/registration-token-not-registered") {
                        // Handle token not registered error
                        const expiredToken = user.fcmtoken;
                        console.log('tokenexpired-----------', expiredToken)
                        await Token.deleteMany({ fcmtoken: expiredToken });
                        console.log('deletefcmtokenSuccesffuly');
                    } else {
                        // Handle other FCM errors
                        console.log('Error sending FCM notification:', error);
                    }
                }
            });
            return res.status(200).json({ success: true, status: 200, msg: "Message send successfully" });
        }
        else {
            return res.status(400).json({ success: false, status: 400, msg: "Student Inactive" });
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}

module.exports.sendNotificationByUser = async (req, res) => {
    try {
        const userid = req.user.id;
        const studentdata = await Student.findById(userid).select('status');

        const { title, body, token } = req.body;
        console.log('title', title);
        console.log('body', body);
        console.log('token', token);
        let url = ""; // Initialize the URL variable

        if (req.file) {
            let imageObj = await imageUploadAws(req.file, "univ-connect-profile", "notification-profile");
            if (!imageObj.error) {
                url = imageObj.uploadData?.Location;
            } else {
                return res.status(400).json({ error: imageObj.error });
            }
        }
        console.log('url----------', url);
        if (studentdata.status !== 'inactive') {
            let message = {
                notification: {
                    title: title,
                    body: body
                },
                token: token
            };
            if (url) {
                message.notification.image = url;
            }
            try {
                const tokenmessage = await admin.messaging().send(message);
                return res.status(200).json({ success: true, status: 200, msg: "Message sent successfully", });
            } catch (error) {
                console.log('error', error);
                return res.status(400).json({ success: false, status: 400, error: error });
            }
        } else {
            return res.status(400).json({ success: false, status: 400, msg: "Student is inactive" });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, status: 500, msg: error.msg });
    }
}


