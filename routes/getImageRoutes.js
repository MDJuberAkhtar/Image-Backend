const express = require('express');
const getImageUtility = require('./../utilities/getImageUtility');
const auth = require('./../common/auth');
const router = express.Router()

router.get('/', getImageUtility.getAllImages);
router.post('/upload',auth, getImageUtility.upload.single('image'), getImageUtility.uploadImage);
router.delete('/deletefile/:fileName', auth, getImageUtility.deleteImage)


module.exports = router