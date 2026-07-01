const express = require('express');
const router = express.Router();
const multer = require('multer');
const wrapAsync = require('../utils/wrapAsync');
const { storage } = require('../cloudconfig');
const studentProfileController = require('../controllers/studentProfile');
const { isLoggedIn } = require('../middleware');
const upload = multer({ storage });

router.get('/new', isLoggedIn, studentProfileController.new);
router.post('/', upload.single('studentProfile[profilePhoto]'), wrapAsync(studentProfileController.create));
router.post('/update', isLoggedIn, upload.single('studentProfile[profilePhoto]'), wrapAsync(studentProfileController.update));
router.post('/photo', isLoggedIn, upload.single('profilePhoto'), wrapAsync(studentProfileController.updatePhoto));
router.post('/preferences', isLoggedIn, wrapAsync(studentProfileController.updatePreferences));
router.delete('/', isLoggedIn, wrapAsync(studentProfileController.destroy));
router.get('/', isLoggedIn, wrapAsync(studentProfileController.show));

module.exports = router;
