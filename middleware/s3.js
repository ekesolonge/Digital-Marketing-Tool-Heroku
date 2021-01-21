const aws = require("aws-sdk");
const fs = require("fs");

const upload = (req, res, next) => {
  aws.config.setPromisesDependency();
  aws.config.update({
    accessKeyId: process.env.ACCESSKEYID,
    secretAccessKey: process.env.SECRETACCESSKEY,
    region: process.env.REGION,
  });
  const s3 = new aws.S3();
  var params = {
    ACL: "public-read",
    Bucket: process.env.BUCKET_NAME,
    Body: fs.createReadStream(req.file.path),
    Key: `profile_pictures/${req.file.filename}`,
  };

  s3.upload(params, (err, data) => {
    if (err) {
      res.status(400).send("Internal Server Error");
    }

    if (data) {
      fs.unlinkSync(req.file.path); // Empty temp folder
      req.filePath = data.Location;
      next();
    }
  });
};

module.exports = upload;
