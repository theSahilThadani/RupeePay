const express = require('express')
const {authMiddleware} = require('../middleware/middleware')
const {Account,User} = require('../db/db')
const zod = require('zod')
const { default: mongoose } = require('mongoose');

const router = express.Router();
const AddAmountValidation = zod.number().nonnegative()
router.get('/balance',authMiddleware,async(req,res)=>{
    try {
        const account = await Account.findOne({
            userId:req.userId
        })
        res.json({
            balance: account.balance
        })
    } catch (error) {
        res.json({
            msg:'bad request somthing went wrong error:'+error
        })
    }
})

router.post('/addcredit',authMiddleware,async(req,res)=>{
    try {
        const {success} = AddAmountValidation.safeParse(req.body.addAmount);
        if(!success ){
            return res.status(411).json({
                msg:"Incorrect inputs or nagative number"
            })
        }
        const session = await mongoose.startSession();
        session.startTransaction();
        const account = await User.findOne({ _id: req.userId }).session(session)
        // console.log(account)
        if(!account){
            res.json({
                msg:'No account found with this id'
            })
            return;
        }
        
        const {addAmount} = req.body;
        const s = await Account.updateOne({ userId: req.userId }, { $inc: { balance: addAmount } }).session(session);
        // console.log(s)
        // console.log(addAmount)
        await session.commitTransaction();
        res.json({
            msg:'Amount added succsefully'
        })
    } catch (error) {
        res.json({
            msg:'Somthing went wrong ammount not added to wallet error:'+error
        })
    }
})

router.post('/transfer',authMiddleware,async(req,res)=>{
    try {
        const {success} = AddAmountValidation.safeParse(req.body.amount);
        if(!success ){
            return res.status(411).json({
                msg:"Incorrect inputs or nagative number"
            })
        }
        const session = await mongoose.startSession();
        
        session.startTransaction();
        const {amount,to} = req.body;

        const account = await Account.findOne({ userId: req.userId }).session(session)
            // check account has balance
        if(!account || account.balance < amount) {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Insufficient balance"
            });
        }
        //check to user exits in db 
        const toAccount = await Account.findOne({ userId: to }).session(session);

        //if not abort txm
        if (!toAccount) {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Invalid account"
            });
        }

        // update account balance of both
        // Perform the transfer
        await Account.updateOne({userId:req.userId},{$inc:{balance:-amount}}).session(session);
        await Account.updateOne({userId:to},{$inc:{balance:amount}}).session(session)
        
        await session.commitTransaction();
        res.json({
            message: "Transfer successful"
        });
    } catch (error) {
        res.json({
            message: "Somthing went wrong error:"+error
        });
    }
})

module.exports = router;