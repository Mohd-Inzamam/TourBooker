const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const { uploadSingle, uploadMultiple } = require('../middlewares/upload.middleware');
const { uploadSingleImage, uploadMultipleImages } = require('../controllers/upload.controller');

// Protect all upload routes and restrict to operators and admins
router.use(protect);
router.use(authorizeRoles('operator', 'admin'));

router.post('/single', uploadSingle, uploadSingleImage);
router.post('/multiple', uploadMultiple, uploadMultipleImages);

module.exports = router;
