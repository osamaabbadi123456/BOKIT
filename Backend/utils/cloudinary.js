//import Cloudinary core and storage adapter
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

//configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//define storage strategy for multer to upload files into Cloudinary
const pitchStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: "bokit/pitches",
      allowed_formats: ["jpg", "jpeg", "png"],
    };
  },
});
const userStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "bokit/users",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

//export both the cloudinary instance and storage config
module.exports = {
  cloudinary,
  pitchStorage,
  userStorage,
};
