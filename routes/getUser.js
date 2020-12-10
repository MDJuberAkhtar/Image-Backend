const express = require('express');
const getUser = require('./../utilities/getUserUtility.js');
const auth = require('./../common/auth');
const router = express.Router();

router.get('/users', auth, getUser.getAllUser);
router.post('/signup', getUser.createUser);
router.post('/login', getUser.logUser);
// router.delete('/deleteuser/:email', getUser.deleteUser);

module.exports = router

