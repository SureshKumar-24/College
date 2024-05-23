// const multerMiddleware = require("../middlewares/multer");
const s3 = require("./upload_file");

async function imageUpload(req, bucketName, key) {
  try {
    const allowedMimeTypes = ["image/png", "image/jpg", "image/jpeg","application/pdf"];
    let uploadImageType;

    if (Array.isArray(req)) {
      // If req is an array, use the first element's mimetype
      uploadImageType = req[0].mimetype;
      console.log('Arraymimetype', req[0].mimetype);
    } else {
      // If req is not an array, use req.mimetype
      uploadImageType = req.mimetype;
      console.log('singlemimetype', req.mimetype);
    }

    if (!allowedMimeTypes.includes(uploadImageType)) {
      console.log("Invalid mime");
      return {
        error: "Invalid Mime Type",
        status: false,
      };
    }

    const timestamp = new Date().getTime();
    const uniqueFilename = `${timestamp}-${Array.isArray(req) ? req[0].originalname : req.originalname}`;
    const objectKey = `${key}/${uniqueFilename}`;

    const uploadParams = {
      Bucket: bucketName,
      Key: objectKey,
      Body: Array.isArray(req) ? req[0].buffer : req.buffer,
      ContentType: uploadImageType,
    };

    const uploadData = await s3.upload(uploadParams).promise();

    if (!uploadData) {
      console.log("Empty upload data");
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
    console.log(err);
    return {
      error: err,
      status: false,
    };
  }
}


module.exports = imageUpload;
