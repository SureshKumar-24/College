const AWS = require('aws-sdk');
require("aws-sdk/lib/maintenance_mode_message").suppress = true;

const s3 = new AWS.S3({
  accessKeyId: "AKIA3F35TRDH7CRANPP5",
  secretAccessKey: "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",
  region: "us-east-1"
});

module.exports = s3;