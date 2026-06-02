const { upload } = require('../config/cloudinary');

const uploadSingle = upload.single('image');
const uploadMultiple = upload.array('images', 5);

module.exports = {
  uploadSingle,
  uploadMultiple
};
