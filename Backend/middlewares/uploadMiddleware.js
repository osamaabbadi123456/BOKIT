//modules
const multer = require("multer");
const { pitchStorage, userStorage } = require("../utils/cloudinary"); //import Cloudinary storage

//custom file filter for validating allowed MIME types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); //accept the file
  } else {
    //reject with a plain Error, not a MulterError
    cb(new Error("Only JPG, JPEG, and PNG formats are allowed"), false);
  }
};

//create the multer instance with storage and custom filter
const uploadPitch = multer({
  storage: pitchStorage, //determine where/how pitch images are store
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});
const uploadUser = multer({
  storage: userStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

//export the upload middleware
module.exports = {
  uploadPitch,
  uploadUser,
};
