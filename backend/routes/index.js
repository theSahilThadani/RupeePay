const express = require('express')
const UserRouter = require('./user')
const AccountRouter = require('./account')



const router = express.Router()

router.use('/user',UserRouter);
router.use('/account',AccountRouter);

module.exports = router;