// const multerMiddleware = require("../middlewares/multer");
const s3 = require("./upload_file");

async function generalUpload(req, bucketName, key,type) {
  try {
    const allowedFileTypes = {
      assignment: ["image/png", "image/jpg", "image/jpeg", "application/pdf" ],//"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" later may gona add it 
      image: ["image/png", "image/jpg", "image/jpeg"],
    };

    if (!allowedFileTypes[type]) {
      console.log("Invalid type specified");
      return {
        error: "Invalid file type specified",
        status: false,
      };
    }

    const allowedMimeTypes = allowedFileTypes[type];
    const uploadFileType = req.mimetype;

    if (!allowedMimeTypes.includes(uploadFileType)) {
      console.log("File Type Doesn't Match The Specified Format");
      return {
        error: `File is not a valid ${type} Format`,
        status: false,
      };
    }

    const timestamp = new Date().getTime();
    const uniqueFilename = `${timestamp}-${req.originalname}`;
    let objectKey = `${key}/${uniqueFilename}`;
    const uploadParams = {
      Bucket: bucketName,
      Key: objectKey,
      Body: req.buffer,
      ContentType: uploadFileType,
    };
    // console.log(uploadParams,"upload params")
    const uploadData = await s3.upload(uploadParams).promise();
    // console.log(uploadData);
    if (!uploadData) {
      console.log("empty upload data");
      return {
        error: "Unable to upload File",
        status: false,
      };
    }
    return {
      error: null,
      uploadData,
    };
  } catch (err) {
    // console.log(err);
    return {
      error: err,
      status: false,
    };
  }
}

module.exports = generalUpload;
