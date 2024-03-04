const express = require('express');
const router = express.Router()
const zod = require('zod')
const jwt = require('jsonwebtoken')
const {JWT_SECRET} = require('../config')
const {User,Account} = require('../db/db')
const bcrypt = require("bcrypt");
const  { authMiddleware } = require("../middleware/middleware");

//zod validation bodys
const SignupValidations = zod.object({
    username:zod.string().email().min(3).max(40),
    firstName:zod.string().min(1).max(20),
    lastName: zod.string().min(1).max(20),
    password: zod.string().min(8).max(20),
})

const signinValidations = zod.object({
    username:zod.string().email(),
    password:zod.string().min(3).max(20)
})

//using hashing of password in [project] and implemting hasing in mongodb function

//create hashing function
const CreateHashPassword = async (password) => {
    const saltrounds = 10;
    const salt = await bcrypt.genSalt(saltrounds);
    return await bcrypt.hash(password,salt)
}
// Validating the candidate password with stored hash and hash function

const ValidatePassword = async (password, password_Hashed) => {
    // console.log(password)
    return await bcrypt.compare(password, password_Hashed);
}



//created User signup route for signup
router.post('/signup',async(req,res)=>{
    const {success } = SignupValidations.safeParse(req.body);
    if(!success ){
        return res.status(411).json({
            msg:"Incorrect inputs"
        })
    }

    const IfUserExits = await User.findOne({
        username:req.body.username
    })
    console.log(IfUserExits)
    if(IfUserExits){
        return res.status(411).json({
            msg:'User Already Exits'
        })
    }
    const HashedPass = await CreateHashPassword(req.body.password)
    const createUser = await User.create({
        username: req.body.username,
        password_Hashed: HashedPass,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
    })
    const userId = createUser._id;
    const JwtToken = jwt.sign({
        userId,
    },JWT_SECRET)
    //creating account / wallet with 0 balance
    await Account.create({
        userId,
        balance: 0
    })
    res.json({
        message: "User created successfully",
        token: JwtToken
    })
})

//signin route for user

router.post('/signin',async (req,res)=>{
    const { success } = signinValidations.safeParse(req.body)
    if(!success){
        return res.status(411).json({
            message: "Incorrect inputs"
        })
    }
    //findone user 
    const user =await User.findOne({
        username: req.body.username
    })
    const {password_Hashed} = user
    // verfing password to stored hashpass in db
    const satus = await ValidatePassword(req.body.password,password_Hashed)
    // console.log(satus +" Hashedpass is:" +password_Hashed)
    if(satus && user){
        const token = jwt.sign({
            userID:user._id
        },JWT_SECRET)

        res.json({
            token: token
        })
        return;
    }
    res.status(411).json({
        message: "Error while logging in"
    })
})


// Updating user data into data table
const updateBody = zod.object({
    firstName:zod.string().min(1).max(20).optional(),
    password: zod.string().min(8).max(20).optional(),
    lastName: zod.string().min(1).max(20).optional(),
})

router.put('/update', authMiddleware, async (req, res) => {
    const { success, data } = updateBody.safeParse(req.body);

    // Check if parsing was successful and if all fields are valid
    if (!success) {
        return res.status(400).json({
            message: "Error while updating information",
            errors: data.errors // Provide details about validation errors
        });
    }

    try {
        // Update the user document with the provided fields
        const status = await User.updateOne({ _id: req.userId}, data);
        console.log(req.userId)
        res.json({
            message: "Updated successfully"
        });
    } catch (error) {
        console.error("Error while updating fields:", error);
        res.status(500).json({
            message: "Error while updating fields",
            error: error.message // Provide details about the internal server error
        });
    }
});



router.get('/search',async (req,res)=>{
    const filter = req.query.filter||"";
    const users = await User.find({
        $or: [
            {
                firstName:{
                    "$regex":filter
                }
            },{
                lastName:{
                    "$regex":filter
                }
            }
        ]
    })

    res.json({
        user: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    })
})

//exporting router
module.exports = router;