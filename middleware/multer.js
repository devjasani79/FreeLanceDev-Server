const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: (req, file) => {
      if (req.baseUrl.includes("gigs")) {
        return 'freelancehub/gigs';
      }
      return 'freelancehub/users';
    },
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});


const upload = multer({ storage });
module.exports = upload;
