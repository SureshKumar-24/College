"use strict";
const s3 = require("./upload_file");
async function deleteFile(bucketName, filekey) {
    const params = {
      Bucket: bucketName,
      Key: filekey,
    };
  try {
    const deletedObj=await s3.deleteObject(params).promise();
    console.log(deletedObj);
    if(deletedObj){
        console.log("Deleted File");
        return {
            error:null,
            succes:true
        };
    }
    console.log("Deleted File Failed");
    return {
        error:"File deletion failed",
        succes:false
    };
  } catch (err) {
    console.log("Error:",err)
    return {
        error:err,
        succes:false
    };
  }
}
module.exports = deleteFile