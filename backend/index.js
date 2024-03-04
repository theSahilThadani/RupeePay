const express = require('express'); //import express
const app = express();//user express function in app
const port = 3000; //port number
const RootRouter = require('./routes/index');
const cors = require('cors') //import cors module

app.use(cors()) //use cors
app.use(express.json()) //use json
app.use('/api/v1',RootRouter) //use RootRouter

app.listen(port)
