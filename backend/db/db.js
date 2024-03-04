const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://SahilThadani:Sahil2336@cluster0.wqrxhks.mongodb.net/RupeePay');

const UserSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true,
        unique:true,
        trim:true,
        lowercase:true,
        minLength:3,
        maxLength:40,
    },
    firstName:{
        type:String,
        required: true,
        trim:true,
        maxLength:20,
    },
    lastName:{
        type:String,
        required: true,
        trim:true,
        maxLength:20,
    },
    password_Hashed:{
        type:String,
        required: true,
    },
})

//Creating Account schema and using user model for reffrencing

const AccountShema = mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    balance:{
        type:Number,
        required:true
    }
})


const User = mongoose.model('User',UserSchema);
const Account = mongoose.model('Account',AccountShema)

module.exports = {
    User,
    Account
}